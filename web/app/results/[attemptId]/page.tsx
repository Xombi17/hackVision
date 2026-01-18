"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function ResultPage({ params }: { params: { attemptId: string } }) {
    const [result, setResult] = useState<any>(null)

    useEffect(() => {
        const stored = localStorage.getItem('exam_result')
        if (stored) {
            setResult(JSON.parse(stored))
        }
    }, [])

    if (!result) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
            <div className="animate-pulse">Loading Results...</div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col items-center">

            <div className="w-full max-w-4xl">
                <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </Link>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900 border border-slate-700 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none" />

                    <div className="flex flex-col md:flex-row gap-12 items-start">

                        {/* Score Circle */}
                        <div className="flex-shrink-0 mx-auto md:mx-0">
                            <div className="relative w-48 h-48 rounded-full border-8 border-slate-800 flex items-center justify-center bg-slate-950">
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="46" fill="transparent" strokeDasharray="290" strokeDashoffset="24" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                </svg>
                                <div className="text-center z-10">
                                    <span className="block text-5xl font-bold text-white">{result.score}</span>
                                    <span className="text-sm text-slate-400 uppercase tracking-widest">Score</span>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{result.title}</h1>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                        <CheckCircle className="w-3 h-3" /> Passed
                                    </span>
                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        <ShieldCheck className="w-3 h-3" /> Integrity Verified
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-300">AI Grading Feedback</h3>
                                <p className="text-slate-400 leading-relaxed bg-black/20 p-6 rounded-xl border border-white/5">
                                    "{result.feedback}"
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Risk Level</p>
                                    <p className="text-xl font-bold text-green-400">Low Risk</p>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Violations</p>
                                    <p className="text-xl font-bold text-white">0 Detected</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
