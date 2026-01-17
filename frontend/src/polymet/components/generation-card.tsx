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
}

export function GenerationCard({ generation, onClick }: GenerationCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("Downloading:", generation.id)
  }

  const handleClick = (e: React.MouseEvent) => {
    // If onClick is provided, use it (and prevent default link navigation if we were using Links)
    if (onClick) {
      e.preventDefault()
      onClick(generation)
    }
  }

  const CardContent = (
    <Card
      className="break-inside-avoid overflow-hidden group cursor-pointer hover:shadow-lg transition-all border border-border/60 hover:border-primary/50"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative bg-muted overflow-hidden">
        <img
          src={generation.url}
          alt={generation.prompt}
          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ aspectRatio: `${generation.width}/${generation.height}` }}
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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