import { useState, useEffect } from "react"
import { apiService } from "@/polymet/data/api-service"
import type { UserActivity, VisitorStat } from "@/polymet/data/api-types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function AnalyticsPage() {
    const [activities, setActivities] = useState<UserActivity[]>([])
    const [visitors, setVisitors] = useState<VisitorStat[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setIsLoading(true)
            try {
                const [acts, visits] = await Promise.all([
                    apiService.getAnalyticsActivity(100),
                    apiService.getAnalyticsVisitors(30)
                ])
                setActivities(acts)
                setVisitors(visits)
            } catch (e) {
                console.error(e)
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [])

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                <p className="text-muted-foreground">User activity and visitor insights.</p>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2">
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
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest 100 user actions</CardDescription>
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
                                            <TableCell>
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
    )
}
