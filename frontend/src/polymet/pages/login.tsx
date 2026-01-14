import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/polymet/components/auth-provider"
import { apiService } from "@/polymet/data/api-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useLanguage } from "@/polymet/components/language-provider"
import { LanguageSwitcher } from "@/polymet/components/language-switcher"

export function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const { t } = useLanguage()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const res = await apiService.login({ email, password })
            if (res.ok) {
                login(res.user)
                navigate("/workbench") // Default to workbench
            } else {
                setError("Login failed")
            }
        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.detail || "Invalid credentials")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background relative">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>{t('auth.login.title')}</CardTitle>
                    <CardDescription>{t('auth.login.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">{t('auth.email')}</Label>
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
                                <Label htmlFor="password">{t('auth.password')}</Label>
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
                            {loading ? t('auth.login.submit') + "..." : t('auth.login.submit')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link to="/register" className="text-sm text-muted-foreground hover:underline">
                        {t('auth.login.noAccount')}
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
