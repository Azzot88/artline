
import React, { useState, useMemo } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Plus,
    Trash2,
    GripVertical,
    ArrowRight,
    Eye,
    EyeOff,
    Settings2
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ValueListEditor } from "./value-list-editor"

interface NormalizationBuilderProps {
    rawSchema: any
    config: any
    onChange: (config: any) => void
}

export function NormalizationBuilder({ rawSchema, config, onChange }: NormalizationBuilderProps) {
    const [selectedParamId, setSelectedParamId] = useState<string | null>(null)

    // 1. Parse Registry (Raw Schema Keys)
    const registryKeys = useMemo(() => {
        if (!rawSchema) return []
        // Try to find properties
        const props = rawSchema?.components?.schemas?.Input?.properties
            || rawSchema?.properties
            || rawSchema?.inputs
            || {}
        return Object.keys(props).sort()
    }, [rawSchema])

    // 2. Parse Configured Params (Workshop)
    // We assume config is Dict[paramId, Rule]
    // We convert to list for rendering
    const configuredParams = useMemo(() => {
        return Object.entries(config || {}).map(([id, rule]: [string, any]) => ({
            id,
            ...rule
        }))
    }, [config])

    const handleAddParam = (paramId: string) => {
        // Check if checks exists
        if (config?.[paramId]) {
            setSelectedParamId(paramId)
            return
        }

        // Create new rule
        const newRule = {
            label_override: paramId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            visible: true,
            // Default type inference could go here if we had type info easily accessible
        }

        const newConfig = { ...config, [paramId]: newRule }
        onChange(newConfig)
        setSelectedParamId(paramId)
    }

    const handleUpdateRule = (paramId: string, updates: any) => {
        const current = config[paramId] || {}
        const newConfig = {
            ...config,
            [paramId]: { ...current, ...updates }
        }
        onChange(newConfig)
    }

    const handleDeleteRule = (paramId: string) => {
        const newConfig = { ...config }
        delete newConfig[paramId]
        onChange(newConfig)
        if (selectedParamId === paramId) setSelectedParamId(null)
    }

    const activeRule = selectedParamId ? config?.[selectedParamId] : null

    return (
        <div className="grid grid-cols-12 h-full gap-4">

            {/* LEFT: Registry */}
            <div className="col-span-3 border-r h-full flex flex-col bg-muted/10">
                <div className="p-4 border-b bg-muted/20">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Settings2 className="w-4 h-4" />
                        Raw Inputs
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        From Provider API ({registryKeys.length})
                    </p>
                </div>
                <ScrollArea className="flex-1 p-2">
                    <div className="space-y-1">
                        {registryKeys.map(key => {
                            const isConfigured = !!config?.[key]
                            return (
                                <div
                                    key={key}
                                    onClick={() => handleAddParam(key)}
                                    className={cn(
                                        "flex items-center justify-between p-2 rounded-md text-sm cursor-pointer hover:bg-muted transition-colors",
                                        isConfigured ? "opacity-50" : "font-medium"
                                    )}
                                >
                                    <span className="truncate" title={key}>{key}</span>
                                    {isConfigured ? (
                                        <span className="text-xs text-green-600">Mapped</span>
                                    ) : (
                                        <Plus className="w-3 h-3 text-muted-foreground" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </div>

            {/* MIDDLE: Workshop (List of Rules) */}
            <div className="col-span-4 border-r h-full flex flex-col">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Normalized Params</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Active UI Controls
                    </p>
                </div>
                <ScrollArea className="flex-1 p-2">
                    <div className="space-y-2">
                        {configuredParams.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground text-sm">
                                Select raw inputs to map them
                            </div>
                        )}
                        {configuredParams.map(param => (
                            <div
                                key={param.id}
                                onClick={() => setSelectedParamId(param.id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:border-primary/50 transition-all",
                                    selectedParamId === param.id ? "border-primary bg-primary/5 shadow-sm" : "bg-card"
                                )}
                            >
                                {/* Status Icon */}
                                {param.visible !== false ? (
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <EyeOff className="w-4 h-4 text-muted-foreground/50" />
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                        {param.label_override || param.id}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate font-mono">
                                        {param.id}
                                    </div>
                                </div>

                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* RIGHT: Editor (Active Rule) */}
            <div className="col-span-5 h-full flex flex-col bg-background">
                {activeRule ? (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b bg-muted/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold truncate">{selectedParamId}</h3>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        {activeRule.type || "Auto"}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteRule(selectedParamId!)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-6">

                                {/* Visibility & Label */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="visible">Visible</Label>
                                        <Switch
                                            id="visible"
                                            checked={activeRule.visible !== false}
                                            onCheckedChange={(c) => handleUpdateRule(selectedParamId!, { visible: c })}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="label">Label</Label>
                                        <Input
                                            id="label"
                                            value={activeRule.label_override || ""}
                                            placeholder={selectedParamId!.replace("_", " ")}
                                            onChange={(e) => handleUpdateRule(selectedParamId!, { label_override: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="desc">Description</Label>
                                        <Input
                                            id="desc"
                                            value={activeRule.description_override || ""}
                                            placeholder="Tooltip text..."
                                            onChange={(e) => handleUpdateRule(selectedParamId!, { description_override: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Values Configuration (Granular Control) */}
                                <div className="space-y-4">
                                    <ValueListEditor
                                        values={activeRule.values || []}
                                        onChange={(newValues) => handleUpdateRule(selectedParamId!, { values: newValues })}
                                    />

                                    <div className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded">
                                        Defining "Allowed Values" converts this input to a <strong>Select</strong> dropdown.
                                        Constraints (Min/Max) below apply only if NO values are defined.
                                    </div>
                                </div>

                                <Separator />

                                {/* Constraints (shown if no values or just as backup) */}
                                {(!activeRule.values || activeRule.values.length === 0) && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-muted-foreground">Numeric Constraints</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Min</Label>
                                                <Input
                                                    type="number"
                                                    value={activeRule.min_override ?? ""}
                                                    onChange={(e) => handleUpdateRule(selectedParamId!, { min_override: e.target.value ? Number(e.target.value) : undefined })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Max</Label>
                                                <Input
                                                    type="number"
                                                    value={activeRule.max_override ?? ""}
                                                    onChange={(e) => handleUpdateRule(selectedParamId!, { max_override: e.target.value ? Number(e.target.value) : undefined })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label>Access Tiers</Label>
                                    <Select
                                        value={activeRule.access_tiers ? activeRule.access_tiers.join(",") : "all"}
                                        onValueChange={(val) => {
                                            const tiers = val === "all" ? [] : val.split(',')
                                            handleUpdateRule(selectedParamId!, { access_tiers: tiers })
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            <SelectItem value="starter,pro,studio">Starter+</SelectItem>
                                            <SelectItem value="pro,studio">Pro+</SelectItem>
                                            <SelectItem value="studio">Studio Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Group</Label>
                                    <Select
                                        value={activeRule.group || "settings"}
                                        onValueChange={(val) => handleUpdateRule(selectedParamId!, { group: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">Basic</SelectItem>
                                            <SelectItem value="advanced">Advanced</SelectItem>
                                            <SelectItem value="settings">Settings</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                        <Settings2 className="w-8 h-8 mb-2 opacity-20" />
                        Select a parameter to edit rules
                    </div>
                )}
            </div>
        </div>
    )
}
