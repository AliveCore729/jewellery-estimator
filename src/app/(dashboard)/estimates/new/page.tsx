"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Star,
  Loader2,
  ChevronDown,
  Gem,
  Receipt,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import { formatCurrency } from "@/lib/utils/formatters";
import { CHARGE_TYPES, WEIGHT_UNITS, CHARGE_NAMES } from "@/lib/constants/defaults";

// ============== Types ==============

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Category {
  id: string;
  name: string;
}

interface MaterialOption {
  id: string;
  name: string;
  category: string;
  purity: string | null;
  defaultUnit: string;
  latestRate: { ratePerUnit: number; unit: string } | null;
}

interface MaterialLine {
  materialId: string;
  materialName: string;
  weight: number;
  unit: string;
  ratePerUnit: number;
  wastagePct: number;
  huid: string;
}

interface ChargeLine {
  chargeName: string;
  chargeType: "FIXED" | "PERCENTAGE" | "PER_GRAM";
  chargeValue: number;
}

interface OldGoldLine {
  itemDescription: string;
  grossWeight: number;
  purity: string;
  netWeight: number;
  ratePerUnit: number;
}

interface Variant {
  variantLabel: string;
  isRecommended: boolean;
  materials: MaterialLine[];
  charges: ChargeLine[];
  oldGoldEntries: OldGoldLine[];
}

// ============== Helper: Calculate Variant Totals ==============

function calcVariantTotals(variant: Variant) {
  let totalMaterialCost = 0;
  let totalWeight = 0;

  for (const mat of variant.materials) {
    const wastageWt = (mat.weight * mat.wastagePct) / 100;
    const tw = mat.weight + wastageWt;
    totalWeight += tw;
    totalMaterialCost += tw * mat.ratePerUnit;
  }

  let totalCharges = 0;
  for (const charge of variant.charges) {
    switch (charge.chargeType) {
      case "FIXED":
        totalCharges += charge.chargeValue;
        break;
      case "PERCENTAGE":
        totalCharges += (totalMaterialCost * charge.chargeValue) / 100;
        break;
      case "PER_GRAM":
        totalCharges += totalWeight * charge.chargeValue;
        break;
    }
  }

  const subtotal = totalMaterialCost + totalCharges;
  const cgst = subtotal * 0.015;
  const sgst = subtotal * 0.015;
  const tax = cgst + sgst;

  let oldGoldDeduction = 0;
  for (const og of variant.oldGoldEntries) {
    oldGoldDeduction += og.netWeight * og.ratePerUnit;
  }

  const grandTotal = subtotal + tax - oldGoldDeduction;

  return { totalMaterialCost, totalCharges, subtotal, cgst, sgst, tax, oldGoldDeduction, grandTotal };
}

// ============== Default Line Factories ==============

const newMaterialLine = (): MaterialLine => ({
  materialId: "",
  materialName: "",
  weight: 0,
  unit: "GRAM",
  ratePerUnit: 0,
  wastagePct: 0,
  huid: "",
});

const newChargeLine = (): ChargeLine => ({
  chargeName: "Making Charges",
  chargeType: "PER_GRAM",
  chargeValue: 0,
});

const newOldGoldLine = (): OldGoldLine => ({
  itemDescription: "",
  grossWeight: 0,
  purity: "",
  netWeight: 0,
  ratePerUnit: 0,
});

const newVariant = (index: number): Variant => ({
  variantLabel: `Option ${String.fromCharCode(65 + index)}`,
  isRecommended: index === 0,
  materials: [newMaterialLine()],
  charges: [newChargeLine()],
  oldGoldEntries: [],
});

// ============== Component ==============

