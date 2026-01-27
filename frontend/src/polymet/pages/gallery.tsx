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

import { useState, useEffect, useRef } from "react"
import { GenerationCard } from "@/polymet/components/generation-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SearchIcon, Loader2 } from "lucide-react"
import { useLanguage } from "@/polymet/components/language-provider"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Generation } from "@/polymet/data/types"
import { Input } from "@/components/ui/input"
import { normalizeGeneration } from "@/polymet/data/transformers"

import { GenerationDetailsDialog } from "@/polymet/components/generation-details-dialog"

interface GalleryProps {
  endpoint?: string
  title?: string
  subtitle?: string
  adminMode?: boolean
}

export function Gallery({
  endpoint = "/gallery",
  title,
  subtitle,
  adminMode = false
}: GalleryProps) {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)
  const observerTarget = useRef<HTMLDivElement>(null)

  const { t } = useLanguage()

  const LIMIT = 30

  const fetchGenerations = async (isLoadMore = false) => {
    // If not loading more (initial), reset
    if (!isLoadMore) {
      setLoading(true)
      offsetRef.current = 0
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    try {
      // Build query
      const url = `${endpoint}?limit=${LIMIT}&offset=${offsetRef.current}`

      const data = await api.get<any[]>(url)

      if (Array.isArray(data)) {
        const mapped = data.map(normalizeGeneration)

        if (data.length < LIMIT) {
          setHasMore(false)
        }

        if (isLoadMore) {
          setGenerations(prev => [...prev, ...mapped])
        } else {
          setGenerations(mapped)
        }

        offsetRef.current += LIMIT
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load gallery")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchGenerations()
  }, [endpoint]) // Reload if endpoint changes

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchGenerations(true)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore])


  // Filter generations (Client side for now, ideally backend search param)
  const filteredGenerations = generations.filter(gen => {
    if (!searchQuery) return true
    return gen.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {title || t('gallery.title')}
        </h1>
        <p className="text-muted-foreground">
          {subtitle || t('gallery.communityTitle')}
        </p>
      </div>

      {/* Search and Filters Bar */}
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
        <Button variant="outline" onClick={() => fetchGenerations(false)}>Refresh</Button>
      </div>

      {/* Loading State (Initial) */}
      {loading && !generations.length && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Masonry Gallery */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 pb-10">
        {filteredGenerations.map((gen) => (
          <div key={gen.id} className="break-inside-avoid mb-4">
            <GenerationCard
              generation={gen}
              onClick={(g) => setSelectedGeneration(g)}
            />
          </div>
        ))}
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={observerTarget} className="h-10 flex justify-center py-4">
        {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
      </div>

      {/* Details Dialog */}
      <GenerationDetailsDialog
        open={!!selectedGeneration}
        onOpenChange={(open) => !open && setSelectedGeneration(null)}
        generation={selectedGeneration}
        onDelete={(id) => {
          setGenerations((prev) => prev.filter((g) => g.id !== id))
          setSelectedGeneration(null)
        }}
      />

      {/* Empty State */}
      {!loading && filteredGenerations.length === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <SearchIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t('gallery.noGenerations')}</h3>
            <p className="text-sm text-muted-foreground">
              {generations.length === 0 ? "No images found." : "Try changing search terms"}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}