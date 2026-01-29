
import { useState } from "react"
import { ParameterValue } from "@/polymet/data/types"
import { Button } from "@/components/ui/button"
import { ParameterValueRow } from "./parameter-value-row"
import { PlusIcon } from "lucide-react"
import { AddValuePointModal } from "./add-value-point-modal"
import { cn } from "@/lib/utils"

interface ParameterValuesListProps {
    values: ParameterValue[]
    type: string
    min?: number
    max?: number
    onChange: (values: ParameterValue[]) => void
}

export function ParameterValuesList({ values, type, min, max, onChange }: ParameterValuesListProps) {
    const [isAddOpen, setIsAddOpen] = useState(false)

    // Handlers
    const handleUpdate = (id: string, updates: Partial<ParameterValue>) => {
        const next = values.map(v => {
            if (v.value === id) { // Using value as ID 
                return { ...v, ...updates }
            }
            // Enforce Single Default Logic
            if (updates.is_default && v.value !== id) {
                return { ...v, is_default: false }
            }
            return v
        })
        onChange(next)
    }

    const handleAdd = (val: number) => {
        const newValue: ParameterValue = {
            value: val,
            label: `${val}`,
            enabled: true,
            is_default: false,
            price: 0.0,
            access_tiers: ["starter", "pro", "studio"]
        }
        // Sort
        const next = [...values, newValue].sort((a, b) => Number(a.value) - Number(b.value))
        onChange(next)
    }

    const handleDelete = (val: any) => {
        onChange(values.filter(v => v.value !== val))
    }

    // Determine Mode
    const isInteger = type === 'integer' || type === 'number'
    const supportsCustomValues = isInteger || type === 'string' // Allow strings too

    // Sort values if integer (robustness)
    const displayValues = isInteger
        ? [...values].sort((a, b) => Number(a.value) - Number(b.value))
        : values

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    Configured Values
                    <div className="bg-primary/10 text-primary px-1.5 rounded-sm text-[10px] font-mono">
                        {values.filter(v => v.enabled).length}/{values.length}
                    </div>
                </h4>

                {supportsCustomValues && (
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsAddOpen(true)}
                        className="h-7 text-xs shadow-sm hover:translate-y-[1px] transition-all"
                    >
                        <PlusIcon className="w-3 h-3 mr-1.5" /> Add Value Point
                    </Button>
                )}
            </div>

            {/* List */}
            <div className="grid gap-2 relative">
                {/* Visual Connector Line? Maybe clutter. Keeping clean. */}

                {displayValues.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
                        <div className="text-sm">No values configured</div>
                        {isInteger && <div className="text-xs opacity-70 mt-1">Add a value point to get started</div>}
                    </div>
                )}

                {displayValues.map((v) => (
                    <ParameterValueRow
                        key={v.value}
                        value={v}
                        onUpdate={(u) => handleUpdate(v.value, u)}
                        onDelete={() => handleDelete(v.value)}
                        canDelete={isInteger} // Select options come from schema, usually fixed
                    />
                ))}
            </div>

            {/* Modals */}
            <AddValuePointModal
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                type={type}
                min={min}
                max={max}
                existingValues={values.map(v => v.value)}
                onAdd={handleAdd}
            />
        </div>
    )
}
