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
    const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set())

    const startPolling = useCallback(async (jobId: string) => {
        setPollingJobs(prev => new Set(prev).add(jobId))

        try {
            const finalJob = await pollJobStatus(jobId, {
                onSuccess: async (job) => {
                    toast.success(t('workbench.toasts.jobStarted'))
                    const generation = normalizeGeneration(job)
                    onSucceeded?.(generation)
                    setPollingJobs(prev => {
                        const next = new Set(prev)
                        next.delete(jobId)
                        return next
                    })
                },
                onError: async (job) => {
                    await refreshUser()
                    toast.error("Generation failed", {
                        description: job.error_message || "An error occurred during generation."
                    })
                    onFailed?.(job)
                    setPollingJobs(prev => {
                        const next = new Set(prev)
                        next.delete(jobId)
                        return next
                    })
                }
            })
            return finalJob
        } catch (error: any) {
            console.error("Polling error:", error)
            setPollingJobs(prev => {
                const next = new Set(prev)
                next.delete(jobId)
                return next
            })
        }
    }, [onSucceeded, onFailed, t, refreshUser])

    const isPolling = (jobId: string) => pollingJobs.has(jobId)

    return {
        startPolling,
        isPolling,
        anyPolling: pollingJobs.size > 0
    }
}
