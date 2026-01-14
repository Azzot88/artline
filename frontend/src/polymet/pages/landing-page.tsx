
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Check, Zap, Shield, Globe, Image as ImageIcon, Video, Sparkles, Wand2, Layers, Cpu, BarChart, History, Repeat, Download, Copy, Lock, Maximize, FlaskConical, EyeOff, Folder, Database, Terminal, Crown, HelpCircle } from "lucide-react"
import { useLanguage } from "@/polymet/components/language-provider"
import { LanguageSwitcher } from "@/polymet/components/language-switcher"

export function LandingPage() {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            {/* 2. Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between mx-auto px-4 md:px-6">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <span>{t('common.brand')}</span>
                    </Link>
                    <nav className="hidden md:flex gap-6 text-sm font-medium items-center">
                        <a href="#products" className="hover:text-primary transition-colors">{t('landing.products.title')}</a>
                        <a href="#pricing" className="hover:text-primary transition-colors">{t('common.tariffs')}</a>
                        {/* <a href="#faq" className="hover:text-primary transition-colors">FAQ</a> */}
                        <LanguageSwitcher variant="ghost" />
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost" size="sm">{t('common.login')}</Button>
                        </Link>
                        <Link to="/register">
                            <Button size="sm">{t('common.register')}</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* 3. Hero Section */}
                <section className="relative overflow-hidden py-24 lg:py-32">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>

                    <div className="container px-4 md:px-6 mx-auto text-center space-y-8">
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            {t('landing.badges.newSupport')}
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl xl:text-6xl max-w-4xl mx-auto">
                            {t('landing.hero.title')}
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {t('landing.hero.subtitle')}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link to="/workbench">
                                <Button size="lg" className="px-8 w-full sm:w-auto text-base">{t('landing.hero.cta')}</Button>
                            </Link>
                            <a href="#pricing">
                                <Button size="lg" variant="outline" className="px-8 w-full sm:w-auto text-base">{t('common.tariffs')}</Button>
                            </a>
                        </div>

                        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                                <Check className="h-4 w-4 text-green-500" /> 15+ AI Models
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Check className="h-4 w-4 text-green-500" /> Pay-as-you-go
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Check className="h-4 w-4 text-green-500" /> 24/7 Uptime
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Products Block */}
                <section id="products" className="py-20 bg-muted/30">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight">{t('landing.products.title')}</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <Card className="hover:shadow-lg transition-shadow bg-background/50 border-primary/10">
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-4">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                    <CardTitle>{t('landing.products.imageGen')}</CardTitle>
                                    <CardDescription>{t('landing.products.imageDesc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-sm text-muted-foreground">VEO 3, Nano Banana, Flux, SDXL...</p>
                                </CardContent>
                                <CardFooter>
                                    <Link to="/workbench" className="w-full">
                                        <Button className="w-full group">
                                            {t('common.createImage')} <Wand2 className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow bg-background/50 border-primary/10">
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 flex items-center justify-center mb-4">
                                        <Video className="h-6 w-6" />
                                    </div>
                                    <CardTitle>{t('landing.products.videoGen')}</CardTitle>
                                    <CardDescription>{t('landing.products.videoDesc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Kling, Runway, Luma...</p>
                                </CardContent>
                                <CardFooter>
                                    <Link to="/workbench" className="w-full">
                                        <Button className="w-full group">
                                            {t('common.createVideo')} <Video className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* 5. Use Cases */}
                <section className="py-20">
                    <div className="container px-4 md:px-6 mx-auto">
                        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">{t('landing.useCases.title')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(t('landing.useCases.items') as any[]).map((item, i) => {
                                const icons = [Sparkles, BarChart, Cpu, Video, Layers];
                                const Icon = icons[i % icons.length];
                                return (
                                    <div key={i} className="flex flex-col items-center text-center p-6 border rounded-xl hover:bg-muted/50 transition-colors">
                                        <div className="mb-4 p-3 bg-primary/10 rounded-full text-primary"><Icon className="h-6 w-6" /></div>
                                        <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* 6. Why US */}
                <section id="features" className="py-20 bg-muted/30">
                    <div className="container px-4 md:px-6 mx-auto">
                        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">{t('landing.whyUs.title')}</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {(t('landing.whyUs.items') as any[]).map((item, i) => {
                                const icons = [Globe, Zap, Shield, Check];
                                const Icon = icons[i % icons.length];
                                return (
                                    <div key={i} className="space-y-4">
                                        <div className="font-bold text-xl flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /> {item.title}</div>
                                        <p className="text-muted-foreground">{item.desc}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* 7. Pay-as-you-go Pricing */}
                <section id="pricing" className="py-20">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight">{t('landing.payAsYouGo.title')}</h2>
                            <p className="text-muted-foreground mt-4 text-lg">{t('landing.payAsYouGo.subtitle')}</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {/* 7.1 Starter */}
                            <Card className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{t('landing.payAsYouGo.starter.title')}</CardTitle>
                                    <div className="text-3xl font-bold mt-2">{t('landing.payAsYouGo.starter.price')}</div>
                                    <CardDescription>{t('landing.payAsYouGo.starter.credits')}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="text-sm">{t('landing.payAsYouGo.starter.desc')}</div>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> All basic models</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Image generation</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Credits forever</li>
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link to="/register" className="w-full">
                                        <Button variant="outline" className="w-full">{t('common.buyMore') || "Купить пакет"}</Button>
                                    </Link>
                                </CardFooter>
                            </Card>

                            {/* 7.2 Basic (Popular) */}
                            <Card className="flex flex-col relative border-primary shadow-lg scale-105">
                                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">Popular</div>
                                <CardHeader>
                                    <CardTitle>{t('landing.payAsYouGo.basic.title')}</CardTitle>
                                    <div className="text-3xl font-bold mt-2">{t('landing.payAsYouGo.basic.price')}</div>
                                    <CardDescription>{t('landing.payAsYouGo.basic.credits')} <span className="text-green-500 font-bold">{t('landing.payAsYouGo.basic.bonus')}</span></CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="text-sm">{t('landing.payAsYouGo.basic.desc')}</div>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> All Starter features</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Video generation</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Best value</li>
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link to="/register" className="w-full">
                                        <Button className="w-full">{t('common.buyMore') || "Купить пакет"}</Button>
                                    </Link>
                                </CardFooter>
                            </Card>

                            {/* 7.3 Advanced */}
                            <Card className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{t('landing.payAsYouGo.advanced.title')}</CardTitle>
                                    <div className="text-3xl font-bold mt-2">{t('landing.payAsYouGo.advanced.price')}</div>
                                    <CardDescription>{t('landing.payAsYouGo.advanced.credits')} <span className="text-green-500 font-bold">{t('landing.payAsYouGo.advanced.bonus')}</span></CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="text-sm">{t('landing.payAsYouGo.advanced.desc')}</div>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Max volume</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> High quality download</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Priority support</li>
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link to="/register" className="w-full">
                                        <Button variant="outline" className="w-full">{t('common.buyMore') || "Купить пакет"}</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* 8. Subscriptions (Redesigned - Stricter & Compact) */}
                <section className="py-16 bg-muted/30">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">{t('landing.subscriptions.title')}</h2>
                            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
                                {t('landing.subscriptions.subtitle')}
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {/* BASIC */}
                            <Card className="flex flex-col hover:border-primary/50 transition-colors duration-300">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-xl">{t('landing.subscriptions.basic.title')}</CardTitle>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-3xl font-bold">{t('landing.subscriptions.basic.price')}</span>
                                        <span className="text-sm text-muted-foreground">/ mon</span>
                                    </div>
                                    <CardDescription className="mt-1 text-xs">{t('landing.subscriptions.basic.desc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 py-2">
                                    <ul className="space-y-2 text-sm">
                                        {(t('landing.subscriptions.basic.features') as string[]).map((f, i) => (
                                            <li key={i} className="flex gap-2 items-start"><Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> <span>{f}</span></li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter className="py-4">
                                    <Link to="/register" className="w-full">
                                        <Button variant="outline" className="w-full h-10">{t('common.startUsing')}</Button>
                                    </Link>
                                </CardFooter>
                            </Card>

                            {/* PRO */}
                            <Card className="flex flex-col relative border-primary bg-background shadow-md">
                                <div className="absolute top-0 right-0 p-3">
                                    <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                        HIT
                                    </div>
                                </div>
                                <CardHeader className="py-4">
                                    <CardTitle className="text-xl text-primary">{t('landing.subscriptions.pro.title')}</CardTitle>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-3xl font-bold">{t('landing.subscriptions.pro.price')}</span>
                                        <span className="text-sm text-muted-foreground">/ mon</span>
                                    </div>
                                    <CardDescription className="mt-1 text-primary/80 font-medium text-xs">{t('landing.subscriptions.pro.desc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 py-2">
                                    <ul className="space-y-2 text-sm">
                                        {(t('landing.subscriptions.pro.features') as string[]).map((f, i) => (
                                            <li key={i} className="flex gap-2 items-start"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>{f}</span></li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter className="py-4">
                                    <Link to="/register" className="w-full">
                                        <Button className="w-full h-10 shadow-sm">{t('common.startUsing')}</Button>
                                    </Link>
                                </CardFooter>
                            </Card>

                            {/* STUDIO */}
                            <Card className="flex flex-col hover:border-purple-500/50 transition-colors duration-300 bg-slate-50 dark:bg-slate-900/50">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-xl">{t('landing.subscriptions.studio.title')}</CardTitle>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-3xl font-bold">{t('landing.subscriptions.studio.price')}</span>
                                        <span className="text-sm text-muted-foreground">/ mon</span>
                                    </div>
                                    <CardDescription className="mt-1 text-xs">{t('landing.subscriptions.studio.desc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 py-2">
                                    <ul className="space-y-2 text-sm">
                                        {(t('landing.subscriptions.studio.features') as string[]).map((f, i) => (
                                            <li key={i} className="flex gap-2 items-start"><Check className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" /> <span>{f}</span></li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter className="py-4">
                                    <Link to="/register" className="w-full">
                                        <Button variant="outline" className="w-full h-10">{t('common.startUsing')}</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* 8.2 FAQ (NEW: Accordion, 2 columns) */}
                <section id="faq" className="py-16 bg-muted/30">
                    <div className="container px-4 md:px-6 mx-auto max-w-6xl">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">{t('landing.faq.title')}</h2>
                        </div>

                        <Accordion type="single" collapsible className="w-full grid md:grid-cols-2 gap-x-8 gap-y-2">
                            {(t('landing.faq.items') as any[]).map((item, i) => (
                                <AccordionItem key={i} value={`item-${i}`} className="border-b-0 mb-4">
                                    <AccordionTrigger className="hover:no-underline hover:text-primary text-left text-sm py-3 px-4 bg-background rounded-lg border shadow-sm data-[state=open]:rounded-b-none data-[state=open]:border-b-0 transition-all duration-200">
                                        {item.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 py-3 bg-background border-x border-b rounded-b-lg text-muted-foreground text-xs leading-relaxed">
                                        {item.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </section>

                {/* 9. Final CTA */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-primary/5"></div>
                    <div className="container px-4 md:px-6 mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('landing.finalCta.title')}</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('landing.finalCta.subtitle')}</p>
                        <Link to="/workbench">
                            <Button size="lg" className="px-8 text-lg">{t('landing.finalCta.button')}</Button>
                        </Link>
                    </div>
                </section>
            </main>

            {/* 10. Footer */}
            <footer className="bg-muted py-12 text-sm">
                <div className="container px-4 md:px-6 mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
                            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <span>{t('common.brand')}</span>
                        </Link>
                        <div className="text-muted-foreground">
                            <p>Email: {t('landing.footer.email')}</p>
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
                        <h3 className="font-semibold text-foreground">{t('landing.footer.documents')}</h3>
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
        </div>
    )
}
