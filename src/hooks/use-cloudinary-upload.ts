"use client";

import { useCallback, useRef, useState } from "react";
import { type CloudinaryUploadResult, uploadToCloudinary } from "@/lib/cloudinary-upload";

export interface UseCloudinaryUploadReturn {
  upload: (blob: Blob) => Promise<CloudinaryUploadResult | null>;
  isUploading: boolean;
  error: string | null;
  lastResult: CloudinaryUploadResult | null;
  reset: () => void;
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CloudinaryUploadResult | null>(null);
  const activeUploads = useRef(0);

  const upload = useCallback(async (blob: Blob): Promise<CloudinaryUploadResult | null> => {
    setError(null);
    activeUploads.current += 1;
    setIsUploading(true);

    try {
      const result = await uploadToCloudinary(blob);
      setLastResult(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      return null;
    } finally {
      activeUploads.current -= 1;
      if (activeUploads.current === 0) {
        setIsUploading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLastResult(null);
  }, []);

  return { upload, isUploading, error, lastResult, reset };
}
