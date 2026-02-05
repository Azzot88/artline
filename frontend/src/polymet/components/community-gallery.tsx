import { useState, useEffect, useRef, useCallback } from "react"
import { GenerationCard } from "@/polymet/components/generation-card"
import { SparklesIcon, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useLanguage } from "@/polymet/components/language-provider"
import { api } from "@/lib/api"
import { Generation } from "@/polymet/data/types"
import { GenerationDetailsDialog } from "@/polymet/components/generation-details-dialog"

interface CommunityGalleryProps {
  onUsePrompt?: (prompt: string) => void
}

export function CommunityGallery({ onUsePrompt }: CommunityGalleryProps) {
  const { t } = useLanguage()
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Modal State
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Infinite Scroll Observer
  const observer = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setOffset(prev => prev + 20) // Limit per page
      }
    })

    if (node) observer.current.observe(node)
  }, [loading, hasMore])

  useEffect(() => {
    const fetchGallery = async () => {
      if (!hasMore && offset !== 0) return

      try {
        setLoading(true)
        // Use limit=20 for denser loading
        const query = `?limit=20&offset=${offset}`
        const data = await api.get<Generation[]>(`/gallery${query}`)

        if (Array.isArray(data)) {
          if (data.length === 0) {
            setHasMore(false)
          } else {
            const mapped = data.map((job: any) => {
              // Reuse mapping logic (simplified for brevity but robust)
              let width = 1024;
              let height = 1024;
              if (job.format === "portrait") { width = 768; height = 1024; }
              if (job.format === "landscape") { width = 1024; height = 768; }

              let cleanPrompt = job.prompt || "";
              if (cleanPrompt.includes("|")) {
                cleanPrompt = cleanPrompt.split("|").pop().trim();
              } else if (cleanPrompt.startsWith("[")) {
                cleanPrompt = cleanPrompt.replace(/\[.*?\]\s*/, "").trim();
              }

              return {
                id: job.id,
                kind: job.kind || "image",
                status: job.status || "succeeded",
                url: job.result_url || job.image,
                image: job.result_url || job.image,
                prompt: cleanPrompt,
                model_name: job.model_id || "Flux",
                model_id: job.model_id,
                width, height,
                credits_spent: job.credits_spent,
                likes: job.likes,
                views: job.views,
                is_public: true,
                is_curated: job.is_curated, // Important for curation UI
                created_at: job.created_at || new Date().toISOString()
              } as Generation
            })

            setGenerations(prev => {
              // Dedup
              const newItems = mapped.filter(m => !prev.some(p => p.id === m.id))
              return [...prev, ...newItems]
            })

            if (data.length < 20) setHasMore(false)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetchGallery()
  }, [offset])

  const handleCardClick = (gen: Generation) => {
    setSelectedGeneration(gen)
    setDetailsOpen(true)
  }

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

      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
        {generations.map((gen, index) => {
          if (generations.length === index + 1) {
            return (
              <div ref={lastElementRef} key={gen.id} className="break-inside-avoid">
                <GenerationCard generation={gen} onClick={handleCardClick} />
              </div>
            )
          }
          return (
            <div key={gen.id} className="break-inside-avoid">
              <GenerationCard generation={gen} onClick={handleCardClick} />
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Details Dialog */}
      <GenerationDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        generation={selectedGeneration}
        // Admin might delete from here? Or just curate. 
        // We generally don't allow delete from Community Gallery unless admin.
        // Dialog handles admin checks internally for Curation.
        // Delete callback:
        onDelete={(id) => {
          setGenerations(prev => prev.filter(g => g.id !== id))
        }}
        onUsePrompt={onUsePrompt}
      />
    </div>
  )
}