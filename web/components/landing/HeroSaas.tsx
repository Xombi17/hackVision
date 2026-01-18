"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, ShieldCheck, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function HeroSaas() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    // Hydration-safe state for random particles
    const [particles, setParticles] = useState<Array<{ x: number, y: number, duration: number, delay: number }>>([]);

    useEffect(() => {
        // Generate particles only on the client side to avoid hydration mismatch
        setParticles([...Array(15)].map(() => ({
            x: Math.random() * 100 - 50, // Percentage based deviation
            y: Math.random() * 100 - 50,
            duration: 10 + Math.random() * 10,
            delay: Math.random() * 5
        })));

        const handleMouseMove = (event: MouseEvent) => {
            // Normalize mouse position for subtler parallax effects
            setMousePosition({
                x: (event.clientX / window.innerWidth) - 0.5,
                y: (event.clientY / window.innerHeight) - 0.5
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <section className="relative min-h-[110vh] flex flex-col items-center justify-center text-center overflow-hidden px-4 md:px-0 bg-[#020617] perspective-container">

            {/* === DYNAMIC 3D BACKGROUND === */}

            {/* 1. Grid Floor with 3D Tilt */}
            <div
                className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"
                style={{
                    transform: `perspective(1000px) rotateX(60deg) translateY(-100px) translateZ(-200px)`,
                    transformOrigin: "top center"
                }}
            />

            {/* 2. Floating Animated Orbs ("Balls") */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                {/* Orb 1: Blue/Cyan (Top Left) */}
                <motion.div
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen"
                />
                {/* Orb 2: Purple/Indigo (Bottom Right) */}
                <motion.div
                    animate={{
                        x: [0, -100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.3, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen"
                />
                {/* Orb 3: Accent Cyan (Center) */}
                <motion.div
                    animate={{
                        x: [0, 50, -50, 0],
                        y: [0, 20, -20, 0],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 5 }}
                    className="absolute top-[30%] left-[30%] w-[300px] h-[300px] bg-cyan-500/20 rounded-full blur-[80px] mix-blend-screen"
                />
            </div>

            {/* 3. Interactive Floating Particles */}
            {particles.map((p, i) => (
                <motion.div
                    key={i}
                    className="absolute -z-5 w-1 h-1 md:w-2 md:h-2 bg-blue-400/50 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{
                        y: [0, -200],
                        opacity: [0, 0.8, 0],
                        scale: [0, 1, 0]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear"
                    }}
                    style={{
                        left: `${50 + p.x}%`,
                        top: `${50 + p.y}%`,
                    }}
                />
            ))}


            {/* === MAIN CONTENT === */}
            <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">

                {/* 3D Floating Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -50, rotateX: 90 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.8, ease: "backOut" }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-500/30 bg-blue-950/40 backdrop-blur-xl text-blue-200 text-sm font-semibold mb-12 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] transition-shadow cursor-default"
                    style={{
                        transform: `perspective(1000px) rotateX(${mousePosition.y * 20}deg) rotateY(${mousePosition.x * 20}deg)`
                    }}
                >
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span className="tracking-wide">AI-POWERED PROCTORING</span>
                    <div className="w-[1px] h-4 bg-blue-500/30 mx-2" />
                    <span className="text-blue-400 font-mono text-xs">V2.0 STABLE</span>
                </motion.div>

                {/* Massive Hero Typography */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
                    className="text-6xl md:text-8xl lg:text-[9rem] font-black tracking-tighter text-white mb-6 leading-[0.85] drop-shadow-2xl"
                    style={{
                        textShadow: "0 0 80px rgba(59,130,246,0.3)"
                    }}
                >
                    UNCOMPROMISED <br />
                    <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400">
                        INTEGRITY
                    </span>
                </motion.h1>

                {/* Subheadline with Glass Effect */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="relative mt-8 mb-12 max-w-3xl backdrop-blur-sm bg-black/30 p-6 rounded-2xl border border-white/5"
                >
                    <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light">
                        The first proctoring suite powered by <strong className="text-white font-semibold">Multimodal Agents</strong>.
                        We analyze context, behavior, and intent—eliminating false positives forever.
                    </p>
                </motion.div>

                {/* High-Performance CTAs */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center gap-6"
                >
                    <Link
                        href="/dashboard"
                        className="group relative h-16 px-10 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center gap-3 overflow-hidden shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_80px_rgba(37,99,235,0.6)] transition-all hover:scale-105"
                    >
                        <span className="relative z-10">Start Deployment</span>
                        <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />

                        {/* Button Internal Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>

                    <Link
                        href="#demo"
                        className="group h-16 px-10 rounded-full border border-slate-700 bg-slate-900/50 text-slate-300 font-medium text-lg flex items-center gap-3 hover:bg-slate-800 transition-all hover:border-slate-500"
                    >
                        <PlayCircle className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        Watch 2-Min Demo
                    </Link>
                </motion.div>

            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-[#020617] pointer-events-none" />

        </section>
    );
}
