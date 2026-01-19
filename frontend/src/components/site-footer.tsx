import { Link } from "react-router-dom"
import { Brain } from "lucide-react"
import { useLanguage } from "@/polymet/components/language-provider"

export function SiteFooter() {
    const { t } = useLanguage()

    return (
        <footer className="bg-muted py-12 text-sm">
            <div className="container px-4 md:px-6 mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-4">
                    <Link to="/" className="flex items-center gap-2 font-bold text-lg">
                        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground">
                            <Brain className="h-4 w-4" />
                        </div>
                        <span>{t('common.brand')}</span>
                    </Link>
                    <div className="text-muted-foreground">
                        <p>Email: <a href="mailto:contact@workbench.ink" className="hover:text-primary transition-colors">contact@workbench.ink</a></p>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                    <h3 className="font-semibold text-foreground">{t('landing.footer.company')}</h3>
                    <div className="text-muted-foreground space-y-1">
                        <p>{t('landing.footer.companyName')}</p>
                        <p>{t('landing.footer.address')}</p>
                        {(t('landing.footer.inn') as any[]).map((inn, i) => (
                            <p key={i}>{inn}</p>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">
                        <Link to="/documents#top" className="hover:text-primary transition-colors">{t('landing.footer.documents')}</Link>
                    </h3>
                    <ul className="space-y-2 text-muted-foreground">
                        <li><Link to="/documents#terms" className="hover:underline hover:text-primary">{t('landing.footer.terms')}</Link></li>
                        <li><Link to="/documents#privacy" className="hover:underline hover:text-primary">{t('landing.footer.privacy')}</Link></li>
                        <li><Link to="/documents#about" className="hover:underline hover:text-primary">{t('landing.footer.about')}</Link></li>
                    </ul>
                </div>
            </div>
            <div className="container mx-auto px-4 mt-8 pt-8 border-t text-center text-muted-foreground">
                © {new Date().getFullYear()} {t('common.brand')}. {t('landing.footer.rights')}
            </div>
        </footer>
    )
}
