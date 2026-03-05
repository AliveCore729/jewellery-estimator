"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  Star,
  Gem,
  Receipt,
  Coins,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import EstimateStatusBadge from "@/components/estimates/EstimateStatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { CardSkeleton, TableSkeleton } from "@/components/common/LoadingSkeleton";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";

interface EstimateDetail {
  id: string;
  estimateNumber: string;
  productName: string;
  productDescription: string | null;
  status: string;
  notes: string | null;
  validUntil: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
  };
  category: { id: string; name: string } | null;
  createdBy: { name: string };
  variants: {
    id: string;
    variantLabel: string;
    sortOrder: number;
    isRecommended: boolean;
    totalMaterialCost: number;
    totalMakingCharges: number;
    totalAdditionalCharges: number;
    subtotal: number;
    taxAmount: number;
    oldGoldDeduction: number;
    grandTotal: number;
    materials: {
      id: string;
      weight: number;
      unit: string;
      ratePerUnit: number;
      wastagePct: number;
      wastageWeight: number;
      totalWeight: number;
      lineTotal: number;
      huid: string | null;
      material: { name: string; purity: string | null };
    }[];
    charges: {
      id: string;
      chargeName: string;
      chargeType: string;
      chargeValue: number;
      calculatedAmount: number;
    }[];
    taxes: {
      id: string;
      taxName: string;
      taxPct: number;
      taxAmount: number;
    }[];
    oldGoldEntries: {
      id: string;
      itemDescription: string | null;
      grossWeight: number;
      purity: string | null;
      netWeight: number;
      ratePerUnit: number;
      deductionAmount: number;
    }[];
  }[];
}

