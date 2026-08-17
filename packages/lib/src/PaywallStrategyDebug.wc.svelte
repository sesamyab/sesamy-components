<svelte:options customElement="sesamy-paywall-strategy-debug" />

<script lang="ts">
  import Base from './Base.svelte';
  import Renderer from './components/paywall/Renderer.svelte';
  import LoginRenderer from './components/paywall/LoginRenderer.svelte';
  import Input from './components/Input.svelte';
  import Button from './components/Button.svelte';
  import Column from './components/Column.svelte';
  import type { SesamyAPI } from '@sesamy/sesamy-js';
  import type { Paywall } from './types/Paywall';

  // ---------------------------------------------------------------------------
  // Types for paywalls.executeStrategy(strategyId, { attribution, content?, debug? }).
  //
  // These mirror StrategyExecutionParams / StrategyExecutionResult from
  // @sesamy/sdk (re-exported through @sesamy/sesamy-js). They are duplicated
  // locally so the component compiles against any installed sesamy-js version;
  // the method is reached through a structural cast (see `getExecuteStrategy`).
  // Drop these in favour of the published types once they ship.
  // ---------------------------------------------------------------------------
  type StrategyAttribution = {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
    referrer?: string;
  };

  type StrategyContentInfo = {
    contentId?: string;
    title?: string;
    type?: 'article' | 'video' | 'audio' | 'premium';
    price?: number;
    currency?: string;
    publisherId?: string;
  };

  type StrategyExecutionParams = {
    attribution?: StrategyAttribution;
    content?: StrategyContentInfo;
    debug?: boolean;
    // Debug-only override for the User-Agent the strategy is evaluated against
    // (device-type rules). Honoured by the proxy only when `debug` is true.
    debugUserAgent?: string;
  };

  type StrategyExecutionResult = {
    paywallId: string;
    matchedNode?: {
      id: string;
      type: string;
      label?: string;
    };
    paywall: Paywall;
    debug?: unknown;
  };

  type ExecuteStrategyFn = (
    strategyId: string,
    params?: StrategyExecutionParams
  ) => Promise<StrategyExecutionResult>;

  const getExecuteStrategy = (api: SesamyAPI): ExecuteStrategyFn | null => {
    const fn = (api.paywalls as unknown as { executeStrategy?: ExecuteStrategyFn }).executeStrategy;
    return typeof fn === 'function' ? fn : null;
  };

  const CONTENT_TYPES = ['', 'article', 'video', 'audio', 'premium'] as const;

  // --- Form state ------------------------------------------------------------
  let strategyId = $state('');

  // attribution
  let attrSource = $state('');
  let attrMedium = $state('');
  let attrCampaign = $state('');
  let attrTerm = $state('');
  let attrContent = $state('');
  let attrReferrer = $state('');

  // content
  let contentId = $state('');
  let contentTitle = $state('');
  let contentType = $state<StrategyContentInfo['type'] | ''>('');
  let contentPrice = $state('');
  let contentCurrency = $state('');
  let contentPublisherId = $state('');

  let debug = $state(true);
  let debugUserAgent = $state('');

  const USER_AGENT_PRESETS: { label: string; value: string }[] = [
    {
      label: 'Mobile (iPhone)',
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
    },
    {
      label: 'Mobile (Android)',
      value:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
    },
    {
      label: 'Tablet (iPad)',
      value:
        'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
    },
    {
      label: 'Desktop',
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    }
  ];

  // --- Result state ----------------------------------------------------------
  let loading = $state(false);
  let error = $state('');
  let result = $state<StrategyExecutionResult | null>(null);

  const buildAttribution = (): StrategyAttribution | undefined => {
    const attribution: StrategyAttribution = {};
    if (attrSource) attribution.source = attrSource;
    if (attrMedium) attribution.medium = attrMedium;
    if (attrCampaign) attribution.campaign = attrCampaign;
    if (attrTerm) attribution.term = attrTerm;
    if (attrContent) attribution.content = attrContent;
    if (attrReferrer) attribution.referrer = attrReferrer;
    return Object.keys(attribution).length ? attribution : undefined;
  };

  const buildContent = (): StrategyContentInfo | undefined => {
    const content: StrategyContentInfo = {};
    if (contentId) content.contentId = contentId;
    if (contentTitle) content.title = contentTitle;
    if (contentType) content.type = contentType;
    if (contentPrice) content.price = Number(contentPrice);
    if (contentCurrency) content.currency = contentCurrency;
    if (contentPublisherId) content.publisherId = contentPublisherId;
    return Object.keys(content).length ? content : undefined;
  };

  const onSubmit = async (api: SesamyAPI, event: SubmitEvent) => {
    event.preventDefault();
    error = '';
    result = null;

    if (!strategyId.trim()) {
      error = 'Strategy ID is required';
      return;
    }

    if (contentPrice && Number.isNaN(Number(contentPrice))) {
      error = 'Content price must be a number';
      return;
    }

    const executeStrategy = getExecuteStrategy(api);
    if (!executeStrategy) {
      error = 'paywalls.executeStrategy is not available in this version of @sesamy/sesamy-js';
      return;
    }

    loading = true;
    try {
      result = await executeStrategy(strategyId.trim(), {
        attribution: buildAttribution(),
        content: buildContent(),
        debug,
        debugUserAgent: debugUserAgent.trim() || undefined
      });
    } catch (e) {
      error = (e as Error)?.message || 'Failed to execute strategy';
    } finally {
      loading = false;
    }
  };

  const reset = () => {
    result = null;
    error = '';
  };

  const inputClass =
    'w-full rounded-md border border-gray-200 p-3 text-sm leading-snug text-gray-800 outline-0 transition-colors duration-150 placeholder:text-gray-400 focus:border-gray-300';
