"use client";

import { Gem } from "lucide-react";
import { motion } from "framer-motion";

interface LogoProps {
  collapsed?: boolean;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
}

export default function Logo({
  collapsed = false,
  variant = "light",
  size = "md",
}: LogoProps) {
  const iconSizes = { sm: "w-5 h-5", md: "w-6 h-6", lg: "w-8 h-8" };
  const boxSizes = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-12 h-12" };
  const textSizes = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };

  return (
    <div className="flex items-center gap-3">
      <motion.div
        whileHover={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
        className={`${boxSizes[size]} rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 
          flex items-center justify-center shadow-gold-glow flex-shrink-0`}
      >
        <Gem className={`${iconSizes[size]} text-white`} />
      </motion.div>

      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className={`font-playfair ${textSizes[size]} font-bold leading-tight`}>
            <span className={variant === "light" ? "gold-shimmer" : "text-gold"}>
              Kanaka
            </span>
            <span className={variant === "light" ? "text-white/90" : "text-navy"}>
              {" "}Jewellers
            </span>
          </h1>
        </motion.div>
      )}
    </div>
  );
}