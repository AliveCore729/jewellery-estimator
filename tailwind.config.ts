import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1A1A2E",
          50: "#F0F0F5",
          100: "#D8D8E5",
          200: "#B0B0CB",
          300: "#8888B1",
          400: "#606097",
          500: "#3D3D6B",
          600: "#2D2D52",
          700: "#232342",
          800: "#1A1A2E",
          900: "#10101E",
          950: "#080814",
        },
        gold: {
          DEFAULT: "#C9A96E",
          50: "#FBF7F0",
          100: "#F5ECD8",
          200: "#EDDCB8",
          300: "#E2C88F",
          400: "#D4AF37",
          500: "#C9A96E",
          600: "#B8944A",
          700: "#9A7B3C",
          800: "#7C632F",
          900: "#5E4B24",
          950: "#3F3218",
        },
        warm: {
          DEFAULT: "#FAFAF8",
          50: "#FAFAF8",
          100: "#F5F0EB",
          200: "#E8E0D8",
          300: "#D4C8BC",
          400: "#B8A898",
          500: "#9C8C7C",
        },
        surface: "#FFFFFF",
        jewel: {
          emerald: "#059669",
          ruby: "#DC2626",
          amber: "#D97706",
          sapphire: "#2563EB",
          amethyst: "#7C3AED",
        },
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", "serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        warm: "0 1px 3px 0 rgba(26, 26, 46, 0.06), 0 1px 2px -1px rgba(26, 26, 46, 0.06)",
        "warm-md": "0 4px 6px -1px rgba(26, 26, 46, 0.07), 0 2px 4px -2px rgba(26, 26, 46, 0.07)",
        "warm-lg": "0 10px 15px -3px rgba(26, 26, 46, 0.08), 0 4px 6px -4px rgba(26, 26, 46, 0.08)",
        "warm-xl": "0 20px 25px -5px rgba(26, 26, 46, 0.08), 0 8px 10px -6px rgba(26, 26, 46, 0.08)",
        "gold-glow": "0 0 20px rgba(201, 169, 110, 0.3)",
        "gold-glow-lg": "0 0 40px rgba(201, 169, 110, 0.4)",
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      animation: {
        "gold-shimmer": "gold-shimmer 3s ease infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
      keyframes: {
        "gold-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;