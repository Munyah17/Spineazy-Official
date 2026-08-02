import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "primary" | "win" | "boost" | "destructive";
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            tone === "primary" && "bg-primary/15 text-primary",
            tone === "win" && "bg-win/15 text-win",
            tone === "boost" && "bg-boost/15 text-boost",
            tone === "destructive" && "bg-destructive/15 text-destructive"
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-bold text-foreground">{value}</p>
          {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
