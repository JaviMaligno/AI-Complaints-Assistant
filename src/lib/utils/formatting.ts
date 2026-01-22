/**
 * Format a price in GBP
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

/**
 * Format a date in UK format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Generate a complaint reference number
 */
export function generateComplaintRef(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `CMP-${year}-${random}`;
}

/**
 * Generate an order number
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `ORD-${year}-${random}`;
}

/**
 * Format vehicle info
 */
export function formatVehicle(make: string, model: string, year: number): string {
  return `${year} ${make} ${model}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Format time ago
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return formatDate(d);
}

/**
 * Map warranty type to display name
 */
export function warrantyTypeDisplay(type: string): string {
  const types: Record<string, string> = {
    STANDARD_90: "90-Day Standard",
    CARSA_COVER_12: "carsaCover 12 Month",
    CARSA_COVER_24: "carsaCover 24 Month",
    CARSA_COVER_48: "carsaCover 48 Month",
  };
  return types[type] || type;
}

/**
 * Map delivery status to display
 */
export function deliveryStatusDisplay(status: string): string {
  const statuses: Record<string, string> = {
    PENDING: "Processing",
    PREPARING: "Being Prepared",
    IN_TRANSIT: "On the Way",
    DELIVERED: "Delivered",
    FAILED: "Delivery Failed",
  };
  return statuses[status] || status;
}

/**
 * Map complaint status to display
 */
export function complaintStatusDisplay(status: string): string {
  const statuses: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    AWAITING_CUSTOMER: "Awaiting Your Response",
    AWAITING_INTERNAL: "Under Review",
    ESCALATED: "Escalated to Team",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };
  return statuses[status] || status;
}

/**
 * Map category to display name
 */
export function categoryDisplay(category: string): string {
  const categories: Record<string, string> = {
    DELIVERY: "Delivery Issue",
    VEHICLE_CONDITION: "Vehicle Condition",
    MISSING_ITEMS: "Missing Items",
    ADMIN_FINANCE: "Admin/Finance",
    WARRANTY: "Warranty",
    COMMUNICATION: "Communication",
    OTHER: "Other",
  };
  return categories[category] || category;
}
