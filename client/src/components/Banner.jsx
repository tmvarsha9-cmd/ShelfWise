import { Info, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
  ok: CheckCircle2,
};

export default function Banner({
  variant = "info",
  children,
  action,
  className,
}) {
  const Icon = ICONS[variant] || Info;

  const styleMap = {
    info: "bg-status-info-bg text-status-info border-status-info/30",
    warning: "bg-status-warning-bg text-status-warning border-status-warning/30",
    danger: "bg-status-danger-bg text-status-danger border-status-danger/30",
    ok: "bg-status-ok-bg text-status-ok border-status-ok/30",
  };

  return (
    <div
      role="status"
      className={clsx(
        "flex items-center justify-between gap-3 px-4 py-3 rounded-card border text-[14px] leading-relaxed",
        styleMap[variant],
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 shrink-0 stroke-[2]" aria-hidden="true" />
        <div className="text-text font-normal">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
