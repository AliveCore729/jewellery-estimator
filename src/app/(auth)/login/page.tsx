"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Gem, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Login failed");
        if (data.error?.includes("email") || data.error?.includes("password")) {
          setErrors({ password: data.error });
        }
        return;
      }

      toast.success(`Welcome back, ${data.data.name}!`);
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[60%] bg-navy relative overflow-hidden items-center justify-center"
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy to-navy-950" />

          {/* Gold Circle Decorations */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full border border-gold/10"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full border border-gold/5"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-gold/5"
          />

          {/* Gold Dots */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
              className="absolute w-1 h-1 rounded-full bg-gold"
              style={{
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-12">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 flex justify-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-gold-glow">
              <Gem className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Shop Name */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="font-playfair text-5xl xl:text-6xl font-bold mb-4"
          >
            <span className="gold-shimmer">Kanaka</span>
            <br />
            <span className="text-white/90">Jewellers</span>
          </motion.h1>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="w-24 h-0.5 gold-shimmer-bg mx-auto mb-6 rounded-full"
          />

          {/* Tagline */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-gold-200/70 text-lg font-inter tracking-wide"
          >
            Crafting Timeless Elegance
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-12 space-y-3"
          >
            {["Professional Estimates", "Instant PDF Generation", "Smart Calculations"].map(
              (feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.9 + index * 0.15 }}
                  className="flex items-center gap-3 text-white/50 text-sm font-inter"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                  {feature}
                </motion.div>
              )
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel — Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-warm-50"
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10 text-center">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-4 shadow-gold-glow">
              <Gem className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-playfair text-2xl font-bold">
              <span className="gold-shimmer">Kanaka</span>{" "}
              <span className="text-navy">Jewellers</span>
            </h1>
          </div>

          {/* Welcome Text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-playfair text-3xl font-bold text-navy mb-2">
              Welcome Back
            </h2>
            <p className="text-warm-500 font-inter mb-8">
              Sign in to manage your jewellery estimates
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5 font-inter">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="admin@kanakajewellers.com"
                className={`w-full px-4 py-3 rounded-lg border bg-white font-inter text-navy
                  placeholder:text-warm-400 transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold
                  ${errors.email ? "border-red-400 ring-2 ring-red-100" : "border-warm-200 hover:border-warm-300"}`}
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-500 font-inter"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5 font-inter">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white font-inter text-navy
                    placeholder:text-warm-400 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold
                    ${errors.password ? "border-red-400 ring-2 ring-red-100" : "border-warm-200 hover:border-warm-300"}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-navy transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-500 font-inter"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full btn-gold py-3.5 text-base font-semibold font-inter
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </motion.form>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center text-sm text-warm-400 font-inter"
          >
            Kanaka Jewellers Estimation System
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}