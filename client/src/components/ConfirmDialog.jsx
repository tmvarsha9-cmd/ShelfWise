import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import clsx from "clsx";

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = false,
  isLoading = false,
}) {
  const dialogRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button when opened
    confirmBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md bg-surface border border-border rounded-card shadow-dialog p-6 relative"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-text-muted hover:text-text p-1 rounded hover:bg-surface-muted transition-colors"
        >
          <X className="w-5 h-5 stroke-[1.75]" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          {isDestructive && (
            <div className="w-9 h-9 rounded-btn bg-status-danger-bg text-status-danger flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2]" />
            </div>
          )}
          <div>
            <h3 id="confirm-dialog-title" className="text-[18px] font-semibold text-text leading-snug">
              {title}
            </h3>
            {message && <p className="text-[14px] text-text-muted mt-2 leading-relaxed">{message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="h-10 px-4 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              "h-10 px-5 text-[14px] font-medium text-white rounded-btn transition-colors disabled:opacity-50 flex items-center gap-2",
              isDestructive
                ? "bg-status-danger hover:bg-[#881e15]"
                : "bg-primary hover:bg-primary-hover"
            )}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
