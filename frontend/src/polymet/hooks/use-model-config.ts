import { useState, useEffect, useCallback } from "react"
import { ModelParameter, ModelParameterConfig, ParameterValues } from "@/polymet/data/types"
import { parseReplicateSchema } from "@/polymet/lib/schema-parser"

interface UseModelConfigProps {
    modelId: string
    initialValues?: ParameterValues
    initialConfigs?: ModelParameterConfig[]
    initialCapabilities?: string[]
}

export function useModelConfig({ modelId, initialValues = {}, initialConfigs = [], initialCapabilities = [] }: UseModelConfigProps) {
    // Core State
    const [parameters, setParameters] = useState<ModelParameter[]>([])
    const [configs, setConfigs] = useState<ModelParameterConfig[]>(initialConfigs)
    const [values, setValues] = useState<ParameterValues>(initialValues)
    const [capabilities, setCapabilities] = useState<string[]>(initialCapabilities)

    // UI State
    const [schemaLoaded, setSchemaLoaded] = useState(false)

    // Load from local storage on mount (if available and no initial values)
    useEffect(() => {
        if (!modelId) return

        const saved = localStorage.getItem(`model-config-${modelId}`)
        if (saved) {
            try {
                const { values: savedValues, configs: savedConfigs, capabilities: savedCaps } = JSON.parse(saved)

                if (Object.keys(initialValues).length === 0) {
                    setValues(prev => ({ ...prev, ...savedValues }))
                }

                // Also restore capabilities if not provided initially
                if (initialCapabilities.length === 0 && savedCaps) {
                    setCapabilities(savedCaps)
                }

            } catch (e) {
                console.error("Failed to load draft config", e)
            }
        }
    }, [modelId])

    // Save to local storage on change
    useEffect(() => {
        if (!modelId) return
        const timeout = setTimeout(() => {
            localStorage.setItem(`model-config-${modelId}`, JSON.stringify({ values, configs, capabilities }))
        }, 1000) // Debounce 1s
        return () => clearTimeout(timeout)
    }, [modelId, values, configs, capabilities])

    const loadSchema = useCallback((schema: any, modelRef: string) => {
        const { parameters: newParams, configs: newConfigs, suggested_capabilities } = parseReplicateSchema(schema, modelId, modelRef)

        setParameters(newParams)

        // Preserve existing configs if they match parameters
        setConfigs(prev => {
            const merged = [...newConfigs]
            // Apply overrides from previous configs (e.g. disabled/hidden states)
            prev.forEach(p => {
                const idx = merged.findIndex(n => n.parameter_id === p.parameter_id)
                if (idx >= 0) {
                    merged[idx] = { ...merged[idx], ...p }
                }
            })
            return merged
        })

        // Set default values if not present
        setValues(prev => {
            const next = { ...prev }
            newParams.forEach(p => {
                if (next[p.id] === undefined && p.default_value !== null) {
                    next[p.id] = p.default_value
                }
            })
            return next
        })

        // Set suggested capabilities if none are set
        setCapabilities(prev => {
            if (prev.length > 0) return prev
            return suggested_capabilities
        })

        setSchemaLoaded(true)
    }, [modelId])

    const updateValue = useCallback((paramId: string, value: any) => {
        setValues(prev => ({ ...prev, [paramId]: value }))
    }, [])

    const updateConfig = useCallback((paramId: string, updates: Partial<ModelParameterConfig>) => {
        setConfigs(prev => {
            const exists = prev.some(c => c.parameter_id === paramId)
            if (exists) {
                return prev.map(c => c.parameter_id === paramId ? { ...c, ...updates } : c)
            }
            // Create New
            return [...prev, { parameter_id: paramId, enabled: true, display_order: 0, ...updates }]
        })
    }, [])

    const toggleCapability = useCallback((cap: string) => {
        setCapabilities(prev =>
            prev.includes(cap)
                ? prev.filter(c => c !== cap)
                : [...prev, cap]
        )
    }, [])

    const resetValues = useCallback(() => {
        const defaults: ParameterValues = {}
        parameters.forEach(p => {
            if (p.default_value !== null) defaults[p.id] = p.default_value
        })
        setValues(defaults)
    }, [parameters])

    return {
        parameters,
        configs,
        values,
        capabilities,
        updateValue,
        updateConfig,
        toggleCapability,
        loadSchema,
        resetValues,
        schemaLoaded,
        setParameters,
        setConfigs,
        setValues,
        setCapabilities
    }
}
