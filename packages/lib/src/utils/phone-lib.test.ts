import { describe, expect, it, vi } from 'vitest';
import { version } from '../../../../package.json';
import { getPhoneLibUrl, loadPhoneLib, type PhoneLib } from './phone-lib';

const fakeLib = {} as typeof PhoneLib;

describe('getPhoneLibUrl', () => {
  it('points at the phone-lib route for this version', () => {
    expect(getPhoneLibUrl('abcnyheter')).toBe(
      `https://scripts.sesamy.com/s/abcnyheter/phone-lib/${version}`
    );
  });

  it('encodes the vendor id', () => {
    expect(getPhoneLibUrl('a/b c')).toBe(
      `https://scripts.sesamy.com/s/a%2Fb%20c/phone-lib/${version}`
    );
  });
});

describe('loadPhoneLib', () => {
  it('loads the library once per vendor', async () => {
    const load = vi.fn().mockResolvedValue(fakeLib);
    await expect(loadPhoneLib('vendor-once', load)).resolves.toBe(fakeLib);
    await expect(loadPhoneLib('vendor-once', load)).resolves.toBe(fakeLib);
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(getPhoneLibUrl('vendor-once'));
  });

  it('loads from each vendor’s own url', async () => {
    const load = vi.fn().mockResolvedValue(fakeLib);
    await loadPhoneLib('vendor-a', load);
    await loadPhoneLib('vendor-b', load);
    expect(load.mock.calls).toEqual([[getPhoneLibUrl('vendor-a')], [getPhoneLibUrl('vendor-b')]]);
  });

  it('retries after a failed load', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('blocked')).mockResolvedValue(fakeLib);
    await expect(loadPhoneLib('vendor-retry', load)).rejects.toThrow('blocked');
    await expect(loadPhoneLib('vendor-retry', load)).resolves.toBe(fakeLib);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
