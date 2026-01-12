import { ImageIcon, VideoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/polymet/components/language-provider"

export type CreationType = "image" | "video"

interface CreationTypeToggleProps {
  value: CreationType
  onChange: (value: CreationType) => void
}

export function CreationTypeToggle({ value, onChange }: CreationTypeToggleProps) {
  const t = useTranslations()
  
  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
      <Button
        variant={value === "image" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("image")}
        className="gap-0 px-3"
      >
        <ImageIcon className="w-4 h-4" />
      </Button>
      <Button
        variant={value === "video" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("video")}
        className="gap-0 px-3"
      >
        <VideoIcon className="w-4 h-4" />
      </Button>
    </div>
  )
}