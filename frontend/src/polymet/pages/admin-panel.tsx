import { useEffect, useState } from "react"
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
import { Link } from "react-router-dom"
import { TrashIcon, PencilIcon, ChevronDown, ChevronUp, CheckSquare, Square } from "lucide-react"
import { normalizeGeneration } from "@/polymet/data/transformers"

export function AdminPanel() {
    const [stats, setStats] = useState<AdminStats | null>(null)

    useEffect(() => {
        apiService.getAdminStats().then(setStats)
    }, [])

    return (
        <div className="container mx-auto p-8 space-y-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard title="Total Users" value={stats?.total_users} />
                <StatsCard title="Total Jobs" value={stats?.total_jobs} />
                <StatsCard title="Active Jobs" value={stats?.active_jobs} />
                <StatsCard title="Total Credits" value={stats?.total_credits} />
            </div>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
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

function StatsCard({ title, value }: { title: string, value?: number }) {
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {models.map(m => (
                    <Card key={m.id} className="overflow-hidden">
                        <div className="h-32 bg-muted relative">
                            {m.cover_image_url && (
                                <img src={m.cover_image_url} className="w-full h-full object-cover" alt={m.display_name} />
                            )}
                            <div className="absolute top-2 right-2">
                                <Badge variant={m.is_active ? "default" : "secondary"}>
                                    {m.is_active ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold truncate">{m.display_name}</h4>
                                    <p className="text-xs text-muted-foreground">{m.provider} / {m.model_ref}</p>
                                </div>
                                <Badge variant="outline">{m.type}</Badge>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Link to={`/model-config/${m.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full" size="sm">
                                        <PencilIcon className="w-3 h-3 mr-2" /> Configure
                                    </Button>
                                </Link>
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteM(m.id)}>
                                    <TrashIcon className="w-3 h-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
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
        await apiService.createModel(data)
        onComplete()
    }

    return (
        <Card className="bg-muted/50 mb-6">
            <CardHeader><CardTitle>Register New Model</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm">Internal Name</label>
                        <Input placeholder="flux-schnell" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm">Display Name</label>
                        <Input placeholder="Flux Schnell" value={data.display_name} onChange={e => setData({ ...data, display_name: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm">Provider</label>
                        <Input value={data.provider} onChange={e => setData({ ...data, provider: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm">Model Ref (Owner/Name)</label>
                        <Input placeholder="black-forest-labs/flux-schnell" value={data.model_ref} onChange={e => setData({ ...data, model_ref: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm">Type</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={data.type}
                            onChange={e => setData({ ...data, type: e.target.value as any })}
                        >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm">Cost (Credits)</label>
                        <Input type="number" value={data.credits} onChange={e => setData({ ...data, credits: Number(e.target.value) })} />
                    </div>
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
