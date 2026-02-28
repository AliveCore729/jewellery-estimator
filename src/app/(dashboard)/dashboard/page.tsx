"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gem, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

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
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="card-premium p-12 text-center max-w-lg w-full"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-6 shadow-gold-glow">
          <Gem className="w-8 h-8 text-white" />
        </div>

        <h1 className="font-playfair text-3xl font-bold text-navy mb-2">
          Welcome{user ? `, ${user.name}` : ""}! 🎉
        </h1>

        <p className="text-warm-500 font-inter mb-2">
          You&apos;re logged in to{" "}
          <span className="gold-shimmer font-semibold">Kanaka Jewellers</span>
        </p>

        <p className="text-warm-400 font-inter text-sm mb-8">{user?.email}</p>

        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 mb-8">
          <p className="text-emerald-700 font-inter text-sm font-medium">
            ✅ Auth system is working perfectly!
          </p>
          <p className="text-emerald-600 font-inter text-xs mt-1">
            Login, JWT cookies, route protection — all good.
          </p>
        </div>

        <p className="text-warm-400 font-inter text-sm mb-6">
          🏗️ Full dashboard with sidebar coming in the next batch...
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-warm-200
            text-navy font-inter font-medium hover:bg-warm-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </motion.button>
      </motion.div>
    </div>
  );
}