<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import type { TranslationFunction } from '../i18n';
  import { normalizedCountries, TelInput } from 'svelte-tel-input';
  import type {
    Country,
    CountryCode,
    DetailedValue,
    E164Number,
    TelInputOptions
  } from 'svelte-tel-input/types';
  import Icon from './Icon.svelte';

  type Props = {
    t: TranslationFunction;
    value: E164Number | null;
    valid: boolean;
    name?: string;
    selectedCountry: CountryCode | null;
    hasError?: boolean;
    onChange?: () => void;
  };

  let {
    t,
    value = $bindable(),
    valid = $bindable(),
    name,
    selectedCountry = $bindable(),
    hasError = false,
    onChange
  }: Props = $props();

  let detailedValue = $state<DetailedValue | null>(null);
  let options = $state<TelInputOptions>({
    autoPlaceholder: false
  });

  $effect(() => {
    value;
    onChange?.();
  });

  const sortCountries = (countries: Country[]) =>
    countries.sort((a, b) => a.label.localeCompare(b.label));
</script>

<label class={twMerge('relative w-full gap-2 column-left', hasError && 'z-20')}>
  <div class="absolute top-0 left-px bottom-px z-20 text-gray-300 focus-within:text-gray-400">
    <div class="relative inline-flex pl-4 pr-2 items-center h-full gap-3 rounded-md">
      <span class="flag flag-{selectedCountry?.toLowerCase()} flex-shrink-0"></span>
      <Icon class="!text-xs" name="chevron-down" />
    </div>
    <select
      id="phone-country-select"
      class="absolute peer inset-0 opacity-0 cursor-pointer"
      bind:value={selectedCountry}
    >
      {#each sortCountries(normalizedCountries) as country (country.id)}
        <option value={country.id}>{country.label}</option>
      {/each}
    </select>
  </div>
  <TelInput
    bind:country={selectedCountry}
    bind:detailedValue
    bind:value
    bind:valid
    {name}
    {options}
    required
    class={twMerge(
      'placeholder:text-transparent relative peer w-full rounded-md border border-gray-200 pl-[84px] pr-4 pb-2 pt-6 text-base leading-snug text-gray-800 outline-0 transition-colors duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:z-10 disabled:opacity-[20%] dark:border-gray-700 dark:focus:border-gray-600 dark:bg-black/25 dark:text-gray-100',
      hasError && '!border-red-500'
    )}
  />
  <div
    class={twMerge(
      'pointer-events-none absolute z-20 left-[84px] right-4 top-1/2 line-clamp-1 -translate-y-1/2 text-base font-medium text-gray-400 transition-[transform,font-size] peer-focus:-translate-y-[calc(50%+theme(space.3))] peer-focus:text-xs',
      !!value && '-translate-y-[calc(50%+theme(space.3))] text-xs sm:text-xs'
    )}
  >
    {t('phone_number')}
  </div>
</label>
