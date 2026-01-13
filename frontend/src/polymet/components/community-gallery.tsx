import { useState, useEffect } from "react"
import { GenerationCard } from "@/polymet/components/generation-card"
import { SparklesIcon, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslations } from "@/polymet/components/language-provider"
import { api } from "@/lib/api"
import { Generation } from "@/polymet/data/types"

export function CommunityGallery() {
  const t = useTranslations()
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoading(true)
        const data = await api.get<Generation[]>("/gallery")
        if (Array.isArray(data)) {
          // Map and slice
          const mapped = data.slice(0, 6).map((job: any) => ({
            id: job.id,
            image: job.result_url || job.image || "https://placehold.co/600x400?text=Processing",
            prompt: job.prompt,
            model: job.model_id || "flux-pro",
            provider: "replicate",
            aspectRatio: job.format === "portrait" ? "2:3" : job.format === "landscape" ? "3:2" : "1:1",
            credits: job.credits_spent || 1,
            likes: job.likes || 0,
            views: job.views || 0,
            author: {
              name: "User",
              avatar: "https://github.com/shadcn.png"
            },
            timestamp: job.created_at,
            isVideo: job.kind === "video"
          }))
          setGenerations(mapped)
        }
      } catch (e) {
        console.error("Failed to fetch community gallery", e)
      } finally {
        setLoading(false)
      }
    }
    fetchRecent()
  }, [])

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