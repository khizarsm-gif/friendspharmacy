"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppContactUrl } from "@/lib/whatsapp";
import { classNames } from "@/lib/utils";

interface WhatsAppButtonProps {
  message?: string;
  label?: string;
  className?: string;
  variant?: "solid" | "floating";
}

/**
 * Reusable "WhatsApp Us" button. Opens wa.me with the pharmacy's configured
 * WhatsApp number (config/business.ts) and an optional pre-filled message.
 */
export default function WhatsAppButton({
  message,
  label = "WhatsApp Us",
  className,
  variant = "solid",
}: WhatsAppButtonProps) {
  const href = buildWhatsAppContactUrl(message);

  if (variant === "floating") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={classNames(
          "fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-card-hover transition-transform hover:scale-105",
          className
        )}
      >
        <MessageCircle className="h-7 w-7" aria-hidden="true" />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classNames("btn-whatsapp", className)}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}
