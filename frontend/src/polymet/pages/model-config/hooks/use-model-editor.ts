
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

                    // Basic parsing for fallback
                    return {
                        id: key,
                        type: raw.type || "string",
                        label: config.label_override || raw.title || key,
                        default: raw.default,
                        required: !!raw.required, // Simplified
                        description: raw.description,
                        hidden: config.visible === false,
                        visibleToTiers: config.access_tiers || ["starter", "pro", "studio"],
                        labelOverride: config.label_override,
                        min: raw.minimum,
                        max: raw.maximum,
                        step: raw.step,
                        options: undefined
                    }
                })
            }
        }

        setState({
            modelId: m.id,
            displayName: m.display_name,
            description: m.description || "",
            coverImageUrl: m.cover_image_url || "",
            creditsPerGeneration: m.credits_per_generation || 5,
            parameters: params,
            configs: m.ui_config || {},
            isDirty: false
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
                pricing_rules: model.pricing_rules
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
        save,
        fetchSchema,
        reset
    }
}
