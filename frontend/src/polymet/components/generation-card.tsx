import { useState } from "react"
import { Link } from "react-router-dom"
import { Generation } from "@/polymet/data/generations-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  HeartIcon,
  CoinsIcon,
  DownloadIcon,
  Share2Icon,
  SparklesIcon
} from "lucide-react"

interface GenerationCardProps {
  generation: Generation
  onClick?: (generation: Generation) => void
  layoutMode?: "fixed-width" | "fixed-height"
}

export function GenerationCard({ generation, onClick, layoutMode = "fixed-width" }: GenerationCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  // ... (handlers)

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick(generation)
    }
  }

  // CSS Logic
  // fixed-width (Masonry): width=100%, height=auto. Container controls width.
  // fixed-height (Strip): height=100%, width=auto. Container controls height.
  // We apply aspect-ratio to the container to reserve space? 
  // For fixed-height, we need aspect-ratio to drive the width.

  const aspectRatio = `${generation.width}/${generation.height}`

  const CardContent = (
    <Card
      className={`break-inside-avoid overflow-hidden group cursor-pointer hover:shadow-lg transition-all border border-border/60 hover:border-primary/50 relative isolate transform-gpu rounded-xl ${layoutMode === 'fixed-height' ? 'inline-flex' : 'w-full h-auto'}`}
      style={layoutMode === 'fixed-width' ? { aspectRatio } : { height: '100%', width: 'auto' }}
      onClick={handleClick}
    >
      {/* Media */}
      <div
        className={`relative bg-muted overflow-hidden`}
        style={layoutMode === 'fixed-height' ? { height: '100%', width: 'auto' } : undefined}
      >
        {generation.type === "video" ? (
          <video
            src={`${generation.url}#t=0.001`}
            preload="metadata"
            poster={generation.image && !generation.image.endsWith('.mp4') ? generation.image : undefined}
            className={`object-cover rounded-[inherit] bg-muted`}
            style={layoutMode === 'fixed-height'
              ? { height: '100%', width: 'auto', maxWidth: 'none', aspectRatio: `${generation.width}/${generation.height}` }
              : { width: '100%', height: 'auto', aspectRatio }
            }
            muted
            loop
            playsInline
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => e.currentTarget.pause()}
          />
        ) : (
          <img
            src={generation.url}
            alt={generation.prompt}
            className={`object-cover group-hover:scale-105 transition-transform duration-500 rounded-[inherit] will-change-transform`}
            style={layoutMode === 'fixed-height'
              ? { height: '100%', width: 'auto', maxWidth: 'none', aspectRatio: `${generation.width}/${generation.height}` }
              : { width: '100%', height: 'auto', aspectRatio }
            }
          />
        )}


        {/* Hover Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md">
            Click for details
          </div>
        </div>

        {/* Video Badge - only for videos */}
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

  // If no onClick, wrap in Link for standard navigation (backward compatibility)
  if (!onClick) {
    return (
      <Link to={`/instance/${generation.id}`}>
        {CardContent}
      </Link>
    )
  }

  return (
    <div className="mb-4">
      {CardContent}
    </div>
  )
}