"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction, requireOwnerAction } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

export interface TeamActionState {
  error: string | null;
}

type Role = "owner" | "purchaser";
const MIN_PASSWORD = 8;

function parseRole(value: unknown): Role {
  return value === "owner" ? "owner" : "purchaser";
}

function adminClientOrError() {
  try {
    return { admin: createAdminClient(), error: null as string | null };
  } catch (err) {
    return { admin: null, error: err instanceof Error ? err.message : "Team management isn't configured." };
  }
}

/** Finds an existing auth user by email (used when the email already has a login). */
async function findUserIdByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function ownerCount(admin: ReturnType<typeof createAdminClient>) {
  const { count } = await admin
    .from("admin_users")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "owner");
  return count ?? 0;
}

async function roleOf(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data } = await admin.from("admin_users").select("role").eq("user_id", userId).maybeSingle();
  return (data?.role as Role | undefined) ?? null;
}

export async function addMember(_prev: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  const { admin, error: configError } = adminClientOrError();
  if (!admin) return { error: configError };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = parseRole(formData.get("role"));

  if (!name) return { error: "Name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < MIN_PASSWORD) {
    return { error: `Temporary password must be at least ${MIN_PASSWORD} characters.` };
  }

  let userId: string | null = null;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: name },
  });

  if (created.error) {
    // Email already has a login: reuse it and set the new temporary password.
    if (/already|registered|exists/i.test(created.error.message)) {
      try {
        userId = await findUserIdByEmail(admin, email);
      } catch (err) {
        console.error("[team] listUsers failed:", err);
      }
      if (!userId) return { error: "That email already has a login but it couldn't be found." };
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return { error: `Could not update the existing login: ${error.message}` };
    } else {
      console.error("[team] createUser failed:", created.error.message);
      return { error: `Could not create the login: ${created.error.message}` };
    }
  } else {
    userId = created.data.user.id;
  }

  const { error: upsertError } = await admin.from("admin_users").upsert({
    user_id: userId,
    email,
    display_name: name,
    role,
    must_change_password: true,
  });
  if (upsertError) {
    console.error("[team] admin_users upsert failed:", upsertError.message);
    return { error: `Login created, but granting access failed: ${upsertError.message}` };
  }

  revalidatePath("/admin/team");
  redirect("/admin/team?saved=member-added");
}

export async function changeMemberRole(userId: string, role: Role): Promise<{ error: string | null }> {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  if (userId === auth.userId) return { error: "You can't change your own role." };
  const { admin, error: configError } = adminClientOrError();
  if (!admin) return { error: configError };

  const current = await roleOf(admin, userId);
  if (current === "owner" && role !== "owner" && (await ownerCount(admin)) <= 1) {
    return { error: "There must always be at least one owner." };
  }

  const { error } = await admin.from("admin_users").update({ role: parseRole(role) }).eq("user_id", userId);
  if (error) return { error: `Could not change role: ${error.message}` };
  revalidatePath("/admin/team");
  return { error: null };
}

export async function resetMemberPassword(
  userId: string,
  _prev: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  if (userId === auth.userId) return { error: "Use My account to change your own password." };
  const { admin, error: configError } = adminClientOrError();
  if (!admin) return { error: configError };

  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD) {
    return { error: `Temporary password must be at least ${MIN_PASSWORD} characters.` };
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: `Could not reset password: ${error.message}` };
  await admin.from("admin_users").update({ must_change_password: true }).eq("user_id", userId);

  revalidatePath("/admin/team");
  redirect("/admin/team?saved=password-reset");
}

export async function removeMember(userId: string): Promise<{ error: string | null }> {
  const auth = await requireOwnerAction();
  if (auth.error) return { error: auth.error };
  if (userId === auth.userId) return { error: "You can't remove yourself." };
  const { admin, error: configError } = adminClientOrError();
  if (!admin) return { error: configError };

  if ((await roleOf(admin, userId)) === "owner" && (await ownerCount(admin)) <= 1) {
    return { error: "There must always be at least one owner." };
  }

  // Deleting the login also removes their admin_users row (ON DELETE CASCADE)
  // and ends their sessions.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("[team] deleteUser failed:", error.message);
    return { error: `Could not remove member: ${error.message}` };
  }
  revalidatePath("/admin/team");
  return { error: null };
}

/** Called after a member sets their own new password on the My account page. */
export async function clearMustChangePassword(): Promise<{ error: string | null }> {
  const auth = await requireAdminAction();
  if (auth.error) return { error: auth.error };
  const { admin, error: configError } = adminClientOrError();
  if (!admin) return { error: configError };

  const { error } = await admin
    .from("admin_users")
    .update({ must_change_password: false })
    .eq("user_id", auth.userId);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return { error: null };
}
