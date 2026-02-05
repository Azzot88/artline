import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/polymet/components/auth-provider"
import { apiService } from "@/polymet/data/api-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useLanguage } from "@/polymet/components/language-provider"
import { LanguageSwitcher } from "@/polymet/components/language-switcher"
import { Checkbox } from "@/components/ui/checkbox"
import { EmailVerificationDialog } from "@/polymet/components/email-verification-dialog"

export function Register() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const { t } = useLanguage()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [agreed, setAgreed] = useState(false)
    const [showVerificationDialog, setShowVerificationDialog] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!agreed) {
            return
        }
        setError("")
        setLoading(true)

        try {
            const res = await apiService.register({ email, password })
            if (res.ok) {
                login(res.user)
                setShowVerificationDialog(true)
                // navigate("/workbench") // Wait for verification dialog
            } else {
                setError(t('auth.errors.regFailed'))
            }
        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.detail || t('auth.errors.regFailed'))
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
                    <CardTitle>{t('auth.register.title')}</CardTitle>
                    <CardDescription>{t('auth.register.subtitle')}</CardDescription>
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

                            <div className="flex items-start space-x-2 mt-2">
                                <Checkbox
                                    id="terms"
                                    checked={agreed}
                                    onCheckedChange={(checked) => setAgreed(checked as boolean)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label
                                        htmlFor="terms"
                                        className="text-xs text-muted-foreground leading-snug cursor-pointer select-none"
                                    >
                                        {t('auth.register.agreement.start')}
                                        <Link to="/documents#terms" target="_blank" className="text-primary hover:underline font-medium">
                                            {t('auth.register.agreement.termsLink')}
                                        </Link>
                                        {t('auth.register.agreement.middle')}
                                        <Link to="/documents#privacy" target="_blank" className="text-primary hover:underline font-medium">
                                            {t('auth.register.agreement.privacyLink')}
                                        </Link>
                                        {t('auth.register.agreement.end')}
                                    </label>
                                </div>
                            </div>

                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>

                        <Button className="w-full mt-6" type="submit" disabled={loading || !agreed}>
                            {loading ? t('auth.loading') : t('auth.register.submit')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link to="/login" className="text-sm text-muted-foreground hover:underline">
                        {t('auth.register.hasAccount')}
                    </Link>
                </CardFooter>
            </Card>
            <EmailVerificationDialog
                open={showVerificationDialog}
                onOpenChange={(open) => {
                    setShowVerificationDialog(open)
                    if (!open) {
                        navigate("/workbench")
                    }
                }}
                email={email}
            />
        </div>
    )
}
