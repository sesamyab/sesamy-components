<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import type { TranslationFunction } from '../i18n';
  import { getCountryNameByCountryCode } from '../utils/countries';
  import { onMount, untrack } from 'svelte';
  import {
    formatPhoneNumber,
    getCallingCode,
    getInternationalDigits,
    parsePhoneNumber,
    phoneCountryCodes
  } from '../utils/phone';
  import { loadPhoneLib, type PhoneLib } from '../utils/phone-lib';
  import Icon from './Icon.svelte';

  type Props = {
    t: TranslationFunction;
    /** E.164 formatted number, e.g. `+46701234567` */
    value: string | null;
    valid: boolean;
    name?: string;
    selectedCountry: string;
    /** Used to load the full phone number library from scripts-host */
    vendorId: string;
    locale?: string;
    hasError?: boolean;
    onChange?: () => void;
  };

  let {
    t,
    value = $bindable(),
    valid = $bindable(),
    name,
    selectedCountry = $bindable(),
    vendorId,
    locale = 'en',
    hasError = false,
    onChange
  }: Props = $props();

  // What the user typed. Starts from, and follows, a value set by the parent.
  let input = $state(untrack(() => value) ?? '');
  // The last value this component bound, to tell its own updates apart from the parent's
  let bound = untrack(() => value);
  // Full validation and formatting, loaded on demand. Until it arrives (or if it fails to
  // load) the number is only checked for a plausible length.
  let lib = $state<typeof PhoneLib | null>(null);

  onMount(() => {
    loadPhoneLib(vendorId)
      .then((loaded) => (lib = loaded))
      .catch((error) => {
        console.warn('[sesamy] Phone number library unavailable, using basic validation', error);
      });
  });

  const handleInput = (event: Event & { currentTarget: HTMLInputElement }) => {
    const element = event.currentTarget;
    let next = element.value;
    // Only format while typing at the end, so deleting a space or editing mid-number isn't undone
    const isTyping = event instanceof InputEvent && event.inputType.startsWith('insert');
    if (lib && isTyping && element.selectionStart === next.length) {
      next = formatPhoneNumber(next, selectedCountry, lib);
      element.value = next;
    }
    input = next;
    // A number typed in international format with another calling code selects its country
    if (parsed.country !== selectedCountry) selectedCountry = parsed.country;
  };

  // Picking a country while the field holds an international number for another country
  // keeps the digits after the old calling code as a national number for the new country
  const handleCountryChange = (event: Event & { currentTarget: HTMLSelectElement }) => {
    const country = event.currentTarget.value;
    const internationalDigits = getInternationalDigits(input);
    const oldCallingCode = getCallingCode(selectedCountry);
    if (internationalDigits?.startsWith(oldCallingCode)) {
      const nationalNumber = internationalDigits.slice(oldCallingCode.length);
      input = lib ? formatPhoneNumber(nationalNumber, country, lib) : nationalNumber;
    }
    selectedCountry = country;
  };

  const countries = $derived(
    phoneCountryCodes
      .map((code) => ({
        code,
        label: `${getCountryNameByCountryCode(code, locale) || code} (+${getCallingCode(code)})`
      }))
      .sort((a, b) => a.label.localeCompare(b.label, locale))
  );

  const parsed = $derived(parsePhoneNumber(input, selectedCountry, lib));

  $effect(() => {
    bound = parsed.value;
    value = parsed.value;
    valid = parsed.valid;
  });

  // The parent set or reset the value, e.g. to null after a submit
  $effect(() => {
    const next = value;
    untrack(() => {
      if (next !== bound) input = next ?? '';
    });
  });

  $effect(() => {
    value;
    onChange?.();
  });
</script>

<label class={twMerge('relative w-full gap-2 column-left', hasError && 'z-20')}>
  <div class="absolute top-0 left-px bottom-px z-20 text-gray-300 focus-within:text-gray-400">
    <div class="relative inline-flex pl-4 pr-2 items-center h-full gap-2 rounded-md">
      <span class="text-base text-gray-800 dark:text-gray-100"
        >+{getCallingCode(selectedCountry)}</span
      >
      <Icon class="!text-xs" name="chevron-down" />
    </div>
    <select
      id="phone-country-select"
      class="absolute peer inset-0 opacity-0 cursor-pointer"
      aria-label={t('country')}
      value={selectedCountry}
      onchange={handleCountryChange}
    >
      {#each countries as country (country.code)}
        <option value={country.code}>{country.label}</option>
      {/each}
    </select>
  </div>
  <input
    type="tel"
    autocomplete="tel"
    value={input}
    oninput={handleInput}
    {name}
    required
    class={twMerge(
      'placeholder:text-transparent relative peer w-full rounded-md border border-gray-200 pl-[84px] pr-4 pb-2 pt-6 text-base leading-snug text-gray-800 outline-0 transition-colors duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:z-10 disabled:opacity-[20%] dark:border-gray-700 dark:focus:border-gray-600 dark:bg-black/25 dark:text-gray-100',
      hasError && '!border-red-500'
    )}
  />
  <div
    class={twMerge(
      'pointer-events-none absolute z-20 left-[84px] right-4 top-1/2 line-clamp-1 -translate-y-1/2 text-base font-medium text-gray-400 transition-[transform,font-size] peer-focus:-translate-y-[calc(50%+theme(space.3))] peer-focus:text-xs',
      !!input && '-translate-y-[calc(50%+theme(space.3))] text-xs sm:text-xs'
    )}
  >
    {t('phone_number')}
  </div>
</label>
