"use client";

import { useTransition } from "react";
import { deleteProduct } from "./actions";

export default function DeleteProductButton({ id, name }: { id: number; name: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
          startTransition(() => {
            deleteProduct(id);
          });
        }
      }}
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
