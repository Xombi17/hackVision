"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight } from "lucide-react";

export default function EvaluatorSection() {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = () => setIsResizing(true);
    const handleMouseUp = () => setIsResizing(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isResizing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const position = Math.min(Math.max((x / width) * 100, 0), 100);
        setSliderPosition(position);
    };

    // Touch support
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isResizing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const width = rect.width;
        const position = Math.min(Math.max((x / width) * 100, 0), 100);
        setSliderPosition(position);
    }

    useEffect(() => {
        window.addEventListener("mouseup", handleMouseUp);
        return () => window.removeEventListener("mouseup", handleMouseUp);
    }, []);

    return (
        <section className="py-24 px-6 bg-[#020617] text-white">
            <div className="max-w-7xl mx-auto text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Agentic Grading</h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                    Subjective answers require semantic understanding. Drag the slider to see how Aegis transforms messy handwriting into structured, graded feedback.
                </p>
            </div>

            <div
                ref={containerRef}
                className="relative w-full max-w-5xl mx-auto aspect-[3/4] md:aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl cursor-col-resize select-none"
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onTouchMove={handleTouchMove}
                onTouchStart={handleMouseDown}
            >
                {/* BEFORE IMAGE (Bottom Layer) */}
                <img
                    src="/assets/eval-before.png"
                    alt="Handwritten Answer"
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                />
                <div className="absolute top-4 left-4 bg-slate-900/80 px-3 py-1 rounded text-slate-300 font-mono text-xs">
                    ORIGINAL SUBMISSION
                </div>

                {/* AFTER IMAGE (Top Layer - Clipped) */}
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                    <img
                        src="/assets/eval-after.png"
                        alt="Graded Answer"
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                    />
                    <div className="absolute top-4 right-4 bg-green-900/80 px-3 py-1 rounded text-green-300 font-mono text-xs border border-green-500/50">
                        AI GRADED: A+ (98/100)
                    </div>
                </div>

                {/* SLIDER HANDLE */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-blue-500 z-30 flex items-center justify-center transform hover:scale-110 transition-transform"
                    style={{ left: `${sliderPosition}%` }}
                >
                    <div className="w-10 h-10 rounded-full bg-blue-600 border-4 border-[#020617] flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                        <ArrowLeftRight className="w-4 h-4 text-white" />
                    </div>
                </div>

            </div>
        </section>
    );
}
