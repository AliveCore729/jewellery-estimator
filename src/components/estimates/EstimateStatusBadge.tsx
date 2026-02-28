"use client";

interface EstimateStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  DRAFT: {
    label: "Draft",
    classes: "bg-gray-100 text-gray-700 border-gray-200",
  },
  SENT: {
    label: "Sent",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ACCEPTED: {
    label: "Accepted",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "Rejected",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  EXPIRED: {
    label: "Expired",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  INVOICED: {
    label: "Invoiced",
    classes: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

export default function EstimateStatusBadge({
  status,
  size = "md",
}: EstimateStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT;
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-inter font-medium ${config.classes} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
}