"use client";

import { useCallback, useState } from "react";
import { CameraView } from "@/components/camera-view";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";
import { trpc } from "@/lib/trpc";

export default function CapturePage() {
  const { upload } = useCloudinaryUpload();
  const captureItem = trpc.items.capture.useMutation();
  const { data: locationData } = trpc.locations.list.useQuery();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const locations = locationData?.map((loc) => ({
    id: loc.id,
    name: loc.name,
    icon: loc.icon,
  }));

  const handleCapture = useCallback(
    async (blob: Blob) => {
      const result = await upload(blob);
      if (!result) return;
      captureItem.mutate({
        cloudinaryPublicId: result.public_id,
        locationId: selectedLocationId ?? undefined,
      });
    },
    [upload, captureItem, selectedLocationId],
  );

  const handleLocationSelect = useCallback((locationId: string) => {
    setSelectedLocationId((prev) => (prev === locationId ? null : locationId));
  }, []);

  return (
    <CameraView
      onCapture={handleCapture}
      locations={locations}
      selectedLocationId={selectedLocationId}
      onLocationSelect={handleLocationSelect}
    />
  );
}
