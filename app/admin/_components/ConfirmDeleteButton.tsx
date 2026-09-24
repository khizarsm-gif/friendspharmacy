"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

/**
 * Delete button that confirms first and shows any error the server action
 * returns (for example, a category that still has products).
 */
export default function ConfirmDeleteButton({
  action,
  confirmText,
  label = "Delete",
  iconOnly = false,
}: {
  action: () => Promise<{ error: string | null }>;
  confirmText: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={isPending}
        title={label}
        aria-label={label}
        onClick={() => {
          if (!window.confirm(confirmText)) return;
          setError(null);
          startTransition(async () => {
            const result = await action();
            if (result.error) setError(result.error);
          });
        }}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {!iconOnly && (isPending ? "Deleting…" : label)}
      </button>
      {error && <span className="mt-1 max-w-[16rem] text-right text-xs text-red-600">{error}</span>}
    </span>
  );
}
