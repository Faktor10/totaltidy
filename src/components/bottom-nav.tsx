"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./bottom-nav.module.css";
import { InboxBadge } from "./inbox-badge";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/capture", label: "Capture", icon: "\u{1F4F7}" },
  { href: "/inbox", label: "Inbox", icon: "\u{1F4E5}", showBadge: true },
  { href: "/dashboard", label: "Dashboard", icon: "\u{1F4CA}" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

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