export default function NewEstimatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customer") || "";

  // Data options
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [materialsOptions, setMaterialsOptions] = useState<MaterialOption[]>([]);

  // Form state
  const [customerId, setCustomerId] = useState(preselectedCustomerId);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [variants, setVariants] = useState<Variant[]>([newVariant(0)]);
  const [activeVariant, setActiveVariant] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    Promise.all([
      fetch("/api/customers?limit=100").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/materials").then((r) => r.json()),
    ]).then(([custData, catData, matData]) => {
      if (custData.success) setCustomers(custData.data);
      if (catData.success) setCategories(catData.data);
      if (matData.success) setMaterialsOptions(matData.data);
      setIsLoading(false);
    });
  }, []);

  // Set customer search text when preselected
  useEffect(() => {
    if (preselectedCustomerId && customers.length > 0) {
      const c = customers.find((c) => c.id === preselectedCustomerId);
      if (c) setCustomerSearch(c.name);
    }
  }, [preselectedCustomerId, customers]);

  // Variant helpers
  const updateVariant = (index: number, updater: (v: Variant) => Variant) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? updater(v) : v)));
  };

  const addVariant = () => {
    if (variants.length >= 5) {
      toast.error("Maximum 5 variants allowed");
      return;
    }
    setVariants((prev) => [...prev, newVariant(prev.length)]);
    setActiveVariant(variants.length);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      toast.error("At least one variant is required");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
    if (activeVariant >= variants.length - 1) {
      setActiveVariant(Math.max(0, variants.length - 2));
    }
  };

  // Material select handler
  const handleMaterialSelect = (variantIdx: number, lineIdx: number, materialId: string) => {
    const mat = materialsOptions.find((m) => m.id === materialId);
    if (!mat) return;

    updateVariant(variantIdx, (v) => ({
      ...v,
      materials: v.materials.map((m, i) =>
        i === lineIdx
          ? {
              ...m,
              materialId: mat.id,
              materialName: mat.name,
              unit: mat.defaultUnit,
              ratePerUnit: mat.latestRate?.ratePerUnit || 0,
            }
          : m
      ),
    }));
  };

  // Submit
  const handleSubmit = async () => {
    // Validation
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!productName.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    for (let vi = 0; vi < variants.length; vi++) {
      const v = variants[vi];
      if (v.materials.length === 0 || !v.materials[0].materialId) {
        toast.error(`${v.variantLabel}: Add at least one material`);
        setActiveVariant(vi);
        return;
      }
      for (const mat of v.materials) {
        if (!mat.materialId) {
          toast.error(`${v.variantLabel}: Select a material for all rows`);
          setActiveVariant(vi);
          return;
        }
        if (mat.weight <= 0) {
          toast.error(`${v.variantLabel}: Weight must be greater than 0`);
          setActiveVariant(vi);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          categoryId: categoryId || null,
          productName,
          productDescription,
          notes,
          variants,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create estimate");
        return;
      }

      toast.success(`Estimate ${data.data.estimateNumber} created!`);
      router.push(`/estimates/${data.data.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  const currentVariant = variants[activeVariant];
  const totals = calcVariantTotals(currentVariant);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/estimates")}
          className="flex items-center gap-1.5 text-sm text-warm-500 hover:text-navy font-inter transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Estimates
        </button>
        <PageHeader title="New Estimate" description="Create a new jewellery estimate" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Customer + Product */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-5"
          >
            <h3 className="font-playfair text-lg font-semibold text-navy mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-gold" />
              Basic Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Search */}
              <div className="relative sm:col-span-2">
                <label className="block text-sm font-medium text-navy mb-1.5 font-inter">
                  Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                    if (!e.target.value) setCustomerId("");
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search customer by name or phone..."
                  className="w-full px-4 py-2.5 rounded-lg border border-warm-200 bg-white font-inter text-sm text-navy
                    placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                />
                {showCustomerDropdown && customerSearch && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCustomerDropdown(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-warm-200 rounded-xl shadow-warm-lg z-20 max-h-48 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.slice(0, 10).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setCustomerId(c.id);
                              setCustomerSearch(c.name);
                              setShowCustomerDropdown(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-warm-50 
                              transition-colors text-left"
                          >
                            <div>
                              <p className="text-sm font-inter font-medium text-navy">{c.name}</p>
                              <p className="text-xs font-inter text-warm-400">{c.phone}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-warm-400 font-inter">No customers found</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5 font-inter">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="E.g., Gold Necklace Set"
                  className="w-full px-4 py-2.5 rounded-lg border border-warm-200 bg-white font-inter text-sm text-navy
                    placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5 font-inter">
                  Category <span className="text-warm-400 text-xs">(Optional)</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-warm-200 bg-white font-inter text-sm text-navy
                    focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-navy mb-1.5 font-inter">
                  Description <span className="text-warm-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="E.g., Traditional temple design with rubies"
                  className="w-full px-4 py-2.5 rounded-lg border border-warm-200 bg-white font-inter text-sm text-navy
                    placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                />
              </div>
            </div>
          </motion.div>

          {/* Section 2: Variant Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium"
          >
            {/* Variant Tab Bar */}
            <div className="flex items-center border-b border-warm-100 px-5 pt-4 gap-1 overflow-x-auto">
              {variants.map((v, vi) => (
                <button
                  key={vi}
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
              <button
                onClick={addVariant}
                className="px-3 py-2.5 text-warm-400 hover:text-gold transition-colors"
                title="Add Variant"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Variant Content */}
            <div className="p-5">
              {/* Variant Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={currentVariant.variantLabel}
                    onChange={(e) =>
                      updateVariant(activeVariant, (v) => ({
                        ...v,
                        variantLabel: e.target.value,
                      }))
                    }
                    className="text-lg font-playfair font-semibold text-navy bg-transparent border-none 
                      focus:outline-none focus:ring-0 p-0 w-40"
                  />
                  <button
                    onClick={() =>
                      updateVariant(activeVariant, (v) => ({
                        ...v,
                        isRecommended: !v.isRecommended,
                      }))
                    }
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-inter font-medium transition-all
                      ${
                        currentVariant.isRecommended
                          ? "bg-gold/10 text-gold"
                          : "bg-warm-100 text-warm-400 hover:text-gold"
                      }`}
                  >
                    <Star
                      className={`w-3 h-3 ${currentVariant.isRecommended ? "fill-gold" : ""}`}
                    />
                    {currentVariant.isRecommended ? "Recommended" : "Set as Recommended"}
                  </button>
                </div>

                {variants.length > 1 && (
                  <button
                    onClick={() => removeVariant(activeVariant)}
                    className="text-xs text-red-500 hover:text-red-700 font-inter flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>

              {/* Materials Section */}
              <div className="mb-6">
                <h4 className="text-sm font-inter font-semibold text-navy mb-3 flex items-center gap-2">
                  <Gem className="w-4 h-4 text-gold" />
                  Materials
                </h4>

                <div className="space-y-3">
                  {currentVariant.materials.map((mat, mi) => (
                    <motion.div
                      key={mi}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-warm-50/50 border border-warm-100"
                    >
                      {/* Material Select */}
                      <div className="col-span-12 sm:col-span-3">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Material</label>
                        <select
                          value={mat.materialId}
                          onChange={(e) => handleMaterialSelect(activeVariant, mi, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm font-inter text-navy
                            focus:outline-none focus:ring-2 focus:ring-gold/40"
                        >
                          <option value="">Select</option>
                          {materialsOptions.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} {m.purity ? `(${m.purity})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Weight */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Weight</label>
                        <input
                          type="number"
                          step="0.001"
                          value={mat.weight || ""}
                          onChange={(e) =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              materials: v.materials.map((m, i) =>
                                i === mi ? { ...m, weight: parseFloat(e.target.value) || 0 } : m
                              ),
                            }))
                          }
                          placeholder="0.000"
                          className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm font-inter text-navy
                            focus:outline-none focus:ring-2 focus:ring-gold/40 tabular-nums"
                        />
                      </div>

                      {/* Unit */}
                      <div className="col-span-4 sm:col-span-1">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Unit</label>
                        <select
                          value={mat.unit}
                          onChange={(e) =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              materials: v.materials.map((m, i) =>
                                i === mi ? { ...m, unit: e.target.value } : m
                              ),
                            }))
                          }
                          className="w-full px-2 py-2 rounded-lg border border-warm-200 bg-white text-sm font-inter text-navy
                            focus:outline-none focus:ring-2 focus:ring-gold/40"
                        >
                          {WEIGHT_UNITS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.symbol}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Rate */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Rate (₹)</label>
                        <input
                          type="number"
                          value={mat.ratePerUnit || ""}
                          onChange={(e) =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              materials: v.materials.map((m, i) =>
                                i === mi ? { ...m, ratePerUnit: parseFloat(e.target.value) || 0 } : m
                              ),
                            }))
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm font-inter text-navy
                            focus:outline-none focus:ring-2 focus:ring-gold/40 tabular-nums"
                        />
                      </div>

                      {/* Wastage % */}
                      <div className="col-span-4 sm:col-span-1">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Wastage %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={mat.wastagePct || ""}
                          onChange={(e) =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              materials: v.materials.map((m, i) =>
                                i === mi ? { ...m, wastagePct: parseFloat(e.target.value) || 0 } : m
                              ),
                            }))
                          }
                          placeholder="0"
                          className="w-full px-2 py-2 rounded-lg border border-warm-200 bg-white text-sm font-inter text-navy
                            focus:outline-none focus:ring-2 focus:ring-gold/40 tabular-nums"
                        />
                      </div>

                      {/* Line Total */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Total</label>
                        <div className="px-3 py-2 rounded-lg bg-warm-100 text-sm font-inter font-medium text-navy tabular-nums">
                          {formatCurrency(
                            (mat.weight + (mat.weight * mat.wastagePct) / 100) * mat.ratePerUnit
                          )}
                        </div>
                      </div>

                      {/* Remove */}
                      <div className="col-span-4 sm:col-span-1 flex items-end">
                        {currentVariant.materials.length > 1 && (
                          <button
                            onClick={() =>
                              updateVariant(activeVariant, (v) => ({
                                ...v,
                                materials: v.materials.filter((_, i) => i !== mi),
                              }))
                            }
                            className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  <button
                    onClick={() =>
                      updateVariant(activeVariant, (v) => ({
                        ...v,
                        materials: [...v.materials, newMaterialLine()],
                      }))
                    }
                    className="flex items-center gap-1.5 text-sm text-gold hover:text-gold-600 font-inter font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Material
                  </button>
                </div>
              </div>

              {/* Charges Section */}
              <div className="mb-6">
                <h4 className="text-sm font-inter font-semibold text-navy mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-gold" />
                  Charges
                </h4>

                <div className="space-y-3">
                  {currentVariant.charges.map((charge, ci) => (
                    <motion.div
                      key={ci}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-warm-50/50 border border-warm-100"
                    >
                      {/* Charge Name */}
                      <div className="col-span-12 sm:col-span-4">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Charge Name</label>
                        <select
                          value={charge.chargeName}
                          onChange={(e) =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              charges: v.charges.map((c, i) =>
                                i === ci ? { ...c, chargeName: e.target.value } : c
                              ),
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm font-inter text-navy
                            focus:outline-none focus:ring-2 focus:ring-gold/40"
                        >
                          {CHARGE_NAMES.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Type */}
                      <div className="col-span-6 sm:col-span-3">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Type</label>
                        <select
                          value={charge.chargeType}
                          onChange={(e) =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              charges: v.charges.map((c, i) =>
                                i === ci
                                  ? { ...c, chargeType: e.target.value as ChargeLine["chargeType"] }
                                  : c
                              ),
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm font-inter text-navy
                            focus:outline-none focus:ring-2 focus:ring-gold/40"
                        >
                          {CHARGE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Value */}
                      <div className="col-span-4 sm:col-span-3">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Value</label>
                        <input
                          type="number"
                          value={charge.chargeValue || ""}
                          onChange={(e) =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              charges: v.charges.map((c, i) =>
                                i === ci ? { ...c, chargeValue: parseFloat(e.target.value) || 0 } : c
                              ),
                            }))
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm font-inter text-navy
                            focus:outline-none focus:ring-2 focus:ring-gold/40 tabular-nums"
                        />
                      </div>

                      {/* Remove */}
                      <div className="col-span-2 flex items-end">
                        <button
                          onClick={() =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              charges: v.charges.filter((_, i) => i !== ci),
                            }))
                          }
                          className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  <button
                    onClick={() =>
                      updateVariant(activeVariant, (v) => ({
                        ...v,
                        charges: [...v.charges, newChargeLine()],
                      }))
                    }
                    className="flex items-center gap-1.5 text-sm text-gold hover:text-gold-600 font-inter font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Charge
                  </button>
                </div>
              </div>

              {/* Old Gold Section */}
              <div>
                <h4 className="text-sm font-inter font-semibold text-navy mb-3 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-gold" />
                  Old Gold Exchange <span className="text-xs text-warm-400 font-normal">(Optional)</span>
                </h4>

                <div className="space-y-3">
                  {currentVariant.oldGoldEntries.map((og, oi) => (
                    <motion.div
                      key={oi}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-amber-50/50 border border-amber-100"
                    >
                      <div className="col-span-12 sm:col-span-3">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Description</label>
                        <input
                          type="text"
                          value={og.itemDescription}
                          onChange={(e) =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              oldGoldEntries: v.oldGoldEntries.map((o, i) =>
                                i === oi ? { ...o, itemDescription: e.target.value } : o
                              ),
                            }))
                          }
                          placeholder="Old ring"
                          className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm font-inter
                            focus:outline-none focus:ring-2 focus:ring-gold/40"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Gross Wt (g)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={og.grossWeight || ""}
                          onChange={(e) =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              oldGoldEntries: v.oldGoldEntries.map((o, i) =>
                                i === oi ? { ...o, grossWeight: parseFloat(e.target.value) || 0 } : o
                              ),
                            }))
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm font-inter
                            focus:outline-none focus:ring-2 focus:ring-gold/40 tabular-nums"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Net Wt (g)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={og.netWeight || ""}
                          onChange={(e) =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              oldGoldEntries: v.oldGoldEntries.map((o, i) =>
                                i === oi ? { ...o, netWeight: parseFloat(e.target.value) || 0 } : o
                              ),
                            }))
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm font-inter
                            focus:outline-none focus:ring-2 focus:ring-gold/40 tabular-nums"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Rate (₹/g)</label>
                        <input
                          type="number"
                          value={og.ratePerUnit || ""}
                          onChange={(e) =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              oldGoldEntries: v.oldGoldEntries.map((o, i) =>
                                i === oi ? { ...o, ratePerUnit: parseFloat(e.target.value) || 0 } : o
                              ),
                            }))
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm font-inter
                            focus:outline-none focus:ring-2 focus:ring-gold/40 tabular-nums"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-2">
                        <label className="text-xs text-warm-400 font-inter mb-1 block">Deduction</label>
                        <div className="px-3 py-2 rounded-lg bg-amber-100 text-sm font-inter font-medium text-amber-800 tabular-nums">
                          -{formatCurrency(og.netWeight * og.ratePerUnit)}
                        </div>
                      </div>

                      <div className="col-span-6 sm:col-span-1 flex items-end">
                        <button
                          onClick={() =>
                            updateVariant(activeVariant, (v) => ({
                              ...v,
                              oldGoldEntries: v.oldGoldEntries.filter((_, i) => i !== oi),
                            }))
                          }
                          className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  <button
                    onClick={() =>
                      updateVariant(activeVariant, (v) => ({
                        ...v,
                        oldGoldEntries: [...v.oldGoldEntries, newOldGoldLine()],
                      }))
                    }
                    className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-inter font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Old Gold
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-premium p-5"
          >
            <label className="block text-sm font-medium text-navy mb-1.5 font-inter">
              Notes <span className="text-warm-400 text-xs">(Optional — visible on PDF)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Customer prefers matte finish. Delivery by 15 March."
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-warm-200 bg-white font-inter text-sm text-navy
                placeholder:text-warm-400 resize-none focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
            />
          </motion.div>
        </div>

        {/* Right: Live Totals Panel */}
        <div className="xl:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-premium p-5 sticky top-24"
          >
            <h3 className="font-playfair text-lg font-semibold text-navy mb-4">
              {currentVariant.variantLabel} — Totals
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-inter">
                <span className="text-warm-500">Material Cost</span>
                <span className="text-navy tabular-nums font-medium">
                  {formatCurrency(totals.totalMaterialCost)}
                </span>
              </div>

              <div className="flex justify-between text-sm font-inter">
                <span className="text-warm-500">Charges</span>
                <span className="text-navy tabular-nums font-medium">
                  {formatCurrency(totals.totalCharges)}
                </span>
              </div>

              <div className="border-t border-warm-100 pt-3 flex justify-between text-sm font-inter">
                <span className="text-warm-500">Subtotal</span>
                <span className="text-navy tabular-nums font-medium">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-sm font-inter">
                <span className="text-warm-400">CGST (1.5%)</span>
                <span className="text-warm-500 tabular-nums">{formatCurrency(totals.cgst)}</span>
              </div>

              <div className="flex justify-between text-sm font-inter">
                <span className="text-warm-400">SGST (1.5%)</span>
                <span className="text-warm-500 tabular-nums">{formatCurrency(totals.sgst)}</span>
              </div>

              {totals.oldGoldDeduction > 0 && (
                <div className="flex justify-between text-sm font-inter">
                  <span className="text-amber-600">Old Gold Deduction</span>
                  <span className="text-amber-600 tabular-nums font-medium">
                    -{formatCurrency(totals.oldGoldDeduction)}
                  </span>
                </div>
              )}

              <div className="border-t-2 border-gold/30 pt-3 flex justify-between">
                <span className="font-playfair text-lg font-bold text-navy">Grand Total</span>
                <span className="font-playfair text-xl font-bold text-navy tabular-nums">
                  {formatCurrency(totals.grandTotal)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full btn-gold py-3 mt-6 text-base font-semibold font-inter
                flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Estimate"
              )}
            </motion.button>

            <p className="text-xs text-warm-400 font-inter text-center mt-2">
              Estimate will be saved as Draft
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}