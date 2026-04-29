"use client";

import Image from "next/image";
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
        <Image
          key={blobUrl}
          src={blobUrl}
          alt={`Capture ${captures.length - index}`}
          width={48}
          height={48}
          unoptimized
          className={`${styles.thumb}${index === 0 ? ` ${styles.latest}` : ""}`}
          data-testid="thumbnail-image"
        />
      ))}
    </div>
  );
}
