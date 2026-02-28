"use client";

import { motion } from "framer-motion";
import { LucideIcon, Inbox } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-warm-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-warm-400" />
      </div>
      <h3 className="font-playfair text-lg font-semibold text-navy mb-1">{title}</h3>
      <p className="text-warm-400 font-inter text-sm max-w-sm mb-6">{description}</p>
      {action}
    </motion.div>
  );
}