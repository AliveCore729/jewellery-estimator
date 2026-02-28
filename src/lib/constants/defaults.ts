export const CHARGE_NAMES = [
  "Making Charges",
  "Hallmarking",
  "Polishing",
  "Stone Setting",
  "Rhodium Plating",
  "Engraving",
  "Certification",
  "Other",
] as const;

export const MATERIAL_CATEGORIES = [
  { value: "GOLD", label: "Gold", color: "#D4AF37" },
  { value: "SILVER", label: "Silver", color: "#C0C0C0" },
  { value: "PLATINUM", label: "Platinum", color: "#E5E4E2" },
  { value: "DIAMOND", label: "Diamond", color: "#B9F2FF" },
  { value: "GEMSTONE", label: "Gemstone", color: "#7C3AED" },
  { value: "OTHER", label: "Other", color: "#6B7280" },
] as const;

export const WEIGHT_UNITS = [
  { value: "GRAM", label: "Gram (g)", symbol: "g" },
  { value: "TOLA", label: "Tola", symbol: "tola" },
  { value: "CARAT", label: "Carat (ct)", symbol: "ct" },
  { value: "PIECE", label: "Piece", symbol: "pc" },
] as const;

export const CHARGE_TYPES = [
  { value: "FIXED", label: "Fixed (₹)" },
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "PER_GRAM", label: "Per Gram (₹/g)" },
] as const;

export const ESTIMATE_STATUSES = [
  { value: "DRAFT", label: "Draft", color: "badge-draft" },
  { value: "SENT", label: "Sent", color: "badge-sent" },
  { value: "ACCEPTED", label: "Accepted", color: "badge-accepted" },
  { value: "REJECTED", label: "Rejected", color: "badge-rejected" },
  { value: "EXPIRED", label: "Expired", color: "badge-expired" },
  { value: "INVOICED", label: "Invoiced", color: "badge-invoiced" },
] as const;

export const PURITY_OPTIONS = {
  GOLD: ["24K", "22K", "18K", "14K"],
  SILVER: ["999", "925", "900", "800"],
  PLATINUM: ["950", "900", "850"],
} as const;

export const DEFAULT_TAX_PCT = 3.0;
export const DEFAULT_CGST_PCT = 1.5;
export const DEFAULT_SGST_PCT = 1.5;
export const DEFAULT_ESTIMATE_VALIDITY_DAYS = 3;