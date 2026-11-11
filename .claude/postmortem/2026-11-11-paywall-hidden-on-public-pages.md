---
date: 2026-11-11
title: Paywall rendered nothing on public pages under unified content access
size: full
status: fixed-live-confirmed
repo: sesamyab/sesamy-components
also: []
paths:
  - packages/lib/src/Paywall.wc.svelte
  - packages/lib/src/ContentContainer.wc.svelte
surfaces:
  - sesamy-paywall on a page whose content metadata says accessLevel public (offer, campaign and subscribe pages)
invariant: A sesamy-paywall on a public page fetches its settings and shows its products, whatever content.hasAccess() answers.
tests:
  - 'packages/lib/src/Paywall.wc.test.ts :: paywall on a public page'
  - 'packages/lib/src/Paywall.wc.test.ts :: paywall visibility by access level under unified access'
  - 'tests/paywall-public.spec.ts :: the paywall shows its plans on a public page under unified access'
introduced: v2.31.0, 2026-10-22
fixed: v2.34.1, 2026-11-11, PR #452
detected-by: customer
time-to-detect: 20 days
time-to-fix: 1 h 7 min, from the report to the release
ticket: none
---

## Summary

Releases v2.31.0 (22 October 2026) to v2.34.0 made a `<sesamy-paywall>` placed on a public page render nothing. Offer and subscribe pages are built that way. A scan on 11 November found 8 such pages at 5 publishers where readers saw no products and could not start a purchase; when each publisher first got an affected release is not established. It is over: v2.34.1 is live and all 8 pages show their products. The fix is one condition in the paywall.

## What happened

Times are UTC.

- 2026-10-22 09:44: v2.31.0 is released with "use unified content access by default" (28e8ba58, PR #445). Under unified access the paywall asks `content.hasAccess()` and renders nothing when the answer is yes. VERIFIED: `Paywall.wc.svelte` at tag v2.31.0 has the check, at v2.30.1 it does not.
- 2026-11-11 07:13: a publisher reports through support that the offer page shows no products.
- 2026-11-11 07:57: the fix is committed. 08:15 PR #452 is merged. 08:18 v2.34.1 is released. 08:20 it is on npm.
- 2026-11-11 10:50 to 11:00: all 8 pages are confirmed in production.
- 2026-11-11 12:06: PR #456 is merged and pull request CI runs the unit tests. 12:12 PR #455 is merged with tests that render the plans.

PR #452 says the behaviour dates from 2.32.0. The tags show it one release earlier, the same day.

## Impact

8 pages at 5 publishers showed an empty paywall, among them the main subscribe page of 3 publishers. VERIFIED by a scan across the publishers' sites on 11 November, before the fix. Readers could not start a purchase from those pages for up to 20 days; the start per publisher is not established.

Not at risk: paywalls on locked articles, access for existing subscribers, payments, reader data. Locked articles worked throughout.

## Detection

A customer noticed, after 20 days. Nothing of ours did. The failure was silent: an empty shadow root, no settings request, no error. The reporting publisher had no error or 5xx log lines in the 14 days before the report. VERIFIED.

## Root cause

`packages/lib/src/Paywall.wc.svelte`, `fetchPaywall()` (line 126): under unified access (`legacyContentAccess === false`) the paywall asks `content.hasAccess(host)` and returns nothing when the answer is yes. Everyone has access to a public article, so on a public page the answer is always yes.

`content.get()` reports `accessLevel: 'public'` both for a paywall nested in a public article and from the page-level `sesamy:accessLevel` meta. VERIFIED on a live page before the fix.

`ContentContainer.wc.svelte` already made the exception (`accessLevel !== 'public'` before its unified unlock, line 284). The paywall did not, and no test asserted that the two agree.

Enabling condition: unified access is the default in sesamy-js from 1.139. INFERRED from the description of PR #452; not checked per publisher.

## Fix

PR #452: `unified` is false when `metadata.accessLevel` is `'public'`, so the paywall fetches and renders its settings (line 132). Four lines added, one removed. Released as v2.34.1.

A mitigation was available and not used: `legacyContentAccess: true` in a publisher's client config turns the earlier behaviour back on for that site within minutes.

## Confirmation

2026-11-11 10:50 to 11:00 UTC, in headless Chrome, logged out, with every non-GET request blocked. Each of the 8 pages loaded components 2.34.1 and rendered the paywall, and the number of products shown (3 to 5 per page) equalled the subscriptions in the paywall API response. VERIFIED. No publisher configuration was changed.

One edge-cache object still served 2.34.0 at 10:46, for a bundle URL none of the 8 pages request. It served 2.34.1 by 10:55.

## Tests

Added in PR #452, in `packages/lib/src/Paywall.wc.test.ts`, under "paywall on a public page":

- "fetches the configured paywall without an access check"
- "stays shown when the container grants the public article"

These two assert that no access check is made and that the paywall settings are fetched, also after the container's grant event. They do not assert that products are rendered.

Added in PR #455, which does assert the rendering:

- `Paywall.wc.test.ts`, under "paywall visibility by access level under unified access": a public page renders the configured plans and a button; an entitlement page hides with access and renders the server-selected plans without; the legacy flow is unchanged.
- `tests/paywall-public.spec.ts` (Playwright, against a Storybook story with a faked sesamy-js): both plans and a button are visible.

Red and green, VERIFIED on 2026-11-11 15:34 UTC by running `Paywall.wc.test.ts` on `dev` at 5b03337: 29 passed; with the fix condition reverted, 3 failed and 26 passed. The 3 are the two tests from PR #452 and "renders the plans on a public page even though the reader has access". That one fails on its access-check assertion, before its rendering assertions are reached. The Playwright spec was not run against the reverted code.

Tracked: `playwright.yml` runs on every pull request to `dev` and `main`, with `yarn test:unit` (step "Run unit tests", added in PR #456) and `yarn test` (Storybook build and Playwright). VERIFIED by reading the workflow on `dev`. Before PR #456 no workflow ran the unit tests, so the tests in PR #452 were merged without CI running them.

## Gaps

Prevention: the default was flipped with tests for locked content only. There was no case for a paywall on public content, and nothing ties the paywall's decision to the container's.

Detection: nothing looks at a real offer page, and a paywall that renders nothing emits no signal.

## Follow-ups

1. Run `yarn test:unit` in pull request CI. Owner: repo owner. Done in PR #456.
2. A production smoke check of offer and subscribe pages: the paywall renders and shows as many products as the paywall API returns. Owner: platform. Proposed.
3. An access-level matrix test: public and locked, legacy and unified, for each element that decides visibility. Owner: repo owner. Done for the paywall in PR #455. Proposed for the content container, where the same matrix was not checked.
4. One line in the client-locking developer docs: a paywall on a public article always renders. Owner: docs. Proposed.

## Not established

- Sales lost. No estimate was made.
- When each publisher first got the affected version. `stable` is resolved server-side, and the time it moved to 2.31.0 was not checked.
- Whether pages that the scan could not reach from a site's home page are affected.
- Whether any publisher relied on the paywall hiding on public articles.
