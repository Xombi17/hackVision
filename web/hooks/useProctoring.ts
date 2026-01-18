'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

export type ProctoringAlert = {
    type: 'LOOKING_AWAY' | 'MULTIPLE_FACES' | 'NO_FACE' | 'PHONE_DETECTED' | 'TAB_SWITCH'
    timestamp: number
    message: string
}

export function useProctoring({
    videoRef,
    canvasRef
}: {
    videoRef: React.RefObject<HTMLVideoElement | null>
    canvasRef?: React.RefObject<HTMLCanvasElement | null>
}) {
    const [isProctoring, setIsProctoring] = useState(false)
    const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null)
    const [alerts, setAlerts] = useState<ProctoringAlert[]>([])
    const requestRef = useRef<number>(0)
    const lastProcessedTime = useRef<number>(-1)
    const suspiciousFrames = useRef<number>(0)

    // Object Detection Ref
    const objectDetectorRef = useRef<cocoSsd.ObjectDetection | null>(null)

    // Initialize Models
    useEffect(() => {
        const initModels = async () => {
            // 1. Load MediaPipe Face
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
            )
            const landmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: 'GPU'
                },
                outputFaceBlendshapes: true,
                runningMode: 'IMAGE', // Changed from VIDEO to reduce sync errors
                numFaces: 5 // Allow detection of up to 5 faces
            })
            setFaceLandmarker(landmarker)

            // 2. Load COCO-SSD
            await tf.ready()
            const model = await cocoSsd.load()
            objectDetectorRef.current = model
        }
        initModels()
    }, [])

    const addAlert = (type: ProctoringAlert['type'], message: string) => {
        setAlerts(prev => {
            const lastSameType = prev.filter(a => a.type === type).pop()
            // Throttle alerts: only add if last alert of same type was > 3s ago
            if (lastSameType && Date.now() - lastSameType.timestamp < 3000) return prev
            return [...prev, { type, timestamp: Date.now(), message }]
        })
    }

    const drawResults = (video: HTMLVideoElement, faceResults: any, objectPredictions: any[]) => {
        if (!canvasRef || !canvasRef.current) return
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw Object Detections (Phones)
        objectPredictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox
            const isSuspicious = ['cell phone', 'remote', 'book'].includes(prediction.class)

            ctx.strokeStyle = isSuspicious ? '#ef4444' : '#22c55e' // Red or Green
            ctx.lineWidth = 4
            ctx.strokeRect(x, y, width, height)

            ctx.fillStyle = isSuspicious ? '#ef4444' : '#22c55e'
            ctx.font = '18px Arial'
            ctx.fillText(`${prediction.class.toUpperCase()} ${Math.round(prediction.score * 100)}%`, x, y > 10 ? y - 5 : 10)
        })

        // Draw Face Mesh (Simple Points)
        if (faceResults.faceLandmarks) {
            faceResults.faceLandmarks.forEach((landmarks: any[]) => {
                ctx.fillStyle = '#60a5fa' // Blue
                for (const landmark of landmarks) {
                    ctx.beginPath()
                    ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 2, 0, 2 * Math.PI)
                    ctx.fill()
                }
            })
        }
    }

    const detectFrame = useCallback(async () => {
        if (!faceLandmarker || !videoRef.current || !isProctoring) {
            // Keep requesting frames until ready
            requestRef.current = requestAnimationFrame(detectFrame)
            return
        }

        const video = videoRef.current

        // CRITICAL FIX: Wait for video to be fully ready to avoid MediaPipe crash
        if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
            requestRef.current = requestAnimationFrame(detectFrame)
            return
        }

        if (video.currentTime !== lastProcessedTime.current) {
            const now = performance.now()
            lastProcessedTime.current = video.currentTime

            let objectPredictions: any[] = []
            let faceResults: any = {} // Default empty object

            // --- 1. Face Analysis (MediaPipe) ---
            try {
                // STABILIZATION FIX: Draw to offscreen canvas first
                // This completely decouples MediaPipe from the live video stream state
                const tempCanvas = document.createElement('canvas')
                tempCanvas.width = video.videoWidth
                tempCanvas.height = video.videoHeight
                const tempCtx = tempCanvas.getContext('2d')

                if (tempCtx && tempCanvas.width > 0 && tempCanvas.height > 0) {
                    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)

                    // Pass the static canvas image to MediaPipe (IMAGE mode)
                    faceResults = faceLandmarker.detect(tempCanvas)

                    // DEBUG: Log face count every frame
                    const faceCount = faceResults.faceLandmarks?.length || 0
                    console.log(`[PROCTORING] Faces: ${faceCount}`)

                    if (faceResults.faceLandmarks) {
                        if (faceResults.faceLandmarks.length === 0) {
                            addAlert('NO_FACE', 'No face detected. Please stay in frame.')
                        } else if (faceResults.faceLandmarks.length > 1) {
                            console.warn(`[PROCTORING] ⚠️ MULTIPLE FACES: ${faceResults.faceLandmarks.length}`)
                            addAlert('MULTIPLE_FACES', `Multiple faces detected! (${faceResults.faceLandmarks.length} people)`)
                        } else {
                            // Gaze Logic
                            const landmarks = faceResults.faceLandmarks[0]
                            const nose = landmarks[1]
                            const leftEar = landmarks[234]
                            const rightEar = landmarks[454]
                            const nosePos = nose.x - leftEar.x
                            const earDist = rightEar.x - leftEar.x

                            if (earDist !== 0) {
                                const ratio = nosePos / earDist
                                if (ratio < 0.35) {
                                    suspiciousFrames.current += 1
                                    if (suspiciousFrames.current > 30) {
                                        addAlert('LOOKING_AWAY', 'Please look at the screen (Head Left).')
                                        suspiciousFrames.current = 0
                                    }
                                } else if (ratio > 0.65) {
                                    suspiciousFrames.current += 1
                                    if (suspiciousFrames.current > 30) {
                                        addAlert('LOOKING_AWAY', 'Please look at the screen (Head Right).')
                                        suspiciousFrames.current = 0
                                    }
                                } else {
                                    suspiciousFrames.current = Math.max(0, suspiciousFrames.current - 1)
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn("MediaPipe Error (Skipping Frame):", err)
            }

            // --- 2. Object Detection (COCO-SSD) ---
            // Check 50% of frames
            if (objectDetectorRef.current && Math.random() < 0.5) {
                try {
                    const predictions = await objectDetectorRef.current.detect(video)
                    objectPredictions = predictions

                    // DEBUG: Log all detected objects
                    if (predictions.length > 0) {
                        console.log("[COCO-SSD]", predictions.map(p => `${p.class}(${Math.round(p.score * 100)}%)`).join(', '))
                    }

                    // Check for prohibited items (phones, books, etc.)
                    const prohibited = predictions.filter(p =>
                        (p.class === 'cell phone' || p.class === 'remote' || p.class === 'book') && p.score > 0.4
                    )

                    if (prohibited.length > 0) {
                        const detected = prohibited[0].class
                        addAlert('PHONE_DETECTED', `Prohibited Item Detected: ${detected.toUpperCase()}`)
                    }

                    // Check for multiple people in frame (body detection, not just face)
                    const people = predictions.filter(p => p.class === 'person' && p.score > 0.5)
                    if (people.length > 1) {
                        console.warn(`[COCO-SSD] ⚠️ MULTIPLE PEOPLE: ${people.length}`)
                        addAlert('MULTIPLE_FACES', `Multiple people detected in frame! (${people.length} people)`)
                    }
                } catch (e) {
                    console.error("Obj detection error", e)
                }
            }

            // DRAW AI VISION HUD
            if (canvasRef && canvasRef.current) {
                drawResults(video, faceResults, objectPredictions)
            }
        }

        // Loop
        requestRef.current = requestAnimationFrame(detectFrame)
    }, [faceLandmarker, isProctoring, videoRef, canvasRef])

    const startProctoring = () => {
        setIsProctoring(true)
        detectFrame()
    }

    const stopProctoring = () => {
        setIsProctoring(false)
        if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }

    // Tab Switching / Focus Loss
    useEffect(() => {
        if (!isProctoring) return

        const handleVisibilityChange = () => {
            if (document.hidden) {
                addAlert('TAB_SWITCH', 'Tab Switch Detected! (Focus Lost)')
            }
        }

        const handleWindowBlur = () => {
            addAlert('TAB_SWITCH', 'Window Focus Lost! Please stay on the exam.')
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('blur', handleWindowBlur)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('blur', handleWindowBlur)
        }
    }, [isProctoring])

    // Restart loop check
    useEffect(() => {
        if (isProctoring) {
            requestRef.current = requestAnimationFrame(detectFrame)
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [detectFrame, isProctoring])

    return { isProctoring, startProctoring, stopProctoring, alerts }
}

function startTimeMs(now: number) {
    return now
}
