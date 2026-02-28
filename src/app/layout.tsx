import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kanaka Jewellers — Estimation App",
  description:
    "Professional Jewellery Estimation & Marketplace Web Application for Kanaka Jewellers. Create beautiful estimates, generate PDFs, and share with customers.",
  keywords: ["jewellery", "estimation", "gold", "invoice", "Kanaka Jewellers"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid #E8E0D8",
              borderRadius: "0.625rem",
              boxShadow:
                "0 10px 15px -3px rgba(26, 26, 46, 0.08), 0 4px 6px -4px rgba(26, 26, 46, 0.08)",
              color: "#1A1A2E",
              fontFamily: "var(--font-inter)",
            },
            className: "font-inter",
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}