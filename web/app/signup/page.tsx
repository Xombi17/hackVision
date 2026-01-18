"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log("Attempting signup with:", { email, fullName });

        try {
            // Use 127.0.0.1 to avoid potential localhost resolution issues on Windows
            const res = await fetch("http://127.0.0.1:8000/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, full_name: fullName }),
            });

            const data = await res.json();
            console.log("Signup response:", data);

            if (!res.ok || data.error) {
                throw new Error(data.error || `Server error: ${res.status}`);
            }

            // Auto-login (save to localStorage)
            localStorage.setItem("user", JSON.stringify(data));

            toast.success("Account created! Redirecting to setup...");
            router.push("/onboarding");
        } catch (error) {
            console.error("Signup error details:", error);
            const msg = error instanceof Error ? error.message : "Signup failed";
            toast.error(msg);
            // Fallback alert if toast misses
            // alert(`Signup Failed: ${msg}`); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                        <UserPlus className="w-6 h-6 text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Create Account</h1>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            className="bg-slate-950/50 border-slate-800 text-white"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="student@university.edu"
                            className="bg-slate-950/50 border-slate-800 text-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="bg-slate-950/50 border-slate-800 text-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 mt-4" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : "Sign Up"}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Log in</Link>
                </div>
            </motion.div>
        </div>
    );
}
