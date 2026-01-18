'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { IntegrityHeatmap } from '@/components/admin/IntegrityHeatmap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, ShieldAlert, CheckCircle, Clock, Search } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDashboard() {
    const [analyzingIds, setAnalyzingIds] = useState<number[]>([])
    const [aiReport, setAiReport] = useState<{ verdict: string, risk_level: string, explanation: string } | null>(null)

    const handleAnalyze = async (studentId: number) => {
        setAnalyzingIds(prev => [...prev, studentId])
        try {
            // Mock alerts for the demo (in real app, fetch from Supabase)
            const mockAlerts = [
                { type: 'LOOKING_AWAY', timestamp: 1715420000, message: 'Head Left' },
                { type: 'LOOKING_AWAY', timestamp: 1715420050, message: 'Head Right' },
                { type: 'PHONE_DETECTED', timestamp: 1715420100, message: 'Phone visible' }
            ]

            const response = await fetch('http://localhost:8000/analyze_integrity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alerts: mockAlerts })
            })

            if (!response.ok) throw new Error("Analysis Failed")

            const data = await response.json()
            setAiReport(data)
            toast.success(`AI Verdict: ${data.verdict}`)

        } catch (error) {
            toast.error("Failed to run AI Analysis")
        } finally {
            setAnalyzingIds(prev => prev.filter(id => id !== studentId))
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117]">
            <Navbar />
            <main className="container px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Admin Oversight Console</h1>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <MetricCard title="Active Candidates" value="1,248" icon={<Users className="text-blue-500" />} trend="+12%" />
                    <MetricCard title="Integrity Score" value="98.2%" icon={<CheckCircle className="text-emerald-500" />} trend="+0.4%" />
                    <MetricCard title="Active Alerts" value="14" icon={<ShieldAlert className="text-red-500" />} trend="-2" />
                    <MetricCard title="Avg. Grade Time" value="1.2s" icon={<Clock className="text-purple-500" />} trend="-0.1s" />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <IntegrityHeatmap />

                    <div className="space-y-6">
                        {/* Live Feed */}
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Live Violation Feed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold">S{i * 4}</div>
                                                <div>
                                                    <div className="font-semibold text-sm">Student {i * 4}</div>
                                                    <div className="text-xs text-red-500 font-medium">Potential Violation Detected</div>
                                                </div>
                                                <div className="ml-auto text-xs text-muted-foreground">Now</div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-8 text-xs border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-400"
                                                onClick={() => handleAnalyze(i * 4)}
                                                disabled={analyzingIds.includes(i * 4)}
                                            >
                                                {analyzingIds.includes(i * 4) ? "Analyzing..." : "Run AI Analysis (Llama 8B)"}
                                                {!analyzingIds.includes(i * 4) && <Search className="w-3 h-3 ml-2" />}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Report Card */}
                        {aiReport && (
                            <Card className="col-span-1 animate-in fade-in slide-in-from-right-4 border-l-4 border-l-indigo-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex justify-between items-center">
                                        AI Integrity Verdict
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${aiReport.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {aiReport.risk_level} RISK
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-medium text-slate-100 mb-1">{aiReport.verdict}</p>
                                    <p className="text-sm text-slate-400 leading-relaxed">{aiReport.explanation}</p>
                                    <p className="text-xs text-slate-600 mt-4 text-right">Model: Llama 3 8B (Groq)</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

function MetricCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
    return (
        <Card>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold mt-1">{value}</h3>
                    <span className="text-xs text-emerald-500 font-medium">{trend} from last hour</span>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                    {icon}
                </div>
            </CardContent>
        </Card>
    )
}
