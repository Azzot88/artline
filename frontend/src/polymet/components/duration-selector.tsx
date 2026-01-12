import { ClockIcon, ChevronDownIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type DurationType = "5" | "10" | "15"

interface Duration {
  value: DurationType
  label: string
}

const DURATIONS: Duration[] = [
  { value: "5", label: "5 sec" },
  { value: "10", label: "10 sec" },
  { value: "15", label: "15 sec" }
]

interface DurationSelectorProps {
  value: DurationType
  onChange: (value: DurationType) => void
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  const selectedDuration = DURATIONS.find(d => d.value === value)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[120px] h-10 border-2">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-muted-foreground" />
          <SelectValue>
            {selectedDuration?.label}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {DURATIONS.map((duration) => (
          <SelectItem key={duration.value} value={duration.value}>
            {duration.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}