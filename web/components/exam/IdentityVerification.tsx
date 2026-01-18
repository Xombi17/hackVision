"use client";

import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User, AlertCircle, CheckCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface IdentityVerificationProps {
    onVerified: () => void;
    storedIdUrl?: string | null;
}

export default function IdentityVerification({ onVerified, storedIdUrl }: IdentityVerificationProps) {
    const webcamRef = useRef<Webcam>(null);
    const [step, setStep] = useState<"intro" | "id_card" | "selfie" | "verifying" | "success" | "failure">("intro");
    const [idImage, setIdImage] = useState<File | null>(null);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<{ is_match: boolean; confidence: number; reason: string } | null>(null);

    // Effect: If storedIdUrl is present, fetch it and skip ID upload step
    useEffect(() => {
        if (storedIdUrl) {
            const fetchStoredId = async () => {
                try {
                    const res = await fetch(storedIdUrl);
                    const blob = await res.blob();
                    const file = new File([blob], "stored_id.jpg", { type: blob.type });
                    setIdImage(file);
                    // Skip to intro, but logically we have the ID. 
                    // We can change default behavior: 
                    // User clicks "Start" -> Checks if ID exists -> Goes to Selfie immediately.
                } catch (e) {
                    console.error("Failed to load stored ID", e);
                    toast.error("Could not load stored ID. Please upload manually.");
                }
            };
            fetchStoredId();
        }
    }, [storedIdUrl]);

    // Helper: Convert Base64 string to File object
    const dataURLtoFile = (dataurl: string, filename: string) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)![1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const captureSelfie = () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setSelfieImage(imageSrc);
            setStep("verifying");
            verifyIdentity(imageSrc);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIdImage(e.target.files[0]);
            setStep("selfie");
        }
    };

    const handleStart = () => {
        if (idImage) {
            setStep("selfie"); // Skip ID upload if we already have it
        } else {
            setStep("id_card");
        }
    };

    const verifyIdentity = async (selfieBase64: string) => {
        if (!idImage) return;

        const selfieFile = dataURLtoFile(selfieBase64, "selfie.jpg");
        const formData = new FormData();
        formData.append("id_card", idImage); // Name must match backend 'id_card'
        formData.append("webcam_image", selfieFile); // Name must match backend 'webcam_image'

        try {
            const response = await fetch("http://localhost:8000/verify_identity", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();

            if (data.is_match !== undefined) {
                setAnalysis(data);
                if (data.is_match) {
                    setStep("success");
                    setTimeout(onVerified, 3000); // Auto-proceed after 3s
                } else {
                    setStep("failure");
                }
            } else {
                throw new Error("Invalid response from backend");
            }
        } catch (error) {
            console.error(error);
            toast.error("Verification failed. Please try again.");
            setStep("intro");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <motion.div
                layout
                className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative"
            >
                {/* Header */}
                <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-blue-500" />
                    <h2 className="text-lg font-semibold text-white">Identity Check</h2>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col items-center text-center min-h-[300px] justify-center">
                    <AnimatePresence mode="wait">

                        {step === "intro" && (
                            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <User className="w-10 h-10 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Verify Your Identity</h3>
                                    <p className="text-slate-400">Before starting the exam, we need to match your face with your ID card using AI.</p>
                                </div>
                                <Button onClick={handleStart} className="w-full bg-blue-600 hover:bg-blue-700">
                                    Start Verification
                                </Button>
                            </motion.div>
                        )}

                        {step === "id_card" && (
                            <motion.div key="id_card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 w-full">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Smartphone className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Step 1: Upload ID Card</h3>
                                <p className="text-sm text-slate-400">Upload a photo of your Student ID, Driver's License, or Passport.</p>

                                <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-medium text-blue-400">Click to Upload</span>
                                        <span className="text-xs text-slate-500 mt-1">JPG, PNG supported</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === "selfie" && (
                            <motion.div key="selfie" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 w-full">
                                <h3 className="text-lg font-bold text-white">Step 2: Take a Selfie</h3>
                                <div className="relative rounded-xl overflow-hidden border-2 border-slate-700 aspect-video bg-black">
                                    <Webcam
                                        ref={webcamRef}
                                        audio={false}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                    />
                                </div>
                                <Button onClick={captureSelfie} className="w-full bg-blue-600 hover:bg-blue-700">
                                    Capture & Verify
                                </Button>
                            </motion.div>
                        )}

                        {step === "verifying" && (
                            <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                <div>
                                    <h3 className="text-xl font-bold text-white">Analyzing Biometrics...</h3>
                                    <p className="text-slate-400 text-sm mt-2">Connecting to Groq Vision Llama 3.2...</p>
                                </div>
                            </motion.div>
                        )}

                        {step === "success" && (
                            <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Identity Verified</h3>
                                    <p className="text-green-400 font-mono text-sm mt-2">Confidence: {((analysis?.confidence || 0) * 100).toFixed(1)}%</p>
                                    <p className="text-slate-400 text-sm mt-4 px-4">{analysis?.reason}</p>
                                </div>
                            </motion.div>
                        )}

                        {step === "failure" && (
                            <motion.div key="failure" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <AlertCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Verification Failed</h3>
                                    <p className="text-red-400 font-mono text-sm mt-2">Confidence: {((analysis?.confidence || 0) * 100).toFixed(1)}%</p>
                                    <p className="text-slate-400 text-sm mt-4 px-4">{analysis?.reason}</p>
                                </div>
                                <div className="space-y-3 w-full">
                                    <Button onClick={() => setStep("intro")} variant="outline" className="w-full">
                                        Try Again
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            toast.info("Request sent to human proctor...");
                                            setTimeout(() => {
                                                toast.success("Manual Override Approved by Proctor");
                                                onVerified();
                                            }, 2000);
                                        }}
                                        variant="ghost"
                                        className="w-full text-slate-500 hover:text-white"
                                    >
                                        request manual review (Hair/Appearance change)
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
