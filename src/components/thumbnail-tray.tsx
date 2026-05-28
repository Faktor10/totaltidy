"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import styles from "./thumbnail-tray.module.css";

export interface ThumbnailTrayProps {
  captures: string[];
}

const MAX_THUMBNAILS = 4;

const thumbnailVariants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.5 },
};

export function ThumbnailTray({ captures }: ThumbnailTrayProps) {
  const visible = captures.slice(0, MAX_THUMBNAILS);

  if (visible.length === 0) return null;

  return (
    <div className={styles.tray} data-testid="thumbnail-tray">
      <AnimatePresence mode="popLayout">
        {visible.map((blobUrl, index) => (
          <motion.div
            key={blobUrl}
            variants={thumbnailVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 500, damping: 25, mass: 0.8 }}
            layout
          >
            <Image
              src={blobUrl}
              alt={`Capture ${captures.length - index}`}
              width={48}
              height={48}
              unoptimized
              className={`${styles.thumb}${index === 0 ? ` ${styles.latest}` : ""}`}
              data-testid="thumbnail-image"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
