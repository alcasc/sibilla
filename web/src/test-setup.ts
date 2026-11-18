import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

// jsdom lacks these; Base UI and Recharts touch them.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
Element.prototype.scrollIntoView ??= () => {};
// The Web Animations API, used by Rare UI's StreamingResponse: an animation that is already over.
Element.prototype.animate ??= function () {
  const finished = Promise.resolve();
  return { finished, ready: finished, cancel() {}, finish() {}, play() {}, pause() {}, onfinish: null, playState: "finished" } as unknown as Animation;
};
// Reduced motion is "on" so animated components (Rare UI's streamed replies, the orb) settle at once: tests check behaviour, not timing.
window.matchMedia ??= ((query: string) => ({
  // motion asks "(prefers-reduced-motion)", the orb "(prefers-reduced-motion: reduce)"
  matches: query.includes("prefers-reduced-motion") && !query.includes("no-preference"), media: query, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;
