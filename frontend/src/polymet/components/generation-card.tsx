import { useState } from "react"
import { Link } from "react-router-dom"
import { Generation, JobStatus } from "@/polymet/data/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SparklesIcon, MusicIcon, AlertCircle, PlayIcon, Volume2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/polymet/components/language-provider"

interface GenerationCardProps {
  generation: Generation
  onClick?: (generation: Generation) => void
  layoutMode?: "fixed-width" | "fixed-height" // fixed-width (Masonry/Library), fixed-height (Widget/Filmstrip)
}

export function GenerationCard({ generation, onClick, layoutMode = "fixed-width" }: GenerationCardProps) {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      e.stopPropagation()
      onClick(generation)
    }
  }

  // --- Status Logic ---
  const isRunning = generation.status === 'running' || generation.status === 'queued';
  const isFailed = generation.status === 'failed';
  const isSucceeded = generation.status === 'succeeded' || !generation.status; // assume success if undefined for legacy

  // --- Aspect Ratio Logic ---
  // Ensure we have valid dimensions, default to square if missing
  const width = generation.width || 1024;
  const height = generation.height || 1024;
  const aspectRatio = width / height;

  // --- Render Content Helper ---
  const renderContent = () => {
    if (isRunning) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground p-4">
          <div className="relative w-12 h-12 mb-3">
            {/* Spinner Ring */}
            <div className="absolute inset-0 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            {/* Inner Pulse */}
            <div className="absolute inset-3 bg-primary/20 rounded-full animate-pulse" />
          </div>
          <span className="text-xs font-medium animate-pulse">
            {generation.status === 'queued' ? t('generationDetails.status.queued') : t('generationDetails.status.running')}
          </span>
        </div>
      );
    }

    if (isFailed) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-destructive/5 text-destructive p-4 border-2 border-dashed border-destructive/20">
          <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-xs font-medium">{t('generationDetails.status.failed')}</span>
        </div>
      );
    }

    // Success State Content
    switch (generation.kind) {
      case 'video':
        return (
          <>
            <video
              src={`${generation.url}#t=0.001`}
              preload="metadata"
              className="w-full h-full object-cover"
              muted loop playsInline
              onMouseEnter={(e) => { e.currentTarget.play().catch(() => { }) }}
              onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
              poster={generation.image && !generation.image.endsWith('.mp4') ? generation.image : undefined}
            />
            {/* Video Badge */}
            <div className="absolute top-2 right-2 pointer-events-none">
              <Badge variant="secondary" className="bg-black/60 text-white hover:bg-black/70 border-0 backdrop-blur-sm shadow-sm gap-1 px-1.5 h-6">
                <PlayIcon className="w-3 h-3 fill-white" />
                {generation.duration ? Math.round(generation.duration) + 's' : ''}
              </Badge>
            </div>
          </>
        );

      case 'audio': // handle legacy/alternate type names, though Kind is usually image|video. Assuming 'audio' might be added.
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 relative group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-colors">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Volume2Icon className="w-8 h-8 text-primary" />
            </div>
            {/* Fake Waveform */}
            <div className="flex items-center gap-1 h-8">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary/40 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            <div className="absolute top-2 right-2 pointer-events-none">
              <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm">
                <MusicIcon className="w-3 h-3 mr-1" />
                Audio
              </Badge>
            </div>
          </div>
        );

      default: // Image
        return (
          <img
            src={generation.url}
            alt={generation.prompt}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
          />
        );
    }
  };

  // --- LAYOUT: Fixed Width (Masonry / Library) ---
  if (layoutMode === 'fixed-width') {
    // In masonry, width is constrained by the column, height depends on aspect ratio.
    // We use a padding-bottom hack or explicit height if known to reserve space.
    // Actually, simply using width: 100% and height: auto with aspect-ratio CSS property is best in modern CSS.

    return (
      <Card
        className={cn(
          "group relative overflow-hidden cursor-pointer border-border/50 bg-muted/30 break-inside-avoid mb-4 transition-all duration-300 hover:shadow-lg hover:border-primary/50",
          isRunning && "pointer-events-none"
        )}
        onClick={handleClick}
      >
        <div
          className="w-full relative"
          style={{
            // Default to square if loading, otherwise use real aspect ratio
            aspectRatio: `${width}/${height}`
          }}
        >
          <div className="absolute inset-0 w-full h-full">
            {renderContent()}
          </div>

          {/* Hover Overlay - Only if succeeded */}
          {isSucceeded && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <p className="text-white text-xs line-clamp-2 md:line-clamp-3 font-medium drop-shadow-md">
                {generation.prompt}
              </p>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // --- LAYOUT: Fixed Height (Widget / Film Strip) ---
  // In the widget, the container typically scrolls horizontally.
  // We want all items to have the same height (e.g. 10rem or h-40) and width to adjust according to aspect ratio.

  // We need to calculate the width based on the fixed height (which is controlled by the parent className usually).
  // BUT: The parent usually is a flex row with a specific height. 
  // To make the element maintain aspect ratio in a flex row of fixed height, we set h-full and w-auto.
  // And the image/video inside must also be object-cover or object-contain.

  return (
    <div
      className={cn(
        "h-full relative inline-flex group cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-muted/30 transition-all duration-300 hover:shadow-md hover:border-primary/50 flex-shrink-0",
        isRunning && "pointer-events-none"
      )}
      style={{
        aspectRatio: `${width}/${height}`
      }}
      onClick={handleClick}
    >
      {/* Content */}
      <div className="w-full h-full">
        {renderContent()}
      </div>

      {/* Simple Hover for Widget */}
      {isSucceeded && (
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {/* Optional: Add an icon or just slight darken */}
        </div>
      )}
    </div>
  )
}