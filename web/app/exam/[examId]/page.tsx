"use client";

import { ExamInterface } from '@/components/exam/ExamInterface';
import { useParams } from 'next/navigation';

export default function ExamPage() {
    const params = useParams();
    const examId = params.examId as string;

    if (!examId) return <div>Invalid Exam ID</div>;

    return <ExamInterface examId={examId} />;
}
