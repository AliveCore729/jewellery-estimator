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
  CheckCircle,
} from "lucide-react";
import AnimatedCounter from "@/components/common/AnimatedCounter";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import EstimateStatusBadge from "@/components/estimates/EstimateStatusBadge";
import { DashboardSkeleton } from "@/components/common/LoadingSkeleton";
import { formatCurrency, formatDate, getGreeting } from "@/lib/utils/formatters";

interface DashboardData {
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
  recentEstimates: {
    id: string;
    estimateNumber: string;
    customerName: string;
    status: string;
    grandTotal: number;
    createdAt: string;
  }[];
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    userName: string;
    createdAt: string;
    details: any;
  }[];
}

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

function formatAction(action: string): string {
  const map: Record<string, string> = {
    create_estimate: "Created estimate",
    update_status: "Updated status",
    share_estimate: "Shared estimate",
    delete_estimate: "Deleted estimate",
    duplicate_estimate: "Duplicated estimate",
    create_customer: "Added customer",
    update_customer: "Updated customer",
    update_material_rate: "Updated rate",
    update_settings: "Updated settings",
  };
  return map[action] || action.replace(/_/g, " ");
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((resp) => {
        if (resp.success) {
          setData(resp.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const stats = data?.stats;

  const statCards = [
    {
      label: "Total Estimates",
      value: stats?.totalEstimates || 0,
      subLabel: stats?.estimatesThisMonth
        ? `+${stats.estimatesThisMonth} this month`
        : "No new this month",
      icon: FileText,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      change: stats?.estimateChange || 0,
    },
    {
      label: "Pending",
      value: stats?.pendingEstimates || 0,
      subLabel: "Draft + Sent",
      icon: Calendar,
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      label: "Total Customers",
      value: stats?.totalCustomers || 0,
      subLabel: stats?.customersThisMonth
        ? `+${stats.customersThisMonth} this month`
        : "No new this month",
      icon: Users,
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      label: "Accepted",
      value: stats?.acceptedThisMonth || 0,
      subLabel: "This month",
      icon: CheckCircle,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      change: stats?.acceptedChange || 0,
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
                {card.value}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-inter text-warm-400">{card.subLabel}</span>
                {card.change !== undefined && card.change !== 0 && (
                  <span
                    className={`text-xs font-inter font-medium ${
                      card.change > 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {card.change > 0 ? "↑" : "↓"} {Math.abs(card.change)}%
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Estimates — Left (2 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-2 card-premium"
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

          {data?.recentEstimates && data.recentEstimates.length > 0 ? (
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
                  {data.recentEstimates.map((estimate, index) => (
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
              description="Create your first estimate to get started."
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

        {/* Recent Activity — Right (1 col) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="xl:col-span-1 card-premium"
        >
          <div className="p-5 border-b border-warm-100">
            <h2 className="font-playfair text-lg font-semibold text-navy">
              Recent Activity
            </h2>
          </div>

          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="p-3">
              {data.recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-warm-50/50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-gold mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-inter text-navy truncate">
                      {formatAction(activity.action)}
                    </p>
                    <p className="text-xs font-inter text-warm-400 mt-0.5">
                      {activity.userName} • {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-warm-400 font-inter">No recent activity</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Revenue Card */}
      {stats && stats.revenueThisMonth > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card-premium p-6 mt-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter text-warm-400 mb-1">Accepted Revenue This Month</p>
              <p className="font-playfair text-3xl font-bold text-navy">
                {formatCurrency(stats.revenueThisMonth)}
              </p>
            </div>
            {stats.revenueChange !== 0 && (
              <div
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-inter font-medium ${
                  stats.revenueChange > 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <TrendingUp className={`w-4 h-4 ${stats.revenueChange < 0 ? "rotate-180" : ""}`} />
                {Math.abs(stats.revenueChange)}% vs last month
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}