import { useState, useMemo } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDownIcon, ChevronRightIcon, InfoIcon, Settings2Icon, FileIcon } from "lucide-react"

import type { ModelParameter, ModelParameterConfig, UIGroup } from "@/polymet/data/types"
import { ModelParameterControl } from "@/polymet/components/model-parameter-control"

interface ModelParameterAdminControlProps {
    parameter: ModelParameter
    config: ModelParameterConfig
    onConfigChange: (updates: Partial<ModelParameterConfig>) => void
    onValueChange: (newValue: any) => void
    currentValue: any
}

export function ModelParameterAdminControl({
    parameter,
    config,
    onConfigChange,
    onValueChange,
    currentValue
}: ModelParameterAdminControlProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    // Handle visibility toggle
    const handleToggleVisible = (checked: boolean) => {
        onConfigChange({ enabled: checked })
    }

    // Handle custom label
    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onConfigChange({ custom_label: e.target.value })
    }

    // Handle custom description
    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onConfigChange({ custom_description: e.target.value })
    }

    // Handle allowed values (valid_options) for enums
    const handleAllowedValueToggle = (value: any, checked: boolean) => {
        const currentAllowed = config.allowed_values || parameter.enum || []
        let newAllowed: any[]

        if (checked) {
            // Add if not present
            if (!currentAllowed.includes(value)) {
                newAllowed = [...currentAllowed, value]
            } else {
                newAllowed = currentAllowed
            }
        } else {
            // Remove
            newAllowed = currentAllowed.filter(v => v !== value)
        }

        // If all unchecked, maybe we should treat it as "allow all" or "allow none"?
        // Usually "undefined" or null allowed_values means ALL are allowed.
        // If we want restriction, we need explicit array.
        // Let's say if we are interacting with this, we are setting an explicit filter.
        onConfigChange({ allowed_values: newAllowed })

        // If current default value is no longer allowed, we should probably warn or reset,
        // but for now let's just update the config.
    }

    // Determine if this is a file/image input
    const isFileInput = parameter.name.includes("image") ||
        parameter.name.includes("file") ||
        parameter.format === "uri"

    // Determine available options for Enums
    const allEnumOptions = parameter.enum || []
    const hasEnums = allEnumOptions.length > 0
    const activeAllowedValues = config.allowed_values && config.allowed_values.length > 0
        ? config.allowed_values
        : allEnumOptions

    // Render
    return (
        <div className={`border rounded-lg p-3 transition-colors ${config.enabled ? 'bg-card border-border' : 'bg-muted/30 border-dashed border-muted-foreground/30'}`}>

            {/* Top Bar: Toggle + Status + Main Controls */}
            <div className="flex items-start gap-3">
                {/* Enable Switch */}
                <div className="pt-1">
                    <Switch
                        checked={config.enabled}
                        onCheckedChange={handleToggleVisible}
                        className="data-[state=unchecked]:bg-slate-200"
                    />
                </div>

                {/* content */}
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`font-medium ${!config.enabled && 'text-muted-foreground line-through decoration-slate-400/50'}`}>
                                {config.custom_label || parameter.name}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono text-muted-foreground">
                                {parameter.name}
                            </Badge>
                            {parameter.required && <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Req</Badge>}
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <Settings2Icon className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {config.custom_description || parameter.description || "No description provided."}
                    </div>

                    {/* If enabled, show the DEFAULT VALUE selector (which acts as a preview) */}
                    {config.enabled && (
                        <div className="pt-2">
                            <div className="flex items-center gap-3">
                                <Label className="text-xs w-24 flex-shrink-0 text-muted-foreground">Default Value:</Label>
                                <div className="flex-1 max-w-sm">
                                    {isFileInput ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded border border-dashed">
                                            <FileIcon className="w-4 h-4" />
                                            <span>File Input (Configured in Workbench)</span>
                                        </div>
                                    ) : (
                                        <ModelParameterControl
                                            parameter={parameter}
                                            config={config} // This passes allowed_values, effectively filtering the dropdown
                                            value={currentValue}
                                            onChange={(val) => {
                                                onValueChange(val) // Updates the local override_default in parent
                                                onConfigChange({ override_default: val })
                                            }}
                                            compact={true}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded Config */}
            {isExpanded && (
                <div className="mt-4 pl-12 space-y-4 border-t border-border/50 pt-4 animate-in slide-in-from-top-1">

                    {/* Custom Label & Description */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Display Label</Label>
                            <Input
                                value={config.custom_label || ""}
                                onChange={handleLabelChange}
                                placeholder={parameter.name}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            {/* Placeholder for ordering or other meta */}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs">Description (Tooltip)</Label>
                        <Textarea
                            value={config.custom_description || ""}
                            onChange={handleDescriptionChange}
                            placeholder={parameter.description || "Enter user-facing description..."}
                            className="h-20 text-sm resize-none"
                        />
                    </div>

                    {/* Enum Options Management */}
                    {hasEnums && (
                        <div className="space-y-2">
                            <Label className="text-xs block mb-1">Valid Options (Open List)</Label>
                            <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2 rounded-md border text-sm">
                                {allEnumOptions.map((opt) => {
                                    const isChecked = activeAllowedValues.includes(opt)
                                    return (
                                        <div key={String(opt)} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`${parameter.id}-opt-${opt}`}
                                                checked={isChecked}
                                                onCheckedChange={(c) => handleAllowedValueToggle(opt, !!c)}
                                            />
                                            <label
                                                htmlFor={`${parameter.id}-opt-${opt}`}
                                                className="text-sm cursor-pointer select-none"
                                            >
                                                {String(opt)}
                                            </label>
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Selected options will be available in the dropdown. Disable options to hide them from users.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
