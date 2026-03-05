"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  StickyNote,
  Pencil,
  FileText,
  Plus,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import CustomerForm from "@/components/customers/CustomerForm";
import EstimateStatusBadge from "@/components/estimates/EstimateStatusBadge";
import { CardSkeleton, TableSkeleton } from "@/components/common/LoadingSkeleton";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";

interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  estimateCount: number;
  createdAt: string;
  estimates: {
    id: string;
    estimateNumber: string;
    productName: string;
    status: string;
    grandTotal: number;
    createdAt: string;
  }[];
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      const data = await res.json();

      if (data.success) {
        setCustomer(data.data);
      } else {
        toast.error("Customer not found");
        router.push("/customers");
      }
    } catch {
      toast.error("Failed to load customer");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <TableSkeleton rows={3} />
      </div>
    );
  }

  if (!customer) return null;

  const totalValue = customer.estimates.reduce(
    (sum, est) => sum + est.grandTotal,
    0
  );

  return (
    <div>
      {/* Back Button + Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/customers")}
          className="flex items-center gap-1.5 text-sm text-warm-500 hover:text-navy font-inter 
            transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </button>

        <PageHeader
          title={customer.name}
          description={`Customer since ${formatDate(customer.createdAt)}`}
          action={
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-warm-200
                  text-navy font-inter text-sm font-medium hover:bg-warm-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/estimates/new?customer=${customer.id}`)}
                className="btn-gold flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                New Estimate
              </motion.button>
            </div>
          }
        />
      </div>

      {/* Customer Info Card + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-5 lg:col-span-2"
        >
          <h3 className="font-playfair text-lg font-semibold text-navy mb-4">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-warm-400 font-inter">Phone</p>
                <p className="text-sm font-medium text-navy font-inter">{customer.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-warm-400 font-inter">Email</p>
                <p className="text-sm font-medium text-navy font-inter">
                  {customer.email || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-warm-400 font-inter">Address</p>
                <p className="text-sm font-medium text-navy font-inter">
                  {customer.address || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-warm-400 font-inter">Added On</p>
                <p className="text-sm font-medium text-navy font-inter">
                  {formatDate(customer.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="mt-4 pt-4 border-t border-warm-100">
              <div className="flex items-start gap-3">
                <StickyNote className="w-4 h-4 text-warm-400 mt-0.5" />
                <div>
                  <p className="text-xs text-warm-400 font-inter mb-1">Notes</p>
                  <p className="text-sm text-warm-500 font-inter">{customer.notes}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="card-premium p-5">
            <p className="text-xs text-warm-400 font-inter uppercase tracking-wider">
              Total Estimates
            </p>
            <p className="font-playfair text-3xl font-bold text-navy mt-1">
              {customer.estimateCount}
            </p>
          </div>
          <div className="card-premium p-5">
            <p className="text-xs text-warm-400 font-inter uppercase tracking-wider">
              Total Value
            </p>
            <p className="font-playfair text-2xl font-bold text-navy mt-1 tabular-nums">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Estimate History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-premium"
      >
        <div className="flex items-center justify-between p-5 border-b border-warm-100">
          <h3 className="font-playfair text-lg font-semibold text-navy">
            Estimate History
          </h3>
        </div>

        {customer.estimates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-warm-100">
                  <th className="text-left text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3">
                    Estimate #
                  </th>
                  <th className="text-left text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3">
                    Product
                  </th>
                  <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3">
                    Amount
                  </th>
                  <th className="text-center text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-inter font-medium text-warm-400 uppercase tracking-wider px-5 py-3">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {customer.estimates.map((est) => (
                  <tr
                    key={est.id}
                    onClick={() => router.push(`/estimates/${est.id}`)}
                    className="border-b border-warm-50 hover:bg-warm-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-inter font-medium text-navy">
                        {est.estimateNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-inter text-warm-500">
                        {est.productName}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-inter font-medium text-navy tabular-nums">
                        {formatCurrency(est.grandTotal)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <EstimateStatusBadge status={est.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm text-warm-400 font-inter">
                        {formatDate(est.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No estimates yet"
            description={`Create the first estimate for ${customer.name}`}
            action={
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/estimates/new?customer=${customer.id}`)}
                className="btn-gold flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Estimate
              </motion.button>
            }
          />
        )}
      </motion.div>

      {/* Edit Customer Dialog */}
      <CustomerForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={fetchCustomer}
        editData={customer}
      />
    </div>
  );
}