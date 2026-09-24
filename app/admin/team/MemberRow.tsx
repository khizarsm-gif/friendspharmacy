"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { KeyRound, Loader2 } from "lucide-react";
import ConfirmDeleteButton from "../_components/ConfirmDeleteButton";
import PasswordField from "../_components/PasswordField";
import { changeMemberRole, removeMember, resetMemberPassword, type TeamActionState } from "./actions";

export interface Member {
  userId: string;
  name: string | null;
  email: string | null;
  role: "owner" | "purchaser";
  mustChangePassword: boolean;
  createdAt: string;
}

function ResetSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary !py-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      Set password
    </button>
  );
}

export default function MemberRow({ member, isSelf }: { member: Member; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [roleError, setRoleError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetState, resetAction] = useFormState<TeamActionState, FormData>(
    resetMemberPassword.bind(null, member.userId),
    { error: null }
  );

  return (
    <li className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900">
            {member.name || member.email}
            {isSelf && <span className="ml-2 text-xs font-normal text-gray-400">(you)</span>}
          </p>
          <p className="truncate text-sm text-gray-500">{member.email}</p>
          {member.mustChangePassword && (
            <p className="mt-1 text-xs text-amber-700">Hasn&apos;t set their own password yet</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSelf ? (
            <span className="badge bg-brand-50 capitalize text-brand-700">{member.role}</span>
          ) : (
            <select
              value={member.role}
              disabled={isPending}
              aria-label={`Role for ${member.email}`}
              onChange={(e) => {
                const role = e.target.value as Member["role"];
                setRoleError(null);
                startTransition(async () => {
                  const result = await changeMemberRole(member.userId, role);
                  if (result.error) setRoleError(result.error);
                });
              }}
              className="input !w-auto !py-1.5"
            >
              <option value="purchaser">Purchaser</option>
              <option value="owner">Owner</option>
            </select>
          )}
          {!isSelf && (
            <>
              <button
                type="button"
                onClick={() => setShowReset((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Reset password
              </button>
              <ConfirmDeleteButton
                action={removeMember.bind(null, member.userId)}
                confirmText={`Remove ${member.email}? They will lose access immediately.`}
                label="Remove"
              />
            </>
          )}
        </div>
      </div>
      {roleError && <p className="mt-2 text-sm text-red-600">{roleError}</p>}

      {showReset && (
        <form action={resetAction} className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">
          {resetState.error && <p role="alert" className="text-sm text-red-600">{resetState.error}</p>}
          <PasswordField id={`reset-${member.userId}`} name="password" label="New temporary password" generate />
          <p className="text-xs text-gray-500">They&apos;ll be asked to choose their own password at next sign-in.</p>
          <ResetSubmit />
        </form>
      )}
    </li>
  );
}
