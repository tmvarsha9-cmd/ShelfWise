import { Link } from "react-router-dom";
import clsx from "clsx";

export default function FigureTile({
  label,
  value,
  hint,
  to,
  onClick,
  variant = "default", // default, warning, danger, ok
  className,
}) {
  const content = (
    <div
      className={clsx(
        "p-4 bg-surface border border-border rounded-card transition-colors select-none",
        (to || onClick) && "hover:border-border-strong hover:bg-surface-muted/50 cursor-pointer",
        className
      )}
    >
      <div className="text-[13px] font-medium text-text-muted mb-1 truncate">{label}</div>
      <div
        className={clsx(
          "text-[28px] font-semibold leading-tight tabular-nums tracking-tight",
          variant === "danger" && "text-status-danger",
          variant === "warning" && "text-status-warning",
          variant === "ok" && "text-status-ok",
          variant === "default" && "text-text"
        )}
      >
        {value}
      </div>
      {hint && <div className="text-[12px] text-text-muted mt-1 truncate">{hint}</div>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left p-0 border-0 bg-transparent">
        {content}
      </button>
    );
  }

  return content;
}
