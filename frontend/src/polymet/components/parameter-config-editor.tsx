import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, Settings2 } from "lucide-react"

export interface ParameterConfig {
    hidden: boolean
    default?: any
    min?: number
    max?: number
    step?: number
    allowed_values?: any[] // for enums
    custom_label?: string
}

interface ParameterConfigEditorProps {
    parameter: {
        name: string
        type: string
        label?: string
        default?: any
        min?: number
        max?: number
        options?: any[] // Enum options from provider
        help?: string
    }
    config: ParameterConfig
    onChange: (newConfig: ParameterConfig) => void
}

export function ParameterConfigEditor({ parameter, config, onChange }: ParameterConfigEditorProps) {
    const [isOpen, setIsOpen] = useState(false)

    const isHidden = config.hidden
    const customLabel = config.custom_label || ""
    const defaultValue = config.default !== undefined ? config.default : parameter.default

    const handleUpdate = (updates: Partial<ParameterConfig>) => {
        onChange({ ...config, ...updates })
    }

    return (
        <Card className="mb-2 border-l-4" style={{ borderLeftColor: isHidden ? "transparent" : "hsl(var(--primary))" }}>
            <div className="p-3 flex items-center gap-3">
                {/* Visibility Toggle */}
                <Switch
                    checked={!isHidden}
                    onCheckedChange={(checked) => handleUpdate({ hidden: !checked })}
                />

                <div className="flex-1 grid gap-1 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    <div className="flex items-center gap-2">
                        <span className={`font-medium ${isHidden ? "text-muted-foreground line-through" : ""}`}>
                            {parameter.name}
                        </span>
                        {customLabel && <Badge variant="outline" className="text-xs">{customLabel}</Badge>}
                        <Badge variant="secondary" className="text-[10px]">{parameter.type}</Badge>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }} className="p-1 hover:bg-muted rounded">
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="p-3 pt-0 border-t bg-muted/10">
                    <div className="grid gap-4 py-4">
                        {/* Common: Custom Label & Default */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Custom Label</Label>
                                <Input
                                    size={30} // React type compliant
                                    className="h-8"
                                    value={customLabel}
                                    onChange={(e) => handleUpdate({ custom_label: e.target.value })}
                                    placeholder={parameter.label || parameter.name}
                                />
                            </div>

                            {/* Default Value Input depends on type */}
                            <div className="space-y-1">
                                <Label className="text-xs">Override Default</Label>
                                {parameter.type === "boolean" ? (
                                    <div className="flex items-center h-8">
                                        <Switch
                                            checked={defaultValue === true}
                                            onCheckedChange={(c) => handleUpdate({ default: c })}
                                        />
                                        <span className="ml-2 text-sm">{defaultValue ? "True" : "False"}</span>
                                    </div>
                                ) : parameter.options ? (
                                    <select
                                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={defaultValue}
                                        onChange={(e) => handleUpdate({ default: e.target.value })}
                                    >
                                        {(config.allowed_values || parameter.options).map((opt: any) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <Input
                                        type={parameter.type === "integer" || parameter.type === "number" || parameter.type === "float" ? "number" : "text"}
                                        className="h-8"
                                        value={defaultValue || ""}
                                        onChange={(e) => {
                                            const val = parameter.type === "integer" ? parseInt(e.target.value) :
                                                (parameter.type === "number" || parameter.type === "float") ? parseFloat(e.target.value) : e.target.value
                                            handleUpdate({ default: val })
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Numeric Constraints */}
                        {(parameter.type === "integer" || parameter.type === "number" || parameter.type === "float") && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Min ({parameter.min ?? "-"})</Label>
                                    <Input
                                        type="number"
                                        className="h-8"
                                        value={config.min ?? ""}
                                        onChange={(e) => handleUpdate({ min: e.target.value === "" ? undefined : Number(e.target.value) })}
                                        placeholder={parameter.min?.toString()}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Max ({parameter.max ?? "-"})</Label>
                                    <Input
                                        type="number"
                                        className="h-8"
                                        value={config.max ?? ""}
                                        onChange={(e) => handleUpdate({ max: e.target.value === "" ? undefined : Number(e.target.value) })}
                                        placeholder={parameter.max?.toString()}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Enum Constraints */}
                        {(parameter.options || parameter.type === "select") && parameter.options && (
                            <div className="space-y-2">
                                <Label className="text-xs">Allowed Values</Label>
                                <div className="grid grid-cols-2 gap-2 border rounded p-2 max-h-40 overflow-y-auto">
                                    {parameter.options.map((opt: any) => {
                                        const allowed = config.allowed_values ? config.allowed_values.includes(opt) : true
                                        return (
                                            <div key={opt} className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={allowed}
                                                    onCheckedChange={(checked) => {
                                                        const current = config.allowed_values ?? [...parameter.options!]
                                                        let next
                                                        if (checked) {
                                                            next = [...current, opt]
                                                        } else {
                                                            next = current.filter(x => x !== opt)
                                                        }
                                                        handleUpdate({ allowed_values: next })
                                                    }}
                                                />
                                                <span className="text-sm truncate" title={opt}>{opt}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Card>
    )
}
