import { useState, useEffect } from "react"
import { GenerationCard } from "@/polymet/components/generation-card"
import { GenerationDetailsDialog } from "@/polymet/components/generation-details-dialog"
import { SparklesIcon, Loader2, ImageIcon } from "lucide-react"
import { useLanguage } from "@/polymet/components/language-provider"
import { api } from "@/lib/api"
import { Generation } from "@/polymet/data/types"

export function Library() {
    const { t } = useLanguage()
    const [generations, setGenerations] = useState<Generation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchMyJobs = async () => {
            try {
                setLoading(true)
                // Fetch user's personal jobs
                const data = await api.get<any[]>("/jobs")

                if (Array.isArray(data)) {
                    const mapped = data.map((job: any) => {
                        // Basic Aspect Ratio Logic
                        let width = 1024;
                        let height = 1024;
                        if (job.format === "portrait") { width = 768; height = 1024; }
                        if (job.format === "landscape") { width = 1024; height = 768; }

                        // Clean prompt
                        let cleanPrompt = job.prompt || "";
                        if (cleanPrompt.includes("|")) {
                            cleanPrompt = cleanPrompt.split("|").pop().trim();
                        } else if (cleanPrompt.startsWith("[")) {
                            cleanPrompt = cleanPrompt.replace(/\[.*?\]\s*/, "").trim();
                        }

                        return {
                            id: job.id,
                            url: job.result_url || job.image,
                            image: job.result_url || job.image,

                            prompt: cleanPrompt,
                            model: job.model_id || "Flux",
                            provider: "replicate",

                            credits: job.credits_spent || 1,
                            likes: job.likes || 0,
                            views: job.views || 0,

                            userName: "Me",
                            userAvatar: "https://github.com/shadcn.png", // specific avatar if available

                            width: width,
                            height: height,
                            type: job.kind,
                            kind: job.kind,
                            timestamp: job.created_at,

                            // Status specific to personal library
                            status: job.status
                        }
                    })
                    setGenerations(mapped)
                }
            } catch (e) {
                console.error("Failed to fetch library", e)
            } finally {
                setLoading(false)
            }
        }
        fetchMyJobs()
    }, [])

    const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleCardClick = (gen: Generation) => {
        setSelectedGeneration(gen)
        setIsDialogOpen(true)
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">{t('common.library') || "Library"}</h1>
                    <p className="text-sm text-muted-foreground">
                        Your personal collection of generations
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : generations.length === 0 ? (
                <div className="text-center py-20 border rounded-lg bg-muted/20 border-dashed">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">No generations yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                        Create your first masterpiece in the Workbench to see it appear here.
                    </p>
                </div>
            ) : (
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 px-1">
                    {generations.map((gen) => (
                        <GenerationCard
                            key={gen.id}
                            generation={gen}
                            onClick={handleCardClick}
                        />
                    ))}
                </div>
            )}

            <GenerationDetailsDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                generation={selectedGeneration}
                onDelete={(id) => {
                    setGenerations(prev => prev.filter(g => g.id !== id))
                }}
            />
        </div>
    )
}
