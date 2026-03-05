"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, User, Phone, Mail, MapPin, StickyNote } from "lucide-react";
import { toast } from "sonner";

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
  } | null;
}

export default function CustomerForm({
  isOpen,
  onClose,
  onSuccess,
  editData = null,
}: CustomerFormProps) {
  const [form, setForm] = useState<CustomerFormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<CustomerFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const isEdit = !!editData;

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || "",
        phone: editData.phone || "",
        email: editData.email || "",
        address: editData.address || "",
        notes: editData.notes || "",
      });
    } else {
      setForm({ name: "", phone: "", email: "", address: "", notes: "" });
    }
    setErrors({});
  }, [editData, isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<CustomerFormData> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    else if (form.phone.replace(/\D/g, "").length < 10)
      newErrors.phone = "Phone must be at least 10 digits";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const url = isEdit ? `/api/customers/${editData!.id}` : "/api/customers";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }

      toast.success(isEdit ? "Customer updated!" : "Customer created!");
      onSuccess();
      onClose();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative bg-surface rounded-xl shadow-warm-xl border border-warm-200 
              w-full max-w-lg z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-warm-100">
              <h2 className="font-playfair text-xl font-bold text-navy">
                {isEdit ? "Edit Customer" : "New Customer"}
              </h2>
              <button
                onClick={onClose}
                className="text-warm-400 hover:text-navy transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-navy mb-1.5 font-inter">
                  <User className="w-3.5 h-3.5 text-warm-400" />
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="Enter customer name"
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white font-inter text-sm text-navy
                    placeholder:text-warm-400 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold
                    ${errors.name ? "border-red-400" : "border-warm-200"}`}
                  autoFocus
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500 font-inter">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-navy mb-1.5 font-inter">
                  <Phone className="w-3.5 h-3.5 text-warm-400" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value });
                    setErrors({ ...errors, phone: undefined });
                  }}
                  placeholder="+91 98765 43210"
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white font-inter text-sm text-navy
                    placeholder:text-warm-400 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold
                    ${errors.phone ? "border-red-400" : "border-warm-200"}`}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500 font-inter">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-navy mb-1.5 font-inter">
                  <Mail className="w-3.5 h-3.5 text-warm-400" />
                  Email <span className="text-warm-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="customer@email.com"
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white font-inter text-sm text-navy
                    placeholder:text-warm-400 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold
                    ${errors.email ? "border-red-400" : "border-warm-200"}`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 font-inter">{errors.email}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-navy mb-1.5 font-inter">
                  <MapPin className="w-3.5 h-3.5 text-warm-400" />
                  Address <span className="text-warm-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Enter address"
                  className="w-full px-4 py-2.5 rounded-lg border border-warm-200 bg-white font-inter text-sm text-navy
                    placeholder:text-warm-400 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-navy mb-1.5 font-inter">
                  <StickyNote className="w-3.5 h-3.5 text-warm-400" />
                  Notes <span className="text-warm-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="E.g., Prefers 22K gold, regular customer"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-warm-200 bg-white font-inter text-sm text-navy
                    placeholder:text-warm-400 transition-all duration-200 resize-none
                    focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-warm-200 text-navy font-inter 
                    text-sm font-medium hover:bg-warm-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-gold py-2.5 text-sm flex items-center justify-center gap-2
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isEdit ? "Updating..." : "Creating..."}
                    </>
                  ) : isEdit ? (
                    "Update Customer"
                  ) : (
                    "Create Customer"
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}