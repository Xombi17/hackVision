"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Menu } from "lucide-react";

export function Navbar() {
    const pathname = usePathname();
    const isDashboard = pathname.startsWith("/dashboard");

    if (isDashboard) return null; // Logic handled in dashboard layout usually

    return (
        <motion.nav
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-full py-3 px-6 shadow-2xl flex items-center justify-between"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2 group">
                <div className="relative">
                    <ShieldCheck className="w-6 h-6 text-blue-500 relative z-10" />
                    <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full animate-pulse-slow" />
                </div>
                <span className="font-bold text-white tracking-tight group-hover:text-blue-200 transition-colors">AegisExamAI</span>
            </Link>

            {/* Links (Desktop) */}
            <div className="hidden md:flex items-center gap-6">
                {["Technology", "Security", "Pricing"].map((item) => (
                    <Link key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        {item}
                    </Link>
                ))}
            </div>

            {/* Action */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                    Dashboard
                </Link>
                <Link
                    href="/login"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
                >
                    Sign In
                </Link>
            </div>
        </motion.nav>
    );
}
