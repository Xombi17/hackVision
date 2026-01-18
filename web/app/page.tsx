"use client";

import HeroSaas from "@/components/landing/HeroSaas";
import ThreatSection from "@/components/landing/ThreatSection";
import SentrySection from "@/components/landing/SentrySection";
import EvaluatorSection from "@/components/landing/EvaluatorSection";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] font-sans selection:bg-blue-500/30">

      {/* 1. HERO - Modern SaaS with Dashboard & Gradient Transition */}
      <HeroSaas />

      {/* 2. THREAT - Red Laser Marquee */}
      <ThreatSection />

      {/* 3. SENTRY - Sticky Video Feed */}
      <SentrySection />

      {/* 4. EVALUATOR - Before/After Comparison */}
      <EvaluatorSection />

      {/* FINAL CTA */}
      <section className="py-32 px-6 text-center relative overflow-hidden bg-[#020617] border-t border-slate-800">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />

        <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 relative z-10">
          Secure Your Integrity.
        </h2>
        <Link
          href="/dashboard"
          className="relative z-10 inline-flex items-center gap-2 px-10 py-5 bg-white text-slate-950 font-bold rounded-full hover:bg-blue-50 transition-all hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.3)]"
        >
          Deploy Aegis
          <ChevronRight className="w-5 h-5" />
        </Link>
      </section>

      <footer className="py-12 border-t border-white/5 text-center text-slate-600 text-sm bg-[#020617]">
        <p>© 2026 AegisExam AI. All rights reserved.</p>
      </footer>

    </main>
  );
}
