"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { CameraView } from "@/components/camera-view";

export default function CapturePage() {
  const router = useRouter();

  const handleCapture = useCallback((_blob: Blob) => {
    // Upload to Cloudinary and persist via tRPC — wired in a later subtask
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return <CameraView onCapture={handleCapture} onClose={handleClose} />;
}
