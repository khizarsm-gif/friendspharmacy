import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import PageHeader from "../_components/PageHeader";
import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user, isAdmin, role, displayName, mustChangePassword } = await getAdminSession();
  if (!user || !isAdmin) redirect("/admin/login");

  return (
    <div className="max-w-xl">
      <PageHeader title="My account" />
      {mustChangePassword && (
        <div className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Welcome! Please choose your own password to continue.
        </div>
      )}
      <div className="card mb-6 p-5 text-sm">
        <dl className="grid grid-cols-[6rem_1fr] gap-y-2">
          {displayName && (
            <>
              <dt className="text-gray-500">Name</dt>
              <dd className="text-gray-900">{displayName}</dd>
            </>
          )}
          <dt className="text-gray-500">Email</dt>
          <dd className="text-gray-900">{user.email}</dd>
          <dt className="text-gray-500">Role</dt>
          <dd className="capitalize text-gray-900">{role}</dd>
        </dl>
      </div>
      <ChangePasswordForm forced={mustChangePassword} />
    </div>
  );
}
