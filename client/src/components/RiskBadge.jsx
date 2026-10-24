import StatusChip from "./StatusChip";

const RISK_MAP = {
  HIGH: { variant: "danger", label: "High risk" },
  MEDIUM: { variant: "warning", label: "Medium risk" },
  LOW: { variant: "ok", label: "Low risk" },
  NONE: { variant: "neutral", label: "No risk" },
};

export default function RiskBadge({ level, className }) {
  const normalized = String(level || "NONE").toUpperCase();
  const meta = RISK_MAP[normalized] || RISK_MAP.NONE;

  return (
    <StatusChip
      variant={meta.variant}
      label={meta.label}
      className={className}
    />
  );
}
