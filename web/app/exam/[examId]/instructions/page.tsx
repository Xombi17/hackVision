"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Camera, Mic, AlertCircle, Shield, ChevronRight } from "lucide-react";
import Webcam from "react-webcam";
import { motion } from "framer-motion";

export default function ExamInstructionsPage() {
    const router = useRouter();
    const params = useParams();
    const examId = params.examId;

    const [cameraActive, setCameraActive] = useState(false);
    const [agreed, setAgreed] = useState(false);

    // Simulate Hardware Check
    useEffect(() => {
        // In a real app, we'd check permissions specifically
        setTimeout(() => setCameraActive(true), 1500);
    }, []);

    const handleStart = () => {
        router.push(`/exam/${examId}`);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8"
            >

                {/* LEFT: Instructions */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                            Pre-Exam Checks
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">
                            Please verify your environment before starting. The session will be monitored by AI.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Proctoring Active</h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    Your webcam, microphone, and screen activity will be monitored. Looking away or switching tabs will be flagged.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-4">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Strict Rules</h3>
                                <ul className="text-sm text-slate-400 mt-1 space-y-1 list-disc list-inside">
                                    <li>No mobile phones or external devices.</li>
                                    <li>Maintain eye contact with the screen.</li>
                                    <li>Do not leave the fullscreen window.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${agreed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 group-hover:border-indigo-500'}`}>
                                {agreed && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                            <span className="text-slate-300 group-hover:text-white transition-colors">I agree to the Terms & Conditions and Proctoring Rules.</span>
                        </label>
                    </div>
                </div>

                {/* RIGHT: Hardware Check */}
                <Card className="bg-slate-900 border-slate-800 overflow-hidden flex flex-col">
                    <CardContent className="p-0 flex-1 relative bg-black flex items-center justify-center">
                        <Webcam
                            audio={false}
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                            mirrored
                        />

                        {/* Overlay Elements */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-64 h-64 border-2 border-dashed border-white/20 rounded-full" />
                        </div>

                        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                <Camera className={`w-4 h-4 ${cameraActive ? 'text-green-400' : 'text-slate-400'}`} />
                                <span className="text-xs font-mono text-white/90">Camera: {cameraActive ? "Connected" : "Checking..."}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                <Mic className="w-4 h-4 text-green-400" />
                                <span className="text-xs font-mono text-white/90">Mic: Active</span>
                            </div>
                        </div>
                    </CardContent>
                    <div className="p-6 border-t border-slate-800 bg-slate-900">
                        <Button
                            onClick={handleStart}
                            disabled={!agreed}
                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20"
                        >
                            Start Assessment <ChevronRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                </Card>

            </motion.div>
        </div>
    );
}
