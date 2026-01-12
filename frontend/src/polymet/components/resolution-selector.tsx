import { MonitorIcon, ChevronDownIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type ResolutionType = "720" | "1080" | "4k"

interface Resolution {
  value: ResolutionType
  label: string
}

const RESOLUTIONS: Resolution[] = [
  { value: "720", label: "720p" },
  { value: "1080", label: "1080p" },
  { value: "4k", label: "4K" }
]

interface ResolutionSelectorProps {
  value: ResolutionType
  onChange: (value: ResolutionType) => void
}

export function ResolutionSelector({ value, onChange }: ResolutionSelectorProps) {
  const selectedResolution = RESOLUTIONS.find(r => r.value === value)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[120px] h-10 border-2">
        <div className="flex items-center gap-2">
          <MonitorIcon className="w-4 h-4 text-muted-foreground" />
          <SelectValue>
            {selectedResolution?.label}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {RESOLUTIONS.map((resolution) => (
          <SelectItem key={resolution.value} value={resolution.value}>
            {resolution.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}