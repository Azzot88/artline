import { Button } from "@/components/ui/button"
import { useLanguage } from "@/polymet/components/language-provider"
import { Type, Image as ImageIcon, Video as VideoIcon } from "lucide-react"

export type InputType = "text" | "image"

interface InputTypeToggleProps {
  value: InputType
  onChange: (value: InputType) => void
  creationType: "image" | "video"
}

export function InputTypeToggle({ value, onChange, creationType }: InputTypeToggleProps) {
  const { t } = useLanguage()

  const getLabel = (type: InputType) => {
    if (type === "text") {
      return creationType === "image" ? t('workbench.textToImage') : t('workbench.textToVideo')
    } else {
      return creationType === "image" ? t('workbench.imageToImage') : t('workbench.videoToVideo')
    }
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit border border-border/50">
      <Button
        variant={value === "text" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("text")}
        className="gap-2 px-3 text-xs min-w-[32px]"
      >
        <Type className="w-4 h-4 md:hidden" />
        <span className="hidden md:inline">{getLabel("text")}</span>
      </Button>
      <Button
        variant={value === "image" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("image")}
        className="gap-2 px-3 text-xs min-w-[32px]"
      >
        {creationType === 'image' ? <ImageIcon className="w-4 h-4 md:hidden" /> : <VideoIcon className="w-4 h-4 md:hidden" />}
        <span className="hidden md:inline">{getLabel("image")}</span>
      </Button>
    </div>
  )
}