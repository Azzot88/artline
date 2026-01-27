import { useState, useEffect, useRef } from "react"
import { apiService } from "@/polymet/data/api-service"
import type { SystemLog, SystemHealth, UserActivity, VisitorStat } from "@/polymet/data/api-types"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, Server, Database, RefreshCw, Pause, Play, Trash2, Terminal } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

export function SystemHealthPage() {
    const [health, setHealth] = useState<SystemHealth | null>(null)
    const [logs, setLogs] = useState<SystemLog[]>([])
    const [isLoadingLogs, setIsLoadingLogs] = useState(false)
    const [isLive, setIsLive] = useState(false) // Default to false (manual mode)
    const [activities, setActivities] = useState<UserActivity[]>([])
    const [visitors, setVisitors] = useState<VisitorStat[]>([])
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)

    // Polling for HEALTH stats (always active for monitoring)
    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const data = await apiService.getSystemHealth()
                setHealth(data)
            } catch (e) {
                console.error(e)
            }
        }

        fetchHealth()
        const interval = setInterval(fetchHealth, 2000)
        return () => clearInterval(interval)
    }, [])

    // Log Fetching Logic
    const fetchLogs = async () => {
        setIsLoadingLogs(true)
        try {
            const data = await apiService.getSystemLogs()
            // Invert order to show newest first? Or keep chronological?
            // Usually newest first is better for manual table view.
            setLogs(data.reverse())
        } catch (e) {
            console.error(e)
            toast.error("Failed to fetch logs")
        } finally {
            setIsLoadingLogs(false)
        }
    }

    // Effect for "Live" mode
    useEffect(() => {
        if (!isLive) return

        fetchLogs() // Initial fetch when switching to live
        const interval = setInterval(fetchLogs, 2000)
        return () => clearInterval(interval)
    }, [isLive])

    // Analytics Fetching
    const fetchAnalytics = async () => {
        setIsLoadingAnalytics(true)
        try {
            const [acts, visits] = await Promise.all([
                apiService.getAnalyticsActivity(100),
                apiService.getAnalyticsVisitors(30)
            ])
            setActivities(acts)
            setVisitors(visits)
        } catch (e) {
            console.error(e)
            toast.error("Failed to fetch analytics")
        } finally {
            setIsLoadingAnalytics(false)
        }
    }

    // Initial load? maybe user wants empty state until they click "Load"?

    // Initial load? maybe user wants empty state until they click "Load"?
    // Or load once on mount? Let's load once on mount.
    useEffect(() => {
        useEffect(() => {
            fetchLogs()
            fetchAnalytics()
        }, [])
    }, [])

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getLevelBadge = (level: string) => {
        const l = level.toUpperCase()
        if (l === 'ERROR') return <Badge variant="destructive">ERROR</Badge>
        if (l === 'WARNING') return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">WARN</Badge>
        if (l === 'INFO') return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">INFO</Badge>
        return <Badge variant="outline">{l}</Badge>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
                <p className="text-muted-foreground">Monitor backend performance and system logs.</p>
            </div>

            {/* Health Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{health?.cpu_percent ?? 0}%</div>
                        <p className="text-xs text-muted-foreground">Core Load</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Memory</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{health ? formatBytes(health.memory.used) : '-'}</div>
                        <p className="text-xs text-muted-foreground">
                            of {health ? formatBytes(health.memory.total) : '-'} ({health?.memory.percent}%)
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disk Space</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{health ? formatBytes(health.disk.free) : '-'}</div>
                        <p className="text-xs text-muted-foreground">Free Space</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">Healthy</div>
                        <p className="text-xs text-muted-foreground">Backend Online</p>
                    </CardContent>
                </Card>
            </div>

            {/* Logs Table Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>System Logs</CardTitle>
                        <CardDescription>
                            Recent backend events ({logs.length} items loaded)
                        </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="flex items-center space-x-2 mr-2">
                            <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-zinc-300'}`} />
                            <span className="text-sm text-muted-foreground">{isLive ? "Live" : "Static"}</span>
                        </div>

                        <Button
                            variant={isLive ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setIsLive(!isLive)}
                        >
                            {isLive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                            {isLive ? "Stop Live" : "Go Live"}
                        </Button>

                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => fetchLogs()}
                            disabled={isLoadingLogs || isLive}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <div className="relative w-full overflow-auto max-h-[600px]">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b bg-muted/50 sticky top-0 z-10 w-full backdrop-blur">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[180px]">Timestamp</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[100px]">Level</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[200px]">Logger</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Message</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="h-24 text-center">
                                                No logs found.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log, i) => (
                                            <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle whitespace-nowrap font-mono text-xs text-muted-foreground">
                                                    {format(new Date(log.timestamp), 'MMM dd HH:mm:ss.SSS')}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {getLevelBadge(log.level)}
                                                </td>
                                                <td className="p-4 align-middle font-medium text-xs font-mono truncate max-w-[200px]" title={log.logger}>
                                                    {log.logger}
                                                </td>
                                                <td className="p-4 align-middle font-mono text-xs break-all">
                                                    {log.message}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Analytics Section */}
            <div className="pt-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">User Analytics</h3>
                        <p className="text-muted-foreground">Persistent activity logs from database.</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAnalytics}
                        disabled={isLoadingAnalytics}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </Button>
                </div>

                {/* Charts */}
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Unique Visitors (30d)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={visitors}>
                                    <XAxis
                                        dataKey="day"
                                        tickFormatter={(str) => format(new Date(str), 'MM/dd')}
                                        fontSize={12}
                                    />
                                    <YAxis fontSize={12} />
                                    <Tooltip
                                        labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                                    />
                                    <Bar dataKey="visitors" fill="#2563eb" radius={[4, 4, 0, 0]} name="Unique Visitors" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Actions (30d)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={visitors}>
                                    <XAxis
                                        dataKey="day"
                                        tickFormatter={(str) => format(new Date(str), 'MM/dd')}
                                        fontSize={12}
                                    />
                                    <YAxis fontSize={12} />
                                    <Tooltip
                                        labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                                    />
                                    <Bar dataKey="actions" fill="#16a34a" radius={[4, 4, 0, 0]} name="Total Actions" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Activity Log</CardTitle>
                        <CardDescription>Latest 100 recorded actions (Persistent)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>User / Guest</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="text-right">IP</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activities.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                No activity recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activities.map((act) => (
                                            <TableRow key={act.id}>
                                                <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                                                    {format(new Date(act.created_at), 'MMM dd HH:mm:ss')}
                                                </TableCell>
                                                <TableCell component="th" scope="row">
                                                    {act.user_id ? (
                                                        <Badge variant="outline" className="border-blue-500/50 text-blue-500">User</Badge>
                                                    ) : (
                                                        <div className="flex flex-col">
                                                            <Badge variant="secondary" className="w-fit text-xs">Guest</Badge>
                                                            <span className="text-[10px] text-muted-foreground truncate w-20" title={act.guest_id || ''}>
                                                                {act.guest_id?.slice(0, 8)}...
                                                            </span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={act.action.includes('error') || act.action.includes('fail') ? "destructive" : "default"}>
                                                        {act.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[300px] truncate text-xs font-mono" title={JSON.stringify(act.details)}>
                                                    {act.details ? JSON.stringify(act.details) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    {act.ip_address}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
