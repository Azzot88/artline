import { Generation, JobStatus, JobKind, InputType } from "@/polymet/data/types"

/**
 * Normalizes raw backend data (from /api/jobs or /api/gallery) into a clean Generation object.
 * This ensures consistency across the app, centralizing fallback logic for dimensions, keys, and values.
 */
export function normalizeGeneration(raw: any): Generation {
    return {
        // Identity
        id: raw.id,
        kind: raw.kind || "image",
        status: raw.status || "queued",

        // Content
        url: raw.result_url || raw.url || "",
        thumbnailUrl: raw.thumbnail_url || undefined,
        prompt: raw.prompt || "",

        // Dimensions
        width: Number(raw.width) || 1024,
        height: Number(raw.height) || 1024,
        format: raw.format || "square",
        resolution: raw.resolution || "1080",

        // Metadata
        model_id: raw.model_id || "unknown",
        model_name: raw.model_name || "Unknown Model",
        provider: raw.provider || "replicate",
        duration: Number(raw.duration) || 0,
        credits_spent: Number(raw.cost_credits) || 0,
        params: raw.params || {},

        // Social
        is_public: !!raw.is_public,
        is_curated: !!raw.is_curated,
        is_private: !!raw.is_private,
        likes: raw.likes || 0,
        views: raw.views || 0,

        // Timestamps
        created_at: raw.created_at || new Date().toISOString(),
        completed_at: raw.completed_at,

        // User
        user_id: raw.user_id || raw.guest_id,
        user_name: raw.user_name || "User",
        user_avatar: raw.user_avatar,

        // Inputs
        input_type: raw.input_type || "text",
        input_image_url: raw.input_image_url
    }
}

/**
 * Normalizes model inputs from the backend into a clean array of ModelParameter objects.
 * Handles fallbacks for missing types, enumeration values, and UI configurations.
 */
export function normalizeModelInputs(model: any): any[] {
    if (!model || !model.inputs) return []

    try {
        return model.inputs.map((input: any) => {
            if (!input) return null
            const type = input.type || 'string'
            let allowedValues = input.enum || input.allowed_values
            const uiConfig = model.ui_config?.parameter_configs?.find(
                (c: any) => c.parameter_id === input.name
            )

            if (uiConfig?.allowed_values?.length > 0) {
                allowedValues = uiConfig.allowed_values
            }

            // Sanitise default value:
            // If we have strict allowed values and the current default is NOT in them,
            // fallback to the first allowed value.
            let safeDefault = input.default
            if (allowedValues && allowedValues.length > 0) {
                if (!allowedValues.includes(safeDefault)) {
                    safeDefault = allowedValues[0]
                }
            }

            return {
                id: input.name,
                name: input.name,
                type: type,
                default_value: safeDefault,
                required: input.required || false,
                enum: allowedValues,
                min: input.min,
                max: input.max,
                ui_group: 'other',
                _config: uiConfig
            }
        }).filter(Boolean)
            .filter((p: any) => p.name !== 'prompt')
            .filter((p: any) => !(p._config && p._config.enabled === false))
            .sort((a: any, b: any) => {
                const score = (p: string) => {
                    if (p === 'format') return 0
                    if (p === 'width' || p === 'height' || p === 'size' || p === 'resolution') return 1
                    if (p === 'quality' || p === 'steps') return 2
                    return 10
                }
                return score(a.name) - score(b.name)
            })
    } catch (e) {
        console.error("Failed to parse dynamic inputs", e)
        return []
    }
}
