import { Eye, EyeOff } from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/polymet/components/auth-provider"
import { useLanguage } from "@/polymet/components/language-provider"
import { apiService } from "@/polymet/data/api-service"
import { EmailVerificationDialog } from "@/polymet/components/email-verification-dialog"

interface AuthDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultMode?: 'login' | 'register'
}

export function AuthDialog({ open, onOpenChange, defaultMode = 'register' }: AuthDialogProps) {
    const { t, language } = useLanguage()
    const { login } = useAuth()
    const navigate = useNavigate()

    // Form State
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [agreed, setAgreed] = useState(false)
    const [mode, setMode] = useState<'register' | 'login'>('register')

    // Effect to update mode if defaultMode changes when opening? 
    // Usually we want to reset mode when dialog opens. 
    // But for simplicity, we can just initialize it. 
    // Better: Update mode when 'open' becomes true?
    // Let's just use a useEffect watching `open` and `defaultMode`.

    useEffect(() => {
        if (open) {
            setMode(defaultMode)
        }
    }, [open, defaultMode])

    // Email Verification Modal
    const [showVerificationDialog, setShowVerificationDialog] = useState(false)
    const [registeredEmail, setRegisteredEmail] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            let res;
            if (mode === 'register') {
                if (!agreed) return;
                res = await apiService.register({ email, password }, language)
            } else {
                res = await apiService.login({ email, password })
            }

            if (res.ok) { // Check if ok property exists or implied by type
                // Actually apiService returns the response directly. 
                // api-client usually throws if error? 
                // Let's check api.ts again. Yes, throws APIError.
                // So if we are here,  it's success.
                // BUT apiService.register returns { user, ... } ?
                // Let's assume standard auth flow.
                login((res as any).user || res)

                // If registration, show email verification dialog
                if (mode === 'register') {
                    setRegisteredEmail(email)
                    setShowVerificationDialog(true)
                }

                onOpenChange(false)
                // navigate("/workbench") // Already there
            } else {
                // Should be caught by catch usually
                setError(t('auth.errors.regFailed'))
            }
        } catch (err: any) {
            console.error(err)
            const msg = err.data?.detail || err.message || "Error"
            if (typeof msg === 'object') {
                setError(msg.message || JSON.stringify(msg))
            } else {
                setError(String(msg))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[425px] top-[40%] sm:top-[50%] scale-95 sm:scale-100">
                    <DialogHeader>
                        <DialogTitle>{mode === 'register' ? t('auth.register.title') : t('common.login')}</DialogTitle>
                        <DialogDescription>
                            {mode === 'register' ? t('auth.register.subtitle') : t('auth.login.welcomeBack')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('auth.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="username"
                            />
                            const [showPassword, setShowPassword] = useState(false)
                            <div className="grid gap-2">
                                <Label htmlFor="password">{t('auth.password')}</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="sr-only">Toggle password visibility</span>
                                    </Button>
                                </div>
                            </div>

                            {mode === 'register' && (
                                <div className="flex items-start space-x-2">
                                    <Checkbox
                                        id="terms"
                                        checked={agreed}
                                        onCheckedChange={(c) => setAgreed(c as boolean)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor="terms"
                                            className="text-xs text-muted-foreground leading-snug cursor-pointer select-none"
                                        >
                                            {t('auth.register.agreement.start')} <span className="text-primary">{t('auth.register.agreement.termsLink')}</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {error && <p className="text-sm text-destructive">{error}</p>}

                            <Button type="submit" disabled={loading || (mode === 'register' && !agreed)}>
                                {loading ? t('auth.loading') : (mode === 'register' ? t('auth.register.submit') : t('common.login'))}
                            </Button>
                    </form>

                    <div className="text-center text-sm text-muted-foreground">
                        {mode === 'register' ? (
                            <>
                                {t('auth.register.hasAccount')}
                                <button onClick={() => setMode('login')} className="ml-1 text-primary hover:underline">
                                    {t('common.login')}
                                </button>
                            </>
                        ) : (
                            <>
                                {t('auth.login.noAccount')}
                                <button onClick={() => setMode('register')} className="ml-1 text-primary hover:underline">
                                    {t('auth.register.submit')}
                                </button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Email Verification Dialog */}
            <EmailVerificationDialog
                open={showVerificationDialog}
                onOpenChange={setShowVerificationDialog}
                email={registeredEmail}
            />
        </>
    )
}
