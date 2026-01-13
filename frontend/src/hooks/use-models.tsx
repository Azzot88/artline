import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { AIModel as SelectorModel } from "@/polymet/components/model-selector"

// Backend Model Shape
interface BackendModel {
    id: string
    name: string
    provider: string
    cover_image?: string
    inputs: any[]
    defaults: any
}

export function useModels() {
    const [models, setModels] = useState<SelectorModel[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const data = await api.get<BackendModel[]>("/models")

                // Map Backend to Frontend Shape
                const mapped: SelectorModel[] = data.map(m => ({
                    id: m.id,
                    name: m.name,
                    description: `${m.provider} model`, // Description not in backend yet
                    category: "both" // Allow all for now, or infer from inputs
                }))

                setModels(mapped)
            } catch (err) {
                console.error("Failed to fetch models", err)
                setError("Failed to load models")
                // Fallback to empty or static if critical? 
                // For now, empty list.
            } finally {
                setLoading(false)
            }
        }

        fetchModels()
    }, [])

    return { models, loading, error }
}
