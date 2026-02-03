
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiService } from "@/polymet/data/api-service"
import { AIModel } from "@/polymet/data/models-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from "@/components/ui/collapsible"
import {
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Database,
    FileJson,
    LayoutTemplate
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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
            // We need to fetch details for each model to get extracted_inputs if not present in list
            // Optimization: Fetch details on expand? 
            // For now, let's fetch all details in parallel or just rely on list if backend includes it.
            // Backend update added it to `get_model` (detail), not list. 
            // So we need to fetch detail on expand.
            setModels(data)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Schema Visualizer</h2>
                <p className="text-muted-foreground">
                    Deep inspection of the Schema Pipeline steps: Raw &rarr; Extracted &rarr; Spec.
                </p>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Schema Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {models.map(model => (
                                <ModelRow key={model.id} initialModel={model} />
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
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
            <TableRow>
                <TableCell>
                    <Button variant="ghost" size="sm" onClick={toggleOpen}>
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
                    <div className="flex gap-2">
                        <Badge variant="outline" className={model.raw_schema_json ? "text-green-600 border-green-200" : "text-yellow-600 border-yellow-200"}>
                            {model.raw_schema_json ? "Raw Schema" : "Missing Raw"}
                        </Badge>
                        <Badge variant="outline" className={model.ui_config ? "text-blue-600 border-blue-200" : "text-slate-500"}>
                            {model.ui_config ? "Configured" : "Default"}
                        </Badge>
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/models/${model.id}/normalization`)}>
                        <LayoutTemplate className="w-4 h-4 mr-2" />
                        Builder
                    </Button>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={5} className="p-0 border-b-0">
                    <Collapsible open={isOpen}>
                        <CollapsibleContent className="p-4 bg-muted/30 border-b animate-in slide-in-from-top-2">
                            {loading ? (
                                <div className="py-8 text-center text-muted-foreground">Loading pipeline data...</div>
                            ) : details ? (
                                <PipelineInspector model={details} />
                            ) : null}
                        </CollapsibleContent>
                    </Collapsible>
                </TableCell>
            </TableRow>
        </>
    )
}

function PipelineInspector({ model }: { model: AIModel }) {
    // We assume 'extracted_inputs' is usually available on the detailed model object now.
    // If typescript complains, we cast or check keys.
    const extracted = (model as any).extracted_inputs || {}
    const raw = model.raw_schema_json
    const spec = (model as any).spec

    return (
        <div className="grid grid-cols-3 gap-4 h-[600px]">
            {/* Stage 1: Raw */}
            <StageColumn
                title="1. Raw Provider Schema"
                icon={Database}
                data={raw}
                className="border-green-200 bg-green-50/50 dark:bg-green-950/10"
            />

            {/* Stage 2: Extracted & Controls */}
            <ExtractedInputsControls
                model={model}
                extractedInputs={extracted}
                className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10"
            />

            {/* Stage 3: Final Spec */}
            <StageColumn
                title="3. Final UI Spec"
                icon={LayoutTemplate}
                data={spec}
                className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/10"
                description="Result after applying UI Config & Access Control"
            />
        </div>
    )
}

function ExtractedInputsControls({ model, extractedInputs, className }: any) {
    const [config, setConfig] = useState<any>(model.ui_config || {})
    const [saving, setSaving] = useState(false)

    // Merge extracted keys with config keys to show everything
    const allKeys = Array.from(new Set([
        ...Object.keys(extractedInputs || {}),
        ...Object.keys(config.parameters || {})
    ])).sort()

    async function handleUpdate(paramId: string, updates: any) {
        const newConfig = { ...config }
        if (!newConfig.parameters) newConfig.parameters = {}
        if (!newConfig.parameters[paramId]) newConfig.parameters[paramId] = {}

        newConfig.parameters[paramId] = {
            ...newConfig.parameters[paramId],
            ...updates
        }

        setConfig(newConfig)
    }

    async function saveChanges() {
        try {
            setSaving(true)
            await apiService.updateModel(model.id, { ui_config: config })
            // Ideally reload the model here to refresh the Spec column
            // But for now, we rely on the parent to eventually refresh or user to re-expand
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className={`flex flex-col rounded-lg border h-full overflow-hidden ${className}`}>
            <div className="p-3 border-b bg-background/50 backdrop-blur flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                    <FileJson className="w-4 h-4" />
                    2. Extracted Inputs
                </div>
                <Button size="sm" onClick={saveChanges} disabled={saving}>
                    {saving ? "Saving..." : "Save Config"}
                </Button>
            </div>
            <div className="flex-1 overflow-auto p-2 bg-background/50 space-y-2">
                {allKeys.length === 0 && <div className="text-sm text-muted-foreground p-4">No inputs detected.</div>}

                {allKeys.map(key => {
                    const extracted = extractedInputs[key]
                    const paramConfig = config.parameters?.[key] || {}
                    const isEnabled = paramConfig.enabled !== false // Default to true if not specified? 
                    // Actually existing logic might be: if not in config, it passes through. 
                    // Let's assume enabled=true by default.

                    return (
                        <Card key={key} className="p-3 bg-card/80">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="font-medium text-sm flex items-center gap-2">
                                        {key}
                                        {extracted ? (
                                            <Badge variant="outline" className="text-[10px] h-4">
                                                {extracted.type}
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px] h-4">Config Only</Badge>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                        {extracted?.title || "No description"}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Switch
                                        checked={isEnabled}
                                        onCheckedChange={(c) => handleUpdate(key, { enabled: c })}
                                        className="scale-75"
                                    />
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="grid grid-cols-1 gap-2">
                                <Select
                                    value={paramConfig.component_type || "auto"}
                                    onValueChange={(v) => handleUpdate(key, { component_type: v === "auto" ? undefined : v })}
                                >
                                    <SelectTrigger className="h-7 text-xs">
                                        <SelectValue placeholder="Widget Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">Auto</SelectItem>
                                        <SelectItem value="slider">Slider</SelectItem>
                                        <SelectItem value="select">Select</SelectItem>
                                        <SelectItem value="switch">Switch</SelectItem>
                                        <SelectItem value="textarea">Text Area</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

function StageColumn({ title, icon: Icon, data, className, description }: any) {
    return (
        <div className={`flex flex-col rounded-lg border h-full overflow-hidden ${className}`}>
            <div className="p-3 border-b bg-background/50 backdrop-blur">
                <div className="flex items-center gap-2 font-semibold">
                    <Icon className="w-4 h-4" />
                    {title}
                </div>
                {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
            </div>
            <div className="flex-1 overflow-auto p-0 bg-background/50">
                <JsonViewer data={data} />
            </div>
        </div>
    )
}

function JsonViewer({ data }: { data: any }) {
    if (!data) return <div className="p-4 text-sm text-muted-foreground italic">No data</div>

    return (
        <pre className="text-[10px] font-mono p-4 leading-relaxed">
            {JSON.stringify(data, null, 2)}
        </pre>
    )
}
