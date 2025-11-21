<script lang="ts">
  import type { TranslationFunction } from '../i18n';
  import Input from './Input.svelte';

  type Props = {
    t: TranslationFunction;
    year?: string;
    month?: string;
    day?: string;
    hasError?: boolean;
    onYearChange?: (value: string) => void;
    onMonthChange?: (value: string) => void;
    onDayChange?: (value: string) => void;
  };

  let {
    t,
    year = $bindable(''),
    month = $bindable(''),
    day = $bindable(''),
    hasError = false,
    onYearChange,
    onMonthChange,
    onDayChange
  }: Props = $props();

  // Component refs for the input fields
  let birthYearInput: any;
  let birthMonthInput: any;
  let birthDayInput: any;

  // Generic function to handle numeric input filtering with auto-advance
  const handleNumericInput =
    (setValue: (value: string) => void, maxLength?: number, getNextFieldRef?: () => any) =>
    (e: Event) => {
      const target = e.target as HTMLInputElement;
      const numericValue = target.value.replace(/[^0-9]/g, '');
      const truncatedValue = maxLength ? numericValue.slice(0, maxLength) : numericValue;
      target.value = truncatedValue;
      setValue(truncatedValue);

      // Auto-advance to next field when max length is reached
      if (maxLength && getNextFieldRef && truncatedValue.length === maxLength) {
        // Use setTimeout to ensure the next field is available and to avoid focus issues
        setTimeout(() => {
          const nextFieldRef = getNextFieldRef();
          if (nextFieldRef && nextFieldRef.focus) {
            nextFieldRef.focus();
          }
        }, 0);
      }
    };

  // Function to handle backspace navigation between fields
  const handleBackspaceNavigation = (getPrevFieldRef?: () => any) => (e: KeyboardEvent) => {
    if (e.key === 'Backspace') {
      const target = e.target as HTMLInputElement;
      // If the field is empty and backspace is pressed, move to previous field
      if (target.value === '' && getPrevFieldRef) {
        setTimeout(() => {
          const prevFieldRef = getPrevFieldRef();
          if (prevFieldRef && prevFieldRef.focus) {
            prevFieldRef.focus();
          }
        }, 0);
      }
    }
  };

  // Wrapper functions to call external change handlers
  const handleYearChange = (value: string) => {
    year = value;
    onYearChange?.(value);
  };

  const handleMonthChange = (value: string) => {
    month = value;
    onMonthChange?.(value);
  };

  const handleDayChange = (value: string) => {
    day = value;
    onDayChange?.(value);
  };
</script>

<div class="w-full rounded-md border border-gray-200 dark:border-gray-700">
  <div
    class="px-4 py-2 text-xs text-gray-600 font-bold dark:text-gray-100 bg-white dark:bg-black/25 rounded-t-md"
  >
    {t('date_of_birth')}
  </div>
  <div class="grid grid-cols-3 w-[calc(100%+2px)] -m-px">
    <Input
      bind:this={birthYearInput}
      oninput={handleNumericInput(handleYearChange, 4, () => birthMonthInput)}
      onkeydown={handleBackspaceNavigation()}
      bind:value={year}
      name="birth-year"
      inputmode="numeric"
      compact
      placeholder={t('year')}
      {hasError}
      min="1900"
      max={new Date().getFullYear()}
      autocomplete="bday-year"
      class="rounded-none rounded-bl-md w-[calc(100%+1px)]"
    />
    <Input
      bind:this={birthMonthInput}
      oninput={handleNumericInput(handleMonthChange, 2, () => birthDayInput)}
      onkeydown={handleBackspaceNavigation(() => birthYearInput)}
      bind:value={month}
      name="birth-month"
      inputmode="numeric"
      compact
      placeholder={t('month')}
      {hasError}
      min="1"
      max="12"
      autocomplete="bday-month"
      class="rounded-none w-[calc(100%+1px)]"
    />
    <Input
      bind:this={birthDayInput}
      oninput={handleNumericInput(handleDayChange, 2)}
      onkeydown={handleBackspaceNavigation(() => birthMonthInput)}
      bind:value={day}
      name="birth-day"
      inputmode="numeric"
      compact
      placeholder={t('day')}
      {hasError}
      min="1"
      max="31"
      autocomplete="bday-day"
      class="rounded-none rounded-br-md"
    />
  </div>
</div>
