import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-5 text-center">
      <p className="text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Spineazy Casino. All rights reserved. 18+ | Play Responsibly
      </p>
      <Link
        href="https://globalspaceweb.co.zw"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-xs text-muted-foreground/70 transition-colors hover:text-primary"
      >
        Developed &amp; Powered By Global Space Web. +263773909307
      </Link>
    </footer>
  );
}
