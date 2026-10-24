import { useEffect } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "max-w-2xl",
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
      <div
        className={clsx(
          "w-full bg-surface border-l border-border h-full flex flex-col shadow-dialog animate-in slide-in-from-right duration-150",
          width
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface-muted/50 shrink-0">
          <div>
            <h2 className="text-[18px] font-semibold text-text leading-snug">{title}</h2>
            {subtitle && <p className="text-[13px] text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="p-1.5 text-text-muted hover:text-text hover:bg-surface rounded-btn transition-colors"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {footer && (
          <div className="p-4 border-t border-border bg-surface-muted/40 shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
