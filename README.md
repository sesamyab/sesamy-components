# 🌐 sesamy-components

> A shareable web components library using [Vite](https://vitejs.dev), [Svelte](https://svelte.dev), [storybook](https://storybook.js.org) and [TypeScript](https://www.typescriptlang.org).

This library provides typed [web components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) that can be used with [plain HTML](https://www.webcomponents.org/introduction#how-do-i-use-a-web-component-) or within any major frameworks, such as React, Angular, Vue or Svelte (see [compatibility](https://custom-elements-everywhere.com/)).

## Installation

You can install the package with:

```bash
npm install @sesamy/sesamy-components
# or
yarn add @sesamy/sesamy-components
```

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
- `login`: Dispatched when login action is triggered

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
    --sesamy-login-button-background-color: blue; /* Sets background color of the login button, default transparent */
    --sesamy-login-button-text-color: green; /* Sets text color of the login button, default black */
    --sesamy-login-button-border-color: pink; /* Sets border color of the login button, default black */
    --sesamy-login-button-border-width: 5px; /* Sets border width of the login button, default 1px */
    --sesamy-login-button-border-radius: 20px; /* Sets border radius of the login button, default */
    --sesamy-login-button-font-weight: 100; /* Sets font weight of the login button, default 700 */
    --sesamy-login-popup-width: 400px; /* Sets width of the login popup, default 18rem */
    --sesamy-login-popup-bgcolor: green; /* Sets background color of the login popup, default white */
    --sesamy-login-popup-textcolor: pink; /* Sets text color of the login popup, default black */
    --sesamy-login-popup-border-color: red; /* Sets border color of the login popup, default #e5e7eb */
    --sesamy-login-popup-border-width: 5px; /* Sets border width of the login popup, default 1px */
    --sesamy-login-popup-border-radius: 20px; /* Sets border radius of the login popup, default 0.125rem */
    --sesamy-login-popup-zindex: 100; /* Sets z-index of the login popup, default 10 */
  "
></sesamy-login>
```

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
- `sesamyUnlocked`: Dispatched when content is unlocked (with `item-src` and `publisher-content-id` in detail)

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

**Basic Usage Example:**
```html
<!-- Article paywall -->
<sesamy-paywall 
  settings-url="https://api.example.com/paywall/settings" 
  item-src="https://example.com/article"
  price="99"
  currency="USD">
</sesamy-paywall>

<!-- Login paywall -->
<sesamy-paywall settings-url="https://api.example.com/paywall/login-settings">
  <div slot="below-headline">Additional content below headline</div>
</sesamy-paywall>
```

### sesamy-visibility

A simple web component that conditionally renders content based on user authentication status.

**Basic Usage Example:**
```html
<sesamy-visibility>
  <div slot="logged-in">This content is only visible when logged in</div>
  <div slot="not-logged-in">This content is only visible when not logged in</div>
</sesamy-visibility>
```

## Development

Your components source code lives in `lib/` folder. Only components with the `.wc.svelte` extension will be exported as web components and available in your library. This means that you can also use regular Svelte components with the `.svelte` extension as child components for your implementation details.

You can add additional components by adding them to the `lib` folder and editing `lib/index.js`.

## Testing your components

You can start a development server with:

```bash
npm start
```

Then open your browser to [localhost:5173](http://localhost:5173).

This will build the demo application located in the `demo/` folder, in which you can use and test your web components during development.

If you need unit tests, you can take a look at [Jest](https://jestjs.io) and [Jest testing library](https://github.com/testing-library/svelte-testing-library).

### Using the built web components with the demo app

The demo application is provided for development and testing of your components, that's why it imports the `.svelte` files from the `lib/` folder directly by default.

If you prefer, you can import the built web components from the `dist/` folder instead, by editing `demo/src/App.svelte` and replacing the `import '../../lib';` statement with `import '../../../dist/lib';` if you have the `bundleComponents` option enabled, or individually import your components with `import import '../../dist/MyComponent.wc.js';` otherwise.

You'll also have to make sure to run the `yarn build` script to generate the `dist/lib/` folder first.

## Building the library

The command `yarn build` will create the web components library in the `dist/lib/` folder. It creates both an ES module (`dist/lib/<your-lib>.js`) suitable for bundler (non-minified), a minified ES module (`dist/lib/<your-lib>.min.js`) and a regular UMD script (`dist/lib/<your-lib>.umd.js`).

The build is automatically called when executing `yarn publish` to distribute your library, thanks to the `prepublishOnly` script entry in `package.json`.

## Notes and limitations

This template does not provide any web components polyfills for older browsers support. It's usually best to leave that task to the host application, hence why they're left out.

### Props

Any props accepted by your web component are automatically transformed to element attributes. Since camelCase or PascalCase does not work in HTML, you have to make sure to name your props in lowercase.

```html
<script>
  export let myvalue = 'Default';
</script>
```

### Events

The Svelte syntax event for listening to events like `on:myevent` doesn't work with events dispatched from a Svelte web component ([#3119](https://github.com/sveltejs/svelte/issues/3119)).

You need to use a workaround for that, by creating a `CustomEvent` and dispatching it.

Here's an example:

```html
// MyComponent.wc.svelte
<svelte:options tag="my-component" />
<script>
  import { get_current_component } from 'svelte/internal';
  const component = get_current_component();

  // example function for dispatching events
  const dispatchEvent = (name, detail) =>
    component.dispatchEvent(new CustomEvent(name, { detail }));
</script>
<button onclick="{()" ="">dispatchEvent("test", "Hello!")}> Click to dispatch event</button>
```

## Create a new component

These are the files needed to create a new component:

- Add the `my-component.wc.svelte` file in the `lib/src` folder.
- Add the class in the `lib/src/sesamy-component.d.ts` file to get the types exported.
- Add the component to the `lib/src/index.ts` file to export it.
- Add a story in the `stories` folder.
