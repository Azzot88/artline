import { useEffect, useState } from "react"
import { apiService } from "@/polymet/data/api-service"
import { UserWithBalance } from "@/polymet/data/api-types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function AdminUsers() {
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
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(u => (
                            <TableRow key={u.id}>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>{u.balance}</TableCell>
                                <TableCell>{u.is_admin ? "Yes" : "No"}</TableCell>
                                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="flex items-center gap-2">
                                    <CreditGrantButton userId={u.id} onGrant={loadUsers} />
                                    <DeleteUserButton userId={u.id} email={u.email} onDelete={loadUsers} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}


function DeleteUserButton({ userId, email, onDelete }: { userId: string, email: string, onDelete: () => void }) {
    const [loading, setLoading] = useState(false)

    async function handle() {
        if (!confirm(`Are you sure you want to PERMANENTLY delete user ${email}? This cannot be undone.`)) return
        setLoading(true)
        try {
            await apiService.deleteUser(userId)
            onDelete()
        } catch (e: any) {
            alert("Failed to delete user: " + (e.message || e))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            size="sm"
            variant="destructive"
            onClick={handle}
            disabled={loading}
        >
            {loading ? "..." : "Delete"}
        </Button>
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
