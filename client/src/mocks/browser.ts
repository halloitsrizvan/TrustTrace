import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

let started: Promise<unknown> | null = null;

export function startMocks() {
  started ??= setupWorker(...handlers).start({ onUnhandledFrame: "bypass", quiet: true });
  return started;
}
