
import { cn } from "@/lib/utils"

interface TierBadgeProps {
    tier: string
    active: boolean
    onClick?: () => void
    size?: "sm" | "md" | "lg"
}

export function TierBadge({ tier, active, onClick, size = "md" }: TierBadgeProps) {
    const isInteractive = !!onClick

    // Base Colors
    const tiers: Record<string, string> = {
        starter: "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300",
        pro: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300",
        studio: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
    }

    // Active State Colors (Vibrant)
    const activeTiers: Record<string, string> = {
        starter: "bg-zinc-600 text-white hover:bg-zinc-700 dark:bg-zinc-600",
        pro: "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600",
        studio: "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600"
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
