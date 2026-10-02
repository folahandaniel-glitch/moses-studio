"use client";
import { useRef } from "react";

/** A submit button that asks for confirmation in an accessible dialog before the surrounding form is sent. */
export function ConfirmButton({ children, message, confirmLabel = "Delete", className = "btn btn-danger btn-sm" }: { children: React.ReactNode; message: string; confirmLabel?: string; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => dialog.current?.showModal()}>{children}</button>
      <dialog ref={dialog} className="w-[min(92vw,28rem)] rounded-2xl border border-line bg-surface p-6 text-ink shadow-2xl backdrop:bg-black/50">
        <p className="text-lg font-semibold">Are you sure?</p>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => dialog.current?.close()}>Cancel</button>
          <button type="submit" className="btn btn-sm bg-red-600 text-white hover:bg-red-700">{confirmLabel}</button>
        </div>
      </dialog>
    </>
  );
}
