"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gem,
  TrendingUp,
  Pencil,
  History,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import { DashboardSkeleton } from "@/components/common/LoadingSkeleton";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/formatters";
import { MATERIAL_CATEGORIES } from "@/lib/constants/defaults";

interface MaterialRate {
  id: string;
  ratePerUnit: number;
  unit: string;
  source: string;
  effectiveDate: string;
}

interface Material {
  id: string;
  name: string;
  category: string;
  purity: string | null;
  defaultUnit: string;
  hsnCode: string | null;
  isActive: boolean;
  latestRate: MaterialRate | null;
}

interface RateHistoryItem {
  id: string;
  ratePerUnit: number;
  unit: string;
  source: string;
  effectiveDate: string;
  createdAt: string;
}

const unitSymbols: Record<string, string> = {
  GRAM: "/g",
  TOLA: "/tola",
  CARAT: "/ct",
  PIECE: "/pc",
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [newRate, setNewRate] = useState("");
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);
  const [rateHistory, setRateHistory] = useState<RateHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      if (data.success) {
        setMaterials(data.data);
      }
    } catch {
      toast.error("Failed to load materials");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const filteredMaterials =
    activeCategory === "ALL"
      ? materials
      : materials.filter((m) => m.category === activeCategory);

  const handleSaveRate = async (material: Material) => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error("Please enter a valid rate");
      return;
    }

    setIsSavingRate(true);
    try {
      const res = await fetch(`/api/materials/${material.id}/rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratePerUnit: rate,
          unit: material.defaultUnit,
          source: "MANUAL",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update rate");
        return;
      }

      toast.success(`${material.name} rate updated to ₹${rate.toLocaleString("en-IN")}`);
      setEditingRate(null);
      setNewRate("");
      fetchMaterials();
    } catch {
      toast.error("Failed to update rate");
    } finally {
      setIsSavingRate(false);
    }
  };

  const openHistory = async (material: Material) => {
    setHistoryMaterial(material);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/materials/${material.id}/rates`);
      const data = await res.json();
      if (data.success) {
        setRateHistory(data.data);
      }
    } catch {
      toast.error("Failed to load rate history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  // Group materials by category for display
  const categories = [
    { value: "ALL", label: "All Materials", color: "#6B7280" },
    ...MATERIAL_CATEGORIES,
  ];

  return (
    <div>
      <PageHeader
        title="Materials & Rates"
        description="Manage materials and update daily rates"
      />

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => {
          const count =
            cat.value === "ALL"
              ? materials.length
              : materials.filter((m) => m.category === cat.value).length;

          if (cat.value !== "ALL" && count === 0) return null;

          return (
            <motion.button
              key={cat.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-inter font-medium transition-all duration-200
                ${
                  activeCategory === cat.value
                    ? "bg-navy text-white shadow-md"
                    : "bg-white text-warm-500 border border-warm-200 hover:border-warm-300 hover:text-navy"
                }`}
            >
              {cat.label}
              <span
                className={`ml-2 text-xs ${
                  activeCategory === cat.value ? "text-white/60" : "text-warm-400"
                }`}
              >
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMaterials.map((material, index) => {
          const catConfig = MATERIAL_CATEGORIES.find(
            (c) => c.value === material.category
          );
          const isEditing = editingRate === material.id;

          return (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ y: -2 }}
              className="card-premium p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${catConfig?.color}15` }}
                  >
                    <Gem
                      className="w-4 h-4"
                      style={{ color: catConfig?.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-inter font-semibold text-navy">
                      {material.name}
                    </h3>
                    {material.purity && (
                      <span className="text-xs text-warm-400 font-inter">
                        {material.purity} Purity
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openHistory(material)}
                  className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors"
                  title="Rate History"
                >
                  <History className="w-3.5 h-3.5 text-warm-400" />
                </button>
              </div>

              {/* Rate Display / Edit */}
              {isEditing ? (
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-warm-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder="Enter rate"
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-gold bg-white font-inter text-sm text-navy
                        focus:outline-none focus:ring-2 focus:ring-gold/40"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRate(material);
                        if (e.key === "Escape") {
                          setEditingRate(null);
                          setNewRate("");
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleSaveRate(material)}
                    disabled={isSavingRate}
                    className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 
                      transition-colors disabled:opacity-50"
                  >
                    {isSavingRate ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRate(null);
                      setNewRate("");
                    }}
                    className="p-2 rounded-lg bg-warm-100 text-warm-500 hover:bg-warm-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-end justify-between mt-2">
                  <div>
                    {material.latestRate ? (
                      <>
                        <p className="font-playfair text-xl font-bold text-navy tabular-nums">
                          {formatCurrency(material.latestRate.ratePerUnit)}
                          <span className="text-sm font-inter font-normal text-warm-400">
                            {unitSymbols[material.defaultUnit] || ""}
                          </span>
                        </p>
                        <p className="text-xs text-warm-400 font-inter mt-0.5">
                          Updated {formatDate(material.latestRate.effectiveDate)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-warm-400 font-inter">No rate set</p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setEditingRate(material.id);
                      setNewRate(
                        material.latestRate
                          ? material.latestRate.ratePerUnit.toString()
                          : ""
                      );
                    }}
                    className="p-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
                    title="Update Rate"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              )}

              {/* Category Badge */}
              <div className="mt-3 pt-3 border-t border-warm-100 flex items-center justify-between">
                <span
                  className="text-xs font-inter font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${catConfig?.color}15`,
                    color: catConfig?.color,
                  }}
                >
                  {catConfig?.label || material.category}
                </span>
                {material.hsnCode && (
                  <span className="text-xs text-warm-400 font-inter">
                    HSN: {material.hsnCode}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rate History Modal */}
      <AnimatePresence>
        {historyMaterial && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryMaterial(null)}
              className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-surface rounded-xl shadow-warm-xl border border-warm-200 
                w-full max-w-md z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-warm-100">
                <div>
                  <h2 className="font-playfair text-lg font-bold text-navy">
                    Rate History
                  </h2>
                  <p className="text-sm text-warm-400 font-inter">
                    {historyMaterial.name}
                    {historyMaterial.purity ? ` (${historyMaterial.purity})` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setHistoryMaterial(null)}
                  className="text-warm-400 hover:text-navy transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* History List */}
              <div className="max-h-[400px] overflow-y-auto">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-gold animate-spin" />
                  </div>
                ) : rateHistory.length === 0 ? (
                  <div className="py-12 text-center">
                    <TrendingUp className="w-8 h-8 text-warm-300 mx-auto mb-2" />
                    <p className="text-sm text-warm-400 font-inter">
                      No rate history yet
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-warm-50">
                    {rateHistory.map((rate, index) => (
                      <motion.div
                        key={rate.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <div>
                          <p className="text-sm font-inter font-semibold text-navy tabular-nums">
                            {formatCurrency(rate.ratePerUnit)}
                            <span className="font-normal text-warm-400">
                              {unitSymbols[rate.unit] || ""}
                            </span>
                          </p>
                          <p className="text-xs text-warm-400 font-inter">
                            {formatDateTime(rate.effectiveDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-inter ${
                              rate.source === "API"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-warm-100 text-warm-500"
                            }`}
                          >
                            {rate.source}
                          </span>
                          {index === 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-inter font-medium">
                              Current
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}