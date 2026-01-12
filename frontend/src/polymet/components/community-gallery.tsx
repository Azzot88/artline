import { getCuratedGenerations } from "@/polymet/data/generations-data"
import { GenerationCard } from "@/polymet/components/generation-card"
import { SparklesIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslations } from "@/polymet/components/language-provider"

export function CommunityGallery() {
  const t = useTranslations()
  const curatedGenerations = getCuratedGenerations().slice(0, 6)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{t.communityGallery}</h3>
        </div>
        <Link 
          to="/gallery" 
          className="text-xs text-primary hover:underline"
        >
          {t.viewAll}
        </Link>
      </div>
      
      <div className="columns-1 sm:columns-2 md:columns-3 gap-3 space-y-3">
        {curatedGenerations.map((gen) => (
          <GenerationCard key={gen.id} generation={gen} />
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Curated by our community • Best creations from talented artists
      </p>
    </div>
  )
}