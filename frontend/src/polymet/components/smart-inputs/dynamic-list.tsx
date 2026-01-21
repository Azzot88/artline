import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon, TrashIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DynamicListProps {
    value: string[]
    onChange: (value: string[]) => void
    label?: string
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function DynamicList({
    value = [],
    onChange,
    label,
    placeholder = "Enter value...",
    disabled,
    className
}: DynamicListProps) {
    const handleAdd = () => {
        onChange([...value, ""])
    }

    const handleRemove = (index: number) => {
        const newValue = [...value]
        newValue.splice(index, 1)
        onChange(newValue)
    }

    const handleChange = (index: number, text: string) => {
        const newValue = [...value]
        newValue[index] = text
        onChange(newValue)
    }

    return (
        <div className={cn("space-y-3", className)}>
            {label && <Label>{label}</Label>}

            <div className="space-y-2">
                {value.map((item, i) => (
                    <div key={i} className="flex gap-2">
                        <Input
                            value={item}
                            onChange={(e) => handleChange(i, e.target.value)}
                            placeholder={placeholder}
                            disabled={disabled}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemove(i)}
                            disabled={disabled}
                            className="shrink-0"
                        >
                            <TrashIcon className="w-4 h-4 text-destructive" />
                        </Button>
                    </div>
                ))}

                {value.length === 0 && (
                    <div className="text-sm text-muted-foreground italic p-2 border border-dashed rounded text-center">
                        No items added
                    </div>
                )}
            </div>

            <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAdd}
                disabled={disabled}
                className="w-full"
            >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Item
            </Button>
        </div>
    )
}
