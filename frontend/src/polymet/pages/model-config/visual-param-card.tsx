
import { useState } from "react"
import { AIModel, ModelParameterConfig, PricingRule } from "@/polymet/data/types"
import { UIParameter } from "@/polymet/data/api-types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Settings2Icon, EyeIcon, EyeOffIcon, DollarSignIcon, UsersIcon, FileTypeIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface VisualParamCardProps {
    param: UIParameter
    config: ModelParameterConfig
    onConfigChange: (paramId: string, newConfig: Partial<ModelParameterConfig>) => void
}

export function VisualParamCard({ param, config, onConfigChange }: VisualParamCardProps) {
    const isVisible = config.enabled !== false // Default true

    // Tiers Logic
    const tiers = config.access_tiers || []
    const isRestricted = tiers.length > 0 && !tiers.includes("all")

    // Pricing Logic
    const rules = config.pricing_rules || []
    const hasPricing = rules.length > 0

    // Internal State for Drawer
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Card
            className={cn(
                "group relative transition-all duration-300 hover:shadow-md border-border/50",
                !isVisible && "opacity-60 grayscale-[0.5] border-dashed"
            )}>
            {/* Header: Identity */}
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center bg-muted transition-colors",
                        isVisible ? "group-hover:bg-primary/10 group-hover:text-primary" : "opacity-50"
                    )}>
                        {/* Icon based on Type */}
                        {param.type === 'number' && <span className="text-xs font-mono">123</span>}
                        {param.type === 'boolean' && <span className="text-xs font-mono">T/F</span>}
                        {param.type === 'select' && <span className="text-xs font-mono">ABC</span>}
                        {param.type === 'text' && <span className="text-xs font-mono">TxT</span>}
                    </div>
                    <div>
                        <div className="text-sm font-semibold leading-none">{param.label || param.id}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-1">{param.id}</div>
                    </div>
                </div>

                <Switch
                    checked={isVisible}
                    onCheckedChange={(c) => onConfigChange(param.id, { enabled: c })}
                    onClick={(e) => e.stopPropagation()}
                    className="data-[state=checked]:bg-primary"
                />
            </CardHeader>

            {/* Content: Inline Options or Metadata */}
            <CardContent className="p-4 py-2 text-xs min-h-[60px]">
                {param.options && param.options.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                        {param.options.map(opt => {
                            // Check if enabled (if allowed_values matches or is empty)
                            // If allowed_values is set, only those in it are enabled.
                            // If NOT set, ALL are enabled.
                            const isOptionEnabled = !config.allowed_values || config.allowed_values.includes(opt.value)

                            return (
                                <div
                                    key={opt.value}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        // Toggle Logic
                                        let newAllowed: any[] | undefined

                                        if (!config.allowed_values) {
                                            // Currently ALL enabled. Disabling this one means allowing ALL OTHERS.
                                            newAllowed = param.options!.filter(o => o.value !== opt.value).map(o => o.value)
                                        } else {
                                            if (isOptionEnabled) {
                                                // Disable it
                                                newAllowed = config.allowed_values.filter(v => v !== opt.value)
                                            } else {
                                                // Enable it
                                                newAllowed = [...config.allowed_values, opt.value]
                                            }
                                        }

                                        // If we enabled everything back, reset to undefined to keep it clean
                                        if (newAllowed && newAllowed.length === param.options!.length) {
                                            newAllowed = undefined
                                        }

                                        onConfigChange(param.id, { allowed_values: newAllowed })
                                    }}
                                    className={cn(
                                        "px-2 py-1 rounded-md border text-[10px] font-medium transition-all cursor-pointer select-none",
                                        isOptionEnabled
                                            ? "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                                            : "opacity-40 grayscale bg-muted hover:opacity-60 decoration-slice line-through"
                                    )}
                                    title={isOptionEnabled ? "Click to Disable" : "Click to Enable"}
                                >
                                    {opt.label}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <>
                        {param.description && (
                            <div className="line-clamp-2 mb-2 text-muted-foreground">{param.description}</div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2 text-muted-foreground">
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{param.type}</Badge>
                            {param.default !== undefined && (
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 opacity-70">
                                    def: {String(param.default).substring(0, 10)}
                                </Badge>
                            )}
                        </div>
                    </>
                )}
            </CardContent>

            {/* Footer: Advanced Indicators */}
            <CardFooter className="p-4 pt-2 border-t border-border/30 bg-muted/20 flex items-center justify-between">
                <div className="flex gap-2">
                    {/* Tier Indicator */}
                    {isRestricted ? (
                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-medium" title={`Restricted to: ${tiers.join(', ')}`}>
                            <UsersIcon className="w-3 h-3" />
                            <span>{tiers.length > 2 ? 'Multi-Tier' : tiers.map(t => t.slice(0, 1).toUpperCase()).join('/')}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50" title="Available to Everyone">
                            <UsersIcon className="w-3 h-3" />
                            <span>All</span>
                        </div>
                    )}

                    {/* Pricing Indicator */}
                    {hasPricing && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                            <DollarSignIcon className="w-3 h-3" />
                            <span>{rules.length} Rule{rules.length > 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>

                {/* Advanced Settings Trigger */}
                <Drawer open={isOpen} onOpenChange={setIsOpen}>
                    <DrawerTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/10 hover:text-primary">
                            <Settings2Icon className="w-3.5 h-3.5" />
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                        <div className="mx-auto w-full max-w-lg">
                            <DrawerHeader>
                                <DrawerTitle>Configure: {param.label || param.id}</DrawerTitle>
                                <DrawerDescription>Set access tiers and pricing logic.</DrawerDescription>
                            </DrawerHeader>

                            <div className="p-4 space-y-6">
                                {/* Section 1: Visibility & Tiers */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <UsersIcon className="w-4 h-4 text-primary" /> Access Tiers
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['starter', 'pro', 'studio'].map(tier => {
                                            const isActive = tiers.includes(tier)
                                            return (
                                                <div
                                                    key={tier}
                                                    onClick={() => {
                                                        const newTiers = isActive
                                                            ? tiers.filter(t => t !== tier)
                                                            : [...tiers, tier]
                                                        onConfigChange(param.id, { access_tiers: newTiers })
                                                    }}
                                                    className={cn(
                                                        "cursor-pointer border rounded-md p-2 text-center text-xs transition-colors",
                                                        isActive ? "bg-primary/10 border-primary text-primary font-medium" : "hover:bg-muted"
                                                    )}
                                                >
                                                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Select none to make available to all users.</p>
                                </div>

                                {/* Section 2: Pricing Rules */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            <DollarSignIcon className="w-4 h-4 text-emerald-500" /> Pricing Rules
                                        </h4>
                                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => {
                                            const newRule: PricingRule = {
                                                id: Math.random().toString(36).substr(2, 9),
                                                param_id: param.id,
                                                operator: 'gt',
                                                value: '',
                                                surcharge: 1
                                            }
                                            onConfigChange(param.id, { pricing_rules: [...rules, newRule] })
                                        }}>
                                            + Add Rule
                                        </Button>
                                    </div>

                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {rules.length === 0 ? (
                                            <div className="text-xs text-muted-foreground italic text-center py-4 border border-dashed rounded-md">
                                                No pricing rules defined.
                                            </div>
                                        ) : (
                                            rules.map((rule, idx) => (
                                                <div key={rule.id || idx} className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border text-xs">
                                                    <span className="font-mono text-muted-foreground">IF val</span>
                                                    <Select defaultValue={rule.operator} onValueChange={(v: any) => {
                                                        const newRules = [...rules]; newRules[idx].operator = v;
                                                        onConfigChange(param.id, { pricing_rules: newRules })
                                                    }}>
                                                        <SelectTrigger className="h-6 w-[70px] text-[10px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="gt">&gt;</SelectItem>
                                                            <SelectItem value="lt">&lt;</SelectItem>
                                                            <SelectItem value="eq">=</SelectItem>
                                                            <SelectItem value="in">IN</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        className="h-6 w-[80px] text-[10px]"
                                                        placeholder="Value"
                                                        defaultValue={rule.value}
                                                        onBlur={(e) => {
                                                            const newRules = [...rules]; newRules[idx].value = e.target.value;
                                                            onConfigChange(param.id, { pricing_rules: newRules })
                                                        }}
                                                    />
                                                    <span className="font-mono text-muted-foreground">THEN +</span>
                                                    <Input
                                                        className="h-6 w-[50px] text-[10px]"
                                                        type="number"
                                                        defaultValue={rule.surcharge}
                                                        onChange={(e) => {
                                                            const newRules = [...rules]; newRules[idx].surcharge = parseInt(e.target.value);
                                                            onConfigChange(param.id, { pricing_rules: newRules })
                                                        }}
                                                    />
                                                    <span className="font-mono text-muted-foreground">cr</span>

                                                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:text-red-500" onClick={() => {
                                                        const newRules = rules.filter((_, i) => i !== idx)
                                                        onConfigChange(param.id, { pricing_rules: newRules })
                                                    }}>
                                                        &times;
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DrawerFooter>
                                <Button onClick={() => setIsOpen(false)}>Done</Button>
                                <DrawerClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </div>
                    </DrawerContent>
                </Drawer>
            </CardFooter>
        </Card>
    )
}
