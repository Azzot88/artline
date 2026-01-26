import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { apiService } from "@/polymet/data/api-service"
import { AIModel } from "@/polymet/data/models-data"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PencilIcon, TrashIcon, FileTextIcon, ImageIcon, VideoIcon, MicIcon, MusicIcon, BrushIcon, ScalingIcon } from "lucide-react"

export function AdminModels() {
    const [models, setModels] = useState<AIModel[]>([])
    const [showAdd, setShowAdd] = useState(false)
    const navigate = useNavigate()

    useEffect(() => { load() }, [])

    async function load() {
        setModels(await apiService.getAdminModels())
    }

    async function deleteM(id: string) {
        if (!confirm("Delete model?")) return
        await apiService.deleteModel(id)
        load()
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-3xl font-bold tracking-tight">AI Models</h3>
                <Button onClick={() => setShowAdd(!showAdd)} size="sm">
                    {showAdd ? "Cancel" : "Add Model"}
                </Button>
            </div>

            {showAdd && <AddModelForm onComplete={() => { setShowAdd(false); load() }} />}

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {models.map(m => (
                                <TableRow
                                    key={m.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate(`/model-config/${m.id}`)}
                                >
                                    <TableCell>
                                        <div className="w-10 h-10 rounded bg-muted overflow-hidden relative">
                                            {m.cover_image_url ? (
                                                <img src={m.cover_image_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">?</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{m.display_name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{m.model_ref}</div>
                                    </TableCell>
                                    <TableCell>{m.provider}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col justify-center">
                                            <CapabilitiesIcons model={m} />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium flex items-center gap-1">
                                            {m.credits_per_generation ?? 5}
                                            <span className="text-xs text-muted-foreground">cr</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={m.is_active ? "default" : "secondary"}>
                                            {m.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            <Link to={`/model-config/${m.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <PencilIcon className="w-4 h-4 mr-2" /> Configure
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteM(m.id)}>
                                                <TrashIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function CapabilitiesIcons({ model }: { model: AIModel }) {
    const caps = (model.capabilities || []).map(c => c.toLowerCase())
    const type = model.type?.toLowerCase() || ""

    const isActive = (keys: string[]) => {
        if (caps.length > 0) {
            return keys.some(k => caps.some(c => c.includes(k)))
        }
        return keys.some(k => type.includes(k))
    }

    const icons = [
        { label: "Text", keys: ["text-generation", "llm"], icon: FileTextIcon, color: "text-blue-500" },
        { label: "Image", keys: ["image", "text-to-image"], icon: ImageIcon, color: "text-rose-500" },
        { label: "Video", keys: ["video"], icon: VideoIcon, color: "text-purple-500" },
        { label: "Speech", keys: ["speech", "tts", "audio"], icon: MicIcon, color: "text-yellow-500" },
        { label: "Music", keys: ["music"], icon: MusicIcon, color: "text-green-500" },
        { label: "Inpaint", keys: ["inpaint"], icon: BrushIcon, color: "text-indigo-500" },
        { label: "Upscale", keys: ["upscale"], icon: ScalingIcon, color: "text-cyan-500" },
    ]

    return (
        <div className="flex flex-wrap gap-1 max-w-[80px]">
            {icons.map((item, i) => {
                const active = isActive(item.keys)
                const Icon = item.icon
                return (
                    <div key={i} title={item.label} className={`${active ? item.color : "text-muted-foreground/20"}`}>
                        <Icon className="w-3 h-3" />
                    </div>
                )
            })}
        </div>
    )
}

function AddModelForm({ onComplete }: { onComplete: () => void }) {
    const [data, setData] = useState({
        name: "",
        display_name: "",
        provider: "replicate",
        model_ref: "",
        type: "image" as "image" | "video",
        credits: 5
    })

    async function submit() {
        try {
            if (!data.model_ref) {
                alert("Model Ref is required")
                return
            }

            await apiService.createModel({
                name: data.name,
                display_name: data.display_name,
                provider: data.provider,
                model_ref: data.model_ref,
                type: data.type,
                credits: Number(data.credits),
                is_active: true
            })

            try {
                await apiService.fetchModelSchema(data.model_ref)
            } catch (err) {
                console.error("Failed to auto-fetch schema:", err)
            }

            onComplete()
        } catch (e: any) {
            console.error(e)
            alert("Failed to create model: " + (e.message || e))
        }
    }

    return (
        <Card className="bg-muted/50 mb-6">
            <CardContent className="p-4 grid gap-4">
                <div className="flex justify-between items-center"><h3 className="font-semibold">Register New Model</h3></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Internal Name</label>
                        <Input placeholder="flux-schnell" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Display Name</label>
                        <Input placeholder="Flux Schnell" value={data.display_name} onChange={e => setData({ ...data, display_name: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Provider</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={data.provider}
                            onChange={e => setData({ ...data, provider: e.target.value })}
                        >
                            <option value="replicate">Replicate</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Link / Model Identifier</label>
                        <Input
                            placeholder="e.g. black-forest-labs/flux-schnell"
                            value={data.model_ref}
                            onChange={e => setData({ ...data, model_ref: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Cost (Credits)</label>
                        <Input type="number" value={data.credits} onChange={e => setData({ ...data, credits: Number(e.target.value) })} />
                    </div>
                </div>

                <Button onClick={submit}>Create Model</Button>
            </CardContent>
        </Card>
    )
}
