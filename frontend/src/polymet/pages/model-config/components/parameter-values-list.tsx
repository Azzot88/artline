
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
            if (v.value === id) { // Using value as ID for simplicity or strict ID if available
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
    const isSelect = type === 'select'

    // Sort values if integer (robustness)
    const displayValues = isInteger
        ? [...values].sort((a, b) => Number(a.value) - Number(b.value))
        : values

    return (
        <div className="space-y-3">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Configured Values ({values.length})
                </h4>
                {isInteger && (
                    <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)} className="h-7 text-xs">
                        <PlusIcon className="w-3 h-3 mr-1.5" /> Add Value Point
                    </Button>
                )}
            </div>

            {/* List */}
            <div className="grid gap-2">
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
                min={min}
                max={max}
                existingValues={values.map(v => Number(v.value))}
                onAdd={handleAdd}
            />
        </div>
    )
}
