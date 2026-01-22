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
  SmartphoneIcon
} from "lucide-react"
import type { ImageFormatType, VideoFormatType } from "@/polymet/data/types"

interface FormatSelectorV2Props {
  value: ImageFormatType | VideoFormatType
  onChange: (value: ImageFormatType | VideoFormatType) => void
  type: "image" | "video"
  disabled?: boolean
  compact?: boolean
  allowedValues?: any[]
}

const IMAGE_FORMATS: { value: ImageFormatType; label: string; icon: React.ReactNode }[] = [
  { value: "1:1", label: "1:1 Квадрат", icon: <SquareIcon className="w-4 h-4" /> },
  { value: "2:3", label: "2:3 Портрет", icon: <RectangleVerticalIcon className="w-4 h-4" /> },
  { value: "3:2", label: "3:2 Альбом", icon: <RectangleHorizontalIcon className="w-4 h-4" /> },
  { value: "16:9", label: "16:9 Широкий", icon: <MonitorIcon className="w-4 h-4" /> },
  { value: "9:16", label: "9:16 Вертикальный", icon: <SmartphoneIcon className="w-4 h-4" /> }
]

const VIDEO_FORMATS: { value: VideoFormatType; label: string; icon: React.ReactNode }[] = [
  { value: "16:9", label: "16:9 Горизонтальное", icon: <MonitorIcon className="w-4 h-4" /> },
  { value: "9:16", label: "9:16 Вертикальное", icon: <SmartphoneIcon className="w-4 h-4" /> },
  { value: "1:1", label: "1:1 Квадратное", icon: <SquareIcon className="w-4 h-4" /> }
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
    <div className={compact ? "" : "space-y-1"}>
      {!compact && (
        <label className="text-xs font-medium text-muted-foreground">
          Формат
        </label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={compact ? "h-9" : "h-10"}>
          <SelectValue>
            <div className="flex items-center gap-2">
              {selectedFormat?.icon}
              <span>{selectedFormat?.value || "Выберите формат"}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {formats.map(format => (
            <SelectItem key={format.value} value={format.value}>
              <div className="flex items-center gap-2">
                {format.icon}
                <span>{format.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export type { ImageFormatType, VideoFormatType }