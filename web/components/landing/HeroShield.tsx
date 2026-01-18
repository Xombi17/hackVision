"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";

export default function HeroShield() {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth out the mouse movement
    const mouseX = useSpring(x, { stiffness: 50, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 20 });

    // Map mouse position to rotation values
    const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseXVal = e.clientX - rect.left;
        const mouseYVal = e.clientY - rect.top;

        const xPct = (mouseXVal / width) - 0.5;
        const yPct = (mouseYVal / height) - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <section
            className="h-screen w-full bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden perspective-container"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-radial-gradient-vignette opacity-80 z-0 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full z-0 pointer-events-none animate-pulse-slow" />

            {/* Text Layer (Behind Shield) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center pointer-events-none w-full">
                <h1 className="text-[12vw] font-black text-transparent stroke-text tracking-tighter opacity-30 select-none">
                    AEGIS
                </h1>
            </div>

            {/* 3D Shield Container */}
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d"
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative z-20 w-[400px] h-[500px] md:w-[500px] md:h-[600px]"
            >
                <Image
                    src="/assets/hero-shield.png"
                    alt="Aegis Shield"
                    fill
                    className="object-contain drop-shadow-[0_0_50px_rgba(59,130,246,0.5)] mix-blend-screen"
                    style={{
                        maskImage: "radial-gradient(circle at center, black 60%, transparent 95%)",
                        WebkitMaskImage: "radial-gradient(circle at center, black 60%, transparent 95%)"
                    }}
                    priority
                />

                {/* Glossy reflection effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-full blur-xl pointer-events-none" />
            </motion.div>

            {/* Status Text */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute bottom-20 z-30 flex flex-col items-center gap-2"
            >
                <div className="flex items-center gap-2 px-4 py-1 rounded-full border border-blue-500/30 bg-blue-950/30 backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-blue-200 text-sm font-mono tracking-widest">SYSTEM SECURE</span>
                </div>
                <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.5em] mt-2">Scroll to Initialize</p>
            </motion.div>

        </section>
    );
}
