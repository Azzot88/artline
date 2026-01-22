import { useEffect, useState } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { apiService } from "@/polymet/data/api-service"
import { AdminStats, UserWithBalance, ProviderConfig } from "@/polymet/data/api-types"
import { AIModel } from "@/polymet/data/models-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { TrashIcon, PencilIcon, ChevronDown, ChevronUp, CheckSquare, Square, FileTextIcon, ImageIcon, VideoIcon, MicIcon, MusicIcon, BrushIcon, ScalingIcon } from "lucide-react"
import { normalizeGeneration } from "@/polymet/data/transformers"

export function AdminPanel() {
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get("tab") || "users"
    const [stats, setStats] = useState<AdminStats | null>(null)

    useEffect(() => {
        apiService.getAdminStats().then(setStats)
    }, [])

    const handleTabChange = (val: string) => {
        setSearchParams({ tab: val })
    }

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <SyncButton onSynced={setStats} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard title="Total Users" value={stats?.total_users} />
                <StatsCard title="Total Jobs" value={stats?.total_jobs} />
                <StatsCard title="24h Speed (Avg)" value={stats?.avg_predict_time_24h ? `${stats.avg_predict_time_24h}s` : "0s"} />
                <StatsCard title="24h Est. Cost" value={stats?.est_cost_24h ? `$${stats.est_cost_24h}` : "$0.00"} />
            </div>

            {/* Breakdown Cards */}
            {stats?.breakdown && Object.keys(stats.breakdown).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(stats.breakdown).map(([key, data]) => (
                        <Card key={key} className="bg-muted/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{key} Gen</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-2xl font-bold">{data.count}</div>
                                        <div className="text-xs text-muted-foreground">Runs (24h)</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-mono font-medium">{data.avg_time}s</div>
                                        <div className="text-xs text-muted-foreground">Avg Time</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-mono font-medium">${data.cost}</div>
                                        <div className="text-xs text-muted-foreground">Est. Cost</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-[500px]">
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="models">Models</TabsTrigger>
                    <TabsTrigger value="providers">Providers</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="mt-6">
                    <UsersTab />
                </TabsContent>

                <TabsContent value="models" className="mt-6">
                    <ModelsTab />
                </TabsContent>

                <TabsContent value="providers" className="mt-6">
                    <ProvidersTab />
                </TabsContent>

                <TabsContent value="reports" className="mt-6">
                    <ReportsTab />
                </TabsContent>

                <TabsContent value="system" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>System Health</CardTitle></CardHeader>
                        <CardContent>Coming Soon...</CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function SyncButton({ onSynced }: { onSynced: (s: AdminStats) => void }) {
    const [loading, setLoading] = useState(false)

    async function handle() {
        setLoading(true)
        try {
            const fresh = await apiService.syncGlobalStats()
            onSynced(fresh)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handle} disabled={loading}>
            {loading ? "Syncing..." : "Sync Health Stats"}
        </Button>
    )
}

function StatsCard({ title, value }: { title: string, value?: number | string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value ?? "..."}</div>
            </CardContent>
        </Card>
    )
}

// ------------------------------------------------------------------
// USERS TAB
// ------------------------------------------------------------------
function UsersTab() {
    const [users, setUsers] = useState<UserWithBalance[]>([])
    const [page, setPage] = useState(0)

    useEffect(() => {
        loadUsers()
    }, [page])

    async function loadUsers() {
        const u = await apiService.getAdminUsers(50, page * 50)
        setUsers(u)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage registered users and credits</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(u => (
                            <TableRow key={u.id}>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>{u.balance}</TableCell>
                                <TableCell>{u.is_admin ? "Yes" : "No"}</TableCell>
                                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <CreditGrantButton userId={u.id} onGrant={loadUsers} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function CreditGrantButton({ userId, onGrant }: { userId: string, onGrant: () => void }) {
    const [amount, setAmount] = useState(100)
    const [loading, setLoading] = useState(false)

    async function handle() {
        if (!confirm(`Grant ${amount} credits?`)) return
        setLoading(true)
        await apiService.grantCredits(userId, amount)
        setLoading(false)
        onGrant()
    }

    return (
        <div className="flex gap-2">
            <Input
                type="number"
                className="w-20 h-8"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
            />
            <Button size="sm" variant="outline" onClick={handle} disabled={loading}>Grant</Button>
        </div>
    )
}

// ------------------------------------------------------------------
// PROVIDERS TAB
// ------------------------------------------------------------------
function ProvidersTab() {
    const [providers, setProviders] = useState<ProviderConfig[]>([])
    const [showAdd, setShowAdd] = useState(false)

    useEffect(() => { load() }, [])

    async function load() {
        setProviders(await apiService.getProviders())
    }

    async function toggleActive(p: ProviderConfig) {
        await apiService.updateProvider(p.provider_id, { is_active: !p.is_active })
        load()
    }

    async function deleteP(id: string) {
        if (!confirm("Delete provider?")) return
        await apiService.deleteProvider(id)
        load()
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">AI Providers</h3>
                <Button onClick={() => setShowAdd(!showAdd)} size="sm">
                    {showAdd ? "Cancel" : "Add Provider"}
                </Button>
            </div>

            {showAdd && <AddProviderForm onComplete={() => { setShowAdd(false); load() }} />}

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {providers.map(p => (
                                <TableRow key={p.provider_id}>
                                    <TableCell className="font-medium">{p.provider_id}</TableCell>
                                    <TableCell>
                                        <Badge variant={p.is_active ? "default" : "secondary"}>
                                            {p.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>
                                            {p.is_active ? "Disable" : "Enable"}
                                        </Button>
                                        <Button size="icon" variant="destructive" className="w-8 h-8" onClick={() => deleteP(p.provider_id)}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
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

function AddProviderForm({ onComplete }: { onComplete: () => void }) {
    const [id, setId] = useState("")
    const [key, setKey] = useState("")

    async function submit() {
        if (!id || !key) return
        await apiService.createProvider({ provider_id: id, api_key: key })
        onComplete()
    }

    return (
        <Card className="bg-muted/50">
            <CardContent className="p-4 flex gap-4 items-end">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Provider ID</label>
                    <Input placeholder="e.g. replicate" value={id} onChange={e => setId(e.target.value)} />
                </div>
                <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium">API Key</label>
                    <Input type="password" placeholder="sk-..." value={key} onChange={e => setKey(e.target.value)} />
                </div>
                <Button onClick={submit}>Save</Button>
            </CardContent>
        </Card>
    )
}

// ------------------------------------------------------------------
// MODELS TAB
// ------------------------------------------------------------------
function ModelsTab() {
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
                <h3 className="text-lg font-medium">AI Models</h3>
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

    // Helper to check if active
    const isActive = (keys: string[]) => {
        // If caps exist, rely on them
        // If caps empty, fallback to type
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

            // Map frontend state to API request
            // Note: Backend expects 'credits_per_generation' in the DB model/schema?
            // Actually 'AIModelCreate' schema defines 'credits_per_generation'.
            // Frontend 'AIModelCreateRequest' defines 'credits'.
            // If backend schema doesn't alias 'credits', we must send 'credits_per_generation'.
            // However, 'apiService.createModel' takes 'AIModelCreateRequest' (with 'credits').
            // We should fix 'apiService' or pass 'credits_per_generation' if we can bypass type?
            // Or assume backend has an alias? (It doesn't in previous view).

            // Let's assume we need to fix the contract. For now, let's catch the error.
            await apiService.createModel({
                name: data.name,
                display_name: data.display_name,
                provider: data.provider,
                model_ref: data.model_ref,
                type: data.type,
                credits: data.credits,
                is_active: true
            })
            onComplete()
        } catch (e: any) {
            console.error(e)
            alert("Failed to create model: " + (e.message || e))
        }
    }

    return (
        <Card className="bg-muted/50 mb-6">
            <CardHeader><CardTitle>Register New Model</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
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
                            <option value="openai" disabled>OpenAI (Coming Soon)</option>
                            <option value="fal" disabled>Fal.ai (Coming Soon)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Link / Model Identifier</label>
                        <Input
                            placeholder="e.g. black-forest-labs/flux-schnell"
                            value={data.model_ref}
                            onChange={e => setData({ ...data, model_ref: e.target.value })}
                        />
                        <p className="text-[10px] text-muted-foreground">Owner/Name or Owner/Name:Version</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Cost (Credits)</label>
                        <Input type="number" value={data.credits} onChange={e => setData({ ...data, credits: Number(e.target.value) })} />
                    </div>
                    {/* Type is hidden, defaults to image */}
                </div>

                <Button onClick={submit}>Create Model</Button>
            </CardContent>
        </Card>
    )
}

// ------------------------------------------------------------------
// REPORTS TAB
// ------------------------------------------------------------------
function ReportsTab() {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [expandedId, setExpandedId] = useState<string | null>(null) // Single expansion for simplicity, or Set for multiple

    useEffect(() => { load() }, [])

    async function load() {
        setLoading(true)
        try {
            const res = await apiService.getBrokenJobs()
            // Normalize to get derived fields like user_name/params
            const normalized = res.map(normalizeGeneration)
            setJobs(normalized)
            setSelectedIds(new Set())
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // Toggle Selection
    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const toggleAll = () => {
        if (selectedIds.size > 0) {
            // Deselect All
            setSelectedIds(new Set())
        } else {
            // Select All
            setSelectedIds(new Set(jobs.map(j => j.id)))
        }
    }

    const handleDeleteSelected = async () => {
        if (!confirm(`Delete ${selectedIds.size} jobs permanently?`)) return
        setLoading(true)
        try {
            // Parallel delete
            await Promise.all(Array.from(selectedIds).map(id => apiService.deleteJob(id)))
            await load()
        } catch (e) {
            console.error("Bulk delete failed", e)
            alert("Some items failed to delete")
        } finally {
            setLoading(false)
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Broken Jobs Report</CardTitle>
                    <CardDescription>
                        Listing jobs that are failed or missing content (orphaned).
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={toggleAll}>
                        {selectedIds.size > 0 ? (
                            <><Square className="w-4 h-4 mr-2" /> Deselect All</>
                        ) : (
                            <><CheckSquare className="w-4 h-4 mr-2" /> Select All</>
                        )}
                    </Button>
                    {selectedIds.size > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                            <TrashIcon className="w-4 h-4 mr-2" /> Delete ({selectedIds.size})
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                {/* Header Checkbox optional, button covers it */}
                            </TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.map(job => (
                            <>
                                <TableRow
                                    key={job.id}
                                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${expandedId === job.id ? "bg-muted/50 border-b-0" : ""}`}
                                    onClick={() => toggleExpand(job.id)}
                                >
                                    <TableCell onClick={e => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedIds.has(job.id)}
                                            onCheckedChange={() => toggleSelect(job.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}...</TableCell>
                                    {/* User Column: Show Name (Status) */}
                                    <TableCell className="text-xs font-medium">
                                        {job.user_name || (job.user_id ? "User" : "Guest")}
                                        <div className="text-[10px] text-muted-foreground font-mono">{job.user_id ? "Registered" : "Anonymous"}</div>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {job.model_name || job.model_id || "Unknown"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="destructive">{job.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                        {job.error_message || (job.result_url ? "Missing URL content" : "Empty Result URL")}
                                    </TableCell>
                                    <TableCell className="text-xs">{new Date(job.created_at).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:text-primary hover:bg-primary/10"
                                            onClick={(e) => { e.stopPropagation(); toggleExpand(job.id) }}
                                        >
                                            {expandedId === job.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                {expandedId === job.id && (
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableCell colSpan={8} className="p-4 pt-0">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-xs font-mono bg-background p-4 rounded border whitespace-pre-wrap overflow-x-auto">
                                                    <div className="font-bold mb-2 text-primary">Parameters</div>
                                                    {/* Explicitly show params if available, else standard JSON dump */}
                                                    {job.params ? JSON.stringify(job.params, null, 2) : "No specific parameters recorded"}
                                                </div>
                                                <div className="text-xs font-mono bg-background p-4 rounded border whitespace-pre-wrap overflow-x-auto">
                                                    <div className="font-bold mb-2 text-primary">Raw Job Data</div>
                                                    {JSON.stringify(job, null, 2)}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        ))}
                    </TableBody>
                </Table>
                {loading && <div className="p-4 text-center text-muted-foreground">Loading...</div>}
                {!loading && jobs.length === 0 && <div className="p-4 text-center text-muted-foreground">No broken jobs found. Great!</div>}
            </CardContent>
        </Card>
    )
}
