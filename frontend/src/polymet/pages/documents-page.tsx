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

    const renderContent = (key: string) => {
        const content = t(key);
        if (Array.isArray(content)) {
            return content.map((paragraph: string, index: number) => {
                const match = paragraph.match(/^(\d+\.\s+[^.]+)\.(.*)$/);
                if (match) {
                    return (
                        <p key={index} className="mb-4">
                            <span className="font-semibold text-foreground">{match[1]}.</span>
                            {match[2]}
                        </p>
                    );
                }
                const isHeader = (paragraph.length < 50 && !paragraph.includes('.') && !paragraph.includes(':')) || paragraph.endsWith(':');
                if (isHeader) {
                    return <p key={index} className="font-semibold text-foreground pt-2 mb-2">{paragraph}</p>;
                }

                return <p key={index} className="mb-4">{paragraph}</p>;
            });
        }
        return <p>{content as string}</p>;
    }


    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            <div className="max-w-4xl mx-auto w-full flex-1 md:px-6 px-4">
                <h1 className="text-3xl font-bold mb-8 md:mt-8 mt-6">{t('documents.title')}</h1>

                <div className="flex flex-col gap-8">
                    {/* Navigation - Top Bar on Desktop, Stack on Mobile */}
                    <div className="w-full shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur pb-4 pt-2">
                        <nav className="flex flex-col md:flex-row gap-2 md:gap-4">
                            <Button
                                variant={activeSection === "terms" ? "secondary" : "ghost"}
                                className="justify-start whitespace-nowrap"
                                onClick={() => scrollToSection("terms")}
                            >
                                {t('documents.tabs.terms')}
                            </Button>
                            <Button
                                variant={activeSection === "privacy" ? "secondary" : "ghost"}
                                className="justify-start whitespace-nowrap"
                                onClick={() => scrollToSection("privacy")}
                            >
                                {t('documents.tabs.privacy')}
                            </Button>
                            <Button
                                variant={activeSection === "about" ? "secondary" : "ghost"}
                                className="justify-start whitespace-nowrap"
                                onClick={() => scrollToSection("about")}
                            >
                                {t('documents.tabs.about')}
                            </Button>
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 space-y-16 pb-16 pt-4">
                        <section id="terms" className="scroll-mt-32">
                            <h2 className="text-2xl font-semibold mb-4">{t('documents.tabs.terms')}</h2>
                            <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                                {renderContent('documents.content.terms')}
                            </div>
                        </section>

                        <section id="privacy" className="scroll-mt-32">
                            <h2 className="text-2xl font-semibold mb-4">{t('documents.tabs.privacy')}</h2>
                            <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                                {renderContent('documents.content.privacy')}
                            </div>
                        </section>

                        <section id="about" className="scroll-mt-32">
                            <h2 className="text-2xl font-semibold mb-4">{t('documents.tabs.about')}</h2>
                            <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                                {renderContent('documents.content.about')}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <SiteFooter />
        </div>
    )
}
