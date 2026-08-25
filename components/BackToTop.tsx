"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-24 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 text-white shadow-card-hover transition-transform hover:scale-105 sm:bottom-24"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
