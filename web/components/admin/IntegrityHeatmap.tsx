'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useEffect, useState } from 'react'

interface StudentStatus {
    id: number;
    status: number; // 0 = Green, 1 = Yellow, 2 = Red
    name: string;
}

export function IntegrityHeatmap() {
    const [students, setStudents] = useState<StudentStatus[]>([])

    useEffect(() => {
        // Mock data: 100 students (10x10 grid) generated client-side
        const data = Array.from({ length: 100 }).map((_, i) => ({
            id: i,
            status: Math.random() > 0.9 ? 2 : Math.random() > 0.8 ? 1 : 0,
            name: `Student ${i + 1}`
        }))
        setStudents(data)
    }, [])

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>Real-Time Integrity Heatmap (100 Active Candidates)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-10 gap-2">
                    <TooltipProvider>
                        {students.map((s) => (
                            <Tooltip key={s.id}>
                                <TooltipTrigger>
                                    <div
                                        className={`h-8 w-8 rounded-md transition-all cursor-pointer hover:scale-110 ${s.status === 0 ? 'bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/40' :
                                            s.status === 1 ? 'bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/40 animate-pulse' :
                                                'bg-red-500/20 border border-red-500/40 hover:bg-red-500/40 animate-bounce'
                                            }`}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-bold">{s.name}</p>
                                    <p className="text-xs text-muted-foreground">{s.status === 0 ? 'Verified' : s.status === 1 ? 'Suspicious Gaze' : 'Multiple Violations'}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                </div>
                <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/40 rounded" /> Verified</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500/20 border border-amber-500/40 rounded" /> Warning</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500/20 border border-red-500/40 rounded" /> Critical</div>
                </div>
            </CardContent>
        </Card>
    )
}
