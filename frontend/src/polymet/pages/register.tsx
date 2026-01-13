import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/polymet/components/auth-provider"
import { apiService } from "@/polymet/data/api-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

export function Register() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const res = await apiService.register({ email, password })
            if (res.ok) {
                login(res.user)
                navigate("/workbench")
            } else {
                setError("Registration failed")
            }
        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.detail || "Registration failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Sign Up</CardTitle>
                    <CardDescription>Create an account to save your work</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>

                        <Button className="w-full mt-6" type="submit" disabled={loading}>
                            {loading ? "Create Account" : "Sign Up"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link to="/login" className="text-sm text-muted-foreground hover:underline">
                        Already have an account? Sign in
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
