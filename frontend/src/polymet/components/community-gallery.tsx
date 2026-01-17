import { useState, useEffect } from "react"
import { GenerationCard } from "@/polymet/components/generation-card"
import { SparklesIcon, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useLanguage } from "@/polymet/components/language-provider"
import { api } from "@/lib/api"
import { Generation } from "@/polymet/data/types"

export function CommunityGallery() {
  const { t } = useLanguage()
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoading(true)
        const data = await api.get<Generation[]>("/gallery")
        console.log("[Gallery Debug] Raw Data:", data)
        if (Array.isArray(data)) {
          // Map and slice
          const mapped = data.slice(0, 6).map((job: any) => {
            // Basic Aspect Ratio Logic
            let width = 1024;
            let height = 1024;
            if (job.format === "portrait") { width = 768; height = 1024; }
            if (job.format === "landscape") { width = 1024; height = 768; }

            return {
              id: job.id,
              // Fields for GenerationCard
              url: job.result_url,
              image: job.result_url,

              prompt: job.prompt,
              model: job.model_id || "Flux",
              provider: "replicate",

              credits: job.credits_spent || 1,
              likes: job.likes || 0,
              views: job.views || 0,

              // User Info
              userName: "User",
              userAvatar: "https://github.com/shadcn.png",

              // Data
              width: width,
              height: height,
              type: job.kind, // Card uses .type
              kind: job.kind,
              timestamp: job.created_at
            }
          })
          console.log("[Gallery Debug] Mapped Data:", mapped)
          setGenerations(mapped)
        }
      } catch (e) {
      }
    }
    fetchRecent()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{t('gallery.communityTitle')}</h3>
        </div>
        <Link
          to="/gallery"
          className="text-xs text-primary hover:underline"
        >
          {t('common.viewAll')}
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 gap-3 space-y-3">
          {generations.map((gen) => (
            <GenerationCard key={gen.id} generation={gen} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Recent creations from the community
      </p>
    </div>
  )
}