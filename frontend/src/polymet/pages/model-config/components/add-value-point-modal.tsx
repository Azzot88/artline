
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface AddValuePointModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    min?: number
    max?: number
    existingValues: number[]
    onAdd: (val: number) => void
}

export function AddValuePointModal({ open, onOpenChange, min = 0, max = 100, existingValues, onAdd }: AddValuePointModalProps) {
    const [val, setVal] = useState<string>("")
    const numVal = Number(val)

    // Validation
    const exists = existingValues.includes(numVal)
    const outOfRange = numVal < min || numVal > max
    const isValid = val !== "" && !exists && !outOfRange

    // Presets
    const presets = [10, 25, 50, 75, 100].filter(p => p >= min && p <= max && !existingValues.includes(p))

    const handleSubmit = () => {
        if (isValid) {
            onAdd(numVal)
            onOpenChange(false)
            setVal("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Add Value Point</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Value</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={val}
                                onChange={e => setVal(e.target.value)}
                                autoFocus
                            />
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                Range: {min} - {max}
                            </div>
                        </div>
                        {exists && <p className="text-xs text-destructive">Value already exists</p>}
                        {outOfRange && val !== "" && <p className="text-xs text-destructive">Out of allowed range</p>}
                    </div>

                    {presets.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Quick Presets</Label>
                            <div className="flex flex-wrap gap-2">
                                {presets.map(p => (
                                    <Badge
                                        key={p}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-secondary"
                                        onClick={() => setVal(String(p))}
                                    >
                                        {p}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!isValid}>Add Value</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
