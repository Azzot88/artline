export type CapabilityType =
    | "text-to-image"  // Generate image from text
    | "image-to-image" // Transform image
    | "inpainting"     // Edit inside image
    | "outpainting"    // Expand image
    | "text-to-video"  // Generate video from text
    | "image-to-video" // Animate image
    | "video-to-video" // Style transfer video
    | "upscale"
    | "text-to-audio"  // Generate audio from text
    | "audio-generation";

export const CAPABILITY_SCHEMA: Record<CapabilityType, {
    label: string;
    category: "image" | "video" | "audio";
    requiredInputs: string[]; // e.g. ["prompt"], ["init_image"]
}> = {
    "text-to-image": { label: "Text to Image", category: "image", requiredInputs: ["prompt"] },
    "image-to-image": { label: "Image to Image", category: "image", requiredInputs: ["init_image", "prompt"] },
    "inpainting": { label: "Inpainting", category: "image", requiredInputs: ["init_image", "mask", "prompt"] },
    "outpainting": { label: "Outpainting", category: "image", requiredInputs: ["init_image", "prompt"] },
    "upscale": { label: "Upscale", category: "image", requiredInputs: ["init_image"] },

    "text-to-video": { label: "Text to Video", category: "video", requiredInputs: ["prompt"] },
    "image-to-video": { label: "Image to Video", category: "video", requiredInputs: ["init_image"] },
    "video-to-video": { label: "Video to Video", category: "video", requiredInputs: ["init_video"] },

    "text-to-audio": { label: "Text to Audio", category: "audio", requiredInputs: ["prompt"] },
    "audio-generation": { label: "Audio Generation", category: "audio", requiredInputs: ["prompt"] }
};

export type ModelCategory = "image" | "video" | "audio" | "both"; // 'both' kept for legacy/UI convenience
