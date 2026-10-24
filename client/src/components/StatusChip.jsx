import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Info,
  Minus,
} from "lucide-react";
import clsx from "clsx";

const VARIANTS = {
  ok: {
    text: "#1B6B3A",
    bg: "#E3F3E8",
    border: "#B8E3C6",
    Icon: CheckCircle2,
  },
  warning: {
    text: "#8A5A00",
    bg: "#FBF0D6",
    border: "#EED8A1",
    Icon: AlertTriangle,
  },
  danger: {
    text: "#A3271C",
    bg: "#FBE4E1",
    border: "#F4B8B0",
    Icon: AlertOctagon,
  },
  expiring: {
    text: "#9A4A0B",
    bg: "#FDE9D6",
    border: "#F6C49C",
    Icon: Clock,
  },
  info: {
    text: "#24527A",
    bg: "#E4EEF7",
    border: "#B8D3EA",
    Icon: Info,
  },
  neutral: {
    text: "#4B544F",
    bg: "#ECE9E1",
    border: "#D4CFC4",
    Icon: Minus,
  },
};

export default function StatusChip({
  variant = "neutral",
  label,
  icon: CustomIcon,
  className,
}) {
  const config = VARIANTS[variant] || VARIANTS.neutral;
  const Icon = CustomIcon || config.Icon;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[13px] font-medium rounded-chip border select-none whitespace-nowrap",
        className
      )}
      style={{
        color: config.text,
        backgroundColor: config.bg,
        borderColor: config.border,
      }}
    >
      <Icon className="w-3.5 h-3.5 stroke-[2] shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
