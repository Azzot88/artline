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
    PlayIcon,
    XIcon,
    StarIcon,
    LockIcon,
    GlobeIcon,
    EyeOffIcon
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/polymet/components/language-provider"
import { useAuth } from "@/polymet/components/auth-provider"
import { useModels } from "@/hooks/use-models"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { apiService } from "@/polymet/data/api-service"
import { useState, useMemo, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface GenerationDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    generation: Generation | null
    onDelete?: (id: string) => void
    onUsePrompt?: (prompt: string) => void
}

export function GenerationDetailsDialog({ open, onOpenChange, generation, onDelete, onUsePrompt }: GenerationDetailsDialogProps) {
    const { t } = useLanguage()
    const { user } = useAuth()
    const { models } = useModels()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isPromptExpanded, setIsPromptExpanded] = useState(false)
    const [canDownload, setCanDownload] = useState(true) // Optimistic
    const [isCurated, setIsCurated] = useState(false)
    const [privacy, setPrivacy] = useState<string>('private')

    useEffect(() => {
        if (generation) {
            setIsCurated(generation.is_curated || false)
            if (generation.is_public) setPrivacy('public')
            else if (generation.is_private) setPrivacy('private')
            else setPrivacy('standard')
        }
    }, [generation])

    if (!generation) return null

    // Handlers
    const handlePrivacyChange = async (val: string) => {
        // Optimistic update
        setPrivacy(val)

        try {
            await api.patch(`/jobs/${generation.id}/privacy`, { visibility: val })
            toast.success(t('generationDetails.privacyUpdated') || "Privacy updated")

            // Allow admin to auto-curate if publishing? (Optional, kept separate for now)
        } catch (e) {
            console.error(e)
            toast.error("Failed to update privacy")
            // Revert state on error? (Simplified for MVP: user sees error)
        }
    }

    // Handlers
    const handleCopyPrompt = () => {
        if (!generation?.prompt) return
        navigator.clipboard.writeText(generation.prompt)
        toast.success(t('generationDetails.copied'))

        // Auto-use prompt if handler provided
        if (onUsePrompt) {
            onUsePrompt(generation.prompt)
        }
    }

    const handleDownload = async () => {
        try {
            // New Endpoint Logic
            const res = await api.get(`/jobs/${generation.id}/download`);
            if (res.url) {
                // If presigned URL, open it (browser handles download via Content-Disposition)
                const link = document.createElement('a');
                link.href = res.url;
                link.setAttribute('download', ''); // Hint
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success(t('generationDetails.downloadStarted'));
            } else {
                throw new Error("No URL returned");
            }
        } catch (e) {
            console.error("Download failed, trying direct fallback", e);
            // Fallback: Open original URL
            window.open(generation.url, '_blank');
        }
    }

    const handleDelete = async () => {
        if (!confirm(t('generationDetails.confirms.delete'))) return;

        setIsDeleting(true)
        try {
            await api.delete(`/jobs/${generation.id}`)
            toast.success(t('generationDetails.deleteSuccess'))
            onOpenChange(false)
            if (onDelete) onDelete(generation.id)
        } catch (e) {
            console.error("Delete failed", e)
            toast.error(t('generationDetails.deleteFailed'))
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCurate = async () => {
        if (!user?.is_admin || !generation) return

        try {
            const res = await apiService.toggleCurated(generation.id)
            setIsCurated(res.is_curated)
            toast.success(res.is_curated ? t('generationDetails.addToGallery') : t('generationDetails.removeFromGallery'))
        } catch (e) {
            toast.error(t('generationDetails.curationFailed'))
        }
    }

    // Metadata Prep
    const width = generation.width || 1024
    const height = generation.height || 1024
    const aspectRatio = (width / height).toFixed(2)
    const resolutionLabel = generation.kind === 'video' && height === 1080 ? '1080p (Full HD)' : `${width}x${height}`

    let fileExt = generation.url ? generation.url.split('.').pop()?.split('?')[0] || '' : '';
    if (generation.kind === 'video' && !fileExt) fileExt = 'mp4'
    if (generation.kind === 'image' && !fileExt) fileExt = 'webp'

    const cost = generation.credits_spent || 0
    const durationLabel = generation.duration ? `${Math.round(generation.duration)}s` : null

    // Prompt logic
    const isPromptLong = generation.prompt.length > 280 || generation.prompt.split('\n').length > 4

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl p-0 md:overflow-hidden overflow-y-auto bg-background/95 backdrop-blur-xl gap-0 border-border/40 shadow-2xl md:h-[85vh] h-auto max-h-[90vh] flex flex-col md:flex-row ring-1 ring-white/10" aria-describedby={undefined}>
                <DialogTitle className="sr-only">Details for generation {generation.id}</DialogTitle>

                {/* --- Mobile Close Button --- */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-50 md:hidden bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 backdrop-blur-md border border-white/10 shadow-lg"
                    onClick={() => onOpenChange(false)}
                >
                    <XIcon className="w-5 h-5" />
                    <span className="sr-only">Close</span>
                </Button>

                {/* --- LEFT: Media Viewport --- */}
                <div className="bg-black/95 flex items-center justify-center relative overflow-hidden md:flex-1 w-full md:h-full md:p-4 min-h-[300px] flex-shrink-0 group-media">
                    {/* Atmospheric Background Blur - Optimized */}
                    {/* Using will-change-transform and limiting blur radius helps performance */}
                    <div
                        className="absolute inset-0 opacity-20 blur-2xl pointer-events-none"
                        style={{
                            backgroundImage: `url(${generation.thumbnailUrl || generation.url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />

                    {/* ... rest of content ... */}

                    {/* Main Content - CONTAINED to ensure full visibility */}
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                        {generation.kind === 'video' ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <video
                                    src={generation.url}
                                    controls
                                    autoPlay
                                    loop
                                    className="max-w-full max-h-full w-full md:w-auto h-auto object-contain md:object-contain md:rounded-sm shadow-2xl box-shadow-xl ring-1 ring-white/10"
                                    poster={generation.thumbnailUrl}
                                />
                            </div>
                        ) : generation.kind === 'audio' ? (
                            <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-2xl p-8 flex flex-col items-center gap-8 border border-white/10 shadow-2xl m-8">
                                <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg animate-pulse-slow">
                                    <MusicIcon className="w-20 h-20 text-white" />
                                </div>
                                <div className="w-full space-y-4">
                                    {/* Audio Waveform Visualization */}
                                    <div className="flex items-center justify-center gap-1.5 h-16 w-full">
                                        {[...Array(40)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 bg-primary rounded-full transition-all duration-300"
                                                style={{
                                                    height: `${20 + Math.random() * 80}%`,
                                                    opacity: 0.5 + Math.random() * 0.5
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <audio src={generation.url} controls className="w-full" />
                                </div>
                            </div>
                        ) : (
                            <img
                                src={generation.url}
                                alt={generation.prompt}
                                className="w-full md:w-auto md:max-w-full h-auto md:max-h-full object-contain md:rounded-sm shadow-2xl ring-1 ring-white/10"
                            />
                        )}
                    </div>
                </div>

                {/* --- RIGHT: Information Sidebar --- */}
                <div className="w-full md:w-[420px] flex flex-col bg-background/50 backdrop-blur-md border-l border-border h-auto md:h-full">
                    <ScrollArea className="flex-1 w-full md:h-full" type={typeof window !== 'undefined' && window.innerWidth < 768 ? "always" : "hover"}>
                        <div className="p-6 space-y-8">

                            {/* Header Info */}
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="uppercase tracking-widest text-[10px] font-bold px-2 py-0.5 border-primary/20 text-primary">
                                            {generation.kind}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {new Date(generation.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold font-display tracking-tight leading-tight">
                                        {(generation.model_name || generation.model || t('generationDetails.unknownModel')).split('/').pop()?.split(':')[0].replace(/-/g, ' ') || "Generation"}
                                    </h3>
                                </div>
                                <div className="flex gap-1">
                                    {/* Action Shortcuts could go here */}
                                    {user?.is_admin && (
                                        <Button
                                            variant={isCurated ? "default" : "outline"}
                                            size="icon"
                                            className={cn("h-8 w-8", isCurated ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "")}
                                            onClick={handleCurate}
                                            title="Toggle for Community Gallery"
                                        >
                                            <StarIcon className={cn("w-4 h-4", isCurated ? "fill-current" : "")} />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Separator className="bg-border/40" />

                            {/* Prompt Block */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1 h-4 bg-primary rounded-full" />
                                        {t('generationDetails.prompt')}
                                    </h4>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted" onClick={handleCopyPrompt} title={t('generationDetails.title.copy')}>
                                        <CopyIcon className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                                <div className="relative group">
                                    <div className={cn(
                                        "p-4 rounded-xl bg-muted/40 border border-border/50 text-sm leading-relaxed text-foreground transition-all duration-300 font-medium break-words whitespace-pre-wrap",
                                        !isPromptExpanded && isPromptLong && "max-h-[140px] overflow-hidden mask-bottom-gradient"
                                    )}>
                                        {generation.prompt}
                                    </div>
                                    {isPromptLong && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full mt-1 h-8 text-xs text-primary hover:text-primary/80 hover:bg-transparent justify-center gap-1"
                                            onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                                        >
                                            {isPromptExpanded ? (
                                                <>{t('generationDetails.readLess')} <ChevronUpIcon className="w-3 h-3" /></>
                                            ) : (
                                                <>{t('generationDetails.readMore')} <ChevronDownIcon className="w-3 h-3" /></>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <MetaItem
                                    icon={BoxIcon}
                                    label={t('generationDetails.model')}
                                    value={
                                        // Try to find model name from context or direct prop
                                        // We need to access models list to map ID -> Name if model_name is missing
                                        // For now, let's use generation.model_name (which might be populated soon) or fallback to ID
                                        // But per task, use ID lookup if possible.
                                        // Actually, let's assume generation.model_name will be passed or we use model_id.
                                        // Since we don't have 'models' context easily here without importing hook,
                                        // Let's rely on generation fields first. 
                                        // Wait, user asked: "Should be the model name specified in the admin properties"
                                        // I should import useModels hook here to be safe?
                                        // Let's import useModels to do the lookup.
                                        (models.find(m => m.id === generation.model_id)?.name || generation.model_name || generation.model_id || t('generationDetails.unknownModel')).replace(/:.*/, '') || t('generationDetails.unknownModel')
                                    }
                                    subValue={generation.model_id ? "ID: " + generation.model_id.slice(0, 8) + "..." : undefined}
                                />
                                <MetaItem
                                    icon={MaximizeIcon}
                                    label={t('generationDetails.resolution')}
                                    value={resolutionLabel}
                                    subValue={aspectRatio ? `${aspectRatio} ${t('generationDetails.aspectRatio')}` : 'Unknown AR'}
                                />
                                <MetaItem
                                    icon={FileImageIcon}
                                    label={t('generationDetails.format')}
                                    value={fileExt.toUpperCase()}
                                />
                                {durationLabel && (
                                    <MetaItem
                                        icon={ClockIcon}
                                        label={t('generationDetails.duration')}
                                        value={durationLabel}
                                    />
                                )}
                                <MetaItem
                                    icon={CoinsIcon}
                                    label={t('generationDetails.cost')}
                                    value={cost > 0 ? `${cost} ${t('generationDetails.units.credits')}` : 'Free'}
                                    className="text-indigo-400 font-bold"
                                />
                            </div>

                            {/* Error State */}
                            {generation.status === 'failed' && (
                                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex gap-3 items-start">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="font-semibold text-sm">{t('generationDetails.generationFailed')}</p>
                                        <p className="text-xs opacity-90">{t('workbench.toasts.genFailed')}</p>
                                    </div>
                                </div>
                            )}

                        </div>
                    </ScrollArea>

                    {/* Footer Actions */}
                    <div className="p-6 bg-muted/20 border-t border-border space-y-4">

                        {/* Privacy Control (User) */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", privacy === 'private' ? "bg-indigo-500/10 text-indigo-500" : "bg-muted text-muted-foreground")}>
                                    {privacy === 'private' ? <EyeOffIcon className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-sm font-medium leading-none">
                                        {t('generationDetails.privacy.privateMode') || "Приватный режим"}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        {privacy === 'private'
                                            ? (t('generationDetails.privacy.hiddenDesc') || "Видно только вам")
                                            : (t('generationDetails.privacy.visibleDesc') || "Видно вам и админам")}
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={privacy === 'private'}
                                onCheckedChange={(checked) => handlePrivacyChange(checked ? 'private' : 'standard')}
                                disabled={privacy === 'public' && !user?.is_admin}
                            />
                        </div>

                        {/* Admin Public Control Extension */}
                        {user?.is_admin && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <GlobeIcon className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-medium leading-none text-amber-600 dark:text-amber-400">
                                            {t('generationDetails.privacy.publicMode') || "Публикация"}
                                        </div>
                                        <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
                                            {t('generationDetails.privacy.publicDesc') || "Доступно всем в галерее"}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={privacy === 'public'}
                                    onCheckedChange={(checked) => handlePrivacyChange(checked ? 'public' : 'private')}
                                    className="data-[state=checked]:bg-amber-500"
                                />
                            </div>
                        )}

                        <Button className="w-full shadow-lg shadow-primary/20 font-semibold" size="lg" onClick={handleDownload}>
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            {t('generationDetails.download')} {fileExt.toUpperCase()}
                        </Button>

                        <Button variant="outline" className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors" onClick={handleDelete} disabled={isDeleting}>
                            <Trash2Icon className="w-4 h-4 mr-2 opacity-70" />
                            {isDeleting ? t('generationDetails.deleting') : t('generationDetails.deleteFromLibrary')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Updated MetaItem with lucide-react icon type ref
function MetaItem({ icon: Icon, label, value, subValue, className }: { icon: any, label: string, value: string, subValue?: string, className?: string }) {
    return (
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-border/60 transition-colors">
            <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
                <Icon className="w-3 h-3 text-muted-foreground/70" />
                {label}
            </span>
            <span className={cn("text-sm font-semibold truncate", className)} title={value}>
                {value}
            </span>
            {subValue && (
                <span className="text-[10px] text-muted-foreground/60 font-mono truncate">
                    {subValue}
                </span>
            )}
        </div>
    )
}
