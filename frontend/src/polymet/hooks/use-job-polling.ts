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

    const startPolling = useCallback(async (jobId: string, initialData?: Partial<Generation>) => {
        // Create a temporary generation object
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

        setActiveGenerations(prev => {
            const next = new Map(prev)
            next.set(jobId, tempGen)
            return next
        })

        try {
            console.log(`[Polling] Starting polling for ${jobId}`)
            const finalJob = await pollJobStatus(jobId, {
                onSuccess: async (job) => {
                    console.log(`[Polling] Success for ${jobId}`, job)
                    toast.success(t('workbench.toasts.jobStarted'))
                    const generation = normalizeGeneration(job)
                    console.log(`[Polling] Normalized generation:`, generation)

                    // Update the active generation with the final result immediately
                    // This ensures it transitions from spinner to image in the active list
                    setActiveGenerations(prev => {
                        console.log(`[Polling] Updating active generation ${jobId} to succeeded`)
                        const next = new Map(prev)
                        next.set(jobId, generation)
                        return next
                    })

                    // Schedule removal from active list to allow 'generations' list to catch up
                    // This prevents flicker/disappearance
                    setTimeout(() => {
                        console.log(`[Polling] Removing ${jobId} from active list`)
                        setActiveGenerations(prev => {
                            const next = new Map(prev)
                            next.delete(jobId)
                            return next
                        })
                    }, 5000)

                    onSucceeded?.(generation)
                },
                onError: async (job) => {
                    console.log(`[Polling] Error for ${jobId}`, job)
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
                    console.log(`[Polling] Progress ${jobId}: ${job.status}`)
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
        isPolling,
        anyPolling: activeGenerations.size > 0,
        activeGenerations: Array.from(activeGenerations.values())
    }
}
