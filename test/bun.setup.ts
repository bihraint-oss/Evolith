import { JSDOM } from "../packages/web/node_modules/jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

const { window } = dom;

Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: window,
});
Object.defineProperty(globalThis, "document", {
  configurable: true,
  value: window.document,
});
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: window.navigator,
});
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: window.localStorage,
});
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: window.sessionStorage,
});

for (const propertyName of [
  "CustomEvent",
  "Element",
  "Event",
  "EventTarget",
  "HTMLElement",
  "HTMLInputElement",
  "KeyboardEvent",
  "MouseEvent",
  "Node",
  "StorageEvent",
  "Text",
]) {
  if (!(propertyName in globalThis)) {
    Object.defineProperty(globalThis, propertyName, {
      configurable: true,
      value: window[propertyName as keyof Window],
    });
  }
}

if (typeof globalThis.getComputedStyle !== "function") {
  Object.defineProperty(globalThis, "getComputedStyle", {
    configurable: true,
    value: window.getComputedStyle.bind(window),
  });
}

if (typeof globalThis.requestAnimationFrame !== "function") {
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    configurable: true,
    value: (callback: FrameRequestCallback) =>
      setTimeout(() => callback(Date.now()), 0),
  });
}

if (typeof globalThis.cancelAnimationFrame !== "function") {
  Object.defineProperty(globalThis, "cancelAnimationFrame", {
    configurable: true,
    value: (handle: number) => clearTimeout(handle),
  });
}

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  configurable: true,
  value: true,
  writable: true,
});

await import("../packages/web/src/test/setup.ts");
