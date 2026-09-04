import { Link, useLocation } from "wouter";
import styles from "./bottom-nav.module.css";
import { InboxBadge } from "./inbox-badge";

const NAV_ITEMS = [
  { href: "/capture", label: "Capture", icon: "\u{1F4F7}" },
  { href: "/inbox", label: "Inbox", icon: "\u{1F4E5}", showBadge: true },
  { href: "/gallery", label: "Gallery", icon: "\u{1F5BC}" },
  { href: "/dashboard", label: "Dashboard", icon: "\u{1F4CA}" },
] as const;

/** The nav is for signed-in navigation only, so it stays off the auth screens. */
export function BottomNav() {
  const [pathname] = useLocation();

  if (pathname === "/" || pathname.startsWith("/auth/")) {
    return null;
  }

  return (
    <nav className={styles.nav} data-testid="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.link} ${isActive ? styles.active : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className={styles.iconWrap}>
              <span className={styles.icon}>{item.icon}</span>
              {"showBadge" in item && item.showBadge && <InboxBadge />}
            </span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
