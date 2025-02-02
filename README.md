# 🌐 sesamy-components

> A project for building a shareable web components library using [Vite](https://vitejs.dev), [Svelte](https://svelte.dev), [storybook](https://storybook.js.org) and [TypeScript](https://www.typescriptlang.org).

This templates generates typed [web components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) than can be used with [plain HTML](https://www.webcomponents.org/introduction#how-do-i-use-a-web-component-) or within any major frameworks, such as React, Angular, Vue or Svelte (see [compatibility](https://custom-elements-everywhere.com/)).

## How to use this template

You can directly create a new GitHub repo from this template by selecting the **Use this template** button on GitHub.

You can also clone it locally with the following commands:

```bash
npx degit sesamy/sesamy-components
cd sesamy-components
yarn
```

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
