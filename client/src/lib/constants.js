// Application constants and reference settings

export const STORE_NAME = "Your Store";
export const DEFAULT_CURRENCY = "INR";
export const TIME_ZONE = "Asia/Kolkata";

export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  PRODUCTION: "production",
};

export const SOURCE_TYPES = {
  PURCHASED: "PURCHASED",
  MANUFACTURED: "MANUFACTURED",
};

export const SOURCE_TYPE_LABELS = {
  PURCHASED: "Bought from a supplier",
  MANUFACTURED: "Made in-house",
};

export const PO_STATUSES = {
  DRAFT: "DRAFT",
  CONFIRMED: "CONFIRMED",
  PARTIALLY_RECEIVED: "PARTIALLY_RECEIVED",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
  DELAYED: "DELAYED",
};

export const PRODUCTION_STATUSES = {
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export const ISSUE_REASONS = [
  { value: "SALE", label: "Sale" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "USED_IN_SHOP", label: "Used in shop" },
  { value: "CORRECTION", label: "Correction" },
];
