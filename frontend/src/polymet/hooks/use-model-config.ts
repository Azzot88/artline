import { useState, useEffect, useCallback } from "react"
import { ModelParameter, ModelParameterConfig, ParameterValues } from "@/polymet/data/types"
import { parseReplicateSchema } from "@/polymet/lib/schema-parser"

interface UseModelConfigProps {
    modelId: string
    initialValues?: ParameterValues
    initialConfigs?: ModelParameterConfig[]
}

export function useModelConfig({ modelId, initialValues = {}, initialConfigs = [] }: UseModelConfigProps) {
    // Core State
    const [parameters, setParameters] = useState<ModelParameter[]>([])
    const [configs, setConfigs] = useState<ModelParameterConfig[]>(initialConfigs)
    const [values, setValues] = useState<ParameterValues>(initialValues)

    // UI State
    const [schemaLoaded, setSchemaLoaded] = useState(false)

    // Load from local storage on mount (if available and no initial values)
    useEffect(() => {
        if (!modelId) return

        const saved = localStorage.getItem(`model-config-${modelId}`)
        if (saved) {
            try {
                const { values: savedValues, configs: savedConfigs } = JSON.parse(saved)
                // Merge with initial, prioritizing initial if provided (e.g. from backend)
                // But for "draft" experience, maybe local storage wins? 
                // Let's stick to: Backend > LocalStorage (Draft) > Default
                // actually, usually explicit props > local storage.

                if (Object.keys(initialValues).length === 0) {
                    setValues(prev => ({ ...prev, ...savedValues }))
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
            localStorage.setItem(`model-config-${modelId}`, JSON.stringify({ values, configs }))
        }, 1000) // Debounce 1s
        return () => clearTimeout(timeout)
    }, [modelId, values, configs])

    const loadSchema = useCallback((schema: any, modelRef: string) => {
        const { parameters: newParams, configs: newConfigs } = parseReplicateSchema(schema, modelId, modelRef)

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

        setSchemaLoaded(true)
    }, [modelId])

    const updateValue = useCallback((paramId: string, value: any) => {
        setValues(prev => ({ ...prev, [paramId]: value }))
    }, [])

    const updateConfig = useCallback((paramId: string, updates: Partial<ModelParameterConfig>) => {
        setConfigs(prev => prev.map(c =>
            c.parameter_id === paramId ? { ...c, ...updates } : c
        ))
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
        updateValue,
        updateConfig,
        loadSchema,
        resetValues,
        schemaLoaded,
        setParameters, // Exposed for manual setting if needed
        setConfigs,
        setValues
    }
}
