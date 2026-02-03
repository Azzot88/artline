
export const CANONICAL_SECTIONS = [
    { id: 'prompt', label: 'Prompt', description: 'Text prompts and language settings' },
    { id: 'composition', label: 'Composition / Framing', description: 'Aspect ratio, dimensions, cropping' },
    { id: 'quality', label: 'Quality / Compute', description: 'Steps, guidance, scheduler, detail' },
    { id: 'style', label: 'Style / Conditioning', description: 'Presets, LoRAs, style strength' },
    { id: 'random', label: 'Randomness / Variation', description: 'Seed, variation strength' },
    { id: 'input', label: 'Inputs', description: 'Init images, masks, control inputs' },
    { id: 'control', label: 'ControlNet', description: 'Control mode, image, strength' },
    { id: 'output', label: 'Output', description: 'Format, count, upscale, background' },
    { id: 'safety', label: 'Safety / Moderation', description: 'Safety levels, watermarks' },
    { id: 'batch', label: 'Batch & Workflow', description: 'Grid mode, parallelism' },
    { id: 'advanced', label: 'Advanced / Expert', description: 'Raw overrides, provider flags' },
] as const;

export interface CanonicalFieldDef {
    key: string;
    label: string;
    type: 'string' | 'integer' | 'number' | 'boolean' | 'enum' | 'array' | 'object' | 'image';
    section: string;
    description?: string;
    options?: string[]; // For enums
    min?: number;
    max?: number;
}

export const CANONICAL_FIELDS: Record<string, CanonicalFieldDef> = {
    // 2.1 Prompt
    'prompt.text': { key: 'prompt.text', label: 'Prompt', type: 'string', section: 'prompt' },
    'prompt.negative_text': { key: 'prompt.negative_text', label: 'Negative Prompt', type: 'string', section: 'prompt' },
    'prompt.language': { key: 'prompt.language', label: 'Language', type: 'enum', section: 'prompt', options: ['en', 'ru', 'auto'] },
    'prompt.template_mode': { key: 'prompt.template_mode', label: 'Template Mode', type: 'enum', section: 'prompt', options: ['raw', 'enhanced', 'cinematic', 'product', 'portrait', 'anime', '3d', 'photoreal'] },

    // 2.2 Composition
    'frame.aspect_ratio': { key: 'frame.aspect_ratio', label: 'Aspect Ratio', type: 'enum', section: 'composition', options: ['1:1', '16:9', '9:16', '4:3', '3:4', '2:3', '3:2', '21:9', 'custom'] },
    'frame.width': { key: 'frame.width', label: 'Width', type: 'integer', section: 'composition', min: 64, max: 4096 },
    'frame.height': { key: 'frame.height', label: 'Height', type: 'integer', section: 'composition', min: 64, max: 4096 },
    'frame.crop_mode': { key: 'frame.crop_mode', label: 'Crop Mode', type: 'enum', section: 'composition', options: ['center', 'top', 'bottom', 'face_priority'] },

    // 2.3 Quality
    'quality.preset': { key: 'quality.preset', label: 'Quality Preset', type: 'enum', section: 'quality', options: ['draft', 'balanced', 'high', 'ultra'] },
    'quality.steps': { key: 'quality.steps', label: 'Steps', type: 'integer', section: 'quality', min: 1, max: 200 },
    'quality.guidance_scale': { key: 'quality.guidance_scale', label: 'Guidance Scale', type: 'number', section: 'quality', min: 0, max: 30 },
    'quality.scheduler': { key: 'quality.scheduler', label: 'Scheduler', type: 'enum', section: 'quality', options: ['auto', 'ddim', 'euler', 'euler_a', 'dpmpp_2m', 'dpmpp_sde', 'lms'] },
    'quality.sharpness': { key: 'quality.sharpness', label: 'Sharpness', type: 'number', section: 'quality', min: 0, max: 1 },
    'quality.detail_level': { key: 'quality.detail_level', label: 'Detail Level', type: 'enum', section: 'quality', options: ['low', 'medium', 'high'] },

    // 2.4 Style
    'style.preset': { key: 'style.preset', label: 'Style Preset', type: 'enum', section: 'style', options: ['none', 'cinematic', 'anime', '3d', 'photoreal', 'pixel'] },
    'style.strength': { key: 'style.strength', label: 'Style Strength', type: 'number', section: 'style', min: 0, max: 1 },
    'style.lora': { key: 'style.lora', label: 'LoRAs', type: 'array', section: 'style' },
    'style.ref_image': { key: 'style.ref_image', label: 'Reference Image', type: 'image', section: 'style' },
    'style.ref_strength': { key: 'style.ref_strength', label: 'Ref Strength', type: 'number', section: 'style', min: 0, max: 1 },

    // 2.5 Random
    'random.seed': { key: 'random.seed', label: 'Seed', type: 'integer', section: 'random' },
    'random.variation_strength': { key: 'random.variation_strength', label: 'Variation Strength', type: 'number', section: 'random', min: 0, max: 1 },

    // 2.6 Inputs
    'input.init_image': { key: 'input.init_image', label: 'Init Image', type: 'image', section: 'input' },
    'input.init_strength': { key: 'input.init_strength', label: 'Denoise Strength', type: 'number', section: 'input', min: 0, max: 1 },
    'input.mask_image': { key: 'input.mask_image', label: 'Mask', type: 'image', section: 'input' },

    // 2.7 Control
    'control.mode': { key: 'control.mode', label: 'Control Mode', type: 'enum', section: 'control', options: ['none', 'canny', 'depth', 'pose', 'scribble'] },
    'control.image': { key: 'control.image', label: 'Control Image', type: 'image', section: 'control' },
    'control.strength': { key: 'control.strength', label: 'Control Strength', type: 'number', section: 'control', min: 0, max: 1 },

    // 2.8 Output
    'output.count': { key: 'output.count', label: 'Image Count', type: 'integer', section: 'output', min: 1, max: 8 },
    'output.format': { key: 'output.format', label: 'Format', type: 'enum', section: 'output', options: ['jpg', 'png', 'webp'] },
    'output.quality': { key: 'output.quality', label: 'Quality', type: 'integer', section: 'output', min: 1, max: 100 },
    'output.upscale': { key: 'output.upscale', label: 'Upscale', type: 'enum', section: 'output', options: ['off', '2x', '4x'] },
    'output.background': { key: 'output.background', label: 'Background', type: 'enum', section: 'output', options: ['auto', 'transparent', 'solid'] },

    // 2.9 Safety
    'safety.level': { key: 'safety.level', label: 'Safety Level', type: 'enum', section: 'safety', options: ['strict', 'medium', 'permissive'] },
    'safety.watermark': { key: 'safety.watermark', label: 'Watermark', type: 'boolean', section: 'safety' },

    // 2.10 Batch
    'batch.mode': { key: 'batch.mode', label: 'Batch Mode', type: 'enum', section: 'batch', options: ['single', 'grid', 'variations'] },
    'workflow.stream': { key: 'workflow.stream', label: 'Stream', type: 'boolean', section: 'batch' },

    // 2.11 Advanced
    'advanced.raw_json_override': { key: 'advanced.raw_json_override', label: 'Raw JSON Override', type: 'object', section: 'advanced' },
    'advanced.provider_flags': { key: 'advanced.provider_flags', label: 'Provider Flags', type: 'object', section: 'advanced' },
};
