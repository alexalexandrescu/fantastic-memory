import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingSkeletonProps {
  count?: number;
  variant?: "card" | "list" | "message" | "text";
}

export function LoadingSkeleton({
  count = 3,
  variant = "card",
}: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <Card
            key={i}
            className="animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 animate-fade-in"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "message") {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex gap-2 animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 w-full animate-fade-in"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

