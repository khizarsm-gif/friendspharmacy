"use client";

import { useState, useTransition } from "react";
import { setVoucherActive } from "./actions";

/** Switches a voucher on or off from the list. Shows the server's error if it fails. */
export default function VoucherActiveToggle({ id, active }: { id: number; active: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await setVoucherActive(id, !active);
            if (result.error) setError(result.error);
          });
        }}
        className="rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
      >
        {isPending ? "Saving…" : active ? "Switch off" : "Switch on"}
      </button>
      {error && <span className="mt-1 max-w-[16rem] text-right text-xs text-red-600">{error}</span>}
    </span>
  );
}
