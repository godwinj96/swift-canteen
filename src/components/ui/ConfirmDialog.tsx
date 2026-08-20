"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = true,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="shadow-elevation-lg relative w-full max-w-sm rounded-2xl bg-white p-6"
      >
        <h2 id="confirm-dialog-title" className="font-display text-xl text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={pending}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-canteen-light disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-canteen hover:bg-canteen-dark"
            }`}
          >
            {pending ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
