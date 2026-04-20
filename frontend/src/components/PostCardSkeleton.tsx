export function PostCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-5 w-3/4 bg-muted rounded" />
        <div className="h-5 w-1/2 bg-muted rounded" />
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-5/6 bg-muted rounded" />
        </div>
        <div className="flex gap-4 pt-2">
          <div className="h-3 w-10 bg-muted rounded" />
          <div className="h-3 w-10 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
