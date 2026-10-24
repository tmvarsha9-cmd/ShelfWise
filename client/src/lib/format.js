import { DEFAULT_CURRENCY, TIME_ZONE } from "./constants";

/**
 * Format a number as currency (default INR, en-IN, e.g. ₹1,250.00)
 */
export function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "—";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a regular number with thousands separator
 */
export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Format date (e.g. "27 Oct 2026") in Asia/Kolkata timezone
 */
export function formatDate(dateInput, options = {}) {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" || typeof dateInput === "number"
    ? new Date(dateInput)
    : dateInput;
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

/**
 * Format date & time (e.g. "27 Oct 2026, 14:30")
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" || typeof dateInput === "number"
    ? new Date(dateInput)
    : dateInput;
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Format relative days (e.g. "today", "yesterday", "in 3 days", "3 days ago")
 */
export function formatRelativeDays(dateInput, baseDate = new Date()) {
  if (!dateInput) return "—";
  const target = typeof dateInput === "string" || typeof dateInput === "number"
    ? new Date(dateInput)
    : dateInput;
  if (isNaN(target.getTime())) return "—";

  const diffMs = target.setHours(0,0,0,0) - new Date(baseDate).setHours(0,0,0,0);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 0) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}
