
import { useState, useEffect, useCallback } from "react"
import { AIModel, PricingRule } from "@/polymet/data/types"
import { RichParameter, RichOption, ModelEditorState } from "../types"
import { useAdminModel } from "@/polymet/hooks/use-models"
import { toast } from "sonner"
import { api } from "@/polymet/data/api-client"

export function useModelEditor(modelId: string) {
    const { model, isLoading, mutate } = useAdminModel(modelId)
    const [state, setState] = useState<ModelEditorState | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Transform Backend Spec -> Frontend State
    const initFromModel = useCallback((m: AIModel) => {
        const uiConfig = m.ui_config || {}
        const pricingRules = m.pricing_rules || []

        let params: RichParameter[] = []

        // 1. Priority: Backend Normalized Parameters
        // Accessed via m.param_schema.parameters (canonical list)
        const canonical = m.param_schema && (m.param_schema as any).parameters

        if (canonical && Array.isArray(canonical)) {
            params = canonical.map((p: any) => {
                const config = uiConfig[p.id] || {}

                // Merge Options Pricing
                let options: RichOption[] | undefined = undefined
                if (p.options) {
                    options = p.options.map((opt: any, idx: number) => {
                        const val = opt.value || opt
                        const rule = pricingRules.find(r => r.param_id === p.id && r.operator === 'eq' && r.value === val)
                        return {
                            value: val,
                            label: opt.label || val.toString(), // Canonical has label
                            price: rule ? rule.surcharge : 0,
                            accessTiers: [],
                            order: idx
                        }
                    })
                }

                return {
                    id: p.id,
                    type: p.type, // "select", "integer", "string", "boolean"
                    label: config.label_override || p.label || p.id,
                    default: p.default,
                    required: !!p.required,
                    description: p.description || p.help,

                    hidden: config.visible === false || p.hidden,
                    visibleToTiers: config.access_tiers || ["starter", "pro", "studio"],
                    labelOverride: config.label_override,

                    min: p.min,
                    max: p.max,
                    step: p.step,

                    options
                }
            })
        } else {
            // 2. Fallback: Raw Logic
            const schema = m.raw_schema_json || m.param_schema || {}
            let props = schema.inputs || schema.properties
            if (!props) {
                const deepSchema = schema.latest_version?.openapi_schema || schema.openapi_schema
                if (deepSchema) {
                    props = deepSchema.components?.schemas?.Input?.properties || deepSchema.properties
                }
            }
            if (!props && Object.values(schema).some((v: any) => v && (v.type || v.default))) {
                props = schema
            }

            if (props) {
                params = Object.keys(props).map(key => {
                    const raw = props[key]
                    const config = uiConfig[key] || {}

                    // Robust Type Inference for Fallback
                    let type = raw.type || "string"
                    let options: RichOption[] | undefined = undefined

                    if (raw.enum) {
                        type = "select"
                        options = raw.enum.map((v: any, idx: number) => ({
                            value: v,
                            label: String(v),
                            price: 0,
                            accessTiers: [],
                            order: idx
                        }))
                    } else if (key === "aspect_ratio" && !raw.enum) {
                        // Heuristic for aspect_ratio if missing enum
                        type = "select"
                        options = ["1:1", "16:9", "9:16", "4:3", "3:4"].map((v, idx) => ({
                            value: v,
                            label: v,
                            price: 0,
                            accessTiers: [],
                            order: idx
                        }))
                    }

                    return {
                        id: key,
                        type: type,
                        label: config.label_override || raw.title || key,
                        default: raw.default,
                        required: !!raw.required, // Simplified
                        description: raw.description,
                        hidden: config.visible === false,
                        visibleToTiers: config.access_tiers || ["starter", "pro", "studio"],
                        labelOverride: config.label_override,
                        min: raw.minimum,
                        max: raw.maximum,
                        step: raw.step || (type === "integer" ? 1 : undefined),
                        options: options
                    }
                })
            }
        }

        // 3. Robust Config Initialization (Migration Logic)
        const initialConfigs: Record<string, any> = { ...uiConfig }

        // We need to ensure that if we have pricing rules for a param, they show up as values
        // even if 'values' is not yet in uiConfig.

        // Get all unique param IDs from schema params
        const allParamIds = new Set(params.map(p => p.id))

        allParamIds.forEach(paramId => {
            const currentConfig = initialConfigs[paramId] || { parameter_id: paramId, enabled: true, display_order: 0 }

            // If values already exist, trust them (User has saved new config)
            // If NOT, try to migrate from pricing rules + schema options
            if (!currentConfig.values) {
                const paramRules = pricingRules.filter(r => r.param_id === paramId)
                const schemaParam = params.find(p => p.id === paramId)

                let newValues: any[] = []

                // A. From Schema Options
                if (schemaParam?.options) {
                    newValues = schemaParam.options.map((opt: RichOption) => {
                        // Check for rule
                        const rule = paramRules.find(r => r.value === opt.value) // Assuming value match
                        return {
                            value: opt.value,
                            label: opt.label,
                            enabled: true,
                            is_default: schemaParam.default === opt.value,
                            price: rule ? rule.surcharge : 0,
                            access_tiers: ["starter", "pro", "studio"] // Default logic or infer?
                        }
                    })
                }

                // B. From Orphan Rules (Custom values added via old UI?)
                // If the rule value wasn't in schema options, we should add it too
                paramRules.forEach(rule => {
                    const val = rule.value
                    if (!newValues.some(v => v.value === val)) {
                        newValues.push({
                            value: val,
                            label: rule.label?.split(': ').pop() || String(val),
                            enabled: true,
                            is_default: false,
                            price: rule.surcharge,
                            access_tiers: ["starter", "pro", "studio"]
                        })
                    }
                })

                if (newValues.length > 0) {
                    currentConfig.values = newValues
                }
            }

            initialConfigs[paramId] = currentConfig
        })

        setState({
            modelId: m.id,
            displayName: m.display_name,
            description: m.description || "",
            coverImageUrl: m.cover_image_url || "",
            creditsPerGeneration: m.credits_per_generation || 5,
            parameters: params,
            configs: initialConfigs,
            isDirty: false,
            modelRef: m.model_ref,
            capabilities: (m as any).capabilities // Use any if type not updated yet, or update type
        })
    }, [])

    useEffect(() => {
        if (model) {
            initFromModel(model)
        }
    }, [model, initFromModel])

    // Actions
    const updateMetadata = (updates: Partial<Pick<ModelEditorState, 'displayName' | 'description' | 'coverImageUrl' | 'creditsPerGeneration'>>) => {
        setState(prev => prev ? ({ ...prev, ...updates, isDirty: true }) : null)
    }

    const updateConfig = (paramId: string, newConfig: Partial<ModelParameterConfig>) => {
        setState(prev => {
            if (!prev) return null
            const currentConfigs = prev.configs || {}
            const existing = currentConfigs[paramId] || { parameter_id: paramId, enabled: true, display_order: 0 }

            return {
                ...prev,
                isDirty: true,
                configs: {
                    ...currentConfigs,
                    [paramId]: { ...existing, ...newConfig }
                }
            }
        })
    }

    const updateParameter = (paramId: string, updates: Partial<RichParameter>) => {
        setState(prev => {
            if (!prev) return null
            return {
                ...prev,
                isDirty: true,
                parameters: prev.parameters.map(p =>
                    p.id === paramId ? { ...p, ...updates } : p
                )
            }
        })
    }

    const toggleCapability = (cap: string) => {
        setState(prev => {
            if (!prev) return null
            const caps = prev.capabilities?.modes || prev.capabilities || [] // Handle legacy or object structure
            const current = Array.isArray(caps) ? caps : []

            const newCaps = current.includes(cap)
                ? current.filter((c: string) => c !== cap)
                : [...current, cap]

            return {
                ...prev,
                isDirty: true,
                capabilities: newCaps
            }
        })
    }

    const save = async () => {
        if (!state || !model) return
        setIsSaving(true)

        try {
            // Reconstruct UI Config and Pricing Rules
            // Start with base from state.configs (New Advanced System)
            const newUiConfig: Record<string, any> = { ...state.configs }

            // Legacy merge (for fields not yet fully migrated to configs state if any)
            // Ideally we move fully to state.configs, but for safety let's ensure compatibility.
            // The RichParameter state is still used for basic fields like 'hidden'.
            // Let's sync RichParameter 'hidden' back to ui_config 'enabled' if missing.

            state.parameters.forEach(p => {
                if (!newUiConfig[p.id]) {
                    newUiConfig[p.id] = {
                        parameter_id: p.id,
                        enabled: !p.hidden,
                        display_order: 0
                    }
                }
                // Sync basic toggle if not explicitly set in advanced config
                // (or assume advanced config 'enabled' is source of truth)
            })

            // Construct Payload
            await api.put(`/admin/models/${modelId}`, {
                display_name: state.displayName,
                description: state.description,
                cover_image_url: state.coverImageUrl,
                credits_per_generation: state.creditsPerGeneration,
                ui_config: newUiConfig,
                // Pricing rules might still be needed if backend relies on them for ledger?? 
                // But new system puts price in `values`. 
                // Let's keep existing rules for now to avoid breaking legacy billing.
                pricing_rules: model.pricing_rules,

                // Save Capabilities (Modes)
                modes: state.capabilities // Backend expects 'modes' or 'capabilities'? AIModel has 'modes' AND 'capabilities'. Usually 'modes' is what determines function.
            })

            toast.success("Configuration saved")
            setState(s => s ? ({ ...s, isDirty: false }) : null)
            mutate()

        } catch (e) {
            console.error(e)
            toast.error("Failed to save changes")
        } finally {
            setIsSaving(false)
        }
    }

    const fetchSchema = async () => {
        if (!model) return
        setIsSaving(true)
        try {
            await api.post("/admin/fetch-model-schema", { model_ref: model.model_ref })
            toast.success("Schema fetched successfully")
            await mutate()
        } catch (e) {
            console.error(e)
            toast.error("Failed to fetch schema")
        } finally {
            setIsSaving(false)
        }
    }

    const syncParameter = async (paramId: string) => {
        if (!model) return
        setIsSaving(true) // Show global busy state or local?
        try {
            // We fetch the full schema because Replicate API gives everything at once.
            // In the future this could be optimized if the backend supported partial fetches.
            await api.post("/admin/fetch-model-schema", { model_ref: model.model_ref })

            // Trigger re-validation of state
            await mutate()

            toast.success(`Synced parameter: ${paramId}`)
        } catch (e) {
            console.error(e)
            toast.error(`Failed to sync ${paramId}`)
        } finally {
            setIsSaving(false)
        }
    }

    const reset = () => {
        if (model) initFromModel(model)
    }

    return {
        state,
        isLoading: !state && isLoading,
        isSaving,
        updateMetadata,
        updateParameter,
        updateConfig,
        toggleCapability,
        save,
        fetchSchema,
        syncParameter,
        reset
    }
}
