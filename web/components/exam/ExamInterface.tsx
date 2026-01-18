'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Webcam from 'react-webcam'
import { useProctoring } from '@/hooks/useProctoring'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertCircle, Maximize2, Minimize2, ShieldAlert } from 'lucide-react'
import IdentityVerification from './IdentityVerification'

interface ExamInterfaceProps {
    examId: string;
}

export function ExamInterface({ examId }: ExamInterfaceProps) {
    const router = useRouter()

    // EXAM DATA
    const [examData, setExamData] = useState<any>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

    // STATE
    const [fullscreen, setFullscreen] = useState(false)
    const [answer, setAnswer] = useState('')
    const [gradingResult, setGradingResult] = useState<{ score: number, feedback: string, confidence_score: number } | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // VIOLATION LOCKOUT STATE
    const [isLocked, setIsLocked] = useState(false)
    const [lockoutReason, setLockoutReason] = useState<string | null>(null)

    // VERIFICATION STATE (Persisted)
    const [isVerified, setIsVerified] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem(`verified_${examId}`) === 'true'
        }
        return false
    })

    const [storedIdUrl, setStoredIdUrl] = useState<string | null>(null)

    // REFS
    const webcamRef = useRef<Webcam>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const internalVideoRef = useRef<HTMLVideoElement | null>(null)

    // PROCTORING HOOK
    const { isProctoring, startProctoring, stopProctoring, alerts } = useProctoring({
        videoRef: internalVideoRef,
        canvasRef: canvasRef
    })

    const handleUserMedia = () => {
        if (webcamRef.current?.video) {
            internalVideoRef.current = webcamRef.current.video
            startProctoring()
        }
    }

    // --- EFFECTS ---

    // Fetch Exam
    useEffect(() => {
        if (!examId) return;
        const fetchExam = async () => {
            try {
                const res = await fetch(`http://localhost:8000/exams/${examId}`);
                if (res.ok) {
                    const data = await res.json();
                    setExamData(data);
                }
            } catch (e) {
                console.error("Failed to load exam", e);
                toast.error("Failed to load exam data");
            }
        };
        fetchExam();
    }, [examId]);

    // Fetch Identity Image
    useEffect(() => {
        const fetchUserIdentity = async () => {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const user = JSON.parse(storedUser);
                try {
                    const res = await fetch(`http://localhost:8000/get_id_card/${user.id}`);
                    if (res.ok) {
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        setStoredIdUrl(url);
                    }
                } catch (e) {
                    console.error("Failed to load ID card", e);
                }
            }
        }
        fetchUserIdentity()
    }, [])

    // Audio Monitoring
    useEffect(() => {
        if (isVerified && !isSubmitting) {
            startAudioMonitoring()
        }
        return () => stopAudioMonitoring()
    }, [isVerified, isSubmitting])

    // Proctoring Alerts Handler (Lockout Logic)
    useEffect(() => {
        if (alerts.length > 0) {
            const latest = alerts[alerts.length - 1]
            // We only lockout on specific severe violations
            if (['PHONE_DETECTED', 'MULTIPLE_FACES', 'TAB_SWITCH'].includes(latest.type)) {
                setIsLocked(true)
                setLockoutReason(latest.message)
            } else {
                // Warning only for gaze
                if (Date.now() - latest.timestamp < 3000) {
                    toast.error(latest.message, {
                        duration: 3000,
                        icon: <AlertCircle className="w-5 h-5 text-red-500" />
                    })
                }
            }
        }
    }, [alerts])

    // --- HANDLERS ---

    const handleVerificationComplete = () => {
        setIsVerified(true)
        sessionStorage.setItem(`verified_${examId}`, 'true')
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setFullscreen(true)
        } else {
            document.exitFullscreen()
            setFullscreen(false)
        }
    }

    const handleResume = () => {
        setIsLocked(false)
        setLockoutReason(null)
    }

    const startAudioMonitoring = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder

            const chunks: Blob[] = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data)
            }

            // Every 15 seconds, send audio
            const interval = setInterval(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop()
                    setTimeout(() => mediaRecorder.start(), 100)
                }
            }, 15000)

            mediaRecorder.onstop = async () => {
                if (chunks.length > 0) {
                    const blob = new Blob(chunks, { type: 'audio/webm' })
                    chunks.length = 0
                    await analyzeAudio(blob)
                }
            }

            mediaRecorder.start()
            return () => clearInterval(interval)
        } catch (err) {
            console.error("Audio monitoring failed:", err)
        }
    }

    const stopAudioMonitoring = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())
    }

    const analyzeAudio = async (audioBlob: Blob) => {
        const formData = new FormData()
        formData.append("file", audioBlob, "recording.webm")
        formData.append("question", "General Exam Environment")

        try {
            const res = await fetch('http://localhost:8000/analyze_audio_file', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (data.analysis && data.analysis.is_violation) {
                toast.error(`AUDIO VIOLATION: ${data.analysis.reason}`, {
                    duration: 5000,
                    icon: <ShieldAlert className="w-6 h-6 text-red-600 animate-pulse" />
                })
            }
        } catch (e) {
            console.error("Audio upload failed", e)
        }
    }

    const handleGrade = async () => {
        setIsSubmitting(true)
        try {
            const currentQ = examData?.questions?.[currentQuestionIndex];
            if (!currentQ) return;

            const rubric = `Criteria: Correctness (50pts), Depth (30pts), Clarity (20pts)`

            const response = await fetch('http://localhost:8000/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: currentQ.question_text,
                    student_answer: answer,
                    rubric: rubric
                })
            })

            if (!response.ok) throw new Error('Grading failed')

            const data = await response.json()
            setGradingResult(data)

            localStorage.setItem('exam_result', JSON.stringify({
                score: data.score,
                feedback: data.feedback,
                confidence: data.confidence_score,
                passed: data.score >= 50
            }))

            toast.success("Answer Submitted & Graded!")

        } catch (error) {
            toast.error("Failed to connect to Grading Agent. Check backend.")
            console.error(error)
        } finally {
            setIsSubmitting(false)
            stopAudioMonitoring()
        }
    }

    // --- RENDER: LOCKOUT SCREEN ---
    if (isLocked) {
        return (
            <div className="fixed inset-0 z-50 bg-red-950/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-300">
                <div className="bg-red-900/50 p-6 rounded-full mb-6 ring-4 ring-red-500/50 animate-pulse">
                    <ShieldAlert className="w-24 h-24 text-red-500" />
                </div>
                <h1 className="text-5xl font-black text-white mb-4 tracking-tight">EXAM PAUSED</h1>
                <p className="text-2xl text-red-200 font-medium max-w-2xl mb-8">
                    Security Violation Detected:
                    <span className="block mt-2 font-bold text-white bg-red-500/20 py-2 rounded-lg border border-red-500/30">
                        {lockoutReason}
                    </span>
                </p>

                <div className="flex gap-4">
                    <Button
                        size="lg"
                        className="bg-white text-red-900 hover:bg-red-50 font-bold px-8 text-lg"
                        onClick={handleResume}
                    >
                        Return to Exam
                    </Button>
                </div>
                <p className="mt-8 text-red-400 text-sm font-mono">
                    Incident ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} • Recorded for Review
                </p>
            </div>
        )
    }

    if (!examData) return <div className="min-h-screen flex items-center justify-center text-white">Loading Exam...</div>;

    const currentQuestion = examData.questions[currentQuestionIndex];

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0f1117] overflow-hidden">
            {!isVerified && <IdentityVerification onVerified={handleVerificationComplete} storedIdUrl={storedIdUrl} />}

            {/* Sidebar */}
            <aside className="w-64 border-r bg-white dark:bg-slate-900 hidden md:flex flex-col p-4">
                <h2 className="font-bold text-lg mb-4">{examData.title}</h2>
                <div className="grid grid-cols-4 gap-2">
                    {examData.questions.map((_: any, i: number) => (
                        <Button
                            key={i}
                            variant="outline"
                            onClick={() => {
                                setCurrentQuestionIndex(i);
                                setAnswer("");
                                setGradingResult(null);
                            }}
                            className={`h-10 w-10 p-0 ${i === currentQuestionIndex ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}
                        >
                            {i + 1}
                        </Button>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative">
                {/* Header */}
                <header className="h-16 border-b flex items-center justify-between px-6 bg-white dark:bg-slate-900">
                    <div className="font-medium text-slate-500">{examData.category} - {examData.difficulty}</div>
                    <div className="flex items-center gap-4">
                        <div className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100">{examData.duration_minutes}:00</div>
                        <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                            {fullscreen ? <Minimize2 /> : <Maximize2 />}
                        </Button>
                    </div>
                </header>

                {/* Question Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <Card className="max-w-3xl mx-auto shadow-sm">
                        <CardContent className="p-8">
                            <h3 className="text-xl font-semibold mb-4">Question {currentQuestionIndex + 1}</h3>
                            <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
                                {currentQuestion.question_text}
                            </p>

                            <textarea
                                className="w-full h-64 p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                                placeholder="Type your answer here..."
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                            />

                            <div className="mt-6 flex justify-between items-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentQuestionIndex === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 min-w-[140px]"
                                    onClick={handleGrade}
                                    disabled={isSubmitting || !answer}
                                >
                                    {isSubmitting ? "Grading..." : "Submit & Grade"}
                                </Button>
                            </div>

                            {/* Grading Result */}
                            {gradingResult && (
                                <div className="mt-8 p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-indigo-500/20 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-lg text-indigo-400">AI Evaluation Report</h4>
                                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-mono font-bold text-xl">
                                            {gradingResult.score}/100
                                        </span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                                        {gradingResult.feedback}
                                    </p>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <span>Confidence: {(gradingResult.confidence_score * 100).toFixed(1)}%</span>
                                        <span className="h-1 w-1 rounded-full bg-slate-500" />
                                        <span>Model: Llama 3.3 70B (Groq)</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Floating Webcam (Proctoring) */}
                <div className="absolute bottom-6 right-6 w-56 h-40 bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-slate-800 ring-2 ring-indigo-500/20 group hover:scale-105 transition-transform origin-bottom-right z-50">
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        mirrored
                        onUserMedia={handleUserMedia}
                    />

                    {/* AI Vision HUD Overlay */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none transform scale-x-[-1]"
                    />

                    {/* Status Indicator */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 z-10">
                        <div className={`h-2 w-2 rounded-full ${isProctoring ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-mono text-white/80">
                            {isProctoring ? "LIVE" : "OFFLINE"}
                        </span>
                    </div>

                    {/* Violation Counter */}
                    {alerts.length > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-red-900/80 backdrop-blur-md p-1 text-center border-t border-red-500/30 z-10">
                            <p className="text-[10px] text-red-200 font-bold flex items-center justify-center gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                {alerts.length} FLAGS
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
