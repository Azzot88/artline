import { useState } from "react"
import { Link } from "react-router-dom"
import { Generation } from "@/polymet/data/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SparklesIcon } from "lucide-react"

interface GenerationCardProps {
  generation: Generation
  onClick?: (generation: Generation) => void
  layoutMode?: "fixed-width" | "fixed-height"
}

export function GenerationCard({ generation, onClick, layoutMode = "fixed-width" }: GenerationCardProps) {

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      e.stopPropagation()
      onClick(generation)
    }
  }

  // FLOW 1: WIDGET (Fixed Height Row)
  // Priority: Height is fixed (from parent). Width adjusts naturally.
  if (layoutMode === 'fixed-height') {
    const CardContent = (
      <div
        className="relative h-full inline-flex group cursor-pointer overflow-hidden rounded-xl border border-border/60 hover:border-primary/50 bg-muted"
        onClick={handleClick}
      >
        {/* Direct Image/Video - No wrapping div that forces width */}
        {generation.type === "video" ? (
          <video
            src={`${generation.url}#t=0.001`}
            preload="metadata"
            className="h-full w-auto object-cover max-w-none"
            muted loop playsInline
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => e.currentTarget.pause()}
            poster={generation.image && !generation.image.endsWith('.mp4') ? generation.image : undefined}
          />
        ) : (
          <img
            src={generation.url}
            alt={generation.prompt}
            className="h-full w-auto object-cover max-w-none hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Badges/Overlays */}
        {generation.type === "video" && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white border-0">
              <SparklesIcon className="w-3 h-3 mr-1" />
              Video
            </Badge>
          </div>
        )}

        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
          <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md">
            Click for details
          </div>
        </div>
      </div>
    )

    return <div className="h-full inline-block align-top">{CardContent}</div>
  }

  // FLOW 2: GALLERY (Masonry Column)
  // Priority: Width is fixed (from column). Height adjusts naturally.
  // layoutMode === 'fixed-width' (Default)

  const aspectRatio = `${generation.width}/${generation.height}`

  const CardContent = (
    <Card
      className="break-inside-avoid overflow-hidden group cursor-pointer hover:shadow-lg transition-all border border-border/60 hover:border-primary/50 relative isolate transform-gpu rounded-xl w-full h-auto mb-4"
      onClick={handleClick}
    >
      <div className="relative bg-muted w-full">
        <div style={{ paddingBottom: `${(generation.height / generation.width) * 100}%` }} />
        <div className="absolute inset-0">
          {generation.type === "video" ? (
            <video
              src={`${generation.url}#t=0.001`}
              preload="metadata"
              className="w-full h-full object-cover"
              style={{ aspectRatio }}
              muted loop playsInline
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => e.currentTarget.pause()}
              poster={generation.image && !generation.image.endsWith('.mp4') ? generation.image : undefined}
            />
          ) : (
            <img
              src={generation.url}
              alt={generation.prompt}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              style={{ aspectRatio }}
            />
          )}
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
          <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md">
            Click for details
          </div>
        </div>

        {generation.type === "video" && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white border-0">
              <SparklesIcon className="w-3 h-3 mr-1" />
              Video
            </Badge>
          </div>
        )}
      </div>
    </Card>
  )

  if (!onClick) {
    return (
      <Link to={`/instance/${generation.id}`} className="block mb-4">
        {CardContent}
      </Link>
    )
  }

  return CardContent
}