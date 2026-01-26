import { useEffect, useState } from "react"
import { apiService } from "@/polymet/data/api-service"
import { ProviderConfig } from "@/polymet/data/api-types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrashIcon } from "lucide-react"

export function AdminProviders() {
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
                <h3 className="text-3xl font-bold tracking-tight">AI Providers</h3>
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
