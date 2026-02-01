
import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, GripVertical } from "lucide-react"

export interface ParameterValueConfig {
    value: any
    label?: string
    enabled: boolean
    price: number
    access_tiers: string[]
}

interface ValueListEditorProps {
    values: ParameterValueConfig[]
    onChange: (values: ParameterValueConfig[]) => void
}

export function ValueListEditor({ values: rawValues, onChange }: ValueListEditorProps) {
    const values = Array.isArray(rawValues) ? rawValues : []

    const addValue = () => {
        onChange([
            ...values,
            {
                value: "",
                label: "",
                enabled: true,
                price: 0,
                access_tiers: ["starter", "pro", "studio"]
            }
        ])
    }

    const updateValue = (index: number, updates: Partial<ParameterValueConfig>) => {
        const newValues = [...values]
        newValues[index] = { ...newValues[index], ...updates }
        onChange(newValues)
    }

    const removeValue = (index: number) => {
        onChange(values.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>Allowed Values & Pricing</Label>
                <Button variant="outline" size="sm" onClick={addValue} className="h-7 text-xs gap-1">
                    <Plus className="w-3 h-3" /> Add Option
                </Button>
            </div>

            <div className="space-y-2">
                {values.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start p-2 border rounded-md bg-card/50">
                        <GripVertical className="w-4 h-4 text-muted-foreground mt-2 shrink-0 cursor-grab" />

                        <div className="flex-1 space-y-2">
                            {/* Row 1: Value & Label */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-[10px] text-muted-foreground">Value (Internal)</Label>
                                    <Input
                                        value={item.value}
                                        onChange={(e) => updateValue(index, { value: e.target.value })}
                                        className="h-7 text-xs"
                                        placeholder="e.g. 1024x1024"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px] text-muted-foreground">Label (Display)</Label>
                                    <Input
                                        value={item.label || ""}
                                        onChange={(e) => updateValue(index, { label: e.target.value })}
                                        className="h-7 text-xs"
                                        placeholder="e.g. Square"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Price & Tier */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-[10px] text-muted-foreground">Surcharge (Credits)</Label>
                                    <Input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => updateValue(index, { price: parseFloat(e.target.value) || 0 })}
                                        className="h-7 text-xs"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px] text-muted-foreground">Min Tier</Label>
                                    <Select
                                        value={item.access_tiers.includes("starter") ? "starter" : item.access_tiers.includes("pro") ? "pro" : "studio"}
                                        onValueChange={(val) => {
                                            // Simple logic: if pro selected, include [pro, studio]
                                            let tiers = ["starter", "pro", "studio"]
                                            if (val === "pro") tiers = ["pro", "studio"]
                                            if (val === "studio") tiers = ["studio"]
                                            updateValue(index, { access_tiers: tiers })
                                        }}
                                    >
                                        <SelectTrigger className="h-7 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="starter">All (Starter+)</SelectItem>
                                            <SelectItem value="pro">Pro Only</SelectItem>
                                            <SelectItem value="studio">Studio Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 mt-1"
                            onClick={() => removeValue(index)}
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                ))}

                {values.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md bg-muted/20">
                        No fixed values defined. Parameter allows free input.
                    </div>
                )}
            </div>
        </div>
    )
}
