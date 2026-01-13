import { useEffect, useState } from "react"
import { apiService } from "@/polymet/data/api-service"
import { AdminStats, UserWithBalance } from "@/polymet/data/api-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AdminPanel() {
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [users, setUsers] = useState<UserWithBalance[]>([])
    const [page, setPage] = useState(0)

    useEffect(() => {
        loadData()
    }, [page])

    async function loadData() {
        const s = await apiService.getAdminStats()
        setStats(s)
        const u = await apiService.getAdminUsers(50, page * 50)
        setUsers(u)
    }

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

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
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
                                        <CreditGrantButton userId={u.id} onGrant={loadData} />
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
            <Button size="sm" onClick={handle} disabled={loading}>Grant</Button>
        </div>
    )
}
