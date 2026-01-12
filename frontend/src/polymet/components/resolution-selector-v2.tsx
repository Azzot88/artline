import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import type { ImageFormatType, VideoFormatType } from "@/polymet/data/types"

interface ResolutionSelectorV2Props {
  value: string // e.g., "1024x1024"
  onChange: (value: string) => void
  format: ImageFormatType | VideoFormatType
  allowedResolutions?: string[] // Admin-configured allowed resolutions
  disabled?: boolean
  compact?: boolean
}

// Default resolutions for each format
const DEFAULT_RESOLUTIONS: Record<string, string[]> = {
  "1:1": ["512x512", "1024x1024", "2048x2048"],
  "2:3": ["512x768", "1024x1536", "2048x3072"],
  "3:2": ["768x512", "1536x1024", "3072x2048"],
  "16:9": ["1024x576", "1280x720", "1920x1080", "3840x2160"],
  "9:16": ["576x1024", "720x1280", "1080x1920", "2160x3840"]
}

// Quality labels for resolutions
function getQualityLabel(resolution: string): string {
  const [width, height] = resolution.split('x').map(Number)
  const pixels = width * height
  
  if (pixels <= 512 * 512) return "SD"
  if (pixels <= 1024 * 1024) return "HD"
  if (pixels <= 2048 * 2048) return "Full HD"
  return "4K"
}

export function ResolutionSelectorV2({ 
  value, 
  onChange, 
  format,
  allowedResolutions,
  disabled = false,
  compact = false
}: ResolutionSelectorV2Props) {
  // Get available resolutions for the format
  const availableResolutions = allowedResolutions || DEFAULT_RESOLUTIONS[format] || []
  
  // If current value is not in available resolutions, select first one
  if (availableResolutions.length > 0 && !availableResolutions.includes(value)) {
    onChange(availableResolutions[0])
  }

  return (
    <div className={compact ? "" : "space-y-1"}>
      {!compact && (
        <label className="text-xs font-medium text-muted-foreground">
          Разрешение
        </label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={compact ? "h-9" : "h-10"}>
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{value}</span>
              <span className="text-xs text-muted-foreground">
                ({getQualityLabel(value)})
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableResolutions.map(resolution => (
            <SelectItem key={resolution} value={resolution}>
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-sm">{resolution}</span>
                <span className="text-xs text-muted-foreground">
                  {getQualityLabel(resolution)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Helper to get default resolution for a format
export function getDefaultResolution(format: ImageFormatType | VideoFormatType): string {
  const resolutions = DEFAULT_RESOLUTIONS[format] || []
  // Return middle resolution (usually HD)
  return resolutions[Math.floor(resolutions.length / 2)] || resolutions[0] || "1024x1024"
}