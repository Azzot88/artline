import { ModelParameterConfig } from "@/polymet/data/types"

// ... existing interfaces ...

// The internal state object for the editor
export interface ModelEditorState {
    modelId: string

    // Basic Metadata
    displayName: string
    description: string
    coverImageUrl: string
    creditsPerGeneration: number

    // Legacy (Deprecated but used for basic non-param view?)
    parameters: RichParameter[]

    // New Advanced Configs
    configs: Record<string, ModelParameterConfig>
    isDirty: boolean
    modelRef?: string
    capabilities?: { modes?: string[], resolutions?: string[] }
}
