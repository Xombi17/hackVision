"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, CheckCircle, Loader2, Camera, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Image from "next/image";
import Webcam from "react-webcam";

export default function OnboardingPage() {
    const router = useRouter();

    // States
    const [step, setStep] = useState<1 | 2>(1); // 1: Webcam, 2: ID Upload
    const [faceImage, setFaceImage] = useState<string | null>(null);
    const [idFile, setIdFile] = useState<File | null>(null);
    const [idPreview, setIdPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Webcam Ref
    const webcamRef = useRef<Webcam>(null);

    // 1. Handle Face Capture
    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setFaceImage(imageSrc);
        }
    }, [webcamRef]);

    const retake = () => setFaceImage(null);

    // 2. Handle ID Selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIdFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setIdPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // 3. Helper: Convert DataURI to Blob
    const dataURItoBlob = (dataURI: string) => {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    };

    // 4. Final Submission
    const handleCompleteSetup = async () => {
        if (!faceImage || !idFile) return;
        setUploading(true);

        try {
            // Get User
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                toast.error("User not found. Please log in again.");
                router.push("/login");
                return;
            }
            const user = JSON.parse(storedUser);

            // Prepare Data
            const formData = new FormData();
            formData.append("user_id", user.id);

            // Append ID Card
            formData.append("id_card", idFile);

            // Append Face Capture (Convert Base64 to Blob)
            const faceBlob = dataURItoBlob(faceImage);
            formData.append("face_ref", faceBlob, "face_capture.jpg");

            // Send to Backend
            const res = await fetch("http://localhost:8000/register_identity", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("Identity profile setup complete!");
            router.push("/dashboard");

        } catch (error) {
            console.error(error);
            toast.error("Setup failed: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl"
            >
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Identity Registration</h1>
                    <p className="text-slate-400">
                        Step {step} of 2: {step === 1 ? "Register Face Reference" : "Upload Government ID"}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEFT PANEL: Face Registration */}
                    <Card className={`bg-slate-900 border-slate-800 transition-opacity ${step === 2 && 'opacity-50'}`}>
                        <CardContent className="p-6 flex flex-col items-center">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Camera className="w-4 h-4 text-blue-400" /> Face Capture
                            </h3>

                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-700">
                                {faceImage ? (
                                    <Image src={faceImage} alt="Captured Face" fill className="object-cover" />
                                ) : (
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        mirrored={true}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            <div className="mt-4 flex gap-3 w-full">
                                {faceImage ? (
                                    <Button onClick={retake} variant="outline" className="flex-1 bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
                                        <RefreshCw className="w-4 h-4 mr-2" /> Retake
                                    </Button>
                                ) : (
                                    <Button onClick={capture} className="flex-1 bg-blue-600 hover:bg-blue-500">
                                        <Camera className="w-4 h-4 mr-2" /> Capture
                                    </Button>
                                )}
                            </div>

                            {step === 1 && faceImage && (
                                <Button onClick={() => setStep(2)} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white">
                                    Next: Upload ID <CheckCircle className="ml-2 w-4 h-4" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* RIGHT PANEL: ID Upload */}
                    <Card className={`bg-slate-900 border-slate-800 transition-opacity ${step === 1 && 'opacity-50 pointer-events-none'}`}>
                        <CardContent className="p-6 flex flex-col items-center">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-purple-400" /> ID Document
                            </h3>

                            <div className="w-full aspect-video border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center relative overflow-hidden bg-slate-950/50 hover:bg-slate-950 transition-colors group">
                                {idPreview ? (
                                    <Image src={idPreview} alt="ID Preview" fill className="object-contain p-2" />
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                            <Upload className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p className="text-slate-400 text-sm">Upload ID Card</p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileSelect}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    disabled={step === 1}
                                />
                            </div>

                            <div className="mt-8 w-full">
                                <Button
                                    onClick={handleCompleteSetup}
                                    disabled={!faceImage || !idFile || uploading}
                                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg"
                                >
                                    {uploading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2 w-5 h-5" />}
                                    {uploading ? "Verifying..." : "Complete Registration"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </div>
    );
}
