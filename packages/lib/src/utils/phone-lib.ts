import type * as PhoneLib from 'libphonenumber-js/max';
import { version } from '../../../../package.json';

export type { PhoneLib };

// libphonenumber-js is ~200 kB, so it isn't part of the main bundle. It is published as
// dist/lib/phone-lib.js and served by scripts-host, and only fetched when a phone input is
// shown. Until it arrives (or if the request fails) the input falls back to utils/phone.ts.
export const getPhoneLibUrl = (vendorId: string) =>
  `https://scripts.sesamy.com/s/${encodeURIComponent(vendorId)}/phone-lib/${version}`;

let pending: Promise<typeof PhoneLib> | undefined;

export function loadPhoneLib(vendorId: string): Promise<typeof PhoneLib> {
  pending ??= import(/* @vite-ignore */ getPhoneLibUrl(vendorId)).catch((error) => {
    pending = undefined; // Allow a retry the next time an input is shown
    throw error;
  });
  return pending;
}
