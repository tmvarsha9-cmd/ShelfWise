import { Inbox } from "lucide-react";
import clsx from "clsx";

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
  className,
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-8 text-center bg-surface border border-border rounded-card",
        className
      )}
    >
      <div className="w-10 h-10 mb-3 flex items-center justify-center rounded-btn bg-surface-muted border border-border text-text-muted">
        <Icon className="w-5 h-5 stroke-[1.75]" />
      </div>
      {title && <h3 className="text-[16px] font-semibold text-text mb-1">{title}</h3>}
      <p className="text-[14px] text-text-muted max-w-sm mb-4">
        {description || "No records found."}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center h-10 px-4 text-[14px] font-medium text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
