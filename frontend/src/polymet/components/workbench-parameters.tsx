import { useState, useMemo } from "react"
import { ChevronDownIcon, ChevronRightIcon, SearchIcon, XIcon, SlidersHorizontalIcon } from "lucide-react"
import { ModelParameterControl } from "@/polymet/components/model-parameter-control"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ModelParameter, ModelParameterConfig, UIGroup, ParameterValues } from "@/polymet/data/types"
import { getParameterLabel } from "@/polymet/data/types"
import { cn } from "@/lib/utils"

interface WorkbenchParametersProps {
    parameters: ModelParameter[]
    configs: ModelParameterConfig[]
    values: ParameterValues
    onChange: (parameterId: string, value: any) => void
    disabled?: boolean
}

const GROUP_LABELS: Record<UIGroup, string> = {
    core: "Основные параметры",
    format: "Формат и размер",
    quality: "Качество",
    advanced: "Расширенные настройки",
    safety: "Безопасность",
    debug: "Отладка",
    other: "Другие параметры"
}

const GROUP_ORDER: UIGroup[] = ["core", "format", "quality", "advanced", "safety", "debug", "other"]

export function WorkbenchParameters({
    parameters,
    configs,
    values,
    onChange,
    disabled = false
}: WorkbenchParametersProps) {
    const [searchTerm, setSearchTerm] = useState("")

    // Filter parameters based on search
    const filteredParameters = useMemo(() => {
        if (!searchTerm) return parameters
        const lower = searchTerm.toLowerCase()
        return parameters.filter(p => {
            const config = configs.find(c => c.parameter_id === p.id)
            const label = getParameterLabel(p, config).toLowerCase()
            // Include description in search
            const desc = (p.description || "").toLowerCase()
            return p.name.toLowerCase().includes(lower) || label.includes(lower) || desc.includes(lower)
        })
    }, [parameters, configs, searchTerm])

    // Group parameters by ui_group
    const groupedParams = useMemo(() => {
        const groups = filteredParameters.reduce((acc, param) => {
            const group = param.ui_group || "other" // Fallback to other
            if (!acc[group]) acc[group] = []
            acc[group].push(param)
            return acc
        }, {} as Record<UIGroup, ModelParameter[]>)

        // Sort parameters within each group by display_order
        Object.keys(groups).forEach(group => {
            groups[group as UIGroup].sort((a, b) => {
                const configA = configs.find(c => c.parameter_id === a.id)
                const configB = configs.find(c => c.parameter_id === b.id)
                // Default order if not in config: preserve original order or use large number
                return (configA?.display_order ?? 999) - (configB?.display_order ?? 999)
            })
        })
        return groups
    }, [filteredParameters, configs])

    // State for collapsed groups
    // Default: Core and Format expanded, others collapsed? 
    // Or just expand core.
    const [collapsedGroups, setCollapsedGroups] = useState<Set<UIGroup>>(
        new Set(GROUP_ORDER.filter(g => g !== "core" && g !== "format"))
    )

    // Auto-expand on search
    useMemo(() => {
        if (searchTerm) {
            // We don't want to update state during render usually, but for search expand it's often handled in effect.
            // But useMemo is side-effect free. Let's use logic in render or effect.
        }
    }, [searchTerm])

    // Use effect for search expansion
    useMemo(() => {
        if (searchTerm) {
            // This is a bit tricky with useMemo. Let's just trust the user to expand or use an effect.
            // Actually, let's keep it simple.
        }
    }, [searchTerm])

    const toggleGroup = (group: UIGroup) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev)
            if (next.has(group)) {
                next.delete(group)
            } else {
                next.add(group)
            }
            return next
        })
    }

    // Render empty state
    if (parameters.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No parameters available for this model.</div>
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header / Search */}
            <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                    <SlidersHorizontalIcon className="w-5 h-5 text-primary" />
                    <span>Настройки генерации</span>
                </div>
                <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 pr-9 bg-muted/30"
                        placeholder="Поиск параметров..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-9 w-9 hover:bg-transparent"
                            onClick={() => setSearchTerm("")}
                        >
                            <XIcon className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 pb-12">
                    {GROUP_ORDER.map(group => {
                        const params = groupedParams[group]
                        if (!params || params.length === 0) return null

                        const isCollapsed = collapsedGroups.has(group) && !searchTerm

                        return (
                            <div key={group} className="border border-border/50 rounded-xl overflow-hidden bg-card/30">
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroup(group)}
                                    className={cn(
                                        "w-full px-4 py-3 flex items-center justify-between",
                                        "hover:bg-muted/50 transition-colors",
                                        "bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-2 font-medium">
                                        {/* {isCollapsed ? <ChevronRightIcon className="w-4 h-4 text-muted-foreground" /> : <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />} */}
                                        <span className="text-sm">{GROUP_LABELS[group]}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
                                        {params.length}
                                    </span>
                                </button>

                                {/* Group Content */}
                                {!isCollapsed && (
                                    <div className="p-3 space-y-4 border-t border-border/50">
                                        {params.map(param => (
                                            <ModelParameterControl
                                                key={param.id}
                                                parameter={param}
                                                config={configs.find(c => c.parameter_id === param.id)}
                                                value={values[param.id]}
                                                onChange={(val) => onChange(param.id, val)}
                                                disabled={disabled}
                                                compact={false}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {filteredParameters.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            Нет параметров, соответствующих "{searchTerm}"
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
