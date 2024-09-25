import "./app.css";
import { mount } from "svelte";
import App from "./App.svelte";

const appElement = document.getElementById("app");
if (!appElement) {
  throw new Error("Failed to find app element");
}

const app = mount(App, { target: appElement });

export default app;
