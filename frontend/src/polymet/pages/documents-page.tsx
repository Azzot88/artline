import { Button } from "@/components/ui/button"
import { useLanguage } from "@/polymet/components/language-provider"
import { useState, useRef, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { SiteFooter } from "@/components/site-footer"

export default function DocumentsPage() {
    const { t } = useLanguage()
    const [activeSection, setActiveSection] = useState<string>("terms")
    const location = useLocation()

    useEffect(() => {
        if (location.hash) {
            const id = location.hash.slice(1)
            const element = document.getElementById(id)
            if (element) {
                element.scrollIntoView({ behavior: "smooth" })
                setActiveSection(id)
            }
        }
    }, [location])

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: "smooth" })
            setActiveSection(id)
            window.history.pushState(null, "", `#${id}`)
        }
    }

    return (
        <div className="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
            <h1 className="text-3xl font-bold mb-8">{t('landing.footer.documents')}</h1>

            <div className="flex flex-col md:flex-row gap-8 flex-1">
                {/* Navigation Sidebar */}
                <div className="w-full md:w-64 shrink-0">
                    <nav className="sticky top-24 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                        <Button
                            variant={activeSection === "terms" ? "secondary" : "ghost"}
                            className="justify-start whitespace-nowrap"
                            onClick={() => scrollToSection("terms")}
                        >
                            {t('landing.footer.terms')}
                        </Button>
                        <Button
                            variant={activeSection === "privacy" ? "secondary" : "ghost"}
                            className="justify-start whitespace-nowrap"
                            onClick={() => scrollToSection("privacy")}
                        >
                            {t('landing.footer.privacy')}
                        </Button>
                        <Button
                            variant={activeSection === "about" ? "secondary" : "ghost"}
                            className="justify-start whitespace-nowrap"
                            onClick={() => scrollToSection("about")}
                        >
                            {t('landing.footer.about')}
                        </Button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-16 pb-16">
                    <section id="terms" className="scroll-mt-24">
                        <h2 className="text-2xl font-semibold mb-4">{t('landing.footer.terms')}</h2>
                        <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                            {t('documents.terms.content')}
                        </div>
                    </section>

                    <section id="privacy" className="scroll-mt-24">
                        <h2 className="text-2xl font-semibold mb-4">{t('landing.footer.privacy')}</h2>
                        <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                            {t('documents.privacy.content')}
                        </div>
                    </section>

                    <section id="about" className="scroll-mt-24">
                        <h2 className="text-2xl font-semibold mb-4">{t('landing.footer.about')}</h2>
                        <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                            {t('documents.about.content')}
                        </div>
                    </section>
                </div>
            </div>

            <div className="-mx-4 md:-mx-8 lg:-mx-12 mt-auto">
                <SiteFooter />
            </div>
        </div>
    )
}
