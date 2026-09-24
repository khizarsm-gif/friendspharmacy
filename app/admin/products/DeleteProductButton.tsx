"use client";

import ConfirmDeleteButton from "../_components/ConfirmDeleteButton";
import { deleteProduct } from "./actions";

/** Kept for compatibility; the products table uses ConfirmDeleteButton directly. */
export default function DeleteProductButton({ id, name }: { id: number; name: string }) {
  return (
    <ConfirmDeleteButton
      action={deleteProduct.bind(null, id)}
      confirmText={`Delete "${name}"? This cannot be undone.`}
    />
  );
}
