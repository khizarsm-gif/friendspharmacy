"use client";

import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}

export default function QuantitySelector({
  quantity,
  onChange,
  min = 1,
  max = 99,
  size = "md",
}: QuantitySelectorProps) {
  const dec = () => onChange(Math.max(min, quantity - 1));
  const inc = () => onChange(Math.min(max, quantity + 1));

  const btnSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div
      className="inline-flex items-center rounded-full border border-gray-200"
      role="group"
      aria-label="Quantity selector"
    >
      <button
        type="button"
        onClick={dec}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
        className={`flex ${btnSize} items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        className={`w-8 text-center font-semibold ${textSize}`}
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={quantity >= max}
        aria-label="Increase quantity"
        className={`flex ${btnSize} items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
