
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
    const extracted = (model as any).extracted_inputs
    const raw = model.raw_schema_json
    const spec = (model as any).spec

    return (
        <div className="grid grid-cols-3 gap-4 h-[500px]">
            {/* Stage 1: Raw */}
            <StageColumn
                title="1. Raw Provider Schema"
                icon={Database}
                data={raw}
                className="border-green-200 bg-green-50/50 dark:bg-green-950/10"
            />

            {/* Stage 2: Extracted */}
            <StageColumn
                title="2. Extracted Inputs"
                icon={FileJson}
                data={extracted}
                className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10"
                description="Backend logic (extract_input_properties) result"
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
