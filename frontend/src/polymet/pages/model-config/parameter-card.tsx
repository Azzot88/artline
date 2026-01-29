
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
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { ParameterValuesList } from "./components/parameter-values-list"

interface ParameterCardProps {
    param: UIParameter
    config: ModelParameterConfig
    onConfigChange: (paramId: string, newConfig: Partial<ModelParameterConfig>) => void
}

export function ParameterCard({ param, config, onConfigChange }: ParameterCardProps) {
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
        onConfigChange(param.id, { values: newValues })
    }

    return (
        <Card className={cn(
            "transition-all duration-300 border-l-4",
            isVisible ? "border-l-primary" : "border-l-muted opacity-60",
            expanded ? "ring-1 ring-primary/20 shadow-lg" : "hover:shadow-md"
        )}>
            {/* Header */}
            <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-muted/50 text-xs font-mono font-bold text-muted-foreground">
                        {param.type.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-sm font-semibold">{config.custom_label || param.label}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{param.id}</div>
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

// Init Helper
function initValues(param: UIParameter, config: ModelParameterConfig): ParameterValue[] {
    if (param.options) {
        return param.options.map(opt => ({
            value: opt.value,
            label: opt.label,
            enabled: true,
            is_default: opt.value === param.default,
            price: 0.0,
            access_tiers: ["starter", "pro", "studio"]
        }))
    }

    // For Integer/Range, init with default if exists
    if ((param.type === 'integer' || param.type === 'number') && param.default !== undefined) {
        return [{
            value: param.default,
            label: `${param.default}`,
            enabled: true,
            is_default: true,
            price: 0.0,
            access_tiers: ["starter", "pro", "studio"]
        }]
    }

    return []
}
