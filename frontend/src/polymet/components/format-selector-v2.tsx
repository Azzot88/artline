import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  SquareIcon,
  RectangleVerticalIcon,
  RectangleHorizontalIcon,
  MonitorIcon,
  SmartphoneIcon,
  LayersIcon
} from "lucide-react"
import type { ImageFormatType, VideoFormatType } from "@/polymet/data/types"
import { cn } from "@/lib/utils"

interface FormatSelectorV2Props {
  value: ImageFormatType | VideoFormatType
  onChange: (value: ImageFormatType | VideoFormatType) => void
  type: "image" | "video"
  disabled?: boolean
  compact?: boolean
  allowedValues?: any[]
}

const AspectRatioBox = ({ ratio, className }: { ratio: string; className?: string }) => {
  const is169 = ratio === "16:9"
  const is916 = ratio === "9:16"
  const is11 = ratio === "1:1" || ratio === "square"
  const is23 = ratio === "2:3" || ratio === "portrait"
  const is32 = ratio === "3:2" || ratio === "landscape"

  return (
    <div className={cn("border-2 border-current rounded-sm shrink-0",
      is11 && "w-3 h-3",
      is169 && "w-4 h-2.5",
      is916 && "w-2.5 h-4",
      is32 && "w-4 h-3",
      is23 && "w-3 h-4",
      className)}
    />
  )
}

const IMAGE_FORMATS: { value: ImageFormatType; label: string; icon: React.ReactNode }[] = [
  { value: "9:16", label: "9:16", icon: <AspectRatioBox ratio="9:16" /> },
  { value: "2:3", label: "2:3", icon: <AspectRatioBox ratio="2:3" /> },
  { value: "1:1", label: "1:1", icon: <AspectRatioBox ratio="1:1" /> },
  { value: "3:2", label: "3:2", icon: <AspectRatioBox ratio="3:2" /> },
  { value: "16:9", label: "16:9", icon: <AspectRatioBox ratio="16:9" /> },
]

const VIDEO_FORMATS: { value: VideoFormatType; label: string; icon: React.ReactNode }[] = [
  { value: "9:16", label: "9:16", icon: <AspectRatioBox ratio="9:16" /> },
  { value: "1:1", label: "1:1", icon: <AspectRatioBox ratio="1:1" /> },
  { value: "16:9", label: "16:9", icon: <AspectRatioBox ratio="16:9" /> },
]

export function FormatSelectorV2({
  value,
  onChange,
  type,
  disabled = false,
  compact = false,
  allowedValues
}: FormatSelectorV2Props) {
  let formats = type === "image" ? IMAGE_FORMATS : VIDEO_FORMATS

  if (allowedValues && allowedValues.length > 0) {
    formats = formats.filter(f => allowedValues.includes(f.value))
  }

  const selectedFormat = formats.find(f => f.value === value)

  return (
    <div className={cn("w-[110px]", compact ? "" : "space-y-1")}>
      {!compact && (
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <LayersIcon className="w-3 h-3" />
          Формат
        </label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={cn("w-full bg-background/50 border-white/10 glass-effect gap-2 justify-start", compact ? "h-9" : "h-10")}>
          <div className="flex items-center gap-2 text-xs font-semibold overflow-hidden">
            <div className="text-primary/70 shrink-0">{selectedFormat?.icon}</div>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="glass-effect border-white/10 min-w-[110px]">
          {formats.map(format => (
            <SelectItem key={format.value} value={format.value} className="focus:bg-primary/10 focus:text-primary cursor-pointer px-2">
              <div className="flex items-center justify-between w-full gap-2 min-w-[80px]">
                <span className="text-xs font-medium">{format.label}</span>
                <div className="text-primary/70">{format.icon}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export type { ImageFormatType, VideoFormatType }