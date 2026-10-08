"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { selectableStatuses, STATUS_LABELS } from "@/lib/orders";
import type { DeliveryMethod, OrderStatus } from "@/types";
import { saveInternalNotes, updateOrderStatus, type OrderActionState } from "../actions";

const initialState: OrderActionState = { error: null, success: null };

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary !py-2.5">
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel : label}
    </button>
  );
}

function Feedback({ state }: { state: OrderActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800 ring-1 ring-brand-200">
        {state.success}
      </p>
    );
  }
  return null;
}

export function StatusForm({
  orderId,
  status,
  deliveryMethod,
}: {
  orderId: string;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
}) {
  const [state, formAction] = useFormState(updateOrderStatus, initialState);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor="status" className="label">Status</label>
        <select id="status" name="status" defaultValue={status} className="input">
          {selectableStatuses(deliveryMethod).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="note" className="label">
          Note <span className="text-gray-400">(optional, saved in the history)</span>
        </label>
        <input id="note" name="note" maxLength={500} className="input" placeholder="e.g. Customer confirmed by phone" />
      </div>
      <Feedback state={state} />
      <SubmitButton label="Update status" pendingLabel="Saving…" />
    </form>
  );
}

export function InternalNotesForm({ orderId, notes }: { orderId: string; notes: string }) {
  const [state, formAction] = useFormState(saveInternalNotes, initialState);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor="notes" className="label">
          Internal notes <span className="text-gray-400">(staff only, never shown to the customer)</span>
        </label>
        <textarea id="notes" name="notes" maxLength={2000} defaultValue={notes} className="input min-h-[90px]" />
      </div>
      <Feedback state={state} />
      <SubmitButton label="Save notes" pendingLabel="Saving…" />
    </form>
  );
}
