import { AlertTriangle } from "lucide-react";
import { requireOwnerPage } from "@/lib/admin-auth";
import { isAdminClientConfigured } from "@/lib/supabase-admin";
import PageHeader from "../_components/PageHeader";
import Flash from "../_components/Flash";
import AddMemberForm from "./AddMemberForm";
import MemberRow, { type Member } from "./MemberRow";

export const dynamic = "force-dynamic";

export default async function TeamPage({ searchParams }: { searchParams: { saved?: string } }) {
  const { supabase, user } = await requireOwnerPage();

  // Owners can read every admin_users row (RLS policy).
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, email, display_name, role, must_change_password, created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load team: ${error.message}`);

  const members: Member[] = (data ?? []).map((row) => ({
    userId: row.user_id,
    name: row.display_name,
    email: row.email,
    role: row.role,
    mustChangePassword: row.must_change_password,
    createdAt: row.created_at,
  }));

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Team"
        description="Owners have full access. Purchasers can add, edit and delete products only."
      />
      <Flash saved={searchParams.saved} />

      {!isAdminClientConfigured() && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Adding and removing members needs one more setting: add <code>SUPABASE_SERVICE_ROLE_KEY</code> in
            Vercel → Settings → Environment Variables, then redeploy.
          </p>
        </div>
      )}

      <section className="card mb-6 overflow-hidden">
        <h2 className="border-b px-5 py-4 font-semibold text-gray-900">
          Members <span className="font-normal text-gray-400">({members.length})</span>
        </h2>
        <ul className="divide-y">
          {members.map((m) => (
            <MemberRow key={m.userId} member={m} isSelf={m.userId === user?.id} />
          ))}
        </ul>
      </section>

      <AddMemberForm />
    </div>
  );
}
