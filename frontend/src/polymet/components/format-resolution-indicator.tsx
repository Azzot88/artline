import { InfoIcon } from "lucide-react"
import type { ImageFormatType, VideoFormatType } from "@/polymet/data/types"

interface FormatResolutionIndicatorProps {
  format: ImageFormatType | VideoFormatType
  resolution: string
  quality?: string
  className?: string
}

function getQualityLabel(resolution: string): string {
  const [width, height] = resolution.split('x').map(Number)
  const pixels = width * height
  
  if (pixels <= 512 * 512) return "SD"
  if (pixels <= 1024 * 1024) return "HD"
  if (pixels <= 2048 * 2048) return "Full HD"
  return "4K"
}

export function FormatResolutionIndicator({ 
  format, 
  resolution, 
  quality,
  className = ""
}: FormatResolutionIndicatorProps) {
  const qualityLabel = quality || getQualityLabel(resolution)
  
  return (
    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
      <InfoIcon className="w-3 h-3" />
      <span>
        Формат: <span className="font-medium text-foreground">{format}</span>
        {" • "}
        Разрешение: <span className="font-medium text-foreground font-mono">{resolution}</span>
        {" • "}
        <span className="font-medium text-foreground">{qualityLabel}</span>
      </span>
    </div>
  )
}