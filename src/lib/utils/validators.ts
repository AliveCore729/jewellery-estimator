import { z } from "zod";

// ============================================
// Auth
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// ============================================
// Customer
// ============================================

export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(255),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

// ============================================
// Material
// ============================================

export const materialSchema = z.object({
  name: z.string().min(1, "Material name is required").max(100),
  category: z.enum(["GOLD", "SILVER", "PLATINUM", "DIAMOND", "GEMSTONE", "OTHER"]),
  purity: z.string().optional().or(z.literal("")),
  defaultUnit: z.enum(["GRAM", "TOLA", "CARAT", "PIECE"]),
  hsnCode: z.string().optional().or(z.literal("")),
});

export const materialRateSchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  ratePerUnit: z.number().positive("Rate must be positive"),
  unit: z.enum(["GRAM", "TOLA", "CARAT", "PIECE"]),
  source: z.enum(["API", "MANUAL"]).default("MANUAL"),
});

// ============================================
// Estimate
// ============================================

export const variantMaterialSchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  weight: z.number().positive("Weight must be positive"),
  unit: z.enum(["GRAM", "TOLA", "CARAT", "PIECE"]),
  ratePerUnit: z.number().positive("Rate must be positive"),
  wastagePct: z.number().min(0).max(100).default(0),
  huid: z.string().optional().or(z.literal("")),
});

export const variantChargeSchema = z.object({
  chargeName: z.string().min(1, "Charge name is required"),
  chargeType: z.enum(["FIXED", "PERCENTAGE", "PER_GRAM"]),
  chargeValue: z.number().min(0, "Value must be non-negative"),
});

export const oldGoldEntrySchema = z.object({
  itemDescription: z.string().optional().or(z.literal("")),
  grossWeight: z.number().positive("Weight must be positive"),
  purity: z.string().optional().or(z.literal("")),
  netWeight: z.number().positive("Net weight must be positive"),
  ratePerUnit: z.number().positive("Rate must be positive"),
});

export const estimateVariantSchema = z.object({
  variantLabel: z.string().min(1, "Variant name is required"),
  isRecommended: z.boolean().default(false),
  materials: z.array(variantMaterialSchema).min(1, "At least one material is required"),
  charges: z.array(variantChargeSchema).default([]),
  oldGoldEntries: z.array(oldGoldEntrySchema).default([]),
});

export const estimateCreateSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  categoryId: z.string().optional().or(z.literal("")),
  productName: z.string().min(1, "Product name is required").max(255),
  productDescription: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  variants: z.array(estimateVariantSchema).min(1, "At least one variant is required"),
});

// ============================================
// Settings
// ============================================

export const settingsSchema = z.object({
  shopName: z.string().min(1, "Shop name is required").max(255),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  gstin: z.string().optional().or(z.literal("")),
  defaultTaxPct: z.number().min(0).max(100),
  cgstPct: z.number().min(0).max(100),
  sgstPct: z.number().min(0).max(100),
  estimatePrefix: z.string().min(1).max(10),
  estimateValidityDays: z.number().int().positive(),
  defaultWeightUnit: z.enum(["GRAM", "TOLA", "CARAT", "PIECE"]),
});

// ============================================
// Share
// ============================================

export const shareSchema = z.object({
  channel: z.enum(["WHATSAPP", "EMAIL", "LINK"]),
  recipient: z.string().optional().or(z.literal("")),
});

export const statusUpdateSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "INVOICED"]),
});

// ============================================
// Type exports
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
export type MaterialRateInput = z.infer<typeof materialRateSchema>;
export type EstimateCreateInput = z.infer<typeof estimateCreateSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ShareInput = z.infer<typeof shareSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;