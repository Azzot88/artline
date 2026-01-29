
import React from 'react'
import { RichOption } from '../types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface OptionEditorProps {
    options: RichOption[]
    onChange: (options: RichOption[]) => void
}

export function OptionEditor({ options, onChange }: OptionEditorProps) {

    const handleUpdate = (index: number, field: keyof RichOption, value: any) => {
        const newOptions = [...options]
        newOptions[index] = { ...newOptions[index], [field]: value }
        onChange(newOptions)
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Value (Technical)</TableHead>
                        <TableHead>Label (Display)</TableHead>
                        <TableHead className="w-[100px]">Price (+)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {options.map((opt, idx) => (
                        <TableRow key={idx}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                                {String(opt.value)}
                            </TableCell>
                            <TableCell>
                                <Input
                                    value={opt.label}
                                    onChange={(e) => handleUpdate(idx, 'label', e.target.value)}
                                    className="h-8"
                                />
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground text-xs">+</span>
                                    <Input
                                        type="number"
                                        value={opt.price}
                                        onChange={(e) => handleUpdate(idx, 'price', parseFloat(e.target.value) || 0)}
                                        className="h-8 w-16"
                                    />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
