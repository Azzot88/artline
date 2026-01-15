import React, { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useLanguage } from '@/polymet/components/language-provider'
import { LanguageSwitcher } from '@/polymet/components/language-switcher'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain } from 'lucide-react'

export default function DocumentsPage() {
    const { t } = useLanguage()
    const location = useLocation()
    const [activeTab, setActiveTab] = React.useState("terms")

    useEffect(() => {
        if (location.hash === '#terms') setActiveTab('terms')
        if (location.hash === '#privacy') setActiveTab('privacy')
        if (location.hash === '#about') setActiveTab('about')
    }, [location.hash])

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <header className="px-4 lg:px-6 h-14 flex items-center border-b justify-between">
                <Link to="/" className="flex items-center justify-center">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground mr-2">
                        <Brain className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-lg">{t('common.brand')}</span>
                </Link>
                <LanguageSwitcher />
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8 text-center">{t('documents.title')}</h1>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="terms">{t('documents.tabs.terms')}</TabsTrigger>
                        <TabsTrigger value="privacy">{t('documents.tabs.privacy')}</TabsTrigger>
                        <TabsTrigger value="about">{t('documents.tabs.about')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="terms">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('documents.tabs.terms')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                {(t('documents.content.terms') as string[]).map((paragraph, index) => {
                                    const match = paragraph.match(/^(\d+\.\s+[^.]+)\.(.*)$/);
                                    if (match) {
                                        return (
                                            <p key={index}>
                                                <span className="font-semibold text-foreground">{match[1]}.</span>
                                                {match[2]}
                                            </p>
                                        );
                                    }
                                    return <p key={index}>{paragraph}</p>;
                                })}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('documents.tabs.privacy')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                {(t('documents.content.privacy') as string[]).map((paragraph, index) => {
                                    const match = paragraph.match(/^(\d+\.\s+[^.]+)\.(.*)$/);
                                    if (match) {
                                        return (
                                            <p key={index}>
                                                <span className="font-semibold text-foreground">{match[1]}.</span>
                                                {match[2]}
                                            </p>
                                        );
                                    }
                                    return <p key={index}>{paragraph}</p>;
                                })}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="about">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('documents.tabs.about')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                {(t('documents.content.about') as string[]).map((paragraph, index) => {
                                    const isHeader = paragraph.length < 50 && !paragraph.includes('.') && !paragraph.includes(':');
                                    const isLabel = paragraph.endsWith(':');
                                    return (
                                        <p key={index} className={isHeader || isLabel ? "font-semibold text-foreground pt-2" : ""}>
                                            {paragraph}
                                        </p>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            <footer className="container mx-auto px-4 py-6 border-t text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} {t('common.brand')}. All rights reserved.
            </footer>
        </div>
    )
}
