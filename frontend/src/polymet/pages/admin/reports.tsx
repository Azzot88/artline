import { useEffect, useState } from "react"
import { apiService } from "@/polymet/data/api-service"
import { normalizeGeneration } from "@/polymet/data/transformers"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { TrashIcon, ChevronDown, ChevronUp, Square, CheckSquare } from "lucide-react"

export function AdminReports() {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => { load() }, [])

    async function load() {
        setLoading(true)
        try {
            const res = await apiService.getBrokenJobs()
            const normalized = res.map(normalizeGeneration)
            setJobs(normalized)
            setSelectedIds(new Set())
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const toggleAll = () => {
        if (selectedIds.size > 0) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(jobs.map(j => j.id)))
        }
    }

    const handleDeleteSelected = async () => {
        if (!confirm(`Delete ${selectedIds.size} jobs permanently?`)) return
        setLoading(true)
        try {
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
        <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Broken Jobs</CardTitle>
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
                                <TableHead className="w-[50px]"></TableHead>
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
        </div>
    )
}
