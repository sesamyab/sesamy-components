import { init } from "@sesamy/sesamy-js";
import type { Config } from "@sesamy/sesamy-js";

export type Api = Awaited<ReturnType<typeof init>>;

let api: Api | null = null;

// For now we explictly pass the config here. It would be possible to fetch it from the window object as well
export async function getApi(config: Config, reinitialize = false) {
  if (!api || reinitialize) {
    api = await init(config);
  }

  return api;
}
