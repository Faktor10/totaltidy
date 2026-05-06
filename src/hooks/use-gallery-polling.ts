import { trpc } from "@/lib/trpc";

export const POLLING_INTERVAL_MS = 3000;

export function hasItemsProcessing(
  items: Array<{ processedImageUrl: string | null }> | undefined,
): boolean {
  if (!items) return false;
  return items.some((item) => !item.processedImageUrl);
}

export function useGalleryPolling() {
  return trpc.items.list.useQuery(undefined, {
    refetchInterval: (query) => {
      return hasItemsProcessing(query.state.data) ? POLLING_INTERVAL_MS : false;
    },
  });
}
