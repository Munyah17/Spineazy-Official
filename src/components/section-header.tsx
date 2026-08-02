import Link from "next/link";

export function SectionHeader({
  title,
  href,
  action,
}: {
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          {action ?? "View all"}
        </Link>
      )}
    </div>
  );
}
