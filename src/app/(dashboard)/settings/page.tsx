"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  FileText,
  Percent,
  Save,
  Loader2,
  Receipt,
  Scale,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import { CardSkeleton } from "@/components/common/LoadingSkeleton";

interface Settings {
  id: string;
  shopName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  defaultTaxPct: number;
  cgstPct: number;
  sgstPct: number;
  estimatePrefix: string;
  estimateValidityDays: number;
  defaultWeightUnit: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [cgstPct, setCgstPct] = useState("");
  const [sgstPct, setSgstPct] = useState("");
  const [estimatePrefix, setEstimatePrefix] = useState("");
  const [estimateValidityDays, setEstimateValidityDays] = useState("");
  const [defaultWeightUnit, setDefaultWeightUnit] = useState("GRAM");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const s = data.data;
          setSettings(s);
          setShopName(s.shopName || "");
          setAddress(s.address || "");
          setPhone(s.phone || "");
          setEmail(s.email || "");
          setGstin(s.gstin || "");
          setCgstPct(String(s.cgstPct || ""));
          setSgstPct(String(s.sgstPct || ""));
          setEstimatePrefix(s.estimatePrefix || "");
          setEstimateValidityDays(String(s.estimateValidityDays || ""));
          setDefaultWeightUnit(s.defaultWeightUnit || "GRAM");
        }
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!shopName.trim()) {
      toast.error("Shop name is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: shopName.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          gstin: gstin.trim() || null,
          cgstPct: parseFloat(cgstPct) || 0,
          sgstPct: parseFloat(sgstPct) || 0,
          estimatePrefix: estimatePrefix.trim() || "EST",
          estimateValidityDays: parseInt(estimateValidityDays) || 3,
          defaultWeightUnit,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        toast.success("Settings saved successfully!");
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your shop details, tax rates, and estimate preferences"
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            className="btn-gold flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </motion.button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Shop Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-6"
        >
          <h2 className="font-playfair text-lg font-semibold text-navy mb-5 flex items-center gap-2">
            <Store className="w-5 h-5 text-gold" />
            Shop Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-inter font-medium text-navy mb-1.5">
                Shop Name *
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Your Jewellery Shop"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-inter font-medium text-navy mb-1.5">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-warm-300" />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="input-field pl-10 resize-none"
                  placeholder="Shop address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-inter font-medium text-navy mb-1.5">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field pl-10"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-inter font-medium text-navy mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="shop@email.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-inter font-medium text-navy mb-1.5">
                GSTIN
              </label>
              <div className="relative">
                <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="input-field pl-10 uppercase"
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tax & Estimate Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-6"
        >
          <h2 className="font-playfair text-lg font-semibold text-navy mb-5 flex items-center gap-2">
            <Percent className="w-5 h-5 text-gold" />
            Tax & Estimate Settings
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-inter font-medium text-navy mb-1.5">
                  CGST %
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
                  <input
                    type="number"
                    step="0.1"
                    value={cgstPct}
                    onChange={(e) => setCgstPct(e.target.value)}
                    className="input-field pl-10"
                    placeholder="1.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-inter font-medium text-navy mb-1.5">
                  SGST %
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
                  <input
                    type="number"
                    step="0.1"
                    value={sgstPct}
                    onChange={(e) => setSgstPct(e.target.value)}
                    className="input-field pl-10"
                    placeholder="1.5"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-warm-400 font-inter -mt-2">
              Total GST: {(parseFloat(cgstPct || "0") + parseFloat(sgstPct || "0")).toFixed(1)}%
            </p>

            <div>
              <label className="block text-sm font-inter font-medium text-navy mb-1.5">
                Estimate Number Prefix
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
                <input
                  type="text"
                  value={estimatePrefix}
                  onChange={(e) => setEstimatePrefix(e.target.value.toUpperCase())}
                  className="input-field pl-10 uppercase"
                  placeholder="EST"
                />
              </div>
              <p className="text-xs text-warm-400 font-inter mt-1">
                Example: {estimatePrefix || "EST"}-2026-0001
              </p>
            </div>

            <div>
              <label className="block text-sm font-inter font-medium text-navy mb-1.5">
                Estimate Validity (Days)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
                <input
                  type="number"
                  value={estimateValidityDays}
                  onChange={(e) => setEstimateValidityDays(e.target.value)}
                  className="input-field pl-10"
                  placeholder="3"
                  min={1}
                  max={90}
                />
              </div>
              <p className="text-xs text-warm-400 font-inter mt-1">
                Estimates will be valid for {estimateValidityDays || 3} days from creation
              </p>
            </div>

            <div>
              <label className="block text-sm font-inter font-medium text-navy mb-1.5">
                Default Weight Unit
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
                <select
                  value={defaultWeightUnit}
                  onChange={(e) => setDefaultWeightUnit(e.target.value)}
                  className="input-field pl-10 appearance-none"
                >
                  <option value="GRAM">Grams (g)</option>
                  <option value="TOLA">Tola</option>
                  <option value="CARAT">Carat</option>
                  <option value="MG">Milligram (mg)</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-premium p-6 mt-6"
      >
        <h2 className="font-playfair text-lg font-semibold text-navy mb-4">
          Preview — How it appears on estimates
        </h2>
        <div className="bg-navy rounded-xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-playfair text-xl font-bold text-gold">
                {shopName || "Your Shop Name"}
              </h3>
              {address && (
                <p className="text-sm text-white/60 mt-1">{address}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                {phone && (
                  <span className="text-xs text-white/50">{phone}</span>
                )}
                {email && (
                  <span className="text-xs text-white/50">{email}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40 uppercase tracking-wider">Estimate</p>
              <p className="font-playfair text-lg font-bold text-gold">
                {estimatePrefix || "EST"}-2026-0001
              </p>
            </div>
          </div>
          {gstin && (
            <p className="text-xs text-white/40 mt-3 pt-3 border-t border-white/10">
              GSTIN: {gstin}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}