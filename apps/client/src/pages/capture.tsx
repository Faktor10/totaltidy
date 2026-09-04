import type { SessionSummary } from "@totaltidy/shared/schemas/sessions";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { CameraView } from "@/components/camera-view";
import { JoyRollCard } from "@/components/joy-roll-card";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";
import { useInactivityDetector } from "@/hooks/use-inactivity-detector";
import { playCategorizeTone } from "@/lib/sounds";
import { trpc } from "@/lib/trpc";

const INACTIVITY_TIMEOUT_MS = 60_000;

export default function CapturePage() {
  const [, navigate] = useLocation();
  const { upload } = useCloudinaryUpload();
  const captureItem = trpc.items.capture.useMutation();
  const { data: locations } = trpc.locations.predicted.useQuery();
  const { data: lastUsedLocation } = trpc.locations.lastUsed.useQuery();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const hasUserSelected = useRef(false);

  const sessionIdRef = useRef<string | null>(null);
  const sessionStarted = useRef(false);

  const startSession = trpc.sessions.startSession.useMutation();
  const endSessionMutation = trpc.sessions.endSession.useMutation();

  const handleInactivityTimeout = useCallback(() => {
    if (sessionIdRef.current) {
      endSessionMutation.mutate(
        { sessionId: sessionIdRef.current },
        {
          onSuccess: (session) => {
            const summary = session.summary as {
              itemsCaptured: number;
              locationsUsed: number;
              unsortedItems: number;
              durationMs: number;
            } | null;
            if (summary) {
              setSessionSummary(summary);
            }
          },
        },
      );
      sessionIdRef.current = null;
    }
  }, [endSessionMutation]);

  const {
    recordActivity,
    isTimedOut,
    reset: resetInactivity,
  } = useInactivityDetector({
    timeoutMs: INACTIVITY_TIMEOUT_MS,
    onTimeout: handleInactivityTimeout,
    enabled: sessionIdRef.current !== null,
  });

  useEffect(() => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    startSession.mutate(undefined, {
      onSuccess: (session) => {
        sessionIdRef.current = session?.id ?? null;
      },
    });
  }, [startSession]);

  useEffect(() => {
    if (!hasUserSelected.current && lastUsedLocation?.id) {
      setSelectedLocationId(lastUsedLocation.id);
    }
  }, [lastUsedLocation]);

  // endSessionMutation is a new object on every render (tRPC/react-query does
  // not memoize the mutation result), so it can't be a dependency here without
  // re-running this effect - and thus re-registering its cleanup - on every
  // render. A ref keeps the latest mutate fn reachable without that churn,
  // and this must stay mount-once so the cleanup only fires on actual unmount.
  const endSessionRef = useRef(endSessionMutation.mutate);
  endSessionRef.current = endSessionMutation.mutate;

  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        endSessionRef.current({ sessionId: sessionIdRef.current });
      }
    };
  }, []);

  const handleCapture = useCallback(
    async (blob: Blob) => {
      recordActivity();
      const result = await upload(blob);
      if (!result) return;
      captureItem.mutate(
        {
          cloudinaryPublicId: result.public_id,
          locationId: selectedLocationId ?? undefined,
          captureSessionId: sessionIdRef.current ?? undefined,
        },
        {
          onSuccess: () => {
            if (selectedLocationId) {
              playCategorizeTone();
            }
          },
        },
      );
    },
    [upload, captureItem, selectedLocationId, recordActivity],
  );

  const handleLocationSelect = useCallback(
    (locationId: string) => {
      recordActivity();
      hasUserSelected.current = true;
      setSelectedLocationId((prev) => (prev === locationId ? null : locationId));
    },
    [recordActivity],
  );

  const handleNewSession = useCallback(() => {
    setSessionSummary(null);
    resetInactivity();
    startSession.mutate(undefined, {
      onSuccess: (session) => {
        sessionIdRef.current = session?.id ?? null;
      },
    });
  }, [startSession, resetInactivity]);

  const handleViewGallery = useCallback(() => {
    navigate("/gallery");
  }, [navigate]);

  return (
    <>
      <CameraView
        onCapture={handleCapture}
        locations={locations}
        selectedLocationId={selectedLocationId}
        onLocationSelect={handleLocationSelect}
        isSessionEnded={isTimedOut && !sessionSummary}
      />
      {isTimedOut && sessionSummary && (
        <JoyRollCard
          summary={sessionSummary}
          onNewSession={handleNewSession}
          onViewGallery={handleViewGallery}
        />
      )}
    </>
  );
}
