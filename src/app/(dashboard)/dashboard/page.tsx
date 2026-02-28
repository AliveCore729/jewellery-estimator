"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  Users,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import AnimatedCounter from "@/components/common/AnimatedCounter";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import EstimateStatusBadge from "@/components/estimates/EstimateStatusBadge";
import { DashboardSkeleton } from "@/components/common/LoadingSkeleton";
import { formatCurrency, formatDate, getGreeting } from "@/lib/utils/formatters";
import type { DashboardStats } from "@/lib/types";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const statCards = [
    {
      label: "Today's Estimates",
      value: stats?.estimatesToday || 0,
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "This Month",
      value: stats?.estimatesThisMonth || 0,
      icon: Calendar,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      label: "Total Customers",
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      label: "Gold 22K Rate",
      value: stats?.todaysGoldRate || 0,
      icon: TrendingUp,
      color: "from-gold-400 to-gold-600",
      bgColor: "bg-gold-50",
      textColor: "text-gold-700",
      prefix: "₹",
      suffix: "/g",
      formatIndian: true,
    },
  ];

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={`${getGreeting()} 👋`}
        description="Here's what's happening with your estimates today."
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

      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={staggerItem}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="card-premium p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-inter text-warm-500">{card.label}</span>
                <div className={`w-9 h-9 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.textColor}`} />
                </div>
              </div>
              <div className="font-playfair text-2xl font-bold text-navy">
                <AnimatedCounter
                  value={card.value}
                  prefix={card.prefix || ""}
                  suffix={card.suffix || ""}
                  formatIndian={card.formatIndian}
                  decimals={card.formatIndian ? 0 : 0}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent Estimates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-premium"
      >
        <div className="flex items-center justify-between p-5 border-b border-warm-100">
          <h2 className="font-playfair text-lg font-semibold text-navy">
            Recent Estimates
          </h2>
          <button
            onClick={() => router.push("/estimates")}
            className="text-sm text-gold hover:text-gold-600 font-inter font-medium 
              flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats?.recentEstimates && stats.recentEstimates.length > 0 ? (
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
                {stats.recentEstimates.map((estimate, index) => (
                  <motion.tr
                    key={estimate.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    onClick={() => router.push(`/estimates/${estimate.id}`)}
                    className="border-b border-warm-50 hover:bg-warm-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-inter font-medium text-navy">
                        {estimate.estimateNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-inter text-warm-500">
                        {estimate.customerName}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-inter text-warm-500">
                        {estimate.productName}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-inter font-medium text-navy tabular-nums">
                        {formatCurrency(estimate.grandTotal)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <EstimateStatusBadge status={estimate.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-inter text-warm-400">
                        {formatDate(estimate.createdAt)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No estimates yet"
            description="Create your first estimate to get started with Kanaka Jewellers."
            action={
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/estimates/new")}
                className="btn-gold flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Create First Estimate
              </motion.button>
            }
          />
        )}
      </motion.div>
    </div>
  );
}