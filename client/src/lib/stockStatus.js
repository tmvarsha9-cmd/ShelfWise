/**
 * Standard stock status logic for products.
 * Priority order:
 * 1. Expired (expiry_date <= today and stock > 0) -> Expired (danger)
 * 2. Out of stock (current_stock <= 0) -> Out of stock (danger)
 * 3. Expiring soon (expiry within 7 days, stock > 0) -> Expiring soon (expiring)
 * 4. Low stock (current_stock <= reorder_level) -> Low stock (warning)
 * 5. Otherwise -> In stock (ok)
 */
export function getProductStockStatus(product, today = new Date()) {
  const stock = Number(product?.current_stock) || 0;
  const reorderLevel = Number(product?.reorder_level) || 0;
  const expiryDateStr = product?.expiry_date;

  if (expiryDateStr) {
    const [y, m, d] = String(expiryDateStr).slice(0, 10).split("-").map(Number);
    const expiryMidnight = Date.UTC(y, m - 1, d);
    const todayMidnight = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((expiryMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0 && stock > 0) {
      return {
        key: "EXPIRED",
        label: "Expired",
        variant: "danger",
      };
    }

    if (stock <= 0) {
      return {
        key: "OUT_OF_STOCK",
        label: "Out of stock",
        variant: "danger",
      };
    }

    if (diffDays > 0 && diffDays <= 7) {
      return {
        key: "EXPIRING_SOON",
        label: "Expiring soon",
        variant: "expiring",
        daysToExpiry: diffDays,
      };
    }
  } else if (stock <= 0) {
    return {
      key: "OUT_OF_STOCK",
      label: "Out of stock",
      variant: "danger",
    };
  }

  if (stock <= reorderLevel) {
    return {
      key: "LOW_STOCK",
      label: "Low stock",
      variant: "warning",
    };
  }

  return {
    key: "IN_STOCK",
    label: "In stock",
    variant: "ok",
  };
}

/**
 * Purchase order status display mapping
 */
export function getPOStatusMeta(status, expectedDeliveryDate) {
  const s = String(status).toUpperCase();
  if (s === "RECEIVED") {
    return { key: "RECEIVED", label: "Received", variant: "ok" };
  }
  if (s === "PARTIALLY_RECEIVED") {
    return { key: "PARTIALLY_RECEIVED", label: "Partly received", variant: "info" };
  }
  if (s === "CANCELLED") {
    return { key: "CANCELLED", label: "Cancelled", variant: "neutral" };
  }
  if (s === "CONFIRMED" || s === "DRAFT") {
    // Check if delayed
    if (expectedDeliveryDate) {
      const expDate = new Date(expectedDeliveryDate);
      const now = new Date();
      if (expDate < now) {
        return { key: "DELAYED", label: "Delayed", variant: "danger" };
      }
    }
    return s === "CONFIRMED"
      ? { key: "CONFIRMED", label: "Confirmed", variant: "info" }
      : { key: "DRAFT", label: "Draft", variant: "neutral" };
  }
  return { key: s, label: s, variant: "neutral" };
}

/**
 * Production order status display mapping
 */
export function getProductionStatusMeta(status) {
  const s = String(status).toUpperCase();
  switch (s) {
    case "COMPLETED":
      return { key: "COMPLETED", label: "Completed", variant: "ok" };
    case "IN_PROGRESS":
      return { key: "IN_PROGRESS", label: "In progress", variant: "info" };
    case "PLANNED":
      return { key: "PLANNED", label: "Planned", variant: "warning" };
    case "CANCELLED":
      return { key: "CANCELLED", label: "Cancelled", variant: "neutral" };
    default:
      return { key: s, label: s, variant: "neutral" };
  }
}
