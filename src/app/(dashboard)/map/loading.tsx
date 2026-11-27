
import { SkeletonCard, SkeletonMapPlaceholder } from "@/features/skeleton/components";

export default function MapLoading() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonCard className="h-6 w-48" />
        <SkeletonCard className="mt-1 h-4 w-64 max-w-full" />
      </div>

      <SkeletonMapPlaceholder height={600} />
    </div>
  );
}
