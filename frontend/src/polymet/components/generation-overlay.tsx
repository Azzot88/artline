import { Loader2, SparklesIcon } from "lucide-react"
import { motion } from "framer-motion"

interface GenerationOverlayProps {
    isVisible: boolean
    status: string // 'queued', 'processing', 'succeeded', 'failed'
    progress?: number
    logs?: string
}

export function GenerationOverlay({ isVisible, status, progress, logs }: GenerationOverlayProps) {
    if (!isVisible) return null

    // extract last meaningful log line
    const getLastLog = (text?: string) => {
        if (!text) return null
        const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0)
        if (lines.length === 0) return null
        return lines[lines.length - 1]
    }

    const logStatus = getLastLog(logs)


    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border border-border">
            <div className="flex flex-col items-center gap-4 p-8 max-w-sm text-center">

                {/* Animated Icon */}
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                </div>

                {/* Status Text */}
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold tracking-tight">
                        Generating...
                    </h3>
                    <p className="text-sm text-muted-foreground animate-pulse text-center max-w-[250px] truncate">
                        {logStatus || (status === 'queued' ? "Waiting for GPU..." : "Creating your masterpiece...")}
                    </p>
                </div>

                {/* Progress Bar (Fake or Real) */}
                <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden mt-2">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{
                            width: status === 'queued' ? "10%" : "90%",
                            transition: {
                                duration: status === 'queued' ? 2 : 8,
                                repeat: status === 'queued' ? Infinity : 0,
                                repeatType: "reverse"
                            }
                        }}
                    />
                </div>

                {/* Hints */}
                <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                    <SparklesIcon className="w-3 h-3 text-amber-500" />
                    <span>AI is dreaming...</span>
                </div>

            </div>
        </div>
    )
}
