import { Generation, JobStatus, JobKind, InputType } from "@/polymet/data/types"

/**
 * Normalizes raw backend data (from /api/jobs or /api/gallery) into a clean Generation object.
 * This ensures consistency across the app, centralizing fallback logic for dimensions, keys, and values.
 */
export function normalizeGeneration(raw: any): Generation {
    // 1. Dimensions Logic (Pillow -> Format -> Default)
    let width = raw.width;
    let height = raw.height;

    if (!width || !height) {
        // Fallback based on format
        if (raw.format === "portrait") {
            width = 576;
            height = 1024;
        } else if (raw.format === "landscape") {
            width = 1024;
            height = 576;
        } else {
            // Square or unknown
            width = 1024;
            height = 1024;
        }
    }

    // 2. Prompt Cleaning
    // Remove technical prefixes sometimes left by pipelines if raw prompt is dirty
    // e.g. "[1234] parameters... | actual prompt"
    let cleanPrompt = raw.prompt || "";
    if (typeof cleanPrompt === 'string') {
        if (cleanPrompt.includes("|")) {
            cleanPrompt = cleanPrompt.split("|").pop()?.trim() || cleanPrompt;
        } else if (cleanPrompt.startsWith("[")) {
            cleanPrompt = cleanPrompt.replace(/\[.*?\]\s*/, "").trim();
        }
    }

    // 3. Status Handling
    const status: JobStatus = (raw.status && ["queued", "running", "succeeded", "failed"].includes(raw.status))
        ? raw.status as JobStatus
        : "queued";

    // 4. Kind Handling
    // Detect video/audio if not explicit, though backend should be source of truth
    let kind: JobKind = raw.kind || "image";
    if (!raw.kind && raw.result_url) {
        if (raw.result_url.endsWith(".mp4")) kind = "video";
        // if (raw.result_url.endsWith(".mp3")) kind = "audio"; // Future support
    }

    // 5. Construct Object
    return {
        // Core
        id: raw.id,
        kind: kind,
        prompt: cleanPrompt,
        status: status,

        // Result
        result_url: raw.result_url || raw.image, // Handle legacy 'image' field
        url: raw.result_url || raw.image, // Legacy alias for UI components
        thumbnailUrl: raw.thumbnail_url || raw.cover_image_url || undefined,

        // Inputs & Params
        input_type: raw.input_type || "text",
        input_image_url: raw.input_image_url,

        // Dimensions
        format: raw.format || "square",
        resolution: raw.resolution || "1080",
        width: width,
        height: height,
        duration: raw.duration,

        // Model Info
        model_id: raw.model_id,
        model_name: raw.model_name || raw.model_id || "Unknown Model",
        provider: raw.provider || "replicate",

        // Metrics
        credits_spent: raw.credits_spent || 0,

        // Social / Access
        is_public: !!raw.is_public,
        is_curated: !!raw.is_curated,
        likes: raw.likes || 0,
        views: raw.views || 0,

        // Timestamps
        created_at: raw.created_at,
        completed_at: raw.completed_at,

        // User (If available in join)
        user_id: raw.user_id,
        user_name: raw.user_name || raw.userName || "Me",
        user_avatar: raw.user_avatar || raw.userAvatar || "https://github.com/shadcn.png",
    }
}
