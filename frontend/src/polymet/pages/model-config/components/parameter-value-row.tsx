
import { ParameterValue } from "@/polymet/data/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StarIcon, MoreVerticalIcon, CopyIcon, TrashIcon } from "lucide-react"
import { TierBadge } from "./tier-badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ParameterValueRowProps {
    value: ParameterValue
    onUpdate: (updates: Partial<ParameterValue>) => void
    onDelete?: () => void
    canDelete?: boolean
}

export function ParameterValueRow({ value, onUpdate, onDelete, canDelete }: ParameterValueRowProps) {
    const tiers = ["starter", "pro", "studio"]

    const toggleTier = (tier: string) => {
        const current = value.access_tiers || []
        const next = current.includes(tier)
            ? current.filter(t => t !== tier)
            : [...current, tier]
        onUpdate({ access_tiers: next })
    }

    return (
        <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all group",
            value.enabled ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-muted opacity-80"
        )}>
            {/* 1. Master Toggle */}
            <Checkbox
                checked={value.enabled}
                onCheckedChange={(c) => onUpdate({ enabled: c as boolean })}
                className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            />

            {/* 2. Label & Price */}
            <div className="flex-1 grid grid-cols-[1fr,120px] gap-4 items-center">
                <div className="flex flex-col gap-1">
                    <Input
                        value={value.label || String(value.value)}
                        onChange={(e) => onUpdate({ label: e.target.value })}
                        className="h-7 text-xs font-medium border-transparent hover:border-input focus:border-input bg-transparent px-1"
                        placeholder="Label"
                    />
                    <div className="text-[10px] text-muted-foreground font-mono px-1">
                        Val: {String(value.value)}
                    </div>
                </div>

                <div className="relative">
                    <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">💰</span>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={value.price}
                        onChange={(e) => onUpdate({ price: parseFloat(e.target.value) })}
                        className="h-7 pl-6 text-xs w-full"
                    />
                </div>
            </div>

            {/* 3. Tiers */}
            <div className="flex items-center gap-1.5 px-2 border-l border-r h-8">
                {tiers.map(t => (
                    <TierBadge
                        key={t}
                        tier={t}
                        active={value.access_tiers.includes(t)}
                        onClick={() => toggleTier(t)}
                        size="sm"
                    />
                ))}
            </div>

            {/* 4. Default Marker */}
            <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", value.is_default ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground opacity-20 hover:opacity-100")}
                onClick={() => onUpdate({ is_default: !value.is_default })}
                title={value.is_default ? "Default Value" : "Set as Default"}
            >
                <StarIcon className={cn("w-4 h-4", value.is_default && "fill-current")} />
            </Button>

            {/* 5. Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVerticalIcon className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {canDelete && (
                        <DropdownMenuItem onClick={onDelete} className="text-destructive">
                            <TrashIcon className="w-4 h-4 mr-2" /> Delete Value
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
