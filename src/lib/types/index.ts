import { Prisma } from "@prisma/client";

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Dashboard Stats
// ============================================

export interface DashboardStats {
  stats: {
    totalEstimates: number;
    estimatesThisMonth: number;
    estimateChange: number;
    pendingEstimates: number;
    acceptedThisMonth: number;
    acceptedChange: number;
    totalCustomers: number;
    customersThisMonth: number;
    revenueThisMonth: number;
    revenueChange: number;
  };
  recentEstimates: RecentEstimate[];
  recentActivity: RecentActivity[];
}

export interface RecentEstimate {
  id: string;
  estimateNumber: string;
  customerName: string;
  grandTotal: number;
  status: string;
  createdAt: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  entityType: string;
  userName: string;
  createdAt: string;
  details: any;
}

// ============================================
// Estimate with Relations (Full)
// ============================================

export type EstimateWithRelations = Prisma.EstimateGetPayload<{
  include: {
    customer: true;
    category: true;
    createdBy: { select: { id: true; name: true; email: true } };
    variants: {
      include: {
        materials: { include: { material: true } };
        charges: true;
        taxes: true;
        oldGoldEntries: true;
      };
    };
    shares: true;
    parentEstimate: { select: { id: true; estimateNumber: true } };
    childEstimates: { select: { id: true; estimateNumber: true; version: true } };
  };
}>;

// ============================================
// Estimate List Item (Lightweight)
// ============================================

export interface EstimateListItem {
  id: string;
  estimateNumber: string;
  productName: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
  _count: {
    variants: number;
  };
}

// ============================================
// Auth
// ============================================

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ============================================
// Share
// ============================================

export interface ShareResponse {
  shareToken: string;
  shareUrl: string;
  channel: string;
  whatsappUrl?: string;
}