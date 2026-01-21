import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DualSliderProps {
    value: [number, number]
    min: number
    max: number
    step?: number
    onValueChange: (value: [number, number]) => void
    label?: string
    className?: string
    disabled?: boolean
}

export function DualSlider({
    value,
    min,
    max,
    step = 1,
    onValueChange,
    label,
    className,
    disabled
}: DualSliderProps) {
    // Ensure value is valid
    const safeValue = React.useMemo(() => {
        return [
            Math.max(min, Math.min(max, value[0])),
            Math.max(min, Math.min(max, value[1]))
        ] as [number, number]
    }, [value, min, max])

    return (
        <div className={cn("space-y-3", className)}>
            {label && (
                <div className="flex justify-between items-center">
                    <Label>{label}</Label>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {safeValue[0]} - {safeValue[1]}
                    </span>
                </div>
            )}

            <div className="flex items-center gap-4">
                <Input
                    type="number"
                    className="w-20 h-8"
                    value={safeValue[0]}
                    min={min}
                    max={safeValue[1]}
                    step={step}
                    onChange={(e) => {
                        const val = Number(e.target.value)
                        if (!isNaN(val)) onValueChange([val, safeValue[1]])
                    }}
                    disabled={disabled}
                />

                <Slider
                    value={[safeValue[0], safeValue[1]]}
                    min={min}
                    max={max}
                    step={step}
                    onValueChange={(vals) => onValueChange(vals as [number, number])}
                    disabled={disabled}
                    className="flex-1"
                />

                <Input
                    type="number"
                    className="w-20 h-8"
                    value={safeValue[1]}
                    min={safeValue[0]}
                    max={max}
                    step={step}
                    onChange={(e) => {
                        const val = Number(e.target.value)
                        if (!isNaN(val)) onValueChange([safeValue[0], val])
                    }}
                    disabled={disabled}
                />
            </div>
        </div>
    )
}
