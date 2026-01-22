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
                    // 1. Resolve inputs from various possible locations
                    let inputs = m.inputs || []

                    // Fallback: Check normalized_caps_json
                    if ((!inputs || inputs.length === 0) && (m as any).normalized_caps_json) {
                        const caps = (m as any).normalized_caps_json
                        if (caps.inputs && Array.isArray(caps.inputs)) {
                            inputs = caps.inputs
                        } else if (caps._parameters && Array.isArray(caps._parameters)) {
                            // Convert _parameters to simple inputs if needed, or use directly
                            // Workbench expects simple input shape usually, but let's pass it through
                            inputs = caps._parameters
                        }
                    }

                    // 2. Infer capabilities
                    const caps: string[] = []
                    if (inputs.some((i: any) => i.name === 'prompt' || i.type === 'string')) caps.push('text')
                    if (inputs.some((i: any) => i.name === 'image' || i.name === 'init_image' || i.type === 'image')) caps.push('image')

                    // 3. Resolve credits
                    const credits = (m as any).credits_per_generation ?? (m as any).credits ?? 5

                    return {
                        id: m.id,
                        name: m.name || m.display_name, // Fallback to display_name
                        description: (m as any).description || `${m.provider} model`,
                        provider: m.provider,
                        cover_image: m.cover_image, // or cover_image_url
                        category: "both",
                        capabilities: caps,
                        inputs: inputs,
                        credits: credits // Expose credits
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
