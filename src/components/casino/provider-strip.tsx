import { ALL_PROVIDERS } from "@/lib/data/providers";

export function ProviderStrip() {
  return (
    <div className="no-scrollbar flex items-center gap-6 overflow-x-auto py-1">
      {ALL_PROVIDERS.map((provider) => (
        <span
          key={provider}
          className="shrink-0 text-sm font-bold tracking-wide text-muted-foreground/70 uppercase transition-colors hover:text-foreground"
        >
          {provider}
        </span>
      ))}
    </div>
  );
}
