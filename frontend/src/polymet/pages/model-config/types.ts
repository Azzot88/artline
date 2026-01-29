
import { AIModel } from "@/polymet/data/types"

export interface RichOption {
    value: string | number
    label: string
    price: number // Surcharge in credits
    accessTiers: string[] // ["starter", "pro", "studio"]
    order: number
}

export interface RichParameter {
    id: string // The technical param ID (e.g. "num_inference_steps")

    // Base Schema Props
    type: string // "string", "integer", "number", "boolean", "select"
    label: string
    default: any
    required: boolean
    description?: string

    // UI Config Overrides
    hidden: boolean // Completely hidden from specific tier? Or globally hidden?
    visibleToTiers: string[] // ["starter", "pro", "studio"]
    labelOverride?: string

    // Validation Constraints
    min?: number
    max?: number
    step?: number

    // For Select type
    options?: RichOption[]
}

// The internal state object for the editor
export interface ModelEditorState {
    modelId: string

    // Basic Metadata
    displayName: string
    description: string
    coverImageUrl: string
    creditsPerGeneration: number

    parameters: RichParameter[]

    isDirty: boolean
}
