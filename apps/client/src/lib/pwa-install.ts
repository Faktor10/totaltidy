/**
 * PWA install-prompt state.
 *
 * Reminder policy:
 *  - Installed (or already running standalone)  -> never show again.
 *  - "Don't remind me again"                    -> never show again (localStorage).
 *  - The X button                               -> hidden for this browser session only
 *                                                  (sessionStorage), so it comes back on the
 *                                                  next visit.
 *
 * `beforeinstallprompt` can fire before React mounts, so the listener is attached at module
 * load (see `initPwaInstall`, called from main.tsx) and the event is held until the banner asks.
 */

const NEVER_KEY = "tt:pwa-install:never";
const INSTALLED_KEY = "tt:pwa-install:installed";
const DISMISSED_SESSION_KEY = "tt:pwa-install:dismissed";

/** Chromium's non-standard install event. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallMode = "native" | "ios" | null;

function read(storage: "local" | "session", key: string): string | null {
  try {
    return (storage === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null; // private mode / blocked storage: behave as "nothing stored"
  }
}

function write(storage: "local" | "session", key: string, value: string): void {
  try {
    (storage === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    // Storage unavailable: the banner just reappears next time. Acceptable.
  }
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(ua) || iPadOs;
}

/** Whether the user's stored choices still allow showing the banner. */
export function isSuppressed(): boolean {
  return (
    read("local", NEVER_KEY) === "1" ||
    read("local", INSTALLED_KEY) === "1" ||
    read("session", DISMISSED_SESSION_KEY) === "1" ||
    isStandalone()
  );
}

export const markInstalled = () => write("local", INSTALLED_KEY, "1");
export const markNeverRemind = () => write("local", NEVER_KEY, "1");
export const markDismissedForSession = () => write("session", DISMISSED_SESSION_KEY, "1");

// ---- tiny external store for the captured install event -------------------------------------

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
const listeners = new Set<() => void>();
const notify = () => {
  for (const l of listeners) l();
};

export function initPwaInstall(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // suppress the browser mini-infobar; we show our own banner
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    markInstalled();
    notify();
  });
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function clearDeferredPrompt(): void {
  deferredPrompt = null;
  notify();
}

/** Test seam: reset module state between specs. */
export function __resetPwaInstallForTests(): void {
  deferredPrompt = null;
  initialized = false;
  listeners.clear();
}

/** Register the service worker. Production only: a SW in dev caches stale modules from Vite. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Non-fatal: the app works without offline support.
    });
  });
}
