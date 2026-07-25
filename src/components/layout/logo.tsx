import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-sans text-xl font-extrabold tracking-tight select-none", className)}>
      <span className="text-foreground">SPIN</span>
      <span className="text-primary">EAZY</span>
    </span>
  );
}
