import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Generation } from "@/polymet/data/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DownloadIcon, Share2Icon, CopyIcon, CalendarIcon, FileImageIcon, BoxIcon, MaximizeIcon, Trash2Icon } from "lucide-react"
import { useLanguage } from "@/polymet/components/language-provider"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useState } from "react"

interface GenerationDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    generation: Generation | null
    onDelete?: (id: string) => void
}

export function GenerationDetailsDialog({ open, onOpenChange, generation, onDelete }: GenerationDetailsDialogProps) {
    const { t } = useLanguage()
    const [isDeleting, setIsDeleting] = useState(false)

    if (!generation) return null

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(generation.prompt)
        toast.success("Prompt copied to clipboard")
    }

    const handleDownload = async () => {
        try {
            // Force download by fetching blob
            const response = await fetch(generation.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            // Guess extension
            const ext = generation.type === 'video' ? 'mp4' : 'png';
            link.download = `generation-${generation.id}.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Download failed", e)
            toast.error("Failed to download file")
            // Fallback
            window.open(generation.url, '_blank')
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this file? This cannot be undone.")) return;

        setIsDeleting(true)
        try {
            await api.delete(`/jobs/${generation.id}`)
            toast.success("File deleted")
            onOpenChange(false)
            if (onDelete) onDelete(generation.id)
        } catch (e) {
            console.error("Delete failed", e)
            toast.error("Failed to delete file")
        } finally {
            setIsDeleting(false)
        }
    }

    const aspectRatio = `${generation.width}x${generation.height}`

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
                <div className="flex flex-col md:flex-row h-[80vh] md:h-[600px]">
                    {/* Image Section - Dark Background */}
                    <div className="flex-1 bg-black/5 flex items-center justify-center p-4 relative overflow-hidden">

                        {generation.type === 'video' ? (
                            <video
                                src={generation.url}
                                controls
                                className="max-w-full max-h-full object-contain rounded-sm shadow-sm"
                            />
                        ) : (
                            <img
                                src={generation.url}
                                alt={generation.prompt}
                                className="max-w-full max-h-full object-contain rounded-sm shadow-sm"
                            />
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="w-full md:w-96 p-6 flex flex-col border-l border-border bg-background overflow-y-auto">

                        {/* Header */}
                        <div className="mb-6 space-y-2">
                            <h3 className="font-semibold text-lg leading-tight">Generation Details</h3>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="text-xs font-mono">
                                    {generation.model}
                                </Badge>
                                {generation.type === "video" && (
                                    <Badge className="text-xs bg-primary/90">Video</Badge>
                                )}
                            </div>
                        </div>

                        {/* Prompt */}
                        <div className="flex-1 space-y-4 mb-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prompt</label>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyPrompt} title="Copy Prompt">
                                        <CopyIcon className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                                <p className="text-sm leading-relaxed text-foreground p-3 bg-muted/30 rounded-md border border-border/50">
                                    {generation.prompt}
                                </p>
                            </div>

                            <Separator />

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <MaximizeIcon className="w-3 h-3" /> Resolution
                                    </label>
                                    <p className="text-sm font-medium">{aspectRatio}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <FileImageIcon className="w-3 h-3" /> Format
                                    </label>
                                    <p className="text-sm font-medium uppercase">{generation.url.split('.').pop() || "PNG"}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <BoxIcon className="w-3 h-3" /> Model
                                    </label>
                                    <p className="text-sm font-medium">{generation.model}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <CalendarIcon className="w-3 h-3" /> Date
                                    </label>
                                    <p className="text-sm font-medium">
                                        {new Date(generation.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="mt-auto pt-4 space-y-2 border-t border-border">
                            <Button className="w-full" onClick={handleDownload}>
                                <DownloadIcon className="w-4 h-4 mr-2" />
                                Download
                            </Button>

                            <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={isDeleting}>
                                <Trash2Icon className="w-4 h-4 mr-2" />
                                {isDeleting ? "Deleting..." : "Delete File"}
                            </Button>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
