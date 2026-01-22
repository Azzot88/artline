import { ChevronDownIcon, SparklesIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface AIModel {
  id: string
  name: string
  description: string
  category: "image" | "video" | "both"
  capabilities?: string[]
  inputs?: any[]
  credits?: number
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
  const filteredModels = models.filter(
    model => model.category === creationType || model.category === "both"
  )

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
          <SelectItem key={model.id} value={model.id}>
            <div className="flex flex-col items-start">
              <span className="font-medium">{model.name}</span>
              <span className="text-xs text-muted-foreground">
                {model.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}