import { useEffect, useState } from "react"
import { apiService } from "@/polymet/data/api-service"
import { AdminStats } from "@/polymet/data/api-types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"

export function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiService.getAdminStats().then((data) => {
            setStats(data)
            setLoading(false)
        })
    }, [])

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">High-level overview of system performance.</p>
                </div>
                <SyncButton onSynced={setStats} />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatsCard title="Total Users" value={stats?.total_users} />
                        <StatsCard title="Total Jobs" value={stats?.total_jobs} />
                        <StatsCard title="Active Jobs" value={stats?.active_jobs} />
                        <StatsCard title="Credits Issued" value={stats?.total_credits} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatsCard title="24h Avg Speed" value={stats?.avg_predict_time_24h ? `${stats.avg_predict_time_24h}s` : "0s"} />
                        <StatsCard title="24h Est. Cost" value={stats?.est_cost_24h ? `$${stats.est_cost_24h}` : "$0.00"} />
                    </div>

                    {/* Breakdown Cards */}
                    {stats?.breakdown && Object.keys(stats.breakdown).length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Generation Breakdown (24h)</h3>
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
                                                    <div className="text-xs text-muted-foreground">Runs</div>
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
                        </div>
                    )}
                </>
            )}
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
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
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
