import { ChevronDownIcon, SparklesIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { CapabilityType } from "@/polymet/data/capabilities"

export interface AIModel {
  id: string
  name: string
  description: string
  category: "image" | "video" | "both"
  capabilities?: CapabilityType[]
  inputs?: any[]
  credits?: number
  ui_config?: {
    parameter_configs?: {
      parameter_id: string
      enabled: boolean
      display_order: number
      custom_label: string
      description: string
    }[]
  }
}

const AI_MODELS: AIModel[] = [
  {
    id: "dalle-3",
    name: "DALL-E 3",
    description: "High-quality image generation",
    category: "image"
  },
  {
    id: "midjourney-v6",
    name: "Midjourney v6",
    description: "Artistic image creation",
    category: "image"
  },
  {
    id: "stable-diffusion-xl",
    name: "Stable Diffusion XL",
    description: "Fast and versatile image generation",
    category: "image"
  },
  {
    id: "runway-gen2",
    name: "Runway Gen-2",
    description: "Text and image to video",
    category: "video"
  },
  {
    id: "pika-labs",
    name: "Pika Labs",
    description: "Creative video generation",
    category: "video"
  },
  {
    id: "stable-video",
    name: "Stable Video Diffusion",
    description: "Image to video animation",
    category: "video"
  },
  {
    id: "synthesia",
    name: "Synthesia",
    description: "AI avatar videos",
    category: "video"
  },
  {
    id: "universal-ai",
    name: "Universal AI",
    description: "Multi-purpose generation",
    category: "both"
  }
]

interface ModelSelectorProps {
  value: string
  onChange: (value: string) => void
  creationType: "image" | "video"
  models: AIModel[]
  loading?: boolean
}

export function ModelSelector({ value, onChange, creationType, models, loading }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={loading}>
      <SelectTrigger className="w-full h-12 bg-background/50 border-white/10 glass-effect gap-3 px-4">
        <SparklesIcon className="w-4 h-4 text-primary shrink-0" />
        <SelectValue placeholder={loading ? "Loading models..." : "Select AI Model"} />
      </SelectTrigger>
      <SelectContent className="max-w-xs glass-effect border-white/10">
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id} className="focus:bg-primary/10 focus:text-primary cursor-pointer group">
            <div className="flex flex-col items-start leading-tight py-0.5">
              <span className="font-semibold text-sm">{model.name}</span>
              <span className="text-[10px] text-muted-foreground group-focus:text-primary/70 line-clamp-1">
                {model.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}