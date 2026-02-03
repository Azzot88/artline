
import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { apiService } from "@/polymet/data/api-service"
import { AIModel } from "@/polymet/data/models-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleContent,
} from "@/components/ui/collapsible"
import {
    ChevronDown,
    ChevronRight,
    Braces,
    Settings2,
    Play,
    Search,
    Wand2,
    LayoutTemplate,
    XIcon
} from "lucide-react"
import { CANONICAL_FIELDS, CANONICAL_SECTIONS, CanonicalFieldDef } from "@/polymet/data/canonical-schema"

export function SchemaVisualizer() {
    const [models, setModels] = useState<AIModel[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            const data = await apiService.getAdminModels()
            setModels(data)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 flex flex-col">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Schema Designer</h2>
                <p className="text-muted-foreground">
                    Designer Workspace: Source &rarr; Configurator &rarr; Live Preview.
                </p>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col border-0 shadow-none">
                <div className="overflow-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {models.map(model => (
                                <ModelRow key={model.id} initialModel={model} />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}

function ModelRow({ initialModel }: { initialModel: AIModel }) {
    const [isOpen, setIsOpen] = useState(false)
    const [details, setDetails] = useState<AIModel | null>(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    async function toggleOpen() {
        if (!isOpen && !details) {
            setLoading(true)
            try {
                const fullData = await apiService.getAdminModel(initialModel.id)
                setDetails(fullData)
            } finally {
                setLoading(false)
            }
        }
        setIsOpen(!isOpen)
    }

    const model = details || initialModel

    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={toggleOpen}
            >
                <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleOpen(); }}>
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                </TableCell>
                <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        {model.cover_image_url && (
                            <img src={model.cover_image_url} className="w-6 h-6 rounded object-cover" />
                        )}
                        {model.display_name}
                    </div>
                </TableCell>
                <TableCell>{model.provider}</TableCell>
                <TableCell>
                    <Badge variant="outline" className={model.ui_config ? "text-blue-600 border-blue-200" : "text-slate-500"}>
                        {model.ui_config ? "Configured" : "Default"}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/models/${model.id}/normalization`); }}
                    >
                        <LayoutTemplate className="w-4 h-4 mr-2" />
                        Full Builder
                    </Button>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={5} className="p-0 border-b-0">
                    <Collapsible open={isOpen}>
                        <CollapsibleContent className="bg-muted/30 border-b animate-in slide-in-from-top-2 p-0">
                            {loading ? (
                                <div className="py-8 text-center text-muted-foreground">Loading workspace...</div>
                            ) : details ? (
                                <SchemaWorkspace model={details} />
                            ) : null}
                        </CollapsibleContent>
                    </Collapsible>
                </TableCell>
            </TableRow>
        </>
    )
}

function SchemaWorkspace({ model }: { model: AIModel }) {
    // 1. Source Data
    const raw = model.raw_schema_json

    // 2. Workbench Data (Merged Extracted + Config)
    const extracted = (model as any).extracted_inputs || {}

    // 3. Preview Data (Live Spec is derived from this)
    // We update 'config' locally and user saves it.

    return (
        <div className="grid grid-cols-12 min-h-[600px] divide-x divide-border">
            {/* Column 1: Source (3 cols) */}
            <div className="col-span-3 flex flex-col bg-background/50">
                <div className="p-3 border-b flex items-center gap-2 font-semibold text-muted-foreground">
                    <Braces className="w-4 h-4" />
                    Source Schema
                </div>
                <div className="flex-1 overflow-auto bg-slate-950 text-slate-50 p-4 text-[10px] font-mono leading-relaxed">
                    <pre>{JSON.stringify(raw, null, 2)}</pre>
                </div>
            </div>

            {/* Column 2: Configurator (5 cols) */}
            <div className="col-span-5 flex flex-col bg-background">
                <SchemaConfigurator model={model} extractedInputs={extracted} rawSchema={raw} />
            </div>

            {/* Column 3: Live Preview (4 cols) */}
            <div className="col-span-4 flex flex-col bg-muted/10">
                <div className="p-3 border-b flex items-center gap-2 font-semibold text-muted-foreground">
                    <Play className="w-4 h-4" />
                    Live Preview
                </div>
                <div className="flex-1 p-6 overflow-auto">
                    <LivePreview model={model} />
                </div>
            </div>
        </div>
    )
}

function SchemaConfigurator({ model, extractedInputs, rawSchema }: any) {
    const [config, setConfig] = useState<any>(model.ui_config || {})
    const [saving, setSaving] = useState(false)
    const [newParam, setNewParam] = useState("")

    // Smart Scan State
    const [scannedParams, setScannedParams] = useState<string[]>([])

    // Merge all known keys
    const allKeys = useMemo(() => {
        return Array.from(new Set([
            ...Object.keys(extractedInputs || {}),
            ...Object.keys(config.parameters || {})
        ])).sort()
    }, [extractedInputs, config])

    // Helper: Find definition in raw schema
    function findDefinition(key: string, obj: any = rawSchema, depth = 0): any {
        if (depth > 5 || !obj || typeof obj !== 'object') return null
        // Direct property match in a 'properties' object
        if (obj.properties && obj.properties[key]) return obj.properties[key]
        // Array items match (recurse) - simplistic
        for (const k in obj) {
            const res = findDefinition(key, obj[k], depth + 1)
            if (res) return res
        }
        return null
    }

    // Heuristic Scan
    function runSmartScan() {
        if (!rawSchema) return
        const found = new Set<string>()

        function traverse(obj: any, depth = 0) {
            if (depth > 5) return
            if (!obj || typeof obj !== 'object') return
            // Look for "properties" keys
            if (obj.properties) Object.keys(obj.properties).forEach(k => found.add(k))
            for (const key in obj) {
                if (typeof obj[key] === 'object') traverse(obj[key], depth + 1)
            }
        }
        traverse(rawSchema)
        const newFound = Array.from(found).filter(k => !allKeys.includes(k))
        setScannedParams(newFound)
    }

    async function handleUpdate(paramId: string, updates: any) {
        const newConfig = { ...config }
        if (!newConfig.parameters) newConfig.parameters = {}
        if (!newConfig.parameters[paramId]) newConfig.parameters[paramId] = {}
        newConfig.parameters[paramId] = { ...newConfig.parameters[paramId], ...updates }

        // Auto-configure widget based on canonical key if selected
        if (updates.canonical_key) {
            const cField = CANONICAL_FIELDS[updates.canonical_key]
            if (cField) {
                if (cField.type === 'image') newConfig.parameters[paramId].component_type = 'auto'
                if (cField.type === 'enum') newConfig.parameters[paramId].component_type = 'select'
                if (cField.type === 'integer' || cField.type === 'number') newConfig.parameters[paramId].component_type = 'slider'
                if (cField.type === 'boolean') newConfig.parameters[paramId].component_type = 'switch'
                if (cField.type === 'string') {
                    newConfig.parameters[paramId].component_type = cField.key.includes('negative') ? 'textarea' : 'text'
                }
                // Auto-label if not manual
                if (!newConfig.parameters[paramId].custom_label || newConfig.parameters[paramId].custom_label === paramId) {
                    newConfig.parameters[paramId].custom_label = cField.label
                }
            }
        }
        setConfig(newConfig)
    }

    async function saveChanges() {
        try {
            setSaving(true)
            await apiService.updateModel(model.id, { ui_config: config })
        } finally {
            setSaving(false)
        }
    }

    async function addParam(key: string) {
        const def = findDefinition(key)
        const updates: any = {
            enabled: true,
            component_type: 'auto',
            custom_label: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        }
        if (def) {
            if (def.type === 'integer' || def.type === 'number') updates.component_type = 'slider'
            if (def.type === 'boolean') updates.component_type = 'switch'
            if (def.enum) updates.component_type = 'select'
        }
        await handleUpdate(key, updates)
        setScannedParams(prev => prev.filter(p => p !== key))
    }

    async function deleteParam(key: string) {
        const newConfig = { ...config }
        if (newConfig.parameters) delete newConfig.parameters[key]
        setConfig(newConfig)
        if (!scannedParams.includes(key)) setScannedParams(prev => [...prev, key].sort())
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b flex items-center justify-between bg-card">
                <div className="flex items-center gap-2 font-semibold">
                    <Settings2 className="w-4 h-4" />
                    Configurator
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={runSmartScan} title="Scan Source JSON for missing params">
                        <Wand2 className="w-3 h-3 mr-2" />
                        Smart Scan
                    </Button>
                    <Button size="sm" onClick={saveChanges} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {scannedParams.length > 0 && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border-b">
                    <div className="text-xs font-semibold text-blue-600 mb-2">Smart Scan Found:</div>
                    <div className="flex flex-wrap gap-2">
                        {scannedParams.map(p => (
                            <Badge key={p} variant="outline" className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors" onClick={() => addParam(p)}>
                                + {p}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex p-2 border-b gap-2">
                <Input
                    placeholder="Add manual parameter..."
                    className="h-8 text-xs"
                    value={newParam}
                    onChange={e => setNewParam(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addParam(newParam)}
                />
                <Button size="sm" variant="outline" onClick={() => addParam(newParam)} disabled={!newParam}>Add</Button>
            </div>

// ... SchemaConfigurator ...

            // Derived state for the card
            const mappedCanonical = paramConfig.canonical_key ? CANONICAL_FIELDS[paramConfig.canonical_key] : null
            const showEnumMap = mappedCanonical?.type === 'enum' && mappedCanonical.options
            const showTransform = paramConfig.component_type === 'slider' || (mappedCanonical && ['number', 'integer'].includes(mappedCanonical.type))

            return (
            <Card key={key} className={`p-3 transition-colors ${isEnabled ? 'bg-card' : 'bg-muted/40 opacity-70'}`}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{key}</span>
                            {extracted && <Badge variant="secondary" className="text-[10px] h-4 px-1">{extracted.type}</Badge>}
                            {isConfigured && <Badge variant="outline" className="text-[10px] h-4 px-1 text-blue-500 border-blue-200">Configured</Badge>}
                        </div>
                        <div className="text-[10px] text-muted-foreground line-clamp-1" title={extracted?.message || extracted?.description}>
                            {extracted?.title || extracted?.description || "No description"}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={isEnabled}
                            onCheckedChange={c => handleUpdate(key, { enabled: c })}
                            className="scale-75"
                        />
                        {isConfigured && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteParam(key)}
                                title="Remove from Config"
                            >
                                <XIcon className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                </div>

                {isEnabled && (
                    <div className="mt-3 space-y-3 animation-fade-in">
                        {/* 1. Canonical Mapping & Widget Type */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1 border rounded px-2 h-7 bg-background focus-within:ring-1 focus-within:ring-ring">
                                <span className="text-[10px] text-muted-foreground mr-auto shrink-0 font-medium text-blue-600">Map To</span>
                                <select
                                    className="h-full flex-1 bg-transparent text-[10px] border-none focus:ring-0 outline-none text-right w-full"
                                    value={paramConfig.canonical_key || ""}
                                    onChange={e => handleUpdate(key, { canonical_key: e.target.value })}
                                >
                                    <option value="">-- None --</option>
                                    {Object.values(CANONICAL_FIELDS).map(f => (
                                        <option key={f.key} value={f.key}>
                                            {f.section.toUpperCase()} / {f.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Select
                                value={paramConfig.component_type || "auto"}
                                onValueChange={v => handleUpdate(key, { component_type: v })}
                            >
                                <SelectTrigger className="h-7 text-xs bg-background">
                                    <SelectValue placeholder="Widget" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto</SelectItem>
                                    <SelectItem value="text">Text Input</SelectItem>
                                    <SelectItem value="textarea">Textarea</SelectItem>
                                    <SelectItem value="slider">Slider</SelectItem>
                                    <SelectItem value="select">Select</SelectItem>
                                    <SelectItem value="switch">Switch</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 2. Label Override */}
                        <div className="flex items-center gap-1 border rounded px-2 h-7 bg-background focus-within:ring-1 focus-within:ring-ring">
                            <span className="text-[10px] text-muted-foreground mr-auto shrink-0">Label</span>
                            <Input
                                className="h-5 flex-1 min-w-0 text-[10px] p-0 border-0 focus-visible:ring-0 text-right"
                                value={paramConfig.custom_label || ""}
                                placeholder="Default"
                                onChange={e => handleUpdate(key, { custom_label: e.target.value })}
                            />
                        </div>

                        {/* 3. Enum Mapping Table (if applicable) */}
                        {showEnumMap && (
                            <div className="border rounded bg-muted/20 p-2 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Enum Mapping</span>
                                    <span className="text-[9px] text-muted-foreground">(Canonical Option → Raw Payload)</span>
                                </div>
                                <div className="space-y-1">
                                    {mappedCanonical!.options!.map(opt => {
                                        const currentMap = paramConfig.enum_map || {}
                                        return (
                                            <div key={opt} className="grid grid-cols-2 gap-2 items-center">
                                                <Badge variant="outline" className="text-[10px] justify-center h-5 bg-background font-normal">{opt}</Badge>
                                                <Input
                                                    className="h-5 text-[10px] px-1"
                                                    placeholder={opt}
                                                    value={currentMap[opt] || ""}
                                                    onChange={e => {
                                                        const newMap = { ...currentMap, [opt]: e.target.value }
                                                        handleUpdate(key, { enum_map: newMap })
                                                    }}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 4. Transform Logic (for numbers) */}
                        {showTransform && (
                            <div className="border rounded bg-muted/20 p-2 space-y-2">
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase flex justify-between">
                                    <span>Transform</span>
                                    <span className="text-[9px] font-normal lowercase">out = (in * mul) + off</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center border bg-background rounded px-1 h-6">
                                        <span className="text-[9px] text-muted-foreground mr-1">×</span>
                                        <Input
                                            className="h-full border-none p-0 text-[10px] text-right focus-visible:ring-0"
                                            placeholder="1"
                                            value={paramConfig.transform_multiply || ""}
                                            onChange={e => handleUpdate(key, { transform_multiply: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center border bg-background rounded px-1 h-6">
                                        <span className="text-[9px] text-muted-foreground mr-1">+</span>
                                        <Input
                                            className="h-full border-none p-0 text-[10px] text-right focus-visible:ring-0"
                                            placeholder="0"
                                            value={paramConfig.transform_offset || ""}
                                            onChange={e => handleUpdate(key, { transform_offset: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center border bg-background rounded px-1 h-6 flex-1">
                                        <span className="text-[9px] text-muted-foreground mr-1">Min</span>
                                        <Input
                                            className="h-full border-none p-0 text-[10px] text-right focus-visible:ring-0"
                                            placeholder={mappedCanonical?.min?.toString() || "0"}
                                            value={paramConfig.ui_min || ""}
                                            onChange={e => handleUpdate(key, { ui_min: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center border bg-background rounded px-1 h-6 flex-1">
                                        <span className="text-[9px] text-muted-foreground mr-1">Max</span>
                                        <Input
                                            className="h-full border-none p-0 text-[10px] text-right focus-visible:ring-0"
                                            placeholder={mappedCanonical?.max?.toString() || "100"}
                                            value={paramConfig.ui_max || ""}
                                            onChange={e => handleUpdate(key, { ui_max: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. Visibility Rules */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Visible if...</span>
                            {/* Simplified visibility rule builder for now */}
                            <select
                                className="h-5 w-32 bg-transparent text-[10px] border rounded px-1"
                                value={paramConfig.visible_if_param || ""}
                                onChange={e => handleUpdate(key, { visible_if_param: e.target.value })}
                            >
                                <option value="">(Always Visible)</option>
                                {allKeys.filter(k => k !== key).map(k => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>
                        {/* Closing visibility rules input */}
                        {paramConfig.visible_if_param && (
                            <div className="flex items-center gap-1 border rounded px-2 h-7 bg-background">
                                <span className="text-[10px] text-muted-foreground mr-auto">=</span>
                                <Input
                                    className="h-5 flex-1 min-w-0 text-[10px] p-0 border-0 focus-visible:ring-0 text-right"
                                    value={paramConfig.visible_if_value || ""}
                                    placeholder="Value"
                                    onChange={e => handleUpdate(key, { visible_if_value: e.target.value })}
                                />
                            </div>
                        )}

                    </div>
                )}
            </Card>
            )
                    })}
        </div>
            </ScrollArea >
        </div >
    )
}

function LivePreview({ model }: { model: AIModel }) {
    // Wait, I didn't lift state up in the code above.
    // Let's rely on the user clicking "Save" for now to see updates, 
    // OR self-fetch. 
    // Actually, let's fix the architecture in the next step to be truly live.

    const spec = (model as any).spec || []

    if (spec.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <Play className="w-12 h-12 mb-4 opacity-20" />
                <p>Configure parameters in Workbench to see the form.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
                <h3 className="text-lg font-bold">{model.display_name}</h3>
                <p className="text-sm text-muted-foreground">{model.description}</p>
            </div>

            <div className="space-y-4">
                {spec.map((param: any) => (
                    <PreviewField key={param.id} param={param} />
                ))}
            </div>

            <Button className="w-full">Generate</Button>
        </div>
    )
}

function PreviewField({ param }: { param: any }) {
    return (
        <div className="space-y-1.5 animation-fade-in">
            <Label className="text-sm font-medium">{param.label || param.id}</Label>

            {param.type === "select" && (
                <Select defaultValue={param.default}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                        {(param.options || []).map((opt: any) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {(param.type === "integer" || param.type === "number") && (
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <Slider
                            defaultValue={[param.default || 0]}
                            min={param.min}
                            max={param.max}
                            step={param.step || 1}
                            className="flex-1"
                        />
                        <span className="text-xs w-8 text-right font-mono">{param.default}</span>
                    </div>
                </div>
            )}

            {param.type === "string" && !param.options && (
                <Input placeholder={param.description} defaultValue={param.default} />
            )}

            {param.type === "boolean" && (
                <div className="flex items-center gap-2">
                    <Switch defaultChecked={param.default} />
                    <span className="text-xs text-muted-foreground">{param.description}</span>
                </div>
            )}
            {/* Fallback */}
            {!["select", "integer", "number", "string", "boolean"].includes(param.type) && (
                <Input placeholder="Unknown type" disabled />
            )}
        </div>
    )
}

