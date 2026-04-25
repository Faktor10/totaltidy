"use client";

import { useRouter } from "next/navigation";
import { CameraView } from "@/components/camera-view";

export default function CapturePage() {
  const router = useRouter();

  return (
    <CameraView
      onCapture={() => {
        // Future: upload blob to Cloudinary and call trpc.items.capture
      }}
      onClose={() => router.back()}
    />
  );
}
