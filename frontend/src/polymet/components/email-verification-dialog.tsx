import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/polymet/components/language-provider"
import { apiService } from "@/polymet/data/api-service"
import { useAuth } from "@/polymet/components/auth-provider"

interface EmailVerificationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    email: string
}

export function EmailVerificationDialog({ open, onOpenChange, email }: EmailVerificationDialogProps) {
    const { t, language } = useLanguage()
    const { refreshUser } = useAuth()

    const [code, setCode] = useState<string[]>(["", "", "", "", "", ""])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    // Resend cooldown state
    const [canResend, setCanResend] = useState(true)
    const [resendCountdown, setResendCountdown] = useState(0)

    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Auto-focus first input when dialog opens
    useEffect(() => {
        if (open && inputRefs.current[0]) {
            inputRefs.current[0]?.focus()
        }
    }, [open])

    // Resend countdown timer
    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            setCanResend(true)
        }
    }, [resendCountdown])

    const handleCodeChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return

        const newCode = [...code]
        newCode[index] = value
        setCode(newCode)
        setError("") // Clear error on input

        // Auto-advance to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }

        // Submit on Enter if all filled
        if (e.key === "Enter" && code.every(c => c)) {
            handleVerify()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData("text").trim()

        // Check if pasted data is exactly 6 digits
        if (/^\d{6}$/.test(pastedData)) {
            const newCode = pastedData.split("")
            setCode(newCode)
            inputRefs.current[5]?.focus() // Focus last input
        }
    }

    const handleVerify = async () => {
        const fullCode = code.join("")

        if (fullCode.length !== 6) {
            setError(t('emailVerification.errors.invalidCode'))
            return
        }

        setLoading(true)
        setError("")

        try {
            const response = await apiService.verifyEmailCode(fullCode)

            if (response.ok) {
                setSuccess(true)
                await refreshUser() // Refresh user to update is_email_verified

                setTimeout(() => {
                    onOpenChange(false)
                    setSuccess(false)
                    setCode(["", "", "", "", "", ""])
                }, 1500)
            }
        } catch (err: any) {
            const msg = err.data?.detail || err.message
            if (msg.includes("Invalid") || msg.includes("invalid")) {
                setError(t('emailVerification.errors.invalidCode'))
            } else if (msg.includes("expired")) {
                setError(t('emailVerification.errors.expired'))
            } else {
                setError(msg)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (!canResend) return

        setLoading(true)
        setError("")

        try {
            await apiService.sendEmailVerificationCode(language)
            setCanResend(false)
            setResendCountdown(60) // 60 second cooldown
            setCode(["", "", "", "", "", ""]) // Clear inputs
            inputRefs.current[0]?.focus()
        } catch (err: any) {
            setError(err.data?.detail || err.message || t('emailVerification.errors.sendFailed'))
        } finally {
            setLoading(false)
        }
    }

    const isCodeComplete = code.every(c => c)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('emailVerification.title')}</DialogTitle>
                    <DialogDescription>
                        {t('emailVerification.subtitle')}
                        <br />
                        <span className="text-primary font-medium">{email}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* 6-Digit Code Input */}
                    <div className="flex justify-center gap-2">
                        {code.map((digit, index) => (
                            <Input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                className="w-12 h-12 text-center text-lg font-semibold"
                                disabled={loading || success}
                            />
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <p className="text-sm text-destructive text-center">{error}</p>
                    )}

                    {/* Success Message */}
                    {success && (
                        <p className="text-sm text-green-600 text-center font-medium">
                            {t('emailVerification.success')}
                        </p>
                    )}

                    {/* Verify Button */}
                    <Button
                        onClick={handleVerify}
                        disabled={!isCodeComplete || loading || success}
                        className="w-full"
                    >
                        {loading ? t('auth.loading') : t('emailVerification.verify')}
                    </Button>

                    {/* Resend Button */}
                    <div className="text-center text-sm text-muted-foreground">
                        {resendCountdown > 0 ? (
                            <p>{t('emailVerification.resendIn').replace('{seconds}', String(resendCountdown))}</p>
                        ) : (
                            <button
                                onClick={handleResend}
                                disabled={loading}
                                className="text-primary hover:underline disabled:opacity-50"
                            >
                                {t('emailVerification.resendCode')}
                            </button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
