"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/formatters";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data);
        }
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Logged out successfully");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-16 bg-surface border-b border-warm-200 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: Date */}
      <div className="flex items-center gap-2 text-warm-500">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-inter">{formatDate(new Date())}</span>
      </div>

      {/* Right: User Menu */}
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-warm-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 
            flex items-center justify-center text-white font-inter font-semibold text-sm">
            {user?.name?.charAt(0) || "A"}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-navy font-inter">{user?.name || "Admin"}</p>
            <p className="text-xs text-warm-400 font-inter">{user?.role || "ADMIN"}</p>
          </div>
        </motion.button>

        {/* Dropdown */}
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-56 bg-surface border border-warm-200 
                rounded-xl shadow-warm-lg py-2 z-50"
            >
              {/* User Info */}
              <div className="px-4 py-2 border-b border-warm-100">
                <p className="text-sm font-medium text-navy font-inter">{user?.name}</p>
                <p className="text-xs text-warm-400 font-inter">{user?.email}</p>
              </div>

              {/* Profile Link */}
              <button
                onClick={() => {
                  setShowDropdown(false);
                  router.push("/settings");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-navy 
                  hover:bg-warm-50 transition-colors font-inter"
              >
                <User className="w-4 h-4 text-warm-400" />
                Settings
              </button>

              {/* Logout */}
              <button
                onClick={() => {
                  setShowDropdown(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 
                  hover:bg-red-50 transition-colors font-inter"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </motion.div>
          </>
        )}
      </div>
    </header>
  );
}