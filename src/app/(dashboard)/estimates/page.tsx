"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Eye,
  Trash2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EstimateStatusBadge from "@/components/estimates/EstimateStatusBadge";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { ESTIMATE_STATUSES } from "@/lib/constants/defaults";

interface EstimateItem {
  id: string;
  estimateNumber: string;
  productName: string;
  status: string;
  createdAt: string;
  grandTotal: number;
  variantCount: number;
  customer: { id: string; name: string; phone: string };
  category: { id: string; name: string } | null;
}

export default function EstimatesPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<EstimateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteEstimate, setDeleteEstimate] = useState<EstimateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fetchEstimates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/estimates?${params}`);
      const data = await res.json();

      if (data.success) {
        setEstimates(data.data);
      }
    } catch {
      toast.error("Failed to load estimates");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEstimates();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchEstimates]);

  const handleDelete = async () => {
    if (!deleteEstimate) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/estimates/${deleteEstimate.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete");
        return;
      }

      toast.success("Estimate deleted");
      fetchEstimates();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
      setDeleteEstimate(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Estimates"
        description="Create and manage jewellery estimates"
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/estimates/new")}
            className="btn-gold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Estimate
          </motion.button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by estimate #, product, or customer..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-warm-200 bg-white font-inter text-sm
              text-navy placeholder:text-warm-400 transition-all
              focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("")}
            className={`px-3 py-2 rounded-lg text-xs font-inter font-medium transition-all
              ${!statusFilter ? "bg-navy text-white" : "bg-white text-warm-500 border border-warm-200 hover:border-warm-300"}`}
          >
            All
          </button>
          {ESTIMATE_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-2 rounded-lg text-xs font-inter font-medium transition-all
                ${statusFilter === s.value ? "bg-navy text-white" : "bg-white text-warm-500 border border-warm-200 hover:border-warm-300"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : estimates.length === 0 ? (
        <div className="card-premium">
          <EmptyState
            icon={FileText}
            title={search || statusFilter ? "No estimates found" : "No estimates yet"}
            description={
              search || statusFilter
                ? "Try different search terms or filters"
                : "Create your first jewellery estimate to get started."
            }
            action={
              !search && !statusFilter ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/estimates/new")}
                  className="btn-gold flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create First Estimate
                </motion.button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-warm-100">
                  <th className="text-left text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3">
                    Estimate #
                  </th>
                  <th className="text-left text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3">
                    Customer
                  </th>
                  <th className="text-left text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                    Product
                  </th>
                  <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3">
                    Amount
                  </th>
                  <th className="text-center text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">
                    Date
                  </th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((est, index) => (
                  <motion.tr
                    key={est.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-warm-50 hover:bg-warm-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span
                        onClick={() => router.push(`/estimates/${est.id}`)}
                        className="text-sm font-inter font-medium text-navy hover:text-gold transition-colors cursor-pointer"
                      >
                        {est.estimateNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-inter text-navy">{est.customer.name}</p>
                        <p className="text-xs text-warm-400 font-inter">{est.customer.phone}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div>
                        <p className="text-sm font-inter text-warm-500">{est.productName}</p>
                        {est.category && (
                          <p className="text-xs text-warm-400 font-inter">{est.category.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-inter font-medium text-navy tabular-nums">
                        {formatCurrency(est.grandTotal)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <EstimateStatusBadge status={est.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                      <span className="text-sm text-warm-400 font-inter">
                        {formatDate(est.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === est.id ? null : est.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-warm-400" />
                      </button>

                      {openDropdown === est.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(null);
                            }}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="fixed z-40 w-44 bg-surface border border-warm-200 
                              rounded-xl shadow-warm-lg py-1.5"
                            style={{ right: "2rem" }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(null);
                                router.push(`/estimates/${est.id}`);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-navy 
                                hover:bg-warm-50 transition-colors font-inter"
                            >
                              <Eye className="w-3.5 h-3.5 text-warm-400" />
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(null);
                                // TODO: Duplicate estimate
                                toast.info("Duplicate feature coming soon!");
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-navy 
                                hover:bg-warm-50 transition-colors font-inter"
                            >
                              <Copy className="w-3.5 h-3.5 text-warm-400" />
                              Duplicate
                            </button>
                            <div className="border-t border-warm-100 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(null);
                                setDeleteEstimate(est);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 
                                hover:bg-red-50 transition-colors font-inter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </motion.div>
                        </>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <ConfirmDialog
        isOpen={!!deleteEstimate}
        onClose={() => setDeleteEstimate(null)}
        onConfirm={handleDelete}
        title="Delete Estimate"
        description={`Are you sure you want to delete "${deleteEstimate?.estimateNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}