export default function EstimateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [estimate, setEstimate] = useState<EstimateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVariant, setActiveVariant] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/estimates/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEstimate(data.data);
        } else {
          toast.error("Estimate not found");
          router.push("/estimates");
        }
      })
      .catch(() => {
        toast.error("Failed to load estimate");
      })
      .finally(() => setIsLoading(false));
  }, [id, router]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/estimates/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete");
        return;
      }
      toast.success("Estimate deleted");
      router.push("/estimates");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <TableSkeleton rows={3} />
      </div>
    );
  }

  if (!estimate) return null;

  const variant = estimate.variants[activeVariant];

  return (
    <div>
      {/* Back + Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/estimates")}
          className="flex items-center gap-1.5 text-sm text-warm-500 hover:text-navy font-inter transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Estimates
        </button>

        <PageHeader
          title={estimate.estimateNumber}
          description={`${estimate.productName}${estimate.category ? ` • ${estimate.category.name}` : ""}`}
          action={
            <div className="flex items-center gap-3">
              <EstimateStatusBadge status={estimate.status} />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200
                  text-red-600 font-inter text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </motion.button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Customer & Estimate Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-xs font-inter font-medium text-warm-400 uppercase tracking-wider mb-3">
                  Customer
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-warm-300" />
                    <span
                      onClick={() => router.push(`/customers/${estimate.customer.id}`)}
                      className="text-sm font-inter font-medium text-navy hover:text-gold transition-colors cursor-pointer"
                    >
                      {estimate.customer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-warm-300" />
                    <span className="text-sm font-inter text-warm-500">{estimate.customer.phone}</span>
                  </div>
                  {estimate.customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-warm-300" />
                      <span className="text-sm font-inter text-warm-500">{estimate.customer.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimate Info */}
              <div>
                <h3 className="text-xs font-inter font-medium text-warm-400 uppercase tracking-wider mb-3">
                  Estimate Details
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-warm-300" />
                    <span className="text-sm font-inter text-warm-500">
                      {estimate.productName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-warm-300" />
                    <span className="text-sm font-inter text-warm-500">
                      Created: {formatDate(estimate.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-warm-300" />
                    <span className="text-sm font-inter text-warm-500">
                      Valid until: {formatDate(estimate.validUntil)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {estimate.productDescription && (
              <div className="mt-4 pt-4 border-t border-warm-100">
                <p className="text-sm text-warm-500 font-inter">{estimate.productDescription}</p>
              </div>
            )}

            {estimate.notes && (
              <div className="mt-3 pt-3 border-t border-warm-100">
                <p className="text-xs text-warm-400 font-inter mb-1">Notes</p>
                <p className="text-sm text-warm-500 font-inter">{estimate.notes}</p>
              </div>
            )}
          </motion.div>

          {/* Variant Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium"
          >
            {/* Tab Bar */}
            {estimate.variants.length > 1 && (
              <div className="flex items-center border-b border-warm-100 px-5 pt-4 gap-1 overflow-x-auto">
                {estimate.variants.map((v, vi) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVariant(vi)}
                    className={`relative px-4 py-2.5 text-sm font-inter font-medium rounded-t-lg transition-all whitespace-nowrap
                      ${
                        activeVariant === vi
                          ? "text-gold bg-gold/5 border-b-2 border-gold"
                          : "text-warm-400 hover:text-navy hover:bg-warm-50"
                      }`}
                  >
                    {v.variantLabel}
                    {v.isRecommended && (
                      <Star className="w-3 h-3 inline ml-1.5 text-gold fill-gold" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Variant Content */}
            {variant && (
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-playfair text-lg font-semibold text-navy">
                    {variant.variantLabel}
                  </h3>
                  {variant.isRecommended && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-inter font-medium bg-gold/10 text-gold">
                      <Star className="w-3 h-3 fill-gold" />
                      Recommended
                    </span>
                  )}
                </div>

                {/* Materials Table */}
                <div className="mb-6">
                  <h4 className="text-sm font-inter font-semibold text-navy mb-3 flex items-center gap-2">
                    <Gem className="w-4 h-4 text-gold" />
                    Materials
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-warm-100">
                          <th className="text-left text-xs font-inter font-medium text-warm-400 uppercase tracking-wider py-2 pr-4">
                            Material
                          </th>
                          <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase tracking-wider py-2 px-3">
                            Weight
                          </th>
                          <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase tracking-wider py-2 px-3">
                            Rate
                          </th>
                          <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase tracking-wider py-2 px-3">
                            Wastage
                          </th>
                          <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase tracking-wider py-2 px-3">
                            Total Wt
                          </th>
                          <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase tracking-wider py-2 pl-3">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {variant.materials.map((mat) => (
                          <tr key={mat.id} className="border-b border-warm-50">
                            <td className="py-2.5 pr-4">
                              <p className="text-sm font-inter font-medium text-navy">
                                {mat.material.name}
                              </p>
                              {mat.huid && (
                                <p className="text-xs text-warm-400 font-inter">HUID: {mat.huid}</p>
                              )}
                            </td>
                            <td className="text-right py-2.5 px-3 text-sm font-inter text-warm-500 tabular-nums">
                              {mat.weight}g
                            </td>
                            <td className="text-right py-2.5 px-3 text-sm font-inter text-warm-500 tabular-nums">
                              {formatCurrency(mat.ratePerUnit)}
                            </td>
                            <td className="text-right py-2.5 px-3 text-sm font-inter text-warm-500 tabular-nums">
                              {mat.wastagePct}% ({mat.wastageWeight}g)
                            </td>
                            <td className="text-right py-2.5 px-3 text-sm font-inter text-warm-500 tabular-nums">
                              {mat.totalWeight}g
                            </td>
                            <td className="text-right py-2.5 pl-3 text-sm font-inter font-medium text-navy tabular-nums">
                              {formatCurrency(mat.lineTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Charges */}
                {variant.charges.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-inter font-semibold text-navy mb-3 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-gold" />
                      Charges
                    </h4>
                    <div className="space-y-2">
                      {variant.charges.map((charge) => (
                        <div
                          key={charge.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-warm-50/50"
                        >
                          <div>
                            <span className="text-sm font-inter text-navy">{charge.chargeName}</span>
                            <span className="text-xs text-warm-400 font-inter ml-2">
                              ({charge.chargeType === "FIXED"
                                ? `₹${charge.chargeValue}`
                                : charge.chargeType === "PERCENTAGE"
                                ? `${charge.chargeValue}%`
                                : `₹${charge.chargeValue}/g`})
                            </span>
                          </div>
                          <span className="text-sm font-inter font-medium text-navy tabular-nums">
                            {formatCurrency(charge.calculatedAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Old Gold */}
                {variant.oldGoldEntries.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-inter font-semibold text-navy mb-3 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" />
                      Old Gold Exchange
                    </h4>
                    <div className="space-y-2">
                      {variant.oldGoldEntries.map((og) => (
                        <div
                          key={og.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-50/50"
                        >
                          <div>
                            <span className="text-sm font-inter text-navy">
                              {og.itemDescription || "Old Gold"}
                            </span>
                            <span className="text-xs text-warm-400 font-inter ml-2">
                              {og.netWeight}g × {formatCurrency(og.ratePerUnit)}
                            </span>
                          </div>
                          <span className="text-sm font-inter font-medium text-amber-600 tabular-nums">
                            -{formatCurrency(og.deductionAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Totals Panel */}
        <div className="xl:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-premium p-5 sticky top-24"
          >
            <h3 className="font-playfair text-lg font-semibold text-navy mb-4">
              {variant?.variantLabel} — Totals
            </h3>

            {variant && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-inter">
                  <span className="text-warm-500">Material Cost</span>
                  <span className="text-navy tabular-nums font-medium">
                    {formatCurrency(variant.totalMaterialCost)}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-inter">
                  <span className="text-warm-500">Making Charges</span>
                  <span className="text-navy tabular-nums font-medium">
                    {formatCurrency(variant.totalMakingCharges)}
                  </span>
                </div>

                {variant.totalAdditionalCharges > 0 && (
                  <div className="flex justify-between text-sm font-inter">
                    <span className="text-warm-500">Additional Charges</span>
                    <span className="text-navy tabular-nums font-medium">
                      {formatCurrency(variant.totalAdditionalCharges)}
                    </span>
                  </div>
                )}

                <div className="border-t border-warm-100 pt-3 flex justify-between text-sm font-inter">
                  <span className="text-warm-500">Subtotal</span>
                  <span className="text-navy tabular-nums font-medium">
                    {formatCurrency(variant.subtotal)}
                  </span>
                </div>

                {variant.taxes.map((tax) => (
                  <div key={tax.id} className="flex justify-between text-sm font-inter">
                    <span className="text-warm-400">
                      {tax.taxName} ({tax.taxPct}%)
                    </span>
                    <span className="text-warm-500 tabular-nums">
                      {formatCurrency(tax.taxAmount)}
                    </span>
                  </div>
                ))}

                {variant.oldGoldDeduction > 0 && (
                  <div className="flex justify-between text-sm font-inter">
                    <span className="text-amber-600">Old Gold Deduction</span>
                    <span className="text-amber-600 tabular-nums font-medium">
                      -{formatCurrency(variant.oldGoldDeduction)}
                    </span>
                  </div>
                )}

                <div className="border-t-2 border-gold/30 pt-3 flex justify-between">
                  <span className="font-playfair text-lg font-bold text-navy">Grand Total</span>
                  <span className="font-playfair text-xl font-bold text-navy tabular-nums">
                    {formatCurrency(variant.grandTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Valid Until */}
            <div className="mt-6 pt-4 border-t border-warm-100">
              <p className="text-xs text-warm-400 font-inter text-center">
                Valid until {formatDate(estimate.validUntil)}
              </p>
              <p className="text-xs text-warm-400 font-inter text-center mt-1">
                Created by {estimate.createdBy.name}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Estimate"
        description={`Are you sure you want to delete ${estimate.estimateNumber}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}