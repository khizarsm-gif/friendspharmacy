"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Loader2, UserPlus } from "lucide-react";
import PasswordField from "../_components/PasswordField";
import { addMember, type TeamActionState } from "./actions";

const initialState: TeamActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
      {pending ? "Adding…" : "Add member"}
    </button>
  );
}

export default function AddMemberForm() {
  const [state, formAction] = useFormState(addMember, initialState);

  return (
    <form action={formAction} className="card space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="font-semibold text-gray-900">Add a team member</h2>
        <p className="text-sm text-gray-500">
          They sign in at <span className="font-medium text-gray-700">/admin</span> and must choose their own
          password the first time.
        </p>
      </div>
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="member-name" className="label">Name *</label>
          <input id="member-name" name="name" required className="input" placeholder="e.g. Ali (Purchaser)" />
        </div>
        <div>
          <label htmlFor="member-email" className="label">Email *</label>
          <input id="member-email" name="email" type="email" required autoComplete="off" className="input" />
        </div>
        <div>
          <label htmlFor="member-role" className="label">Role *</label>
          <select id="member-role" name="role" defaultValue="purchaser" className="input">
            <option value="purchaser">Purchaser: products only</option>
            <option value="owner">Owner: full access + team</option>
          </select>
        </div>
        <PasswordField id="member-password" name="password" label="Temporary password *" generate />
      </div>
      <p className="text-xs text-gray-500">
        Share the email and temporary password with them privately (for example in person or a direct message).
      </p>
      <SubmitButton />
    </form>
  );
}
