# 🌐 sesamy-components

> A shareable web components library using [Vite](https://vitejs.dev), [Svelte](https://svelte.dev), [Storybook](https://storybook.js.org) and [TypeScript](https://www.typescriptlang.org).

This library provides typed [web components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) that can be used with [plain HTML](https://www.webcomponents.org/introduction#how-do-i-use-a-web-component-) or within any major frameworks, such as React, Angular, Vue or Svelte (see [compatibility](https://custom-elements-everywhere.com/)).

## Table of Contents

- [Installation](#installation)
- [Interaction tracking](#interaction-tracking)
- [Components](#components)
  - [sesamy-login](#sesamy-login)
  - [sesamy-content-container](#sesamy-content-container)
  - [sesamy-paywall](#sesamy-paywall)
  - [sesamy-visibility](#sesamy-visibility)
  - [sesamy-avatar](#sesamy-avatar)
  - [sesamy-button](#sesamy-button)
  - [sesamy-login-menu-item](#sesamy-login-menu-item)
- [Internationalization](#internationalization)
- [Development](#development)
- [Testing](#testing-your-components)
- [Building](#building-the-library)
- [Create a New Component](#create-a-new-component)

## Installation

You can install the package with:

```bash
npm install @sesamy/sesamy-components
# or
yarn add @sesamy/sesamy-components
```

### CDN Usage

You can also use the components directly via CDN:

```html
<script type="module" src="https://unpkg.com/@sesamy/sesamy-components"></script>
```

## Per-element events

Each top-level component dispatches per-element `CustomEvent`s (`bubbles: true, composed: true`) that publishers can subscribe to directly on the element — no need to poll or listen on `window`. TypeScript consumers get typed `detail` via `HTMLElementEventMap` augmentation exported from the package:

```ts
import '@sesamy/sesamy-components'; // ambient augmentation

const el = document.querySelector('sesamy-login')!;
el.addEventListener('sesamy:login-success', (e) => {
  // e.detail is typed as { userinfo: { sub: string; email?: string; … } }
  console.log(e.detail.userinfo.sub);
});
```

The full event map and detail interfaces are exported as named types:

```ts
import type {
  SesamyElementEventMap,
  SesamyLoginSuccessDetail,
  SesamyPaywallShownDetail,
  SesamyAccessGrantedDetail,
  SesamyContentUnlockedDetail
} from '@sesamy/sesamy-components';
```

## Interaction tracking

In addition to the DOM events above, the components emit first-party interactions through `sesamy-js` (`window.sesamy.analytics.track`), so they arrive with the sesamy-js context (anonymous id, user id, vendor, page) attached. This is additive: the DOM events keep firing exactly as before, and page views stay `sesamy-js`'s responsibility — the components never emit them.

| Event              | Emitted by                 | When                                                                                          | Properties                                                                                   |
| ------------------ | -------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `viewArticle`      | `sesamy-content-container` | Once per element, as soon as the container has resolved an article and knows its access state | `itemSrc`, `publisherContentId`, `state` (`public`/`logged-in`/`unlocked`/`locked`)          |
| `content_unlocked` | `sesamy-content-container` | Alongside the `sesamy:content-unlocked` DOM event                                             | `itemSrc`, `publisherContentId`, `contentName`                                               |
| `addToCart`        | `sesamy-paywall`           | When the user picks a product and continues to checkout                                       | `itemSrc`, `publisherContentId`, `sku`, `purchaseOptionId`, `price`, `currency`, `paywallId` |

Event and property names match the ones `@sesamy/web-components` produced, so consumers of the interactions index keep working unchanged — only `context.library` differs (`@sesamy/sesamy-js` instead of `@sesamy/web-components`). Each event also repeats its own name in `properties.name`, as the legacy library did.

### Opting out

Tracking is on by default. A page opts out with the same meta tag the legacy components honoured:

```html
<meta name="sesamy:analytics" content="false" />
```

or at runtime:

```ts
import { disableInteractions, enableInteractions } from '@sesamy/sesamy-components';

disableInteractions(); // stop emitting; DOM events keep firing
enableInteractions(); // opt back in, overriding the meta tag
```

`resetInteractions()` drops an explicit call and returns to the meta-tag default, and `interactionsEnabled()` reports the current state. Turning `sesamy-js` analytics off (`analytics.enabled: false` in its config) suppresses these events too, since they go through its pipeline.

## Components

### sesamy-login

A web component that provides authentication functionality, displaying a login button for unauthenticated users and an avatar with a dropdown menu for authenticated users.

**Props/Attributes:**

- `buttonText`: Text to display on the login button
- `loading`: Boolean to show loading state
- `loggedIn`: Boolean indicating if user is logged in
- `userAvatar`: URL to the user's avatar image
- `lang`: Language setting for the component
- `variant`: Appearance variant ('text', 'picture', or 'link')
- `class`: CSS classes to apply to the component

**Events:**

All per-element events are `CustomEvent`s dispatched on the `<sesamy-login>` element with `bubbles: true, composed: true`, so they cross shadow DOM boundaries and can be caught via event delegation.

- `sesamy:login-success`: Fired when the authenticated state transitions from logged-out to logged-in. `detail: { userinfo: { sub: string; email?: string; name?: string; [key: string]: unknown } }`.
- `sesamy:login-error`: Fired when a login attempt fails (popup closed, token exchange rejected, network error). `detail: { error: { code: string; message: string; cause?: unknown } }`.
- `sesamy:logout`: Fired when the authenticated state transitions from logged-in to logged-out. `detail: {}`.
- `login`: Legacy event, dispatched when the login action is triggered.

```js
const el = document.querySelector('sesamy-login');
el.addEventListener('sesamy:login-success', (e) => {
  console.log('welcome', e.detail.userinfo.sub);
});
el.addEventListener('sesamy:login-error', (e) => {
  console.warn('login failed', e.detail.error.code, e.detail.error.message);
});
el.addEventListener('sesamy:logout', () => {
  console.log('user logged out');
});
```

See also the window-level `Events` enum emitted by `@sesamy/sesamy-js` (`AUTHENTICATED`, `LOGOUT`, …) for cross-page coordination.

**Basic Usage Example:**

```html
<!-- Simple login button -->
<sesamy-login></sesamy-login>

<!-- Customized login button -->
<sesamy-login button-text="Sign In Now"></sesamy-login>
```

**Design tokens:**

```html
<sesamy-login
  style="
    --sesamy-font-family: Georgia; /* Sets font family, default Helvetica */
    --sesamy-base-font-size: 18px; /* Base size (in px) that all component font sizes and spacing scale from, default 16px. Components never use rem, so they are unaffected by e.g. html { font-size: 62.5% } */
    --sesamy-login-button-background-color: blue; /* Sets background color of the login button, default transparent */
    --sesamy-login-button-text-color: green; /* Sets text color of the login button, default black */
    --sesamy-login-button-border-color: pink; /* Sets border color of the login button, default black */
    --sesamy-login-button-border-width: 5px; /* Sets border width of the login button, default 1px */
    --sesamy-login-button-border-radius: 20px; /* Sets border radius of the login button, default 6px at a 16px base size */
    --sesamy-login-button-font-weight: 100; /* Sets font weight of the login button, default 700 */
    --sesamy-login-popup-width: 400px; /* Sets width of the login popup, default 288px */
    --sesamy-login-popup-bgcolor: green; /* Sets background color of the login popup, default white */
    --sesamy-login-popup-textcolor: pink; /* Sets text color of the login popup, default black */
    --sesamy-login-popup-border-color: red; /* Sets border color of the login popup, default #e5e7eb */
    --sesamy-login-popup-border-width: 5px; /* Sets border width of the login popup, default 1px */
    --sesamy-login-popup-border-radius: 20px; /* Sets border radius of the login popup, default 2px */
    --sesamy-login-popup-zindex: 100; /* Sets z-index of the login popup, default 10 */
  "
></sesamy-login>
```

#### Slots

The `sesamy-login` component provides several slots for customizing its appearance and behavior:

##### button-text

- **Purpose:** Replaces the default login button text.
- **Behavior:** Content in this slot will be rendered as the main text of the login button, replacing the default (localized) "login" text.
- **Example:**
  ```html
  <sesamy-login>
    <span slot="button-text">Sign in with Email</span>
  </sesamy-login>
  ```

##### button-text-prefix

- **Purpose:** Inserts content before the login button text.
- **Behavior:** Content in this slot will appear before the main button text, useful for adding icons or labels.
- **Example:**
  ```html
  <sesamy-login>
    <span slot="button-text-prefix">🔒</span>
  </sesamy-login>
  ```

##### button-text-suffix

- **Purpose:** Inserts content after the login button text.
- **Behavior:** Content in this slot will appear after the main button text, useful for adding icons or additional info.
- **Example:**
  ```html
  <sesamy-login>
    <span slot="button-text-suffix">→</span>
  </sesamy-login>
  ```

##### avatar

- **Purpose:** Replaces the default avatar shown when logged in.
- **Behavior:** Content in this slot will be rendered instead of the default avatar image/button when the user is authenticated.
- **Example:**
  ```html
  <sesamy-login>
    <img
      slot="avatar"
      src="/my-avatar.png"
      alt="User avatar"
      style="width:32px;height:32px;border-radius:50%"
    />
  </sesamy-login>
  ```

##### popup-menu

- **Purpose:** Replaces the default popup menu shown when clicking the avatar.
- **Behavior:** Content in this slot will be rendered instead of the default menu (email/account/logout) when the user is authenticated and opens the menu.
- **Example:**
  ```html
  <sesamy-login>
    <div slot="popup-menu">
      <a href="/profile">Profile</a>
      <a href="/logout">Logout</a>
    </div>
  </sesamy-login>
  ```

**Note:**

- All slots are optional. If not provided, the component will render its default content for each area.

### sesamy-content-container

A web component that controls access to content based on user authentication and entitlements, with support for different content locking mechanisms.

**Props/Attributes:**

- `item-src`: URL of the content item
- `pass`: Semicolon-separated list of pass IDs that grant access
- `access-level`: Access level required ('public', 'logged-in', or 'entitlement')
- `publisher-content-id`: ID of the content from the publisher
- `lock-mode`: Content locking mechanism ('embed', 'encode', 'signedUrl', 'event', or 'proxy')
- `locked-content-selector`: CSS selector for locked content when using signed URLs

**Events:**

All per-element events bubble and are composed (cross shadow roots).

- `sesamy:content-unlocked`: Fired when gated content is decrypted and rendered into the element. `detail: { contentName: string }` — matches the element's `data-dca-content-name` attribute when present, otherwise falls back to the resolved `publisher-content-id`.
- `sesamyUnlocked`: Legacy event, still dispatched alongside `sesamy:content-unlocked`. `detail: { publisherContentId, itemSrc }`.

The container also emits the `viewArticle` and `content_unlocked` interactions through sesamy-js — see [Interaction tracking](#interaction-tracking).

```js
const el = document.querySelector('sesamy-content-container');
el.addEventListener('sesamy:content-unlocked', (e) => {
  analytics.track('content_unlocked', { name: e.detail.contentName });
});
```

**Basic Usage Example:**

```html
<!-- Basic content container with preview and locked content -->
<sesamy-content-container item-src="https://example.com/article.html">
  <div slot="preview">This is a preview visible to everyone</div>
  <div slot="content">This is the full content for authorized users</div>
</sesamy-content-container>

<!-- Content visible only to logged-in users -->
<sesamy-content-container access-level="logged-in">
  <div slot="preview">Please log in to view this content</div>
  <div slot="content">This content is for logged-in users only</div>
</sesamy-content-container>
```

### sesamy-paywall

A web component that displays a paywall for content, loading paywall settings from a remote URL and supporting different templates (Article, Boxes, Login).

**Props/Attributes:**

- `settings-url`: URL to fetch paywall settings (required)
- `item-src`: URL of the content item
- `price`: Price of the content
- `currency`: Currency code for the price
- `redirect-url`: URL to redirect after purchase
- `utm-source`, `utm-medium`, `utm-campaign`, `utm-term`, `utm-content`: UTM parameters for tracking
- `pass`: Pass ID for access

**Events:**

Per-element events dispatched directly on the `<sesamy-paywall>` element (bubble, composed):

- `sesamy:paywall-shown`: Fired once per visible mount when the paywall becomes visible to the user. `detail: { reason: 'unauthenticated' | 'no-entitlement' | 'consent-required' | string }`.
- `sesamy:paywall-dismissed`: Fired when the user dismisses the paywall without purchasing (element is removed while it was shown and access was never granted). `detail: {}`.
- `sesamy:access-granted`: Fired when the paywall confirms the user has access and hides itself. `detail: { scopes: string[] }` — the entitlement scopes / passes that granted access.

```js
const el = document.querySelector('sesamy-paywall');
el.addEventListener('sesamy:paywall-shown', (e) => {
  console.log('paywall visible; reason:', e.detail.reason);
});
el.addEventListener('sesamy:access-granted', (e) => {
  console.log('granted scopes:', e.detail.scopes);
});
```

Legacy bus events (emitted on `window` via `api.events.emit`, unchanged):

- `sesamyPaywallAccessChecked`: Emitted after access check, with `{ hasAccess, paywallId, articleUrl, passes }` in `detail`.
- `sesamyPaywallProductSelected`: Emitted when a product/subscription is selected and the continue button is pressed, with `{ product, checkoutId, paywallId }` in `detail`.
- `sesamyPaywallCheckoutRedirect`: Emitted before redirecting to checkout, with `{ checkout, paywallId, paymentMethod }` in `detail`.

The paywall also emits the `addToCart` interaction through sesamy-js when the user continues to checkout — see [Interaction tracking](#interaction-tracking).

**Slots:**

- `below-headline`: Content rendered below the paywall headline (e.g., additional info, custom elements)
- `features`: Content rendered in the features section of the paywall (e.g., feature list, benefits)

**Basic Usage Example:**

```html
<!-- Article paywall -->
<sesamy-paywall
  settings-url="https://api.example.com/paywall/settings"
  item-src="https://example.com/article"
  price="99"
  currency="USD"
>
  <div slot="features">✔️ Unlimited access<br />✔️ Cancel anytime</div>
</sesamy-paywall>

<!-- Login paywall with below-headline slot -->
<sesamy-paywall settings-url="https://api.example.com/paywall/login-settings">
  <div slot="below-headline">Additional content below headline</div>
</sesamy-paywall>
```

#### Slots

The `sesamy-paywall` component provides two main slots for customization:

##### below-headline

- **Purpose:** Inserts custom content directly below the paywall headline.
- **Behavior:** The content you provide in this slot will be rendered in addition to the default paywall content, immediately below the headline. Use this for adding extra information, banners, or custom elements.
- **Example:**
  ```html
  <sesamy-paywall settings-url="https://api.example.com/paywall/login-settings">
    <div slot="below-headline">Special offer for new users!</div>
  </sesamy-paywall>
  ```

##### features

- **Purpose:** Replaces the default features section of the paywall.
- **Behavior:** When you provide content in the `features` slot, it will completely replace the built-in features list or section. Use this slot to fully customize the list of benefits, features, or selling points shown to the user.
- **Example:**
  ```html
  <sesamy-paywall settings-url="https://api.example.com/paywall/settings">
    <div slot="features">
      <ul>
        <li>✔️ Unlimited access</li>
        <li>✔️ Cancel anytime</li>
        <li>✔️ Exclusive articles</li>
      </ul>
    </div>
  </sesamy-paywall>
  ```

**Note:**

- The `below-headline` slot adds to the paywall, while the `features` slot replaces the default features section entirely.

### sesamy-visibility

A simple web component that conditionally renders content based on user authentication status.

**Basic Usage Example:**

```html
<sesamy-visibility>
  <div slot="logged-in">This content is only visible when logged in</div>
  <div slot="not-logged-in">This content is only visible when not logged in</div>
</sesamy-visibility>
```

### sesamy-avatar

A web component that displays a user avatar image with configurable size and loading state.

**Props/Attributes:**

- `src`: URL of the avatar image
- `alt`: Alt text for the image
- `size`: Size of the avatar ('sm', 'md', or 'lg')
- `loading`: Boolean to show loading state

**Basic Usage Example:**

```html
<!-- Default avatar -->
<sesamy-avatar src="https://example.com/user.jpg" alt="User avatar"></sesamy-avatar>

<!-- Large avatar with loading state -->
<sesamy-avatar src="https://example.com/user.jpg" size="lg" loading></sesamy-avatar>
```

### sesamy-button

A customizable button web component with multiple variants and sizes.

**Props/Attributes:**

- `variant`: Button style variant ('primary', 'secondary', or 'tertiary')
- `size`: Button size ('sm', 'md', or 'lg')
- `loading`: Boolean to show loading spinner
- `disabled`: Boolean to disable the button
- `href`: URL if the button should act as a link
- `type`: Button type ('button', 'submit', etc.)
- `class`: Additional CSS classes

**Basic Usage Example:**

```html
<!-- Primary button -->
<sesamy-button variant="primary">Subscribe</sesamy-button>

<!-- Secondary button with loading state -->
<sesamy-button variant="secondary" loading>Processing...</sesamy-button>

<!-- Button as a link -->
<sesamy-button href="/checkout" variant="primary">Go to Checkout</sesamy-button>
```

### sesamy-login-menu-item

A web component for individual menu items in the login dropdown menu. Can be used to customize the logged-in user menu.

**Props/Attributes:**

- `type`: Type of menu item ('EMAIL', 'ACCOUNT', 'LOGOUT', or 'LINK')
- `href`: URL for link type items
- `target`: Link target attribute (e.g., '\_blank')
- `text`: Custom text for the menu item

**Basic Usage Example:**

```html
<!-- Account link -->
<sesamy-login-menu-item type="ACCOUNT"></sesamy-login-menu-item>

<!-- Custom link -->
<sesamy-login-menu-item
  type="LINK"
  href="https://example.com/settings"
  text="Settings"
></sesamy-login-menu-item>

<!-- Logout button -->
<sesamy-login-menu-item type="LOGOUT"></sesamy-login-menu-item>
```

## Internationalization

The components support multiple languages out of the box. Supported languages:

- 🇬🇧 English (en)
- 🇸🇪 Swedish (sv)
- 🇳🇴 Norwegian Bokmål (nb)
- 🇩🇰 Danish (da)
- 🇫🇮 Finnish (fi)
- 🇮🇹 Italian (it)
- 🇵🇱 Polish (pl)
- 🇨🇿 Czech (cs)

Set the language using the `lang` attribute on supported components:

```html
<sesamy-login lang="sv"></sesamy-login>
```

## Development

Your components source code lives in `packages/lib/` folder. Only components with the `.wc.svelte` extension will be exported as web components and available in your library. This means that you can also use regular Svelte components with the `.svelte` extension as child components for your implementation details.

You can add additional components by adding them to the `packages/lib/src` folder and editing `packages/lib/index.ts`.

### Available Scripts

| Command                | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `yarn dev`             | Start the development server                       |
| `yarn build`           | Build both library and demo                        |
| `yarn build:lib`       | Build the library only                             |
| `yarn storybook`       | Start Storybook for component development          |
| `yarn build:storybook` | Build Storybook for deployment                     |
| `yarn test`            | Run Playwright tests                               |
| `yarn check`           | Run Svelte type checking                           |
| `yarn pull-translations` | Pull latest translations from i18nexus          |

## Testing your components

You can start a development server with:

```bash
yarn dev
```

Then open your browser to [localhost:5173](http://localhost:5173).

This will build the demo application located in the `packages/demo/` folder, in which you can use and test your web components during development.

### Storybook

For component development and visual testing, use Storybook:

```bash
yarn storybook
```

Then open your browser to [localhost:6006](http://localhost:6006).

### End-to-End Tests

Run Playwright tests with:

```bash
yarn test
```

For running E2E tests in Docker (ensuring consistent snapshots):

```bash
yarn e2e
```

To update snapshots:

```bash
yarn e2e:snapshots
```

### Using the built web components with the demo app

The demo application is provided for development and testing of your components, that's why it imports the `.svelte` files from the `packages/lib/` folder directly by default.

If you prefer, you can import the built web components from the `dist/` folder instead, by editing `packages/demo/src/App.svelte` and replacing the import statement with `import '../../../dist/lib';` if you have the `bundleComponents` option enabled.

You'll also have to make sure to run the `yarn build` script to generate the `dist/lib/` folder first.

## Building the library

The command `yarn build` will create the web components library in the `dist/lib/` folder. It creates both an ES module (`dist/lib/<your-lib>.js`) suitable for bundler (non-minified), a minified ES module (`dist/lib/<your-lib>.min.js`) and a regular UMD script (`dist/lib/<your-lib>.umd.js`).

The build is automatically called when executing `yarn publish` to distribute your library, thanks to the `prepublishOnly` script entry in `package.json`.

## Notes and limitations

This template does not provide any web components polyfills for older browsers support. It's usually best to leave that task to the host application, hence why they're left out.

### Props

Props on a `.wc.svelte` component are exposed both as properties of the DOM element and, where possible, as attributes. The attribute name defaults to the prop name lowercased, so a camelCase prop like `buttonText` is only settable from markup as `buttontext` — name each prop exactly as the attribute should be written instead: lowercase for a single word, kebab-case for several. Rename the kebab-case keys to camelCase locals in the `$props()` destructure so the component body stays readable:

```svelte
<!-- MyComponent.wc.svelte -->
<svelte:options customElement={{ tag: 'my-component' }} />

<script lang="ts">
  let { myvalue = 'Default', 'item-src': itemSrc = '' } = $props();
</script>
```

```html
<my-component myvalue="Hello" item-src="https://example.com/article"></my-component>
```

Values set through an attribute always arrive as strings. A prop that needs another type has to declare it in the `customElement.props` config (`{ type: 'Number' | 'Boolean' | 'Array' | 'Object' }`), or be assigned as a DOM property rather than an attribute.

See [`ContentContainer.wc.svelte`](packages/lib/src/ContentContainer.wc.svelte) for the same pattern with the prop types declared in `types.ts`.

### Events

Between plain Svelte components you'd signal the parent with a callback prop or `createEventDispatcher`; neither travels well across the custom element boundary. `createEventDispatcher` events are never re-dispatched on the element, and a callback prop only reaches the component if the consumer assigns it as a DOM property (`el.onLogin = fn`) — it can't be wired up from plain HTML. So a `.wc.svelte` component talks to the host page by dispatching a real DOM `CustomEvent`, which consumers listen for with `addEventListener`. Inside a component compiled as a custom element the `$host()` rune returns that element — under Svelte 5 this is the supported API rather than a workaround.

Here's an example:

```svelte
<!-- MyComponent.wc.svelte -->
<svelte:options customElement={{ tag: 'my-component' }} />

<script>
  // example function for dispatching events
  const dispatchEvent = (name, detail) =>
    $host().dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
</script>

<button onclick={() => dispatchEvent('test', 'Hello!')}>Click to dispatch event</button>
```

Both flags matter. Without `bubbles: true` the event only reaches a listener bound directly to the element, so event delegation on a container won't see it; without `composed: true` it can't escape an enclosing shadow root, which bites as soon as the element is nested inside another component's shadow DOM. The components in this repo get both from the typed `dispatchSesamyEvent` helper in `packages/lib/src/events.ts`, which also type-checks `detail` against `SesamyElementEventMap` — prefer it over a raw `CustomEvent`.

## Create a new component

These are the files needed to create a new component:

1. Add the `my-component.wc.svelte` file in the `packages/lib/src` folder.
2. Add the class in the `packages/lib/src/sesamy-components.d.ts` file to get the types exported.
3. Add the component to the `packages/lib/index.ts` file to export it.
4. Add a story in the `packages/lib/src/stories` folder.

## License

This project is proprietary software by Sesamy.
