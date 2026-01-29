
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
        // 1. Get Schema source
        const schema = m.raw_schema_json || m.param_schema || {}
        const props = schema.inputs || schema.properties || schema

        const uiConfig = m.ui_config || {}
        const pricingRules = m.pricing_rules || []

        // 2. Map to RichParameters (if props exist)
        const params: RichParameter[] = props ? Object.keys(props).map(key => {
            const raw = props[key]
            const config = uiConfig[key] || {}

            // Handle Options
            let options: RichOption[] | undefined = undefined

            const rawEnum = raw.enum || raw.allowed_values || (raw.anyOf ? raw.anyOf.map((x: any) => x.const || x) : null)

            if (rawEnum && Array.isArray(rawEnum)) {
                options = rawEnum.map((val: any, idx: number) => {
                    const rule = pricingRules.find(r => r.param_id === key && r.operator === 'eq' && r.value === val)
                    return {
                        value: val,
                        label: val.toString(),
                        price: rule ? rule.surcharge : 0,
                        accessTiers: [],
                        order: idx
                    }
                })
            }

            return {
                id: key,
                type: raw.type || "string",
                label: config.label_override || raw.title || key,
                default: raw.default,
                required: Array.isArray(schema.required) ? schema.required.includes(key) : !!raw.required,
                description: raw.description,

                hidden: config.visible === false,
                visibleToTiers: config.access_tiers || ["starter", "pro", "studio"],
                labelOverride: config.label_override,

                min: raw.minimum ?? raw.min,
                max: raw.maximum ?? raw.max,
                step: raw.step,

                options
            }
        }) : []

        setState({
            modelId: m.id,
            displayName: m.display_name,
            description: m.description || "",
            coverImageUrl: m.cover_image_url || "",
            creditsPerGeneration: m.credits_per_generation || 5,
            parameters: params,
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
            const newUiConfig: Record<string, any> = { ...model.ui_config }
            const newPricingRules: PricingRule[] = []

            const existingRules = (model.pricing_rules || []).filter(r =>
                !state.parameters.some(p => p.id === r.param_id)
            )

            state.parameters.forEach(p => {
                // 1. UI Config
                newUiConfig[p.id] = {
                    ...newUiConfig[p.id],
                    visible: !p.hidden,
                    access_tiers: p.visibleToTiers,
                    label_override: p.labelOverride
                }

                // 2. Pricing Rules (Options)
                if (p.options) {
                    p.options.forEach(opt => {
                        if (opt.price !== 0) {
                            newPricingRules.push({
                                id: `pr_${p.id}_${opt.value}`,
                                param_id: p.id,
                                operator: "eq",
                                value: opt.value,
                                surcharge: opt.price,
                                label: `${p.label}: ${opt.label}`
                            })
                        }
                    })
                }
            })

            const finalRules = [...existingRules, ...newPricingRules]

            // Send PUT (Backend uses exclude_unset=True)
            await api.put(`/admin/models/${modelId}`, {
                display_name: state.displayName,
                description: state.description,
                cover_image_url: state.coverImageUrl,
                credits_per_generation: state.creditsPerGeneration,
                ui_config: newUiConfig,
                pricing_rules: finalRules
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

    const reset = () => {
        if (model) initFromModel(model)
    }

    return {
        state,
        isLoading: !state && isLoading,
        isSaving,
        updateMetadata,
        updateParameter,
        save,
        reset
    }
}
