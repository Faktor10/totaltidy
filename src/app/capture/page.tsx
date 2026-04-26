"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { CameraView } from "@/components/camera-view";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";

export default function CapturePage() {
  const { upload } = useCloudinaryUpload();

  const handleCapture = useCallback(
    (blob: Blob) => {
      void upload(blob);
    },
    [upload],
  );

  return <CameraView onCapture={handleCapture} />;
}
