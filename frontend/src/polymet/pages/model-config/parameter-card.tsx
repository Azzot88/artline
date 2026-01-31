
import { useState, useEffect } from "react"
import { UIParameter } from "@/polymet/data/api-types"
import { ModelParameterConfig, ParameterValue } from "@/polymet/data/types"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDownIcon, ChevronUpIcon, RefreshCw } from "lucide-react"

import { ParameterValuesList } from "./components/parameter-values-list"

interface ParameterCardProps {
    param: UIParameter
    config: ModelParameterConfig
    onConfigChange: (paramId: string, newConfig: Partial<ModelParameterConfig>) => void
}

export function ParameterCard({ param, config, onConfigChange, onSync }: ParameterCardProps) {
    const [expanded, setExpanded] = useState(false)
    const isVisible = config.enabled !== false

    // Initialize Values if empty
    // If config.values is present, use it.
    // Else, if type is select, init from param.options
    // Else, if type is integer, init from default?
    const [values, setValues] = useState<ParameterValue[]>(
        config.values || initValues(param, config)
    )

    // Sync local values to parent config when they change
    useEffect(() => {
        // Debounce or direct? Direct for now, parent handles state.
        // Actually, we should only call onConfigChange when values change meaningfully
        // But doing it here might cause loops if parent updates prop.
        // Better: onChange prop in ValuesList calls onConfigChange directly.
    }, [])

    const handleValuesChange = (newValues: ParameterValue[]) => {
        setValues(newValues)
        // Immediate sync? Or wait for save? 
        // Sync configs
        onConfigChange(param.id, { values: newValues })
    }

    const handleSync = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onSync) {
            setIsSyncing(true)
            await onSync(param.id)
            setIsSyncing(false)
        }
    }

    // Border Logic for Card
    // Green: Visible
    // Gray: Hidden
    // (Orange concept applies more to specific values, but here could mean restricted visibility? 
    //  For now, param-level visibility is binary: Visible or Not).
    const borderClass = isVisible
        ? "border-l-primary shadow-sm"  // Active 
        : "border-l-muted opacity-60 grayscale-[0.5]" // Inactive

    return (
        <Card className={cn(
            "transition-all duration-300 border-l-4 group/card",
            borderClass,
            expanded ? "ring-1 ring-primary/20 shadow-md" : "hover:shadow-md"
        )}>
            {/* Header */}
            <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-muted/50 text-xs font-mono font-bold text-muted-foreground">
                        {param.type.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold">{config.custom_label || param.label}</div>
                            {onSync && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 text-muted-foreground hover:text-primary"
                                    onClick={handleSync}
                                    title="Sync this parameter with model schema"
                                >
                                    <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
                                </Button>
                            )}
                        </div>
                        <div className="text-[10px] text-muted-foreground leading-tight max-w-[300px] line-clamp-2" title={param.description}>
                            {param.description || param.id}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Badge variant="outline" className="text-[10px] h-5 hidden sm:flex">
                        {values.filter(v => v.enabled).length} Enabled
                    </Badge>
                    <Switch
                        checked={isVisible}
                        onCheckedChange={(c) => onConfigChange(param.id, { enabled: c })}
                        className="scale-75"
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => setExpanded(!expanded)}>
                        {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    </Button>
                </div>
            </CardHeader>

            {/* Expanded Content */}
            {expanded && (
                <CardContent className="p-4 pt-0 border-t bg-muted/5 space-y-6">
                    {/* 1. Basic Settings */}
                    <div className="grid gap-4 pt-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Display Label</Label>
                            <Input
                                value={config.custom_label || ""}
                                onChange={(e) => onConfigChange(param.id, { custom_label: e.target.value })}
                                placeholder={param.label}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Help Text (Tooltip)</Label>
                            <Textarea
                                value={config.custom_description || ""}
                                onChange={(e) => onConfigChange(param.id, { custom_description: e.target.value })}
                                placeholder={param.description}
                                className="h-8 min-h-[32px] text-sm py-1"
                            />
                        </div>
                    </div>

                    {/* 2. Value Configuration */}
                    <ParameterValuesList
                        values={values}
                        type={param.type}
                        min={param.min}
                        max={param.max}
                        onChange={handleValuesChange}
                    />
                </CardContent>
            )}
        </Card>
    )
}

// Init Helper with Merge Logic
function initValues(param: UIParameter, config: ModelParameterConfig): ParameterValue[] {
    const savedValues = config.values || []

    // 1. If Select/Enum type: Merge Schema Options with Saved Values
    if (param.options) {
        return param.options.map(opt => {
            // Check if we have a saved config for this value
            const saved = savedValues.find(v => v.value === opt.value)

            if (saved) {
                return saved
            }

            // Not saved yet -> Auto-discover as "Available but Unconfigured"
            // Rule: Default to Enabled for discovery, Price 0, All Tiers
            // But if there IS a saved config (meaning user has edited *some* values), 
            // should we default new ones to disabled? 
            // User requested: "Admin configures...". Let's default to Enabled so they see it.
            return {
                value: opt.value,
                label: opt.label, // Use schema label as default
                enabled: true,    // Default enabled for discovery
                is_default: opt.value === param.default,
                price: 0.0,
                access_tiers: ["starter", "pro", "studio"]
            }
        })
    }

    // 2. For Integer/Range, just use saved values. 
    // If NO saved values, init with default if exists
    if ((param.type === 'integer' || param.type === 'number')) {
        if (savedValues.length > 0) return savedValues

        if (param.default !== undefined) {
            return [{
                value: param.default,
                label: `${param.default}`,
                enabled: true,
                is_default: true,
                price: 0.0,
                access_tiers: ["starter", "pro", "studio"]
            }]
        }
    }

    return savedValues
}
