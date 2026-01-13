import { useState } from "react"
import { useAuth } from "@/polymet/components/auth-provider"
import { apiService } from "@/polymet/data/api-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function UserProfile() {
    const { user, balance } = useAuth()
    const [password, setPassword] = useState("")
    const [msg, setMsg] = useState("")
    const [loading, setLoading] = useState(false)

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMsg("")
        try {
            await apiService.updateProfile({ password })
            setMsg("Profile updated successfully")
            setPassword("")
        } catch (e) {
            setMsg("Error updating profile")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto p-8 max-w-2xl space-y-8">
            <h1 className="text-3xl font-bold">Account Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Email</Label>
                            <div className="font-medium">{user?.email}</div>
                        </div>
                        <div>
                            <Label>Balance</Label>
                            <div className="text-2xl font-bold">{balance} credits</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                            {msg && <p className="text-sm text-green-600">{msg}</p>}
                        </div>

                        <Button className="mt-6" type="submit" disabled={loading || !password}>
                            {loading ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
