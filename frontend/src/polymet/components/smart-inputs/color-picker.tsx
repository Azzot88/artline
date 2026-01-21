import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
    value: string
    onChange: (color: string) => void
    label?: string
    disabled?: boolean
    className?: string
}

export function ColorPicker({
    value,
    onChange,
    label,
    disabled,
    className
}: ColorPickerProps) {
    const [localValue, setLocalValue] = React.useState(value || "#000000")

    React.useEffect(() => {
        setLocalValue(value || "#000000")
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setLocalValue(val)
        onChange(val)
    }

    return (
        <div className={cn("space-y-2", className)}>
            {label && <Label>{label}</Label>}
            <div className="flex gap-2">
                <div
                    className="w-10 h-10 rounded border"
                    style={{ backgroundColor: localValue }}
                />
                <Input
                    type="text"
                    value={localValue}
                    onChange={handleChange}
                    disabled={disabled}
                    className="font-mono"
                    placeholder="#RRGGBB"
                />
                <Input
                    type="color"
                    value={localValue}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-10 h-10 p-1 opacity-0 absolute pointer-events-none"
                // Invisible but accessible trigger for native picker if needed, 
                // but usually we just want the text input + visual preview.
                // Actually let's make the visual box clickable.
                />
            </div>
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        className="w-full h-2 rounded-full mt-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 opacity-20 hover:opacity-100 transition-opacity"
                        disabled={disabled}
                    />
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                    <div className="grid grid-cols-5 gap-1">
                        {/* Common extracted colors palette */}
                        {["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"].map(c => (
                            <button
                                key={c}
                                className="w-8 h-8 rounded border shadow-sm"
                                style={{ backgroundColor: c }}
                                onClick={() => { onChange(c); setLocalValue(c); }}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
