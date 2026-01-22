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

                import { CAPABILITY_SCHEMA, CapabilityType } from "@/polymet/data/capabilities"

                // ...

                // Map Backend to Frontend Shape
                const mapped: SelectorModel[] = data.map(m => {
                    // 1. Resolve inputs
                    let inputs = m.inputs || []
                    if ((!inputs || inputs.length === 0) && (m as any).normalized_caps_json) {
                        const caps = (m as any).normalized_caps_json
                        if (caps.inputs && Array.isArray(caps.inputs)) inputs = caps.inputs
                        else if (caps._parameters && Array.isArray(caps._parameters)) inputs = caps._parameters
                    }

                    // 2. Resolve Capabilities (Strict Typing)
                    const rawModes = (m as any).modes || []
                    // Cast strings to CapabilityType if they match schema
                    const capabilities: CapabilityType[] = rawModes.filter((mode: string) =>
                        Object.prototype.hasOwnProperty.call(CAPABILITY_SCHEMA, mode)
                    ) as CapabilityType[]

                    // 3. Resolve Category based on Capabilities
                    let isImage = false
                    let isVideo = false

                    if (capabilities.length > 0) {
                        capabilities.forEach(cap => {
                            const cat = CAPABILITY_SCHEMA[cap].category
                            if (cat === 'image') isImage = true
                            if (cat === 'video') isVideo = true
                        })
                    } else {
                        // Fallback inference if capabilities missing
                        if (inputs.some((i: any) => i.name === 'prompt')) isImage = true // Assume image default
                        // Check provider names known for video?
                        if (m.provider.toLowerCase().includes('runway') || m.provider.toLowerCase().includes('pika')) isVideo = true
                    }

                    let category: "image" | "video" | "both" = "both"
                    if (isImage && isVideo) category = "both"
                    else if (isImage) category = "image"
                    else if (isVideo) category = "video"

                    // 4. Resolve credits
                    const credits = (m as any).credits_per_generation ?? (m as any).credits ?? 5

                    return {
                        id: m.id,
                        name: m.name || m.display_name,
                        description: (m as any).description || `${m.provider} model`,
                        provider: m.provider,
                        cover_image: m.cover_image,
                        category: category,
                        capabilities: capabilities, // Use strictly typed array
                        inputs: inputs,
                        credits: credits
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
