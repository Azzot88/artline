
import { useState, useEffect, useCallback } from "react"
import { AIModel } from "@/polymet/data/types"
import { apiService } from "@/polymet/data/api-service"
import { toast } from "sonner"

export function useModels() {
    const [models, setModels] = useState<AIModel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchModels = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await apiService.listModels()
            setModels(response.models)
            setError(null)
        } catch (e) {
            console.error("Failed to fetch models", e)
            setError(e as Error)
            toast.error("Failed to load models")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchModels()
    }, [fetchModels])

    return {
        models,
        isLoading,
        error,
        mutate: fetchModels
    }
}

export function useModel(modelId: string | undefined) {
    const [model, setModel] = useState<AIModel | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchModel = useCallback(async () => {
        if (!modelId) return

        try {
            setIsLoading(true)
            const response = await apiService.getModel(modelId)
            // response might be the model itself or { model: ... } depending on API type. 
            // Looking at api-types.ts via api-service:
            // return api.get<GetModelResponse>(`/models/${modelId}`)
            // We need to check GetModelResponse type.
            // Let's assume it returns AIModel directly or { model: AIModel }
            // Actually, usually detail endpoints return the resource. 
            // But list returns { models: [] }.
            // I'll assume GetModelResponse is AIModel for now, or check response structure.
            // Safe bet: check if response has 'id' directly.

            // Wait, looking at api-service.ts: return api.get<GetModelResponse>(`/models/${modelId}`)
            // If I look at admin.py -> get_model -> returns dict/AIModelRead.
            // So it returns the model object directly.

            setModel(response as any as AIModel)
            setError(null)
        } catch (e) {
            console.error(`Failed to fetch model ${modelId}`, e)
            setError(e as Error)
            setModel(null)
        } finally {
            setIsLoading(false)
        }
    }, [modelId])

    useEffect(() => {
        if (modelId) {
            fetchModel()
        }
    }, [modelId, fetchModel])

    return {
        model,
        isLoading,
        error,
        mutate: fetchModel
    }
}

export function useAdminModel(modelId: string | undefined) {
    const [model, setModel] = useState<AIModel | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchModel = useCallback(async () => {
        if (!modelId) return

        try {
            setIsLoading(true)
            const response = await apiService.getAdminModel(modelId)
            setModel(response as any as AIModel)
            setError(null)
        } catch (e) {
            console.error(`Failed to fetch admin model ${modelId}`, e)
            setError(e as Error)
            setModel(null)
        } finally {
            setIsLoading(false)
        }
    }, [modelId])

    useEffect(() => {
        if (modelId) {
            fetchModel()
        }
    }, [modelId, fetchModel])

    return {
        model,
        isLoading,
        error,
        mutate: fetchModel
    }
}
