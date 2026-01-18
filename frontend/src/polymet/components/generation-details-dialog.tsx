import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Generation } from "@/polymet/data/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DownloadIcon,
    Share2Icon,
    CopyIcon,
    CalendarIcon,
    FileImageIcon,
    BoxIcon,
    MaximizeIcon,
    Trash2Icon,
    ClockIcon,
    CoinsIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    MusicIcon,
    PlayIcon
} from "lucide-react"
import { useLanguage } from "@/polymet/components/language-provider"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useState, useMemo, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface GenerationDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    generation: Generation | null
    onDelete?: (id: string) => void
}

export function GenerationDetailsDialog({ open, onOpenChange, generation, onDelete }: GenerationDetailsDialogProps) {
    const { t } = useLanguage()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isPromptExpanded, setIsPromptExpanded] = useState(false)
    const [isPromptOverflowing, setIsPromptOverflowing] = useState(false)
    const promptRef = useRef<HTMLParagraphElement>(null)

    // Reset states when generation changes
    useEffect(() => {
        setIsPromptExpanded(false)
        if (generation && promptRef.current) {
            // Simple check: if scrolling height > client height (assuming line clamp limits height)
            // But with line-clamp, clientHeight is limited. scrollHeight would be full.
            // A safer way is to check char count or line count approximation.
            // For now, let's assume > 300 chars is "long".
            setIsPromptOverflowing(generation.prompt.length > 300)
        }
    }, [generation])

    if (!generation) return null

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(generation.prompt)
        toast.success(t('generationDetails.copied') || "Copied to clipboard")
    }

    const handleDownload = async () => {
        try {
            // Create a temporary anchor to trigger download
            // If CORS allows value-added features, fetch blob. Otherwise direct link.
            const response = await fetch(generation.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // derive filename
            const ext = generation.url.split('.').pop()?.split('?')[0] || 'png';
            a.download = `generation-${generation.id}.${ext}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error("Download fallback", e);
            window.open(generation.url, '_blank');
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this file? This cannot be undone.")) return;

        setIsDeleting(true)
        try {
            await api.delete(`/jobs/${generation.id}`)
            toast.success(t('generationDetails.delete') + " success")
            onOpenChange(false)
            if (onDelete) onDelete(generation.id)
        } catch (e) {
            console.error("Delete failed", e)
            toast.error("Failed to delete file")
        } finally {
            setIsDeleting(false)
        }
    }

    // Metadata Calculation
    const width = generation.width || 1024
    const height = generation.height || 1024
    const aspectRatio = (width / height).toFixed(2)
    const resolutionLabel = generation.kind === 'video' ? '1080p (Full HD)' : `${width}x${height} px`

    // Determine file extension
    let fileExt = generation.url.split('.').pop()?.split('?')[0] || ''
    if (generation.kind === 'video' && !fileExt) fileExt = 'mp4'
    if (generation.kind === 'image' && !fileExt) fileExt = 'webp'

    // Cost display
    const cost = generation.credits_spent || 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background gap-0 border-none shadow-2xl md:h-[85vh] h-[95vh] flex flex-col md:flex-row">
                <DialogTitle className="sr-only">Generation Details</DialogTitle>

                {/* --- LEFT: Media Preview --- */}
                <div className="flex-1 bg-black/95 flex items-center justify-center p-4 relative overflow-hidden md:h-full h-[40vh]">
                    {/* Background Blur */}
                    <div
                        className="absolute inset-0 opacity-20 blur-3xl scale-125"
                        style={{ backgroundImage: `url(${generation.kind === 'video' ? (generation.thumbnailUrl || generation.url) : generation.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />

                    {/* Content */}
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                        {generation.kind === 'video' ? (
                            <video
                                src={generation.url}
                                controls
                                autoPlay
                                loop
                                className="max-w-full max-h-full object-contain rounded shadow-2xl"
                            />
                        ) : generation.kind === 'audio' || (generation as any).type === 'audio' ? (
                            <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-xl p-8 flex flex-col items-center gap-6">
                                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                                    <MusicIcon className="w-16 h-16 text-primary" />
                                </div>
                                <div className="w-full space-y-2">
                                    {/* Fake Waveform Visual */}
                                    <div className="flex items-center justify-between gap-1 h-12">
                                        {[...Array(30)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 bg-primary/60 rounded-full"
                                                style={{
                                                    height: `${30 + Math.random() * 70}%`,
                                                    opacity: 0.6 + Math.random() * 0.4
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <audio src={generation.url} controls className="w-full mt-4" />
                                </div>
                            </div>
                        ) : (
                            <img
                                src={generation.url}
                                alt={generation.prompt}
                                className="max-w-full max-h-full object-contain rounded shadow-2xl"
                            />
                        )}
                    </div>
                </div>

                {/* --- RIGHT: Details Sidebar --- */}
                <div className="w-full md:w-[400px] flex flex-col bg-background border-l border-border h-full">
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-6">

                            {/* Header */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="px-3 py-1 font-mono text-xs uppercase tracking-wider">
                                        {generation.kind}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-mono">
                                        {new Date(generation.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Status Alert if failed */}
                                {generation.status === 'failed' && (
                                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 flex items-start gap-2">
                                        <div className="mt-0.5">⚠️</div>
                                        <div>
                                            <p className="font-semibold">{t('generationDetails.status.failed')}</p>
                                            <p className="opacity-80 text-xs">Generation failed to complete.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Prompt Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        {t('generationDetails.prompt')}
                                    </label>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1.5 hover:bg-muted" onClick={handleCopyPrompt}>
                                        <CopyIcon className="w-3 h-3" />
                                        {t('generationDetails.copyPrompt')}
                                    </Button>
                                </div>

                                <div className="bg-muted/30 rounded-lg p-3 border border-border/50 group relative">
                                    <p
                                        ref={promptRef}
                                        className={cn(
                                            "text-sm leading-relaxed text-foreground whitespace-pre-wrap transition-all duration-300",
                                            !isPromptExpanded && "line-clamp-5"
                                        )}
                                    >
                                        {generation.prompt}
                                    </p>
                                    {/* Read More Trigger (always show if long) */}
                                    {generation.prompt.length > 200 && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 mt-2 text-xs text-primary font-medium"
                                            onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                                        >
                                            {isPromptExpanded ? (
                                                <span className="flex items-center gap-1">{t('generationDetails.readLess')}<ChevronUpIcon className="w-3 h-3" /></span>
                                            ) : (
                                                <span className="flex items-center gap-1">{t('generationDetails.readMore')}<ChevronDownIcon className="w-3 h-3" /></span>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                <MetaItem
                                    icon={<BoxIcon />}
                                    label={t('generationDetails.model')}
                                    value={generation.model_name || generation.model_id || "Unknown"}
                                />
                                <MetaItem
                                    icon={<MaximizeIcon />}
                                    label={t('generationDetails.resolution')}
                                    value={resolutionLabel}
                                    subValue={`Aspect Ratio ${width}:${height} (${Number(width) / Number(height) > 1 ? 'Landscape' : 'Portrait'})`}
                                />
                                <MetaItem
                                    icon={<FileImageIcon />}
                                    label={t('generationDetails.format')}
                                    value={fileExt.toUpperCase()}
                                />
                                {generation.duration && (
                                    <MetaItem
                                        icon={<ClockIcon />}
                                        label={t('generationDetails.duration')}
                                        value={`${generation.duration}s`}
                                    />
                                )}
                                <MetaItem
                                    icon={<CoinsIcon />}
                                    label={t('generationDetails.cost')}
                                    value={`${cost} Credits`}
                                    className="text-primary font-medium"
                                />
                                <MetaItem
                                    icon={<CalendarIcon />}
                                    label={t('generationDetails.date')}
                                    value={new Date(generation.created_at).toLocaleString()}
                                />
                            </div>

                        </div>
                    </ScrollArea>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-border bg-muted/10 space-y-3">
                        <Button className="w-full gap-2 font-medium" size="lg" onClick={handleDownload}>
                            <DownloadIcon className="w-4 h-4" />
                            {t('generationDetails.download')}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full gap-2 text-destructive hover:text-destructive border-transparent hover:bg-destructive/10"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Trash2Icon className="w-4 h-4" />
                            {isDeleting ? "Deleting..." : t('generationDetails.delete')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function MetaItem({ icon, label, value, subValue, className }: { icon: React.ReactNode, label: string, value: string, subValue?: string, className?: string }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full opacity-70">{icon}</span>
                {label}
            </label>
            <div>
                <p className={cn("text-sm font-semibold text-foreground", className)}>{value}</p>
                {subValue && <p className="text-[10px] text-muted-foreground mt-0.5">{subValue}</p>}
            </div>
        </div>
    )
}
