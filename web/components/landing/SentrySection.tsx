"use client";

import { motion } from "framer-motion";
import { ScanFace, Eye, Activity, ShieldCheck } from "lucide-react";

export default function SentrySection() {
    return (
        <section className="relative bg-[#020617] text-white py-24 px-6 md:px-12">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Left Column: Sticky Interface */}
                <div className="relative h-[80vh]">
                    <div className="sticky top-24 w-full aspect-square md:aspect-video lg:aspect-[4/3] bg-slate-900/50 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                        {/* Background Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

                        {/* Sentry Interface Image */}
                        <img
                            src="/assets/sentry-interface.png"
                            alt="Biometric Sentry"
                            className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90"
                        />

                        {/* Scanning Overlay Animation */}
                        <motion.div
                            animate={{ top: ["0%", "100%", "0%"] }}
                            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                            className="absolute left-0 right-0 h-[1px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)] z-20"
                        />

                        <div className="absolute top-4 left-4 bg-cyan-950/80 border border-cyan-500/50 px-3 py-1 rounded text-cyan-400 font-mono text-xs animate-pulse">
                            ● LIVENESS CHECK ACTIVE
                        </div>
                    </div>
                </div>

                {/* Right Column: Scrollable Content */}
                <div className="flex flex-col justify-center gap-24 py-12 lg:py-24">

                    {/* Feature 1 */}
                    <div className="space-y-4">
                        <div className="w-12 h-12 rounded-lg bg-cyan-950 flex items-center justify-center border border-cyan-500/30">
                            <ScanFace className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                            Deepfake Sentry
                        </h3>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Aegis analyzes <span className="text-white">micro-vascular blood flow (rPPG)</span> to distinguish real human skin from silicone masks or generative AI deepfakes. It operates invisibly, requiring no invasive actions from the candidate.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="space-y-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-950 flex items-center justify-center border border-blue-500/30">
                            <Eye className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                            Gaze Tracking
                        </h3>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Our 6-DoF gaze model tracks attention heatmaps in real-time. If a candidate repeatedly glances at a specific off-screen vector, the proctor is implicitly notified with a timestamped clip.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="space-y-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-950 flex items-center justify-center border border-purple-500/30">
                            <Activity className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                            Audio Context
                        </h3>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Simple decibel spikes generate false positives in other tools. Aegis uses semantic audio analysis to ignore dog barks or traffic while flagging whispering or text-to-speech cues.
                        </p>
                    </div>

                </div>

            </div>
        </section>
    );
}
