import { useState, useEffect, useRef } from "react"
import { apiService } from "@/polymet/data/api-service"
import type { SystemLog, SystemHealth } from "@/polymet/data/api-types"
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
    const [isLoading, setIsLoading] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const fetchHealth = async () => {
        try {
            const data = await apiService.getSystemHealth()
            setHealth(data)
        } catch (e) {
            console.error(e)
        }
    }

    const fetchLogs = async () => {
        if (isPaused) return
        try {
            const data = await apiService.getSystemLogs()
            // Append new logs or replace? Ideally replace since it's a buffer.
            // But to avoid jitter, we might want to diff. 
            // For MVP, replace is fine as it's a snapshot of last 1000.
            setLogs(data)
        } catch (e) {
            console.error(e)
        }
    }

    // Polling effect
    useEffect(() => {
        fetchHealth()
        fetchLogs()

        const interval = setInterval(() => {
            fetchHealth()
            fetchLogs()
        }, 2000)

        return () => clearInterval(interval)
    }, [isPaused])

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current && !isPaused) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs, isPaused])

    const getLevelColor = (level: string) => {
        switch (level.toUpperCase()) {
            case 'ERROR': return 'text-red-500'
            case 'WARNING': return 'text-yellow-500'
            case 'INFO': return 'text-blue-500'
            default: return 'text-muted-foreground'
        }
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
                <p className="text-muted-foreground">Monitor backend performance and real-time logs.</p>
            </div>

            {/* Health Cards Block */}
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

            {/* Log Viewer Block */}
            <Card className="flex flex-col h-[600px] border-zinc-800 bg-black">
                <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 py-3 bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-white" />
                        <div>
                            <CardTitle className="text-base text-white">Live Logs</CardTitle>
                            <CardDescription className="text-zinc-400 text-xs">Streaming from backend buffer</CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                            onClick={() => setIsPaused(!isPaused)}
                        >
                            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                            {isPaused ? "Resume" : "Pause"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                            onClick={() => setLogs([])}
                        >
                            <Trash2 className="h-3 w-3" />
                            Clear
                        </Button>
                    </div>
                </CardHeader>
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-auto p-4 font-mono text-xs md:text-sm bg-black text-zinc-300"
                >
                    {logs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-zinc-600 italic">
                            Waiting for logs...
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="mb-1 hover:bg-zinc-900/50 p-0.5 rounded flex gap-2 break-all">
                                <span className="text-zinc-500 whitespace-nowrap shrink-0">
                                    [{format(new Date(log.timestamp), 'HH:mm:ss')}]
                                </span>
                                <span className={`font-bold w-16 shrink-0 ${getLevelColor(log.level)}`}>
                                    {log.level}
                                </span>
                                <span className="text-zinc-500 w-32 shrink-0 truncate hidden md:block" title={log.logger}>
                                    {log.logger}
                                </span>
                                <span className="text-zinc-300">
                                    {log.message}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    )
}
