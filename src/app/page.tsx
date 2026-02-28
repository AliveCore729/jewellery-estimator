"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if logged in, redirect accordingly
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
    </div>
  );
}