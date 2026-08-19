import Link from "next/link";

export function Footer() {
  return (
    <footer className="flex flex-col items-center gap-1 border-t border-border px-4 py-5 text-center sm:flex-row sm:justify-center sm:gap-2">
      <p className="text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Spineazy Casino. All rights reserved. 18+ | Play Responsibly
      </p>
      <span className="hidden text-xs text-muted-foreground/50 sm:inline">|</span>
      <Link
        href="https://globalspaceweb.co.zw"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground/70 transition-colors hover:text-primary"
      >
        Developed &amp; Powered By Global Space Web. +263773909307
      </Link>
    </footer>
  );
}
