"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { popIn, springBouncy } from "@/lib/motion";
import styles from "./thumbnail-tray.module.css";

export interface ThumbnailTrayProps {
  captures: string[];
}

const MAX_THUMBNAILS = 4;

export function ThumbnailTray({ captures }: ThumbnailTrayProps) {
  const visible = captures.slice(0, MAX_THUMBNAILS);

  if (visible.length === 0) return null;

  return (
    <div className={styles.tray} data-testid="thumbnail-tray">
      {visible.map((blobUrl, index) => (
        <motion.div
          key={blobUrl}
          variants={popIn}
          initial="hidden"
          animate="visible"
          transition={springBouncy}
          className={`${styles.thumbWrap}${index === 0 ? ` ${styles.latest}` : ""}`}
        >
          <Image
            src={blobUrl}
            alt={`Capture ${captures.length - index}`}
            width={48}
            height={48}
            unoptimized
            className={styles.thumb}
            data-testid="thumbnail-image"
          />
        </motion.div>
      ))}
    </div>
  );
}
