import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import styles from "./install-banner.module.css";

/**
 * Add-to-home-screen banner. See lib/pwa-install.ts for the reminder policy.
 * Fixed to the top so it never collides with the bottom nav or the capture shutter.
 */
export function InstallBanner() {
  const { mode, install, dismiss, neverRemind } = useInstallPrompt();
  if (!mode) return null;

  return (
    <aside
      role="dialog"
      aria-label="Install TotalTidy"
      data-testid="install-banner"
      className={styles.banner}
    >
      <div className={styles.row}>
        <img src="/icons/icon-192.png" alt="" width={44} height={44} className={styles.logo} />
        <div className={styles.text}>
          <p className={styles.title}>Install TotalTidy</p>
          {mode === "native" ? (
            <p className={styles.body}>
              Add it to your home screen to snap photos faster, even when your signal is bad.
            </p>
          ) : (
            <p className={styles.body}>
              Tap <Share aria-label="Share" size={16} className={styles.shareIcon} /> in Safari,
              then <strong>Add to Home Screen</strong>.
            </p>
          )}
        </div>
        <button type="button" onClick={dismiss} aria-label="Close" className={styles.close}>
          <X size={20} />
        </button>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={neverRemind}>
          Don't remind me again
        </Button>
        {mode === "native" && (
          <Button size="sm" onClick={() => void install()}>
            <Download size={16} />
            Install
          </Button>
        )}
      </div>
    </aside>
  );
}
