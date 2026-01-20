import { Generation, JobStatus, JobKind, InputType } from "@/polymet/data/types"

/**
 * Normalizes raw backend data (from /api/jobs or /api/gallery) into a clean Generation object.
 * This ensures consistency across the app, centralizing fallback logic for dimensions, keys, and values.
 */
export function normalizeGeneration(raw: any): Generation {
    // 1. Dimensions Logic
    let width = Number(raw.width);
    let height = Number(raw.height);

    // Fallback if missing or invalid
    if (!width || !height || isNaN(width) || isNaN(height)) {
        if (raw.format === "portrait" || raw.format === "9:16") {
            width = 576;
            height = 1024;
        } else if (raw.format === "landscape" || raw.format === "16:9") {
            width = 1024;
            height = 576;
        } else {
            // Default to Square
            width = 1024;
            height = 1024;
        }
    }

    // 2. Kind Inference
    // Backend source of truth is 'kind', but we fallback to URL extension
    let kind: JobKind = raw.kind;
    const url = raw.result_url || raw.image || raw.url || "";

    if (!kind) {
        if (url.match(/\.(mp4|mov|webm)(\?|$)/i)) kind = "video";
        else if (url.match(/\.(mp3|wav|ogg)(\?|$)/i)) kind = "audio";
        else kind = "image";
    }

    // 3. Prompt Cleaning
    let cleanPrompt = raw.prompt || "";
    if (typeof cleanPrompt === 'string') {
        // Remove pipeline artifacts
        if (cleanPrompt.includes("|")) {
            // Heuristic: usually "params | prompt"
            cleanPrompt = cleanPrompt.split("|").pop()?.trim() || cleanPrompt;
        }
        cleanPrompt = cleanPrompt.replace(/\[.*?\]\s*/g, "").trim();
    }

    // 4. Status
    const status: JobStatus = (raw.status && ["queued", "running", "succeeded", "failed"].includes(raw.status))
        ? raw.status as JobStatus
        : "queued";

    // 5. Metadata Extraction
    const modelId = raw.model_id || raw.model || "";
    const modelName = raw.model_name || modelId || "Unknown Model";

    // Duration
    let duration = raw.duration ? Number(raw.duration) : undefined;
    if (!duration && kind === 'video') duration = 0; // Default video duration if unknown

    // Cost
    const cost = raw.credits_spent || raw.cost_credits || 0;

    return {
        // Identity
        id: raw.id,
        kind: kind,
        status: status,

        // Content
        url: url,
        thumbnailUrl: raw.thumbnail_url || raw.cover_image_url || raw.thumbnail || undefined,
        prompt: cleanPrompt,

        // Dimensions
        width,
        height,
        format: raw.format || "square", // Legacy field, kept for compatibility
        resolution: raw.resolution || "1080", // Legacy field

        // Metadata
        model_id: modelId,
        model_name: modelName,
        provider: raw.provider || "replicate",
        duration: duration,
        credits_spent: cost,

        // Social
        is_public: !!raw.is_public,
        is_curated: !!raw.is_curated,
        likes: raw.likes || 0,
        views: raw.views || 0,

        // Timestamps
        created_at: raw.created_at || new Date().toISOString(),
        completed_at: raw.completed_at,

        // User
        user_id: raw.user_id,
        user_name: raw.user_name || raw.userName || "User",
        user_avatar: raw.user_avatar || raw.userAvatar,

        // Inputs (Legacy/Pass-through)
        input_type: raw.input_type || "text",
        input_image_url: raw.input_image_url
    }
}
