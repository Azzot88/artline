
import { cn } from "@/lib/utils"

interface TierBadgeProps {
    tier: string
    active: boolean
    onClick?: () => void
    size?: "sm" | "md" | "lg"
}

export function TierBadge({ tier, active, onClick, size = "md" }: TierBadgeProps) {
    const isInteractive = !!onClick

    // Base Colors (Inactive / Outline)
    const tiers: Record<string, string> = {
        starter: "bg-zinc-100/80 text-zinc-600 border border-transparent hover:border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400",
        pro: "bg-violet-50/50 text-violet-600 border border-transparent hover:border-violet-300 dark:bg-violet-900/10 dark:text-violet-300",
        studio: "bg-amber-50/50 text-amber-600 border border-transparent hover:border-amber-300 dark:bg-amber-900/10 dark:text-amber-300"
    }

    // Active State Colors (Vibrant Gradients)
    const activeTiers: Record<string, string> = {
        starter: "bg-zinc-600 text-white shadow-sm hover:bg-zinc-700 dark:bg-zinc-600",
        pro: "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm hover:from-violet-600 hover:to-indigo-700",
        studio: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm hover:from-amber-500 hover:to-orange-600"
    }

    const baseClass = active ? activeTiers[tier] : tiers[tier]

    return (
        <div
            onClick={onClick}
            className={cn(
                "rounded-full font-medium transition-all duration-200 flex items-center justify-center select-none",
                // Sizes
                size === "sm" && "text-[9px] px-1.5 h-4",
                size === "md" && "text-[10px] px-2.5 py-0.5 h-6",
                size === "lg" && "text-xs px-3 py-1 h-7",
                // State
                isInteractive && "cursor-pointer active:scale-95",
                !active && "opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0",
                baseClass
            )}
            title={active ? `${tier.toUpperCase()} Access Enabled` : `${tier.toUpperCase()} Access Disabled`}
        >
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </div>
    )
}
