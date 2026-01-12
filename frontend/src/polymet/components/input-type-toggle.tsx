import { Button } from "@/components/ui/button"
import { useTranslations } from "@/polymet/components/language-provider"

export type InputType = "text" | "image"

interface InputTypeToggleProps {
  value: InputType
  onChange: (value: InputType) => void
  creationType: "image" | "video"
}

export function InputTypeToggle({ value, onChange, creationType }: InputTypeToggleProps) {
  const t = useTranslations()
  
  const getLabel = (type: InputType) => {
    if (type === "text") {
      return creationType === "image" ? t.textToImage : t.textToVideo
    } else {
      return creationType === "image" ? t.imageToImage : t.videoToVideo
    }
  }

  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
      <Button
        variant={value === "text" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("text")}
        className="gap-0 px-3 text-xs"
      >
        {getLabel("text")}
      </Button>
      <Button
        variant={value === "image" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("image")}
        className="gap-0 px-3 text-xs"
      >
        {getLabel("image")}
      </Button>
    </div>
  )
}