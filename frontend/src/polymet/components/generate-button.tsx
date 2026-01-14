import { SparklesIcon, CoinsIcon, LoaderIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/polymet/components/language-provider"

interface GenerateButtonProps {
  credits: number
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function GenerateButton({
  credits,
  onClick,
  disabled = false,
  loading = false,
  className
}: GenerateButtonProps) {
  const { t } = useLanguage()

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      size="lg"
      className={cn("w-full gap-2 text-base font-semibold", className)}
    >
      {loading ? (
        <>
          <LoaderIcon className="w-5 h-5 animate-spin" />
          {t('workbench.generating')}
        </>
      ) : (
        <>
          <SparklesIcon className="w-5 h-5" />
          {t('workbench.generate')}
          <div className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-foreground/20">
            <CoinsIcon className="w-4 h-4" />
            <span className="text-sm font-bold">{credits}</span>
          </div>
        </>
      )}
    </Button>
  )
}