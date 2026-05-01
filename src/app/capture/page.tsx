"use client";

import { useCallback } from "react";
import { CameraView } from "@/components/camera-view";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";
import { trpc } from "@/lib/trpc";

export default function CapturePage() {
  const { upload } = useCloudinaryUpload();
  const captureItem = trpc.items.capture.useMutation();

  const handleCapture = useCallback(
    async (blob: Blob) => {
      const result = await upload(blob);
      if (!result) return;
      captureItem.mutate({ cloudinaryPublicId: result.public_id });
    },
    [upload, captureItem],
  );

  return <CameraView onCapture={handleCapture} />;
}
