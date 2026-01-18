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
        if (Array.isArray(data)) {
          // Map and slice
          const mapped = data.slice(0, 6).map((job: any) => {
            // Basic Aspect Ratio Logic
            let width = 1024;
            let height = 1024;
            if (job.format === "portrait") { width = 768; height = 1024; }
            if (job.format === "landscape") { width = 1024; height = 768; }

            // Clean prompt: Remove [uuid] params | prefix
            let cleanPrompt = job.prompt;
            if (cleanPrompt.includes("|")) {
              cleanPrompt = cleanPrompt.split("|").pop().trim();
            } else if (cleanPrompt.startsWith("[")) {
              // Fallback if no pipe but has brackets
              cleanPrompt = cleanPrompt.replace(/\[.*?\]\s*/, "").trim();
            }

            return {
              id: job.id,
              kind: job.kind || "image",
              status: job.status || "succeeded",

              url: job.result_url,
              image: job.result_url,

              prompt: cleanPrompt,
              model_name: job.model_id || "Flux",
              model_id: job.model_id,
              provider: "replicate",

              credits_spent: job.credits_spent || 1,
              likes: job.likes || 0,
              views: job.views || 0,
              is_public: true,
              is_curated: false,

              user_name: "User",
              user_avatar: "https://github.com/shadcn.png",

              width: width,
              height: height,
              created_at: job.created_at,

              input_type: "text",
              format: job.format || "square",
              resolution: "1080"
            } as Generation
          })
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