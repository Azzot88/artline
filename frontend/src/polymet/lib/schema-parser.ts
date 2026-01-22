import { ModelParameter, ModelParameterConfig, UIGroup } from "@/polymet/data/types"

/**
 * Replicate JSON Schema Types
 */
export interface ReplicateSchemaProp {
    type: "string" | "integer" | "number" | "boolean" | "array" | "object"
    title?: string
    description?: string
    default?: any
    minimum?: number
    maximum?: number
    enum?: any[]
    "x-order"?: number
    format?: "uri" | "multiline" | string // "uri" often means file/image
    items?: ReplicateSchemaProp // For arrays
    allOf?: any[] // Sometimes used for enums or inheritance
}

export interface ReplicateSchema {
    type: "object"
    required?: string[]
    properties: Record<string, ReplicateSchemaProp>
    title?: string
    description?: string
}

/**
 * Parse Replicate Schema into our internal model
 */
export function parseReplicateSchema(
    schema: ReplicateSchema,
    modelId: string,
    modelRef: string
): { parameters: ModelParameter[]; configs: ModelParameterConfig[]; suggested_capabilities: string[] } {
    // 0. Locate the actual Schema object (Input definition)
    let root = schema

    // Check for standard Replicate API response structure
    if (schema?.latest_version?.openapi_schema) {
        root = schema.latest_version.openapi_schema
    } else if (schema?.openapi_schema) {
        root = schema.openapi_schema
    }

    // Check for components definition (OpenAPI)
    if (root?.components?.schemas?.Input) {
        root = root.components.schemas.Input
    }

    if (!root?.properties) {
        console.warn("Schema parser: No properties found in object", schema)
        return { parameters: [], configs: [] }
    }

    const props = root.properties

    const parameters: ModelParameter[] = []
    const configs: ModelParameterConfig[] = []

    // Extract all properties
    Object.entries(props).forEach(([key, prop]) => {
        // Skip internal fields often found in replicate schemas but not useful for users
        if (key === "version" || key === "created_at") return

        const isRequired = root.required?.includes(key) || false
        const paramId = key // Use the parameter name as the ID for consistency

        // 1. Determine Type
        let type = prop.type

        // Handle "allOf" which sometimes wraps enums or types
        if (!type && prop.allOf && prop.allOf.length > 0) {
            // Simplistic handling: take the first definition that has a type
            const match = prop.allOf.find((p: any) => p.type)
            if (match) type = match.type
        }

        // Fallback
        if (!type) type = "string"

        // 2. Determine Group
        let uiGroup: UIGroup = "other"
        const lowerKey = key.toLowerCase()

        if (["prompt", "negative_prompt", "input_image", "image"].includes(lowerKey)) {
            uiGroup = "core"
        } else if (["width", "height", "aspect_ratio", "format", "dimensions", "resolution"].includes(lowerKey)) {
            uiGroup = "format"
        } else if (["scheduler", "seed", "guidance_scale", "num_inference_steps", "steps", "cfg"].includes(lowerKey)) {
            uiGroup = "quality"
        } else if (["num_outputs", "system_prompt"].includes(lowerKey)) {
            uiGroup = "advanced"
        } else if (["disable_safety_checker", "safety_tolerance"].includes(lowerKey)) {
            uiGroup = "safety"
        }

        // 3. Create Parameter Object
        const parameter: ModelParameter = {
            id: paramId,
            version_id: modelRef, // Use modelRef as version identifier for portability
            name: key,
            type: type as any,
            default_value: prop.default ?? null,
            required: isRequired,
            ui_group: uiGroup,
            created_at: new Date().toISOString(),

            // Extended Metadata
            min: prop.minimum,
            max: prop.maximum,
            enum: prop.enum,
        }

        // Special handling for file uploads (replicate uses type: string, format: uri)
        if (type === "string" && prop.format === "uri") {
            // We can treat this as a file input
            // For now, type 'string' covers it, but we might want a hint
        }

        parameters.push(parameter)

        // 4. Create Config Object
        const config: ModelParameterConfig = {
            parameter_id: paramId,
            enabled: true, // Enable by default for now, or use logic to hide advanced ones
            display_order: prop["x-order"] ?? 999,
            custom_label: prop.title || key,
            description: prop.description,

            // Pass through constraints
            allowed_range: (prop.minimum !== undefined || prop.maximum !== undefined) ? {
                min: prop.minimum,
                max: prop.maximum
            } : undefined,
            allowed_values: prop.enum
        }

        configs.push(config)
    })

    // Sort by x-order
    parameters.sort((a, b) => {
        const ca = configs.find(c => c.parameter_id === a.id)
        const cb = configs.find(c => c.parameter_id === b.id)
        return (ca?.display_order ?? 999) - (cb?.display_order ?? 999)
    })

    // 5. Suggest Capabilities
    const suggestedCapabilities = new Set<string>()
    const paramNames = parameters.map(p => p.name.toLowerCase())

    const hasVideoParams = paramNames.some(p =>
        p.includes("fps") || p.includes("frame") || p.includes("video") || p.includes("duration") || p.includes("seconds")
    )
    const hasAudioParams = paramNames.some(p =>
        p.includes("audio") || p.includes("music") || p.includes("speech") || p.includes("voice") || p.includes("melody")
    )
    const hasInputImage = paramNames.some(p =>
        p.includes("image") || p.includes("file") || p.includes("input")
    )

    if (hasVideoParams) {
        if (hasInputImage) suggestedCapabilities.add("image-to-video")
        suggestedCapabilities.add("text-to-video")
    } else if (hasAudioParams) {
        suggestedCapabilities.add("text-to-audio")
        if (hasInputImage) suggestedCapabilities.add("image-to-audio")
    } else {
        // Default to image
        suggestedCapabilities.add("text-to-image")
        if (hasInputImage) suggestedCapabilities.add("image-to-image")
    }

    // Refinement: Inpainting
    if (paramNames.some(p => p.includes("mask") || p.includes("inpainting"))) {
        suggestedCapabilities.add("inpainting")
    }

    return { parameters, configs, suggested_capabilities: Array.from(suggestedCapabilities) }
}

/**
 * Helper to determine basic input type for UI
 */
export function getInputType(param: ModelParameter): "text" | "number" | "select" | "boolean" | "file" | "range" {
    if (param.enum) return "select"
    if (param.type === "boolean") return "boolean"
    if (param.type === "integer" || param.type === "number") {
        if (param.min !== undefined && param.max !== undefined) return "range"
        return "number"
    }
    // heuristic for file
    if (param.name.includes("image") || param.name.includes("file")) return "file"

    return "text"
}
