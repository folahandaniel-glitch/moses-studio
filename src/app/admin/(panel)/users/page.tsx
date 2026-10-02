import { ActionForm } from "@/components/admin/ActionForm";
import { sql } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { PageHeader, PublishBadge, first, type SearchParams } from "@/components/admin/UI";
import { createUser, deleteUser, resetUserPassword, setUserActive } from "../../actions";

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  const me = await requireSuperAdmin();
  const sp = await searchParams;
  const users = await sql<{ id: string; email: string; name: string; role: string; active: boolean; last_login_at: Date | null }[]>`select id, email, name, role, active, last_login_at from ms_admin_users order by created_at`;
  return (
    <>
      <PageHeader title="Users" description="Administrators who can sign in to this dashboard. Only Super Admins can manage users." sp={{ notice: first(sp.notice), error: first(sp.error) }} />
      <ul className="admin-card divide-y divide-line !p-0">
        {users.map((u) => (
          <li key={u.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-semibold">{u.name} {u.id === me.id && <span className="text-xs text-muted">(you)</span>}</p><p className="text-sm text-muted">{u.email} &middot; {u.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"} &middot; {u.last_login_at ? `Last sign-in ${new Date(u.last_login_at).toLocaleDateString("en-GB")}` : "Never signed in"}</p></div>
              <PublishBadge published={u.active} on="Active" off="Deactivated" />
            </div>
            {u.id !== me.id && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ActionForm action={resetUserPassword} className="flex gap-2"><input type="hidden" name="id" value={u.id} /><input name="password" type="password" autoComplete="new-password" placeholder="New password" aria-label={`New password for ${u.name}`} className="field !w-48 !py-2 text-sm" /><button className="btn btn-outline btn-sm">Reset password</button></ActionForm>
                <ActionForm action={setUserActive}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="active" value={String(!u.active)} /><button className="btn btn-outline btn-sm">{u.active ? "Deactivate" : "Activate"}</button></ActionForm>
                <ActionForm action={deleteUser}><input type="hidden" name="id" value={u.id} /><ConfirmButton message={`${u.name} will lose access permanently.`}>Delete</ConfirmButton></ActionForm>
              </div>
            )}
          </li>
        ))}
      </ul>
      <h2 className="mb-4 mt-10 text-lg font-semibold">Add an administrator</h2>
      <ActionForm action={createUser} className="admin-card grid gap-5 sm:grid-cols-2">
        <div><label htmlFor="u-name" className="admin-label">Full name</label><input id="u-name" name="name" required className="field" /></div>
        <div><label htmlFor="u-email" className="admin-label">Email address</label><input id="u-email" name="email" type="email" required className="field" /></div>
        <div><label htmlFor="u-pass" className="admin-label">Temporary password</label><input id="u-pass" name="password" type="password" autoComplete="new-password" required className="field" /><p className="mt-1.5 text-xs text-muted">At least 10 characters with upper case, lower case and a number.</p></div>
        <div><label htmlFor="u-role" className="admin-label">Role</label><select id="u-role" name="role" className="field"><option value="ADMIN">Admin (content only)</option><option value="SUPER_ADMIN">Super Admin (can manage users)</option></select></div>
        <div className="sm:col-span-2"><button className="btn btn-primary">Create account</button></div>
      </ActionForm>
    </>
  );
}
