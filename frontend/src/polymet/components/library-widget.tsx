import { useState, useEffect, useRef } from "react"
import { GenerationCard } from "@/polymet/components/generation-card"
import { SparklesIcon, Loader2, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { useLanguage } from "@/polymet/components/language-provider"
import { api } from "@/lib/api"
import { Generation } from "@/polymet/data/types"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area" // Assuming shadcn scroll area exists, or use native div
import { Button } from "@/components/ui/button"

interface LibraryWidgetProps {
    refreshTrigger: number
}

export function LibraryWidget({ refreshTrigger }: LibraryWidgetProps) {
    const { t } = useLanguage()
    const [generations, setGenerations] = useState<Generation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchMyJobs = async () => {
            try {
                setLoading(true)
                const data = await api.get<any[]>("/jobs")

                if (Array.isArray(data)) {
                    // Sort by creation date desc if not already
                    // data.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

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
                            userAvatar: "https://github.com/shadcn.png",
                            width: width,
                            height: height,
                            type: job.kind,
                            kind: job.kind,
                            timestamp: job.created_at,
                            status: job.status
                        }
                    })
                    setGenerations(mapped)
                }
            } catch (e) {
                console.error("Failed to fetch library widget", e)
            } finally {
                setLoading(false)
            }
        }
        fetchMyJobs()
    }, [refreshTrigger])

    if (!loading && generations.length === 0) {
        return null
    }

    return (
        <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <SparklesIcon className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('libraryWidget.title')}</h3>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                    <Link to="/library" className="flex items-center gap-1">
                        {t('libraryWidget.viewAll')}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="relative">
                    {/* Horizontal Scroll Container */}
                    <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        {generations.slice(0, 10).map((gen) => (
                            <div key={gen.id} className="flex-none w-[280px] snap-start">
                                <GenerationCard generation={gen} />
                            </div>
                        ))}

                        {/* View More Card */}
                        {generations.length > 5 && (
                            <div className="flex-none w-[100px] flex items-center justify-center snap-start">
                                <Link
                                    to="/library"
                                    className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors p-4"
                                >
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-medium whitespace-nowrap">{t('libraryWidget.viewAll')}</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
