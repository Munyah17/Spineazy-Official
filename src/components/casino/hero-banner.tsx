"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Banner } from "@/lib/data/banners";

const ACCENT_GRADIENT: Record<Banner["accent"], string> = {
  primary: "from-primary/40 via-primary/10 to-transparent",
  boost: "from-boost/40 via-boost/10 to-transparent",
  info: "from-[#4ea8ff]/40 via-[#4ea8ff]/10 to-transparent",
};

export function HeroBanner({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const slide = banners[index];

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (!slide) return null;

  return (
    <div className="relative h-44 overflow-hidden rounded-2xl bg-surface-2 sm:h-56 lg:h-64">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={cn("absolute inset-0 flex flex-col justify-center gap-2 bg-gradient-to-r px-6 sm:px-10", ACCENT_GRADIENT[slide.accent])}
        >
          {slide.eyebrow && (
            <span className="text-xs font-bold tracking-widest text-primary uppercase">{slide.eyebrow}</span>
          )}
          <h1 className="max-w-md text-2xl font-extrabold text-foreground sm:text-3xl">{slide.title}</h1>
          {slide.description && (
            <p className="max-w-sm text-sm text-foreground/70 sm:text-base">{slide.description}</p>
          )}
          {slide.cta_label && slide.cta_href && (
            <Button asChild className="mt-2 w-fit">
              <Link href={slide.cta_href}>{slide.cta_label}</Link>
            </Button>
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-primary" : "w-1.5 bg-foreground/30")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
