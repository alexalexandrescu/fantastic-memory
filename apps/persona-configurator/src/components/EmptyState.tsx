import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
      <Card className="w-full max-w-md border-dashed">
        <CardContent className="flex flex-col items-center text-center p-8 space-y-4">
          <div className="rounded-full bg-muted p-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
          </div>
          {actionLabel && onAction && (
            <Button onClick={onAction} className="mt-4 animate-scale-in">
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
