"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, RefreshCw } from "lucide-react";
import type { AdminVoucher } from "@/lib/admin-vouchers";
import type { Category } from "@/types";
import { createVoucher, updateVoucher, type VoucherActionState } from "./actions";

const initialState: VoucherActionState = { error: null };

// No 0/O or 1/I so a code read out over the phone is hard to mix up.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** NAME-XXXX: the customer's first name plus a random part, so codes are hard to guess. */
function generateCode(customerName: string): string {
  const prefix = customerName.trim().split(/\s+/)[0]?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "VIP";
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  return `${prefix}-${suffix}`;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending ? "Saving…" : label}
    </button>
  );
}

export default function VoucherForm({
  voucher,
  categories,
}: {
  voucher?: AdminVoucher;
  categories: Category[];
}) {
  const isEdit = Boolean(voucher);
  const action = voucher ? updateVoucher.bind(null, voucher.id) : createVoucher;
  const [state, formAction] = useFormState(action, initialState);
  const [customerName, setCustomerName] = useState(voucher?.customerName ?? "");
  const [code, setCode] = useState(voucher?.code ?? "");
  // New vouchers start with Medicines ticked, the usual case for regular-customer discounts.
  const initialCategories = voucher?.categories ?? categories.filter((c) => c.slug === "medicines").map((c) => c.slug);

  return (
    <form action={formAction} className="card max-w-2xl space-y-5 p-5 sm:p-6">
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="customerName" className="label">Customer name *</label>
        <input
          id="customerName"
          name="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
          maxLength={120}
          className="input"
        />
        <p className="mt-1 text-xs text-gray-500">Only for you, to remember who the code belongs to.</p>
      </div>

      <div>
        <label htmlFor="code" className="label">Voucher code *</label>
        <div className="flex gap-2">
          <input
            id="code"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            maxLength={30}
            autoComplete="off"
            spellCheck={false}
            className="input flex-1 font-mono uppercase"
          />
          <button type="button" onClick={() => setCode(generateCode(customerName))} className="btn-secondary !py-2">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Generate
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Letters, numbers and dashes. A code with a random part (like AHMED-7K3Q) is hard for others to guess.
          {isEdit && " If you change the code, tell the customer the new one."}
        </p>
      </div>

      <div className="sm:w-40">
        <label htmlFor="discountPercent" className="label">Discount (%) *</label>
        <input
          id="discountPercent"
          name="discountPercent"
          type="number"
          min={1}
          max={100}
          step={1}
          defaultValue={voucher?.discountPercent ?? 10}
          required
          className="input"
        />
      </div>

      <fieldset>
        <legend className="label">Applies to these categories *</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {categories.map((c) => (
            <label key={c.slug} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="category"
                value={c.slug}
                defaultChecked={initialCategories.includes(c.slug)}
                className="h-4 w-4 rounded border-gray-300"
              />
              {c.name}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">Items in other categories are charged the normal price.</p>
      </fieldset>

      <div className="space-y-3">
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="excludeSaleItems"
            defaultChecked={voucher?.excludeSaleItems ?? true}
            className="mt-0.5 h-4 w-4 rounded border-gray-300"
          />
          <span>
            No extra discount on items that are already on sale
            <span className="block text-xs text-gray-500">Recommended, so a sale price and a voucher do not stack.</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={voucher?.active ?? true}
            className="mt-0.5 h-4 w-4 rounded border-gray-300"
          />
          <span>
            Code is active
            <span className="block text-xs text-gray-500">Untick to stop this code working without deleting it.</span>
          </span>
        </label>
      </div>

      <div className="sm:w-56">
        <label htmlFor="expiresOn" className="label">Last day it works (optional)</label>
        <input id="expiresOn" name="expiresOn" type="date" defaultValue={voucher?.expiresOn ?? ""} className="input" />
        <p className="mt-1 text-xs text-gray-500">Leave empty for no end date.</p>
      </div>

      <div className="flex gap-2 pt-2">
        <SubmitButton label={isEdit ? "Save changes" : "Add voucher"} />
        <Link href="/admin/vouchers" className="btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
