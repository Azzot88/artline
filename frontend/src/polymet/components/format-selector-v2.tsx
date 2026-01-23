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
import { useLanguage } from "@/polymet/components/language-provider"
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
  let w = 1
  let h = 1

  if (ratio.includes("x")) {
    const parts = ratio.split('x').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      w = parts[0]
      h = parts[1]
    }
  } else {
    const parts = ratio.split(':').map(Number);
    w = parts[0] || 1;
    h = parts[1] || 1;
  }

  const iconClasses = cn("w-3.5 h-3.5 shrink-0 opacity-80", className)

  const numericRatio = w / h;

  if (Math.abs(numericRatio - 1) < 0.05) return <SquareIcon className={iconClasses} />
  if (numericRatio > 1) return <RectangleHorizontalIcon className={iconClasses} />
  return <RectangleVerticalIcon className={iconClasses} />
}

const IMAGE_FORMATS: { value: ImageFormatType; label: string; icon: React.ReactNode }[] = [
  { value: "21:9", label: "21:9", icon: <AspectRatioBox ratio="21:9" /> },
  { value: "16:9", label: "16:9", icon: <AspectRatioBox ratio="16:9" /> },
  { value: "3:2", label: "3:2", icon: <AspectRatioBox ratio="3:2" /> },
  { value: "4:3", label: "4:3", icon: <AspectRatioBox ratio="4:3" /> },
  { value: "5:4", label: "5:4", icon: <AspectRatioBox ratio="5:4" /> },
  { value: "1:1", label: "1:1", icon: <AspectRatioBox ratio="1:1" /> },
  { value: "4:5", label: "4:5", icon: <AspectRatioBox ratio="4:5" /> },
  { value: "3:4", label: "3:4", icon: <AspectRatioBox ratio="3:4" /> },
  { value: "2:3", label: "2:3", icon: <AspectRatioBox ratio="2:3" /> },
  { value: "9:16", label: "9:16", icon: <AspectRatioBox ratio="9:16" /> },
  { value: "9:21", label: "9:21", icon: <AspectRatioBox ratio="9:21" /> },
]

const VIDEO_FORMATS: { value: VideoFormatType; label: string; icon: React.ReactNode }[] = [
  { value: "21:9", label: "21:9", icon: <AspectRatioBox ratio="21:9" /> },
  { value: "16:9", label: "16:9", icon: <AspectRatioBox ratio="16:9" /> },
  { value: "1:1", label: "1:1", icon: <AspectRatioBox ratio="1:1" /> },
  { value: "5:4", label: "5:4", icon: <AspectRatioBox ratio="5:4" /> },
  { value: "4:5", label: "4:5", icon: <AspectRatioBox ratio="4:5" /> },
  { value: "9:16", label: "9:16", icon: <AspectRatioBox ratio="9:16" /> },
]

export function FormatSelectorV2({
  value,
  onChange,
  type,
  disabled = false,
  compact = false,
  allowedValues
}: FormatSelectorV2Props) {
  const { t } = useLanguage()
  let formats = type === "image" ? IMAGE_FORMATS : VIDEO_FORMATS

  // Merge predefined key formats with any allowedValues that might not be in the list
  // This ensures that if the backend sends "custom_ratio", it still appears
  const allPossibleFormats = [...formats]

  if (allowedValues && allowedValues.length > 0) {
    // Add any missing formats from allowedValues
    allowedValues.forEach(val => {
      const exists = allPossibleFormats.find(f => f.value === val)
      if (!exists) {
        allPossibleFormats.push({
          value: val,
          label: val,
          icon: <AspectRatioBox ratio={String(val)} />
        })
      }
    })

    // Filter to only show allowed ones
    formats = allPossibleFormats.filter(f => allowedValues.includes(f.value))
  }

  const selectedFormat = formats.find(f => f.value === value) || { value, label: value, icon: <AspectRatioBox ratio={String(value)} /> }

  return (
    <div className={cn("w-[90px]", compact ? "" : "space-y-1")}>
      {!compact && (
        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 flex items-center gap-1.5 px-1">
          {t('workbench.format')}
        </label>
      )}
      <Select value={String(value)} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={cn("w-full bg-background/40 border-white/5 glass-effect px-2 hover:bg-white/5 transition-all text-primary", compact ? "h-9" : "h-10")}>
          <div className="flex items-center gap-1.5 text-xs font-bold overflow-hidden">
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="glass-effect border-white/10 min-w-[90px] p-1">
          {formats.map(format => (
            <SelectItem key={format.value} value={format.value} className="focus:bg-primary/10 focus:text-primary cursor-pointer px-2 rounded-md">
              <div className="flex items-center gap-2 w-full">
                <div className="text-primary/70 shrink-0">{format.icon}</div>
                <span className="text-[11px] font-bold">{format.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export type { ImageFormatType, VideoFormatType }