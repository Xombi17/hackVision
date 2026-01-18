"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, ChevronRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentDashboard() {
    const router = useRouter();
    const [exams, setExams] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            router.push("/login");
            return;
        }
        setUser(JSON.parse(storedUser));

        // Fetch Exams
        const fetchExams = async () => {
            try {
                const res = await fetch("http://localhost:8000/exams");
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();

                // Map Backend Data to Frontend Model
                const mappedExams = data.map((ex: any) => ({
                    id: ex.id,
                    title: ex.title,
                    subject: ex.category || "General",
                    duration: `${ex.duration_minutes} min`,
                    deadline: "Available Now", // Mock deadline
                    status: "active" // Mock status
                }));
                setExams(mappedExams);
            } catch (error) {
                console.error("Error fetching exams:", error);
            }
        };

        fetchExams();
    }, [router]);

    if (!user) return null; // Prevent flash of content

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 font-sans p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Student Dashboard</h1>
                        <p className="text-slate-400 mt-2">Welcome back, {user.full_name}. You have {exams.length} active assessments.</p>
                    </div>
                    <div className="hidden md:block">
                        <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800">
                            View Academic Profile
                        </Button>
                    </div>
                </div>

                {/* Active Exams */}
                <section className="space-y-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Active Assessments
                    </h2>

                    {exams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {exams.filter(e => e.status === 'active').map((exam, i) => (
                                <motion.div
                                    key={exam.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <Card className="bg-slate-900 border-slate-700 overflow-hidden hover:border-blue-500/50 transition-colors group">
                                        <CardHeader className="bg-gradient-to-r from-blue-900/20 to-transparent border-b border-white/5 pb-4">
                                            <Badge className="w-fit bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20 mb-2">
                                                {exam.subject}
                                            </Badge>
                                            <CardTitle className="text-xl text-white group-hover:text-blue-200 transition-colors">{exam.title}</CardTitle>
                                            <CardDescription className="text-slate-400 flex items-center gap-2 mt-1">
                                                <Clock className="w-3 h-3" /> {exam.duration}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="text-sm text-slate-500">
                                                    <p className="mb-1 uppercase text-xs tracking-wider font-semibold">Deadline</p>
                                                    <span className="text-white">{exam.deadline}</span>
                                                </div>
                                            </div>
                                            <Link href={`/exam/${exam.id}/instructions`}>
                                                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-900/20">
                                                    Start Assessment <ChevronRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-xl border-dashed">
                            <p className="text-slate-500 mb-4">No active assessments scheduled.</p>
                            <Button variant="outline" className="border-slate-700 text-slate-300">
                                Refresh Status
                            </Button>
                        </div>
                    )}
                </section>

                {/* Past Results */}
                <section className="space-y-6">
                    <h2 className="text-xl font-semibold text-white">Recent Results</h2>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                        {exams.filter(e => e.status === 'completed').length > 0 ? (
                            exams.filter(e => e.status === 'completed').map((exam) => (
                                <div key={exam.id} className="p-6 border-b border-slate-800 last:border-0 hover:bg-white/5 transition-colors flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-white">{exam.title}</h4>
                                        <p className="text-sm text-slate-400">{exam.subject} • Completed {exam.date}</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 uppercase font-semibold">Score</p>
                                            <p className="text-xl font-bold text-green-400">{exam.score}%</p>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-slate-500 uppercase font-semibold">Integrity</p>
                                            <div className="flex items-center gap-1 text-green-400 font-medium">
                                                <ShieldAlert className="w-4 h-4" />
                                                High
                                            </div>
                                        </div>
                                        <Link href={`/results/${exam.id}`}>
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-500">
                                No past results found.
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
}
