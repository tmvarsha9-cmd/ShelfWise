import { useState } from "react";
import clsx from "clsx";

export default function DateRangeFilter({
  startDate,
  endDate,
  onChange,
  className,
}) {
  const [activePreset, setActivePreset] = useState("last7");
  const [validationError, setValidationError] = useState("");

  const applyPreset = (preset) => {
    setActivePreset(preset);
    setValidationError("");
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (preset === "today") {
      onChange({ startDate: todayStr, endDate: todayStr });
    } else if (preset === "last7") {
      const past = new Date(now.getTime() - 6 * 86400000);
      onChange({ startDate: past.toISOString().slice(0, 10), endDate: todayStr });
    } else if (preset === "thisMonth") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      onChange({ startDate: startOfMonth.toISOString().slice(0, 10), endDate: todayStr });
    } else if (preset === "custom") {
      // Keep current start and end
    }
  };

  const handleCustomChange = (start, end) => {
    setActivePreset("custom");
    if (start && end && end < start) {
      setValidationError("End date cannot be earlier than start date");
      return;
    }
    setValidationError("");
    onChange({ startDate: start, endDate: end });
  };

  return (
    <div className={clsx("flex flex-wrap items-center gap-2 text-[13px]", className)}>
      <div className="inline-flex rounded-btn border border-border bg-surface p-0.5">
        <button
          type="button"
          onClick={() => applyPreset("today")}
          className={clsx(
            "px-2.5 py-1 rounded font-medium transition-colors",
            activePreset === "today" ? "bg-primary text-white" : "text-text-muted hover:text-text"
          )}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => applyPreset("last7")}
          className={clsx(
            "px-2.5 py-1 rounded font-medium transition-colors",
            activePreset === "last7" ? "bg-primary text-white" : "text-text-muted hover:text-text"
          )}
        >
          Last 7 days
        </button>
        <button
          type="button"
          onClick={() => applyPreset("thisMonth")}
          className={clsx(
            "px-2.5 py-1 rounded font-medium transition-colors",
            activePreset === "thisMonth" ? "bg-primary text-white" : "text-text-muted hover:text-text"
          )}
        >
          This month
        </button>
        <button
          type="button"
          onClick={() => applyPreset("custom")}
          className={clsx(
            "px-2.5 py-1 rounded font-medium transition-colors",
            activePreset === "custom" ? "bg-primary text-white" : "text-text-muted hover:text-text"
          )}
        >
          Custom
        </button>
      </div>

      {activePreset === "custom" && (
        <div className="flex items-center gap-1.5 bg-surface border border-border-strong rounded-input px-2 py-1">
          <input
            type="date"
            value={startDate || ""}
            onChange={(e) => handleCustomChange(e.target.value, endDate)}
            aria-label="Start date"
            className="text-[13px] bg-transparent border-0 outline-none text-text"
          />
          <span className="text-text-muted">to</span>
          <input
            type="date"
            value={endDate || ""}
            onChange={(e) => handleCustomChange(startDate, e.target.value)}
            aria-label="End date"
            className="text-[13px] bg-transparent border-0 outline-none text-text"
          />
        </div>
      )}

      {validationError && (
        <span className="text-[12px] text-status-danger font-medium">{validationError}</span>
      )}
    </div>
  );
}
