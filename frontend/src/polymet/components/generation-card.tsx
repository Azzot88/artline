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
}

export function GenerationCard({ generation }: GenerationCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Download logic here
    console.log("Downloading:", generation.id)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Share logic here
    console.log("Sharing:", generation.id)
  }



  return (
    <Link to={`/instance/${generation.id}`}>
      <Card 
        className="break-inside-avoid overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
      >
        {/* Image */}
        <div className="relative bg-muted overflow-hidden">
          <img 
            src={generation.url} 
            alt={generation.prompt}
            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
            style={{ aspectRatio: `${generation.width}/${generation.height}` }}
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button 
              size="icon" 
              variant="secondary" 
              className="rounded-full"
              onClick={handleDownload}
            >
              <DownloadIcon className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="rounded-full"
              onClick={handleShare}
            >
              <Share2Icon className="w-4 h-4" />
            </Button>
          </div>

          {/* Video Badge - only for videos */}
          {generation.type === "video" && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-primary/90 backdrop-blur-sm">
                <SparklesIcon className="w-3 h-3 mr-1" />
                Видео
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          {/* Prompt */}
          <p className="text-sm line-clamp-2">{generation.prompt}</p>

          {/* User Info */}
          <div className="flex items-center gap-2">
            <img 
              src={generation.userAvatar} 
              alt={generation.userName}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-xs text-muted-foreground">{generation.userName}</span>
          </div>

          {/* Model & Provider */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {generation.model}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {generation.provider}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <div className="flex items-center gap-3">
              <button 
                className="flex items-center gap-1 hover:text-primary transition-colors"
                onClick={handleLike}
              >
                <HeartIcon className={`w-3.5 h-3.5 ${isLiked ? "fill-primary text-primary" : ""}`} />
                <span>{generation.likes + (isLiked ? 1 : 0)}</span>
              </button>
              <span className="flex items-center gap-1">
                <CoinsIcon className="w-3.5 h-3.5" />
                {generation.credits}
              </span>
            </div>
            <span className="text-xs">
              {generation.width}×{generation.height}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}