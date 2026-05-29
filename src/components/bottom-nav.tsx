"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { springBouncy } from "@/lib/motion";
import styles from "./bottom-nav.module.css";
import { InboxBadge } from "./inbox-badge";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/capture", label: "Capture", icon: "\u{1F4F7}" },
  { href: "/inbox", label: "Inbox", icon: "\u{1F4E5}", showBadge: true },
  { href: "/gallery", label: "Gallery", icon: "\u{1F5BC}" },
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
            <motion.span
              className={styles.iconWrap}
              whileTap={{ scale: 0.8 }}
              transition={springBouncy}
            >
              <span className={styles.icon}>{item.icon}</span>
              {"showBadge" in item && item.showBadge && <InboxBadge />}
            </motion.span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
