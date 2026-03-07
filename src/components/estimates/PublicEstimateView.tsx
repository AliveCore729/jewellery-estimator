"use client";

import { useState } from "react";
import { Gem, Receipt, Coins, Star, Phone, Mail, MapPin } from "lucide-react";

interface Props {
  estimate: any;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  shopGstin: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PublicEstimateView({
  estimate,
  shopName,
  shopAddress,
  shopPhone,
  shopEmail,
  shopGstin,
}: Props) {
  const [activeVariant, setActiveVariant] = useState(0);
  const variant = estimate.variants[activeVariant];

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 to-white">
      {/* Header */}
      <div className="bg-navy text-white">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-playfair text-2xl font-bold text-gold">{shopName}</h1>
              {shopAddress && (
                <p className="text-sm text-white/60 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {shopAddress}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2">
                {shopPhone && (
                  <span className="text-xs text-white/50 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {shopPhone}
                  </span>
                )}
                {shopEmail && (
                  <span className="text-xs text-white/50 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {shopEmail}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40 uppercase tracking-wider">Estimate</p>
              <p className="font-playfair text-lg font-bold text-gold">{estimate.estimateNumber}</p>
              <p className="text-xs text-white/50 mt-1">{formatDate(estimate.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Customer + Product */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-xs text-warm-400 uppercase tracking-wider mb-2">Prepared For</p>
            <p className="font-inter font-semibold text-navy">{estimate.customer.name}</p>
            <p className="text-sm text-warm-500">{estimate.customer.phone}</p>
            {estimate.customer.email && (
              <p className="text-sm text-warm-500">{estimate.customer.email}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-warm-400 uppercase tracking-wider mb-2">Product</p>
            <p className="font-inter font-semibold text-navy">{estimate.productName}</p>
            {estimate.category && (
              <p className="text-sm text-warm-500">{estimate.category.name}</p>
            )}
            {estimate.productDescription && (
              <p className="text-sm text-warm-400 mt-1">{estimate.productDescription}</p>
            )}
          </div>
        </div>

        {/* Variant Tabs */}
        {estimate.variants.length > 1 && (
          <div className="flex gap-2 mb-6">
            {estimate.variants.map((v: any, vi: number) => (
              <button
                key={v.id}
                onClick={() => setActiveVariant(vi)}
                className={`px-4 py-2 rounded-lg text-sm font-inter font-medium transition-all
                  ${
                    activeVariant === vi
                      ? "bg-navy text-white shadow-md"
                      : "bg-white text-warm-500 border border-warm-200 hover:border-warm-300"
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

        {variant && (
          <>
            {/* Materials */}
            <div className="bg-white rounded-xl border border-warm-200 overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-warm-100 bg-warm-50/50">
                <h3 className="text-sm font-inter font-semibold text-navy flex items-center gap-2">
                  <Gem className="w-4 h-4 text-gold" />
                  Materials
                </h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-warm-100">
                    <th className="text-left text-xs font-inter font-medium text-warm-400 uppercase px-5 py-2">Material</th>
                    <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase px-3 py-2">Weight</th>
                    <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase px-3 py-2">Rate</th>
                    <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase px-3 py-2">Wastage</th>
                    <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase px-5 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {variant.materials.map((mat: any) => (
                    <tr key={mat.id} className="border-b border-warm-50">
                      <td className="px-5 py-2.5 text-sm font-inter text-navy">
                        {mat.material.name}
                        {mat.huid && <span className="text-xs text-warm-400 ml-1">(HUID: {mat.huid})</span>}
                      </td>
                      <td className="text-right px-3 py-2.5 text-sm font-inter text-warm-500 tabular-nums">{mat.weight}g</td>
                      <td className="text-right px-3 py-2.5 text-sm font-inter text-warm-500 tabular-nums">{formatCurrency(mat.ratePerUnit)}</td>
                      <td className="text-right px-3 py-2.5 text-sm font-inter text-warm-500 tabular-nums">{mat.wastagePct}%</td>
                      <td className="text-right px-5 py-2.5 text-sm font-inter font-medium text-navy tabular-nums">{formatCurrency(mat.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Charges */}
            {variant.charges.length > 0 && (
              <div className="bg-white rounded-xl border border-warm-200 overflow-hidden mb-6">
                <div className="px-5 py-3 border-b border-warm-100 bg-warm-50/50">
                  <h3 className="text-sm font-inter font-semibold text-navy flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-gold" />
                    Charges
                  </h3>
                </div>
                <div className="divide-y divide-warm-50">
                  {variant.charges.map((c: any) => (
                    <div key={c.id} className="flex justify-between px-5 py-2.5">
                      <span className="text-sm font-inter text-warm-500">{c.chargeName}</span>
                      <span className="text-sm font-inter font-medium text-navy tabular-nums">
                        {formatCurrency(c.calculatedAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Old Gold */}
            {variant.oldGoldEntries.length > 0 && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden mb-6">
                <div className="px-5 py-3 border-b border-amber-200">
                  <h3 className="text-sm font-inter font-semibold text-amber-800 flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Old Gold Exchange
                  </h3>
                </div>
                <div className="divide-y divide-amber-100">
                  {variant.oldGoldEntries.map((og: any) => (
                    <div key={og.id} className="flex justify-between px-5 py-2.5">
                      <span className="text-sm font-inter text-amber-700">
                        {og.itemDescription || "Old Gold"} ({og.netWeight}g)
                      </span>
                      <span className="text-sm font-inter font-medium text-amber-700 tabular-nums">
                        -{formatCurrency(og.deductionAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
              <div className="p-5 space-y-2.5">
                <div className="flex justify-between text-sm font-inter">
                  <span className="text-warm-500">Material Cost</span>
                  <span className="text-navy tabular-nums">{formatCurrency(variant.totalMaterialCost)}</span>
                </div>
                {variant.totalMakingCharges > 0 && (
                  <div className="flex justify-between text-sm font-inter">
                    <span className="text-warm-500">Making Charges</span>
                    <span className="text-navy tabular-nums">{formatCurrency(variant.totalMakingCharges)}</span>
                  </div>
                )}
                {variant.totalAdditionalCharges > 0 && (
                  <div className="flex justify-between text-sm font-inter">
                    <span className="text-warm-500">Additional Charges</span>
                    <span className="text-navy tabular-nums">{formatCurrency(variant.totalAdditionalCharges)}</span>
                  </div>
                )}
                <div className="border-t border-warm-100 pt-2.5 flex justify-between text-sm font-inter">
                  <span className="text-warm-500">Subtotal</span>
                  <span className="text-navy font-medium tabular-nums">{formatCurrency(variant.subtotal)}</span>
                </div>
                {variant.taxes.map((tax: any) => (
                  <div key={tax.id} className="flex justify-between text-sm font-inter">
                    <span className="text-warm-400">{tax.taxName} ({tax.taxPct}%)</span>
                    <span className="text-warm-500 tabular-nums">{formatCurrency(tax.taxAmount)}</span>
                  </div>
                ))}
                {variant.oldGoldDeduction > 0 && (
                  <div className="flex justify-between text-sm font-inter">
                    <span className="text-amber-600">Old Gold Deduction</span>
                    <span className="text-amber-600 tabular-nums">-{formatCurrency(variant.oldGoldDeduction)}</span>
                  </div>
                )}
                <div className="border-t-2 border-gold/30 pt-3 flex justify-between">
                  <span className="font-playfair text-xl font-bold text-navy">Grand Total</span>
                  <span className="font-playfair text-2xl font-bold text-navy tabular-nums">
                    {formatCurrency(variant.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 space-y-2">
              <p className="text-xs text-warm-400 font-inter">
                Valid until {formatDate(estimate.validUntil)}
              </p>
              {shopGstin && (
                <p className="text-xs text-warm-400 font-inter">GSTIN: {shopGstin}</p>
              )}
              <p className="text-xs text-warm-300 font-inter">
                This is a computer-generated estimate from {shopName}
              </p>
            </div>
          </>
        )}

        {estimate.notes && (
          <div className="mt-6 p-4 bg-warm-50 rounded-xl border border-warm-100">
            <p className="text-xs text-warm-400 font-inter mb-1">Notes</p>
            <p className="text-sm text-warm-600 font-inter">{estimate.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}