import { AlertCircle, RotateCcw } from "lucide-react";
import clsx from "clsx";

export default function ErrorState({
  message = "We couldn't load this information. Check your connection and try again.",
  onRetry,
  className,
}) {
  return (
    <div
      role="alert"
      className={clsx(
        "flex flex-col items-center justify-center p-8 text-center bg-status-danger-bg/40 border border-status-danger/30 rounded-card",
        className
      )}
    >
      <div className="w-10 h-10 mb-3 flex items-center justify-center rounded-btn bg-status-danger-bg text-status-danger">
        <AlertCircle className="w-5 h-5 stroke-[1.75]" />
      </div>
      <p className="text-[14px] text-text font-medium max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 h-10 px-4 text-[14px] font-medium text-text bg-surface border border-border-strong hover:bg-surface-muted rounded-btn transition-colors"
        >
          <RotateCcw className="w-4 h-4 stroke-[1.75]" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
