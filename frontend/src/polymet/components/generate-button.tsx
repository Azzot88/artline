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
      className={cn(
        "w-full gap-2 text-base font-semibold transition-all duration-300 relative overflow-hidden group",
        loading ? "animate-pulse-subtle shadow-[0_0_20px_rgba(107,79,255,0.4)]" : "hover:shadow-[0_0_25px_rgba(107,79,255,0.3)] hover:-translate-y-0.5 active:translate-y-0",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      <div className="relative flex items-center gap-2">
        {loading ? (
          <>
            <LoaderIcon className="w-5 h-5 animate-spin" />
            {t('workbench.generating')}
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5 group-hover:animate-bounce" />
            {t('workbench.generate')}
            <div className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 group-hover:bg-white/30 transition-colors">
              <CoinsIcon className="w-4 h-4" />
              <span className="text-sm font-bold">{credits}</span>
            </div>
          </>
        )}
      </div>
    </Button>
  )
}