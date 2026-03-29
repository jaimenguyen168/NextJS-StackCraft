import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 h-14 shrink-0">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>

      {/* Grid */}
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
