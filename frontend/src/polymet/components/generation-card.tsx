import { useState, useEffect } from "react"
import { Generation } from "@/polymet/data/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SparklesIcon, MusicIcon, AlertCircle, PlayIcon, Volume2Icon, Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/polymet/components/language-provider"

interface GenerationCardProps {
  generation: Generation
  onClick?: (generation: Generation) => void
  layoutMode?: "fixed-width" | "fixed-height" // fixed-width (Masonry/Library), fixed-height (Widget/Filmstrip)
}

export function GenerationCard({ generation, onClick, layoutMode = "fixed-width" }: GenerationCardProps) {
  const { t } = useLanguage();

  // --- Status Logic ---
  const isRunning = generation.status === 'running' || generation.status === 'queued';
  const isFailed = generation.status === 'failed';
  const isSucceeded = generation.status === 'succeeded' || !generation.status;

  // --- Loading State: Creative Messages ---
  const [loadingIndex, setLoadingIndex] = useState(0);

  // Define messages (could be outside component, but here is fine)
  const loadingMessages = [
    "Модель собирает образ",
    "Идёт работа над формой",
    "Формируется визуальное решение",
    "Процесс творческой сборки",
    "Система работает с композицией"
  ];

  // Cycle messages
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setLoadingIndex(prev => (prev + 1) % 5); // 5 messages
    }, 2500);
    return () => clearInterval(interval);
  }, [isRunning]);

  // --- Dimensions ---
  const width = generation.width || 1024;
  const height = generation.height || 1024;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      e.stopPropagation()
      onClick(generation)
    }
  }

  // --- Render Content Helper ---
  const renderContent = () => {
    if (isRunning) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 text-muted-foreground p-4 absolute inset-0">
          <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <SparklesIcon className="w-6 h-6 text-indigo-500 animate-pulse" />
          </div>

          <div className="h-8 flex items-center justify-center w-full px-2">
            <span key={loadingIndex} className="text-[10px] md:text-xs font-mono font-medium text-indigo-500 animate-in fade-in slide-in-from-bottom-1 duration-500 uppercase tracking-widest text-center">
              {generation.status === 'queued' ? 'Очередь...' : loadingMessages[loadingIndex]}
            </span>
          </div>
        </div>
      );
    }

    if (isFailed) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-destructive/5 text-destructive p-4 border-2 border-dashed border-destructive/20 absolute inset-0">
          <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-xs font-medium text-center">{t('generationDetails.status.failed')}</span>
        </div>
      );
    }

    // Success State Content
    switch (generation.kind) {
      case 'video':
        return (
          <div className="w-full h-full bg-black relative group-video">
            <video
              src={`${generation.url}#t=0.001`}
              preload="metadata"
              className={cn(
                "w-full h-full transition-transform duration-700 ease-in-out group-hover:scale-105",
                "object-cover"
              )}
              muted loop playsInline
              onMouseEnter={(e) => { e.currentTarget.play().catch(() => { }) }}
              onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
              poster={generation.thumbnailUrl || (generation.url.match(/\.mp4$/) ? undefined : generation.url)}
            />

            <div className="absolute top-2 right-2 pointer-events-none z-10">
              <Badge variant="secondary" className="bg-black/40 text-white hover:bg-black/60 border-0 backdrop-blur-sm shadow-sm gap-1 px-1.5 h-6">
                {generation.duration ? (
                  <span className="font-mono text-[10px]">{Math.round(generation.duration)}s</span>
                ) : null}
                <span className="bg-white/20 w-[1px] h-3 mx-0.5" />
                <span className="text-[10px] font-medium tracking-wide">HD</span>
              </Badge>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointers-events-none transition-opacity duration-300">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <PlayIcon className="w-4 h-4 text-white fill-white" />
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-6 relative group-hover:from-indigo-900/60 group-hover:to-purple-900/60 transition-colors aspect-square">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-primary/20 shadow-lg shadow-primary/5">
              <Volume2Icon className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center gap-1 h-8 justify-center w-full px-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary/60 rounded-full animate-pulse"
                  style={{
                    height: `${20 + Math.random() * 80}%`,
                    animationDelay: `${i * 0.1}s`,
                    opacity: 0.6 + Math.random() * 0.4
                  }}
                />
              ))}
            </div>
            <div className="absolute top-2 right-2 pointer-events-none">
              <Badge variant="secondary" className="bg-black/40 text-white border-0 backdrop-blur-sm">
                <MusicIcon className="w-3 h-3 mr-1" />
                {generation.duration ? `${generation.duration}s` : 'Audio'}
              </Badge>
            </div>
          </div>
        );

      default: // Image
        return (
          <div className="w-full h-full relative bg-muted/20">
            <img
              src={generation.url}
              alt={generation.prompt}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            />
          </div>
        );
    }
  };

  // --- LAYOUT: Fixed Width (Masonry / Library) ---
  if (layoutMode === 'fixed-width') {
    return (
      <Card
        className={cn(
          "group relative overflow-hidden cursor-pointer border-0 bg-muted/30 break-inside-avoid mb-4 transition-all duration-300 hover:shadow-2xl shadow-sm ring-1 ring-border/50 hover:ring-primary/50 rounded-xl",
          isRunning && "pointer-events-none bg-muted/5"
        )}
        onClick={handleClick}
      >
        <div
          className="w-full relative"
          style={{
            aspectRatio: `${width}/${height}`
          }}
        >
          {renderContent()}

          {/* Hover Overlay - Only if succeeded */}
          {isSucceeded && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-[11px] leading-relaxed line-clamp-2 font-medium opacity-90 drop-shadow-md font-mono mb-1">
                  <span className="text-primary-foreground/70 mr-2 text-[9px] uppercase tracking-wider border border-white/20 px-1 rounded-sm">
                    {generation.model_name?.split('/').pop()?.split(':')[0] || 'AI'}
                  </span>
                  {generation.prompt}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // --- LAYOUT: Fixed Height (Widget / Film Strip) ---
  return (
    <div
      className={cn(
        "h-full relative inline-flex group cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-muted/30 transition-all duration-300 hover:shadow-xl hover:border-primary/50 flex-shrink-0 snap-start",
        isRunning && "pointer-events-none min-w-[150px]"
      )}
      style={{
        aspectRatio: `${width}/${height}`,
        minWidth: 'auto' // Let aspect ratio drive width
      }}
      onClick={handleClick}
    >
      <div className="w-full h-full relative">
        {renderContent()}
      </div>

      {isSucceeded && (
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        </div>
      )}
    </div>
  )
}