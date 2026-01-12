import { SquareIcon, RectangleHorizontalIcon, RectangleVerticalIcon, ChevronDownIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type FormatType = "square" | "horizontal" | "vertical"

interface Format {
  type: FormatType
  label: string
  icon: React.ReactNode
  dimensions: string
}

const FORMATS: Format[] = [
  {
    type: "square",
    label: "Square",
    icon: <SquareIcon className="w-4 h-4" />,
    dimensions: "1:1"
  },
  {
    type: "horizontal",
    label: "Horizontal",
    icon: <RectangleHorizontalIcon className="w-4 h-4" />,
    dimensions: "16:9"
  },
  {
    type: "vertical",
    label: "Vertical",
    icon: <RectangleVerticalIcon className="w-4 h-4" />,
    dimensions: "9:16"
  }
]

interface FormatSelectorProps {
  value: FormatType
  onChange: (value: FormatType) => void
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const selectedFormat = FORMATS.find(f => f.type === value)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[120px] h-10 border-2">
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">
            {selectedFormat?.icon}
          </div>
          <SelectValue>
            {selectedFormat?.dimensions}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {FORMATS.map((format) => (
          <SelectItem key={format.type} value={format.type}>
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground">
                {format.icon}
              </div>
              <span>{format.dimensions}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}