"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function ThreatSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
    const laserTop = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    return (
        <section ref={containerRef} className="relative h-[80vh] w-full bg-red-950 overflow-hidden flex flex-col justify-center">

            {/* Background Collage */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-multiply"
                style={{ backgroundImage: "url('/assets/threat-bg.png')" }}
            />

            {/* Red Overlay/Tint */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-red-900/20 to-[#020617] z-10" />

            {/* Marquee Container */}
            <div className="relative z-20 w-full rotate-[-5deg] scale-110">
                <motion.div style={{ x }} className="whitespace-nowrap flex gap-8">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <span key={i} className="text-8xl md:text-9xl font-black text-transparent stroke-text-red uppercase opacity-80">
                            EXAM LEAK DETECTED // PROXY DETECTED //
                        </span>
                    ))}
                </motion.div>
            </div>

            {/* Laser Scan Line */}
            <motion.div
                style={{ top: laserTop }}
                className="absolute left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] z-30 flex items-center"
            >
                <div className="absolute right-10 -top-6 bg-red-500 text-black font-mono text-xs px-2 py-0.5 font-bold">
                    SCANNING THREATS
                </div>
            </motion.div>

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none z-40 bg-radial-gradient-vignette" />

        </section>
    );
}
