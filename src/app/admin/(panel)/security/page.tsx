import { ActionForm } from "@/components/admin/ActionForm";
import { PageHeader, first, type SearchParams } from "@/components/admin/UI";
import { changeOwnPassword } from "../../actions";

export default async function SecurityPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Security" description="Change your password. Changing it signs you out of all other devices." sp={{ notice: first(sp.notice), error: first(sp.error) }} />
      <ActionForm action={changeOwnPassword} className="admin-card max-w-lg space-y-5">
        <div><label htmlFor="current" className="admin-label">Current password</label><input id="current" name="current" type="password" autoComplete="current-password" required className="field" /></div>
        <div><label htmlFor="next" className="admin-label">New password</label><input id="next" name="next" type="password" autoComplete="new-password" required className="field" /><p className="mt-1.5 text-xs text-muted">At least 10 characters with upper case, lower case and a number.</p></div>
        <div><label htmlFor="confirm" className="admin-label">Confirm new password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" /></div>
        <button className="btn btn-primary">Update password</button>
      </ActionForm>
    </>
  );
}
