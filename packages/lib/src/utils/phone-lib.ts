import type * as PhoneLib from 'libphonenumber-js/max';
import { version } from '../../../../package.json';

export type { PhoneLib };

// libphonenumber-js is ~200 kB, so it isn't part of the main bundle. It is published as
// dist/lib/phone-lib.js and served by scripts-host, and only fetched when a phone input is
// shown. Until it arrives (or if the request fails) the input falls back to utils/phone.ts.
//
// `version` is the version being published: the release job builds before semantic-release
// bumps package.json, but `npm publish` runs `prepublishOnly`, which builds again after it.
export const getPhoneLibUrl = (vendorId: string) =>
  `https://scripts.sesamy.com/s/${encodeURIComponent(vendorId)}/phone-lib/${version}`;

type ImportModule = (url: string) => Promise<typeof PhoneLib>;

const importModule: ImportModule = (url) => import(/* @vite-ignore */ url);

const pending = new Map<string, Promise<typeof PhoneLib>>();

export function loadPhoneLib(
  vendorId: string,
  load: ImportModule = importModule
): Promise<typeof PhoneLib> {
  const url = getPhoneLibUrl(vendorId);
  let loading = pending.get(url);
  if (!loading) {
    loading = load(url).catch((error) => {
      pending.delete(url); // Allow a retry the next time an input is shown
      throw error;
    });
    pending.set(url, loading);
  }
  return loading;
}
