import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { useLanguage } from "@/polymet/components/language-provider"
import { EmailVerificationDialog } from "@/polymet/components/email-verification-dialog"
import { useAuth } from "@/polymet/components/auth-provider"

export function EmailVerificationBanner() {
    const { t } = useLanguage()
    const { user } = useAuth()
    const [showDialog, setShowDialog] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    // Don't show if user is verified or not logged in or dismissed
    if (!user || user.is_email_verified || dismissed) {
        return null
    }

    return (
        <>
            <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950/50">
                <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">
                    {t('emailVerification.banner.title')}
                </AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-4">
                    <span className="text-amber-800 dark:text-amber-200">
                        {t('emailVerification.banner.description')}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setShowDialog(true)}
                            variant="default"
                            size="sm"
                        >
                            {t('emailVerification.banner.action')}
                        </Button>
                        <Button
                            onClick={() => setDismissed(true)}
                            variant="ghost"
                            size="sm"
                            className="text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
                        >
                            ✕
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>

            <EmailVerificationDialog
                open={showDialog}
                onOpenChange={setShowDialog}
                email={user.email}
            />
        </>
    )
}
