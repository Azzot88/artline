import { useState, useEffect } from "react"
import { GenerationCard } from "@/polymet/components/generation-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SearchIcon, Loader2 } from "lucide-react"
import { useLanguage } from "@/polymet/components/language-provider"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Generation } from "@/polymet/data/types"
import { Input } from "@/components/ui/input"

export function Gallery() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useLanguage()

  const fetchGenerations = async () => {
    try {
      setLoading(true)
      const data = await api.get<Generation[]>("/gallery")
      // Ensure data is array
      if (Array.isArray(data)) {
        // Map backend job to frontend generation interface if needed
        // Assuming backend returns JobRead which is compatible or we map it
        // For now trusting the shape or simple mapping
        const mapped = data.map((job: any) => ({
          id: job.id,
          // Required Generation fields
          kind: job.kind || "image",
          status: job.status || "succeeded",
          // Content
          url: job.result_url || job.image || "https://placehold.co/600x400?text=Processing",
          image: job.result_url || job.image, // Legacy support
          prompt: job.prompt || "",

          model_name: job.model_id || "Flux",
          model_id: job.model_id,
          provider: "replicate",

          // Dimensions
          width: job.width || (job.format === "portrait" ? 768 : job.format === "landscape" ? 1024 : 1024),
          height: job.height || (job.format === "portrait" ? 1024 : job.format === "landscape" ? 768 : 1024),

          // Stats
          credits_spent: job.credits_spent || 1,
          likes: job.likes || 0,
          views: job.views || 0,
          is_public: true,
          is_curated: false,

          // User
          user_name: "User",
          user_avatar: "https://github.com/shadcn.png",

          // Tech details
          input_type: "text",
          format: job.format || "square",
          resolution: "1080",
          created_at: job.created_at || new Date().toISOString()
        } as Generation))
        setGenerations(mapped)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load gallery")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGenerations()
  }, [])

  // Filter generations
  const filteredGenerations = generations.filter(gen => {
    const matchesSearch = gen.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {t('gallery.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('gallery.communityTitle')}
        </p>
      </div>

      {/* Search and Filters Bar - Simplified for Now */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={fetchGenerations}>Refresh</Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Masonry Gallery */}
      {!loading && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {filteredGenerations.map((gen) => (
            <GenerationCard key={gen.id} generation={gen} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredGenerations.length === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <SearchIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t('gallery.noGenerations')}</h3>
            <p className="text-sm text-muted-foreground">
              {generations.length === 0 ? "Generate something first!" : "Try changing search terms"}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
// Need to add Input import back since I removed it from imports list above
import { Input } from "@/components/ui/input"