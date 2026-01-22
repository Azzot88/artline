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
                const mapped: SelectorModel[] = data.map(m => {
                    // Infer capabilities from inputs
                    const inputs = m.inputs || []
                    const caps: string[] = []

                    if (inputs.some((i: any) => i.name === 'prompt' || i.type === 'string')) caps.push('text')
                    if (inputs.some((i: any) => i.name === 'image' || i.name === 'init_image' || i.type === 'image')) caps.push('image')

                    // Allow simple override if backend sends capabilities directly later
                    // const capabilities = m.capabilities || caps

                    return {
                        id: m.id,
                        name: m.name,
                        description: `${m.provider} model`,
                        category: "both", // We'll filter by capability, not just category
                        capabilities: caps,
                        inputs: inputs
                    }
                })

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