</script>

<Base let:api let:t>
  {@const host = $host()}

  <div class="sesamy-paywall-strategy-debug w-full max-w-[800px]">
    {#if result}
      {@const paywall = result.paywall}
      {@const template = paywall?.settings?.template}

      <Column up left class="w-full gap-4">
        <Button variant="secondary" size="sm" onclick={reset}>← Edit input</Button>

        <div class="w-full rounded-md border border-gray-200 p-3 text-sm">
          <div><span class="font-semibold">paywallId:</span> {result.paywallId}</div>
          {#if result.matchedNode}
            <div>
              <span class="font-semibold">matchedNode:</span>
              {result.matchedNode.label || result.matchedNode.id}
            </div>
          {:else}
            <div class="text-gray-500">No node matched — default/fallback paywall used</div>
          {/if}
        </div>

        <div class="w-full">
          {#if template === 'ARTICLE'}
            <Renderer {api} {paywall} {host} {t} />
          {:else if template === 'BOXES'}
            <Renderer horizontal {api} {paywall} {host} {t} />
          {:else if template === 'LOGIN'}
            <LoginRenderer {api} {t} {paywall} {host} />
          {:else}
            <div class="text-sm text-red-600">
              Unknown or missing paywall template: {String(template)}
            </div>
          {/if}
        </div>

        {#if result.debug !== undefined}
          <details class="w-full" open>
            <summary class="cursor-pointer text-sm font-medium text-gray-700">Debug output</summary>
            <pre
              class="mt-2 w-full overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">{JSON.stringify(
                result.debug,
                null,
                2
              )}</pre>
          </details>
        {/if}
      </Column>
    {:else}
      <form class="w-full" onsubmit={(e) => onSubmit(api, e)}>
        <Column up left class="w-full gap-4">
          <div class="text-lg font-bold">Paywall strategy debug</div>

          <label class="column-left w-full gap-1">
            <span class="text-sm font-medium text-gray-700">Strategy ID</span>
            <Input placeholder="strategy-id" bind:value={strategyId} required />
          </label>

          <fieldset class="column-left w-full gap-3 rounded-md border border-gray-200 p-4">
            <legend class="px-1 text-sm font-semibold text-gray-700">Attribution (optional)</legend>
            <p class="text-xs text-gray-500">
              Any field left blank falls back to the attribution sesamy-js has already collected
              (UTM tags + referrer).
            </p>

            <div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="column-left gap-1">
                <span class="text-xs text-gray-500">source</span>
                <Input placeholder="newsletter" bind:value={attrSource} />
              </label>
              <label class="column-left gap-1">
                <span class="text-xs text-gray-500">medium</span>
                <Input placeholder="email" bind:value={attrMedium} />
              </label>
              <label class="column-left gap-1">
                <span class="text-xs text-gray-500">campaign</span>
                <Input placeholder="spring-sale" bind:value={attrCampaign} />
              </label>
              <label class="column-left gap-1">
                <span class="text-xs text-gray-500">term</span>
                <Input placeholder="term" bind:value={attrTerm} />
              </label>
              <label class="column-left gap-1">
                <span class="text-xs text-gray-500">content</span>
                <Input placeholder="content" bind:value={attrContent} />
              </label>
              <label class="column-left gap-1">
                <span class="text-xs text-gray-500">referrer</span>
                <Input placeholder="https://referrer.example" bind:value={attrReferrer} />
              </label>
            </div>
          </fieldset>

          <fieldset class="column-left w-full gap-3 rounded-md border border-gray-200 p-4">
            <legend class="px-1 text-sm font-semibold text-gray-700">Content (optional)</legend>

            <div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <label class="column-left gap-1">
                <span class="text-xs text-gray-500">contentId</span>
                <Input placeholder="123" bind:value={contentId} />
              </label>
              <label class="column-left gap-1">
                <span class="text-xs text-gray-500">title</span>
                <Input placeholder="Example article" bind:value={contentTitle} />
              </label>
              <label class="column-left gap-1">
                <span class="text-xs text-gray-500">type</span>
                <select class={inputClass} bind:value={contentType}>
                  {#each CONTENT_TYPES as type}
                    <option value={type}>{type || '(none)'}</option>
                  {/each}
                </select>
              </label>
              <label class="column-left gap-1">
                <span class="text-xs text-gray-500">price</span>
                <Input type="number" placeholder="49" bind:value={contentPrice} />
              </label>
              <label class="column-left gap-1">
                <span class="text-xs text-gray-500">currency</span>
                <Input placeholder="SEK" bind:value={contentCurrency} />
              </label>
              <label class="column-left gap-1">
                <span class="text-xs text-gray-500">publisherId</span>
                <Input placeholder="publisher-id" bind:value={contentPublisherId} />
              </label>
            </div>
          </fieldset>

          <fieldset class="column-left w-full gap-3 rounded-md border border-gray-200 p-4">
            <legend class="px-1 text-sm font-semibold text-gray-700"
              >Device / User-Agent override</legend
            >
            <p class="text-xs text-gray-500">
              Device type is derived server-side from the User-Agent. Set an override to test
              device-type rules — applied only when <span class="font-medium">debug</span> is on
              (browsers block setting the real User-Agent header).
            </p>
            <div class="row-left flex-wrap gap-2">
              {#each USER_AGENT_PRESETS as preset}
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onclick={() => (debugUserAgent = preset.value)}
                >
                  {preset.label}
                </Button>
              {/each}
              {#if debugUserAgent}
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onclick={() => (debugUserAgent = '')}
                >
                  Clear
                </Button>
              {/if}
            </div>
            <textarea
              class={`${inputClass} min-h-[72px] font-mono text-xs`}
              placeholder="Leave blank to use this browser's User-Agent"
              bind:value={debugUserAgent}
            ></textarea>
          </fieldset>

          <label class="row-left items-center gap-2">
            <input type="checkbox" bind:checked={debug} />
            <span class="text-sm font-medium text-gray-700"
              >debug (include debug info in response)</span
            >
          </label>

          {#if error}
            <div class="text-sm text-red-600">{error}</div>
          {/if}

          <Button type="submit" {loading} disabled={loading}>Execute strategy</Button>
        </Column>
      </form>
    {/if}
  </div>
</Base>
