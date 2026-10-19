import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, unmount, flushSync, tick } from 'svelte';
import userEvent from '@testing-library/user-event';
import PhoneNumberInput from './PhoneNumberInput.svelte';
import { loadPhoneLib } from '../utils/phone-lib';

// Serve the library from node_modules instead of scripts-host. Each test picks whether it loads.
vi.mock('../utils/phone-lib', () => ({ loadPhoneLib: vi.fn() }));

let component: ReturnType<typeof mount> | undefined;

afterEach(() => {
  if (component) unmount(component);
  component = undefined;
  document.body.innerHTML = '';
});

const setup = async ({ withLib }: { withLib: boolean }) => {
  const loading = withLib
    ? import('libphonenumber-js/max')
    : Promise.reject(new Error('blocked by the page'));
  vi.mocked(loadPhoneLib).mockReturnValue(loading);
  const props = $state({
    t: (key: string) => key,
    value: null as string | null,
    valid: false,
    selectedCountry: 'SE',
    vendorId: 'vendor',
    locale: 'en'
  });
  component = mount(PhoneNumberInput, { target: document.body, props });
  flushSync();
  expect(loadPhoneLib).toHaveBeenCalledWith('vendor');
  await loading.catch(() => {});
  await tick();
  return {
    props,
    input: document.querySelector('input[type="tel"]') as HTMLInputElement,
    select: document.querySelector('select') as HTMLSelectElement
  };
};

describe('PhoneNumberInput without the full library', () => {
  it('lists countries with their calling code', async () => {
    const { select } = await setup({ withLib: false });
    const sweden = [...select.options].find((o) => o.value === 'SE');
    expect(sweden?.textContent).toBe('Sweden (+46)');
    expect(select.value).toBe('SE');
  });

  it('binds an E.164 value and validity for a national number', async () => {
    const { props, input } = await setup({ withLib: false });
    await userEvent.type(input, '070-123 45 67');
    flushSync();
    expect(props.value).toBe('+46701234567');
    expect(props.valid).toBe(true);
  });

  it('re-parses when the country changes', async () => {
    const { props, input, select } = await setup({ withLib: false });
    await userEvent.type(input, '41234567');
    flushSync();
    expect(props.value).toBe('+4641234567');
    await userEvent.selectOptions(select, 'NO');
    flushSync();
    expect(props.value).toBe('+4741234567');
    expect(props.valid).toBe(true);
  });

  it('selects the country of a number typed in international format', async () => {
    const { props, input, select } = await setup({ withLib: false });
    await userEvent.type(input, '+45 20 12 34 56');
    flushSync();
    expect(props.selectedCountry).toBe('DK');
    expect(select.value).toBe('DK');
    expect(props.value).toBe('+4520123456');
    expect(props.valid).toBe(true);
  });
});

describe('PhoneNumberInput with the full library', () => {
  it('formats the number as it is typed', async () => {
    const { props, input } = await setup({ withLib: true });
    await userEvent.type(input, '0701234567');
    flushSync();
    expect(input.value).toBe('070-123 45 67');
    expect(props.value).toBe('+46701234567');
    expect(props.valid).toBe(true);
  });

  it('rejects a number that has the right length but does not exist', async () => {
    const { props, input } = await setup({ withLib: true });
    await userEvent.type(input, '0999999999');
    flushSync();
    expect(props.value).toBe('+46999999999');
    expect(props.valid).toBe(false);
  });

  it('lets the user delete formatting characters', async () => {
    const { input } = await setup({ withLib: true });
    await userEvent.type(input, '0701234567');
    // Removes 7, 6 and then the space, which must not be added back
    await userEvent.type(input, '{Backspace}{Backspace}{Backspace}');
    flushSync();
    expect(input.value).toBe('070-123 45');
  });
});
