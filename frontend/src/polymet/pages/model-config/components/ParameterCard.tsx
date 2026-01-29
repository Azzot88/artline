
import React from 'react'
import { RichParameter } from '../types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { OptionEditor } from './OptionEditor'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react"

interface ParameterCardProps {
    parameter: RichParameter
    onChange: (updates: Partial<RichParameter>) => void
}

const ALL_TIERS = ["starter", "pro", "studio"]

export function ParameterCard({ parameter, onChange }: ParameterCardProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    const toggleTier = (tier: string) => {
        const current = parameter.visibleToTiers || []
        const next = current.includes(tier)
            ? current.filter(t => t !== tier)
            : [...current, tier]
        onChange({ visibleToTiers: next })
    }

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="mb-4"
        >
            <Card className="transition-all hover:border-primary/50">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                        <CollapsibleTrigger asChild>
                            <div className="cursor-pointer flex items-center gap-2 hover:opacity-80">
                                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                <span className="font-semibold text-sm">{parameter.label}</span>
                            </div>
                        </CollapsibleTrigger>
                        <Badge variant="outline" className="text-xs uppercase bg-muted/50">{parameter.type}</Badge>
                        {parameter.required && <Badge variant="secondary" className="text-xs text-red-500">Required</Badge>}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{parameter.hidden ? "Hidden" : "Visible"}</span>
                        <Switch
                            checked={!parameter.hidden}
                            onCheckedChange={(c) => onChange({ hidden: !c })}
                        />
                    </div>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 px-4 space-y-4 border-t mt-4">
                        {/* Basic Layout */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">Label Override</Label>
                                <Input
                                    value={parameter.labelOverride || ""}
                                    placeholder={parameter.label}
                                    onChange={(e) => onChange({ labelOverride: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">Access Tiers</Label>
                                <div className="flex gap-4 pt-2">
                                    {ALL_TIERS.map(tier => (
                                        <div key={tier} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`tier-${parameter.id}-${tier}`}
                                                checked={parameter.visibleToTiers?.includes(tier)}
                                                onCheckedChange={() => toggleTier(tier)}
                                            />
                                            <label htmlFor={`tier-${parameter.id}-${tier}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer">
                                                {tier}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Type Specific */}
                        {parameter.type === "integer" || parameter.type === "number" ? (
                            <div className="grid grid-cols-3 gap-4 bg-muted/20 p-3 rounded-md">
                                <div>
                                    <Label className="text-xs">Min</Label>
                                    <Input type="number" value={parameter.min ?? ""} onChange={(e) => onChange({ min: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <Label className="text-xs">Max</Label>
                                    <Input type="number" value={parameter.max ?? ""} onChange={(e) => onChange({ max: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <Label className="text-xs">Step</Label>
                                    <Input type="number" value={parameter.step ?? ""} onChange={(e) => onChange({ step: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                        ) : null}

                        {(parameter.type === "select" || (parameter.options && parameter.options.length > 0)) ? (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">Options Pricing & Config</Label>
                                <OptionEditor
                                    options={parameter.options || []}
                                    onChange={(opts) => onChange({ options: opts })}
                                />
                            </div>
                        ) : null}

                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}
