import Link from "next/link";
import { ALL_PROVIDERS } from "@/lib/data/providers";

export function ProviderStrip() {
  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
      {ALL_PROVIDERS.map((provider) => (
        <Link
          key={provider}
          href={`/slots?provider=${encodeURIComponent(provider)}`}
          className="shrink-0 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {provider}
        </Link>
      ))}
    </div>
  );
}
