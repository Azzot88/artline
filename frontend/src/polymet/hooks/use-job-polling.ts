import { useState, useCallback } from "react"
import { pollJobStatus } from "@/polymet/data/api-service"
import type { Job } from "@/polymet/data/api-types"
import { normalizeGeneration } from "@/polymet/data/transformers"
import { toast } from "sonner"
import { useLanguage } from "@/polymet/components/language-provider"
import { useAuth } from "@/polymet/components/auth-provider"
import type { Generation } from "@/polymet/data/types"

interface UseJobPollingProps {
    onSucceeded?: (generation: Generation) => void
    onFailed?: (job: Job) => void
}

export function useJobPolling({ onSucceeded, onFailed }: UseJobPollingProps = {}) {
    const { t } = useLanguage()
    const { refreshUser } = useAuth()
    // Track full generation objects, keyed by ID
    const [activeGenerations, setActiveGenerations] = useState<Map<string, Generation>>(new Map())

    // Add a temporary local generation to the list execution immediately
    const addOptimistic = useCallback((id: string, data: Partial<Generation>) => {
        const tempGen: Generation = {
            id: id,
            status: 'queued',
            created_at: new Date().toISOString(),
            credits_spent: 0,
            is_public: false,
            is_curated: false,
            likes: 0,
            views: 0,
            kind: data?.kind || 'image',
            prompt: data?.prompt || '',
            input_type: data?.input_type || 'text',
            format: data?.format || 'square',
            resolution: data?.resolution || '1080',
            width: data?.width || 1024,
            height: data?.height || 1024,
            model_name: data?.model_name || 'AI',
            ...data
        }

        setActiveGenerations(prev => {
            const next = new Map(prev)
            next.set(id, tempGen)
            return next
        })
    }, [])

    const removeGeneration = useCallback((id: string) => {
        setActiveGenerations(prev => {
            const next = new Map(prev)
            next.delete(id)
            return next
        })
    }, [])

    const markAsFailed = useCallback((id: string, error: string) => {
        // Remove immediately to avoid clutter, assuming Toast handles the notification
        removeGeneration(id)
    }, [removeGeneration])

    const startPolling = useCallback(async (jobId: string, initialData?: Partial<Generation>, previousTempId?: string) => {
        // If we have a temp ID, we want to atomically replace it to avoid flicker
        setActiveGenerations(prev => {
            const next = new Map(prev)
            if (previousTempId) {
                next.delete(previousTempId)
            }

            // Create proper generation object (initial)
            const tempGen: Generation = {
                id: jobId,
                status: 'queued',
                created_at: new Date().toISOString(),
                credits_spent: 0,
                is_public: false,
                is_curated: false,
                likes: 0,
                views: 0,
                kind: initialData?.kind || 'image',
                prompt: initialData?.prompt || '',
                input_type: initialData?.input_type || 'text',
                format: initialData?.format || 'square',
                resolution: initialData?.resolution || '1080',
                width: initialData?.width || 1024,
                height: initialData?.height || 1024,
                model_name: initialData?.model_name || 'AI',
                ...initialData
            }
            next.set(jobId, tempGen)
            return next
        })

        try {
            const finalJob = await pollJobStatus(jobId, {
                onSuccess: async (job) => {
                    toast.success(t('workbench.toasts.jobStarted'))
                    const generation = normalizeGeneration(job)

                    // Update the active generation with the final result immediately
                    // This ensures it transitions from spinner to image in the active list
                    setActiveGenerations(prev => {
                        const next = new Map(prev)
                        next.set(jobId, generation)
                        return next
                    })

                    // Schedule removal from active list to allow 'generations' list to catch up
                    // This prevents flicker/disappearance
                    setTimeout(() => {
                        setActiveGenerations(prev => {
                            const next = new Map(prev)
                            next.delete(jobId)
                            return next
                        })
                    }, 5000)

                    onSucceeded?.(generation)
                },
                onError: async (job) => {
                    await refreshUser()
                    toast.error("Generation failed", {
                        description: job.error_message || "An error occurred during generation."
                    })

                    setActiveGenerations(prev => {
                        const next = new Map(prev)
                        next.delete(jobId)
                        return next
                    })

                    onFailed?.(job)
                },
                onProgress: (job) => {
                    // Safe
                }
            })
            return finalJob
        } catch (error: any) {
            console.error("Polling error:", error)
            setActiveGenerations(prev => {
                const next = new Map(prev)
                next.delete(jobId)
                return next
            })
        }
    }, [onSucceeded, onFailed, t, refreshUser])

    const isPolling = (jobId: string) => activeGenerations.has(jobId)

    return {
        startPolling,
        addOptimistic,
        removeGeneration,
        markAsFailed,
        isPolling,
        anyPolling: activeGenerations.size > 0,
        activeGenerations: Array.from(activeGenerations.values())
    }
}
