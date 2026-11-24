import { useCallback, useEffect, useState } from "react";
import {
  clearDeferredPrompt,
  getDeferredPrompt,
  type InstallMode,
  isIos,
  isSuppressed,
  markDismissedForSession,
  markInstalled,
  markNeverRemind,
  subscribe,
} from "@/lib/pwa-install";

export interface InstallPrompt {
  /** `native` = browser can prompt; `ios` = show Add-to-Home-Screen steps; null = show nothing. */
  mode: InstallMode;
  install: () => Promise<void>;
  /** X button: hide now, remind again on a later visit. */
  dismiss: () => void;
  /** "Don't remind me again": never show again. */
  neverRemind: () => void;
}

export function useInstallPrompt(): InstallPrompt {
  const [hidden, setHidden] = useState(() => isSuppressed());
  const [hasNativePrompt, setHasNativePrompt] = useState(() => getDeferredPrompt() !== null);

  useEffect(() => {
    setHasNativePrompt(getDeferredPrompt() !== null);
    return subscribe(() => {
      setHasNativePrompt(getDeferredPrompt() !== null);
      setHidden(isSuppressed());
    });
  }, []);

  const install = useCallback(async () => {
    const promptEvent = getDeferredPrompt();
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    clearDeferredPrompt(); // the event is single-use
    if (outcome === "accepted") {
      markInstalled();
      setHidden(true);
    } else {
      // Declined the browser dialog: treat like the X, so we ask again next visit.
      markDismissedForSession();
      setHidden(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    markDismissedForSession();
    setHidden(true);
  }, []);

  const neverRemind = useCallback(() => {
    markNeverRemind();
    setHidden(true);
  }, []);

  let mode: InstallMode = null;
  if (!hidden) {
    if (hasNativePrompt) mode = "native";
    else if (isIos()) mode = "ios";
  }

  return { mode, install, dismiss, neverRemind };
}
