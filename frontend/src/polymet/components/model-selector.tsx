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
  // Models are now pre-filtered by parent
  const filteredModels = models

  return (
    <Select value={value} onValueChange={onChange} disabled={loading}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-primary" />
          <SelectValue placeholder={loading ? "Loading models..." : "Select AI Model"} />
        </div>
      </SelectTrigger>
      <SelectContent className="max-w-xs">
        {filteredModels.map((model) => (
          <SelectItem key={model.id} value={model.id} className="focus:bg-primary/10 focus:text-primary cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-primary/5 group-focus:bg-primary/20 transition-colors">
                <SparklesIcon className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="font-semibold text-sm">{model.name}</span>
                <span className="text-[10px] text-muted-foreground group-focus:text-primary/70 line-clamp-1">
                  {model.description}
                </span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}