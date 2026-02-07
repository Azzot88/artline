import { Link, useLocation } from "react-router-dom"
import { Link, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Play, PlayCircle, Check, Image as ImageIcon, ImageOff, Zap, History, RotateCcw, FileCheck, Download, Layers, Palette, Cpu, Scan, FlaskConical, Lock, FolderKanban, Vault, Plug, Star, Video, Film, Sparkles, Wand2, BarChart, Globe, Shield, Music, AudioWaveform, Brain } from "lucide-react";
import { useLanguage } from "@/polymet/components/language-provider"
import { LanguageSwitcher } from "@/polymet/components/language-switcher"
import { ModeToggle } from "@/components/mode-toggle"
import { SiteFooter } from "@/components/site-footer"
import { AuthDialog } from "@/polymet/components/auth-dialog"

export function LandingPage() {
    const { t } = useLanguage()
    const location = useLocation()

    useEffect(() => {
        if (location.hash) {
            const element = document.getElementById(location.hash.slice(1)) // Remove '#'
            if (element) {
                // Small timeout to ensure DOM is ready/rendered
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' })
                }, 100)
            }
        }
    }, [location])

    // Auth Modal State
    const [showAuthDialog, setShowAuthDialog] = useState(false)
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

    // Check URL params for ?auth=login
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const authParam = params.get("auth")
        if (authParam === "login") {
            setAuthMode("login")
            setShowAuthDialog(true)
        } else if (authParam === "register") {
            setAuthMode("register")
            setShowAuthDialog(true)
        }
    }, [location.search])

    // Helper for carousel dots
    const [paygIndex, setPaygIndex] = useState(0)
    const [subIndex, setSubIndex] = useState(0)

    const handleScroll = (e: React.UIEvent<HTMLDivElement>, setIndex: (i: number) => void) => {
        const container = e.currentTarget
        const center = container.scrollLeft + (container.clientWidth / 2)
        const cards = container.getElementsByClassName('snap-center')

        let closestIndex = 0
        let closestDist = Infinity

        Array.from(cards).forEach((card, index) => {
            const cardCenter = (card as HTMLElement).offsetLeft + ((card as HTMLElement).offsetWidth / 2)
            const dist = Math.abs(center - cardCenter)
            if (dist < closestDist) {
                closestDist = dist
                closestIndex = index
            }
        })
        setIndex(closestIndex)
    }

    const CarouselDots = ({ count, activeIndex }: { count: number, activeIndex: number }) => (
        <div className="flex justify-center gap-2 mt-4 md:hidden">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`h-2 w-2 rounded-full transition-colors duration-300 ${i === activeIndex ? "bg-primary" : "bg-primary/20"}`}
                />
            ))}
        </div>
    )

    const basicIcons = [ImageOff, Zap, History, RotateCcw, FileCheck];
    const proIcons = [Download, Layers, Palette, Cpu, Scan];
    const studioIcons = [FlaskConical, Lock, FolderKanban, Vault, Plug, Star];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            {/* 2. Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between mx-auto px-4 md:px-6">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                            <Brain className="h-5 w-5" />
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
                        <Button variant="ghost" size="sm" onClick={() => { setAuthMode('login'); setShowAuthDialog(true) }}>
                            {t('common.login')}
                        </Button>
                        <Link to="/register">
                            <Button size="sm">{t('common.register')}</Button>
                        </Link>
                        <ModeToggle />
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* 3. Hero Section */}
                <section className="relative overflow-hidden py-16 lg:py-24">
                    {/* Gradient Background */}
                    {/* Gradient Background */}
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background animate-pulse-subtle"></div>

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
                                <Check className="h-4 w-4 text-green-500" /> {t('landing.features.models')}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Check className="h-4 w-4 text-green-500" /> {t('landing.features.payg')}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Check className="h-4 w-4 text-green-500" /> {t('landing.features.uptime')}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Products Block */}
                <section id="products" className="py-16 glass-effect">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-10 relative z-10">
                            <h2 className="text-3xl font-bold tracking-tight">{t('landing.products.title')}</h2>
                        </div>
                        {/* Background Blob for Products */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                            {(t('landing.products.items') as any[]).map((product, i) => {
                                // Icons Mapping
                                // 0 (Image): Card=ImageIcon, Button=Wand2
                                // 1 (Video): Card=Video, Button=PlayCircle
                                // 2 (Music): Card=Music, Button=AudioWaveform

                                const cardIconMap = [ImageIcon, Video, Music];
                                const btnIconMap = [Wand2, PlayCircle, AudioWaveform];

                                const CardIcon = cardIconMap[i] || ImageIcon;
                                const BtnIcon = btnIconMap[i] || Wand2;

                                return (
                                    <Link to={product.link} key={i} className="group h-full block">
                                        <Card className="flex flex-col h-full hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden glass-effect-strong">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                                        <CardIcon className="h-6 w-6" />
                                                    </div>
                                                    {product.title}
                                                </CardTitle>
                                                <CardDescription className="text-sm line-clamp-3 min-h-[40px]">
                                                    {product.desc}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1 space-y-2">
                                                <p className="text-xs text-muted-foreground font-medium bg-muted/50 p-2 rounded">
                                                    {product.models}
                                                </p>
                                            </CardContent>
                                            <CardFooter>
                                                <Button className="w-full">
                                                    {product.cta} <BtnIcon className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                );

                            })}
                        </div>
                    </div>
                </section>

                {/* 5. Use Cases */}
                <section className="py-16">
                    <div className="container px-4 md:px-6 mx-auto">
                        <h2 className="text-3xl font-bold tracking-tight text-center mb-10">{t('landing.useCases.title')}</h2>
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
                <section id="features" className="py-16 glass-effect">
                    <div className="container px-4 md:px-6 mx-auto">
                        <h2 className="text-3xl font-bold tracking-tight text-center mb-10">{t('landing.whyUs.title')}</h2>
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
                <section id="pricing" className="py-16">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-10 relative z-10">
                            <h2 className="text-3xl font-bold tracking-tight">{t('landing.payAsYouGo.title')}</h2>
                            <p className="text-muted-foreground mt-4 text-lg">{t('landing.payAsYouGo.subtitle')}</p>
                        </div>
                        {/* Background Blob for Pricing */}
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

                        <div
                            className="flex overflow-x-auto pb-6 pt-8 gap-4 md:grid md:grid-cols-3 md:gap-8 max-w-5xl mx-auto md:overflow-visible snap-x snap-mandatory mask-linear-fade scrollbar-hide relative z-10"
                            onScroll={(e) => handleScroll(e, setPaygIndex)}
                        >
                            {/* 7.1 Starter */}
                            <Link to="/register" className="group h-full block min-w-[85vw] sm:min-w-[350px] md:min-w-0 snap-center">
                                <Card className="flex flex-col h-full hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden glass-effect-strong">
                                    <CardHeader>
                                        <CardTitle>{t('landing.payAsYouGo.starter.title')}</CardTitle>
                                        <div className="text-3xl font-bold mt-2">{t('landing.payAsYouGo.starter.price')}</div>
                                        <CardDescription>{t('landing.payAsYouGo.starter.credits')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-4">
                                        <div className="text-sm">{t('landing.payAsYouGo.starter.desc')}</div>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            {(t('landing.payAsYouGo.starter.features') as string[]).map((f, i) => (
                                                <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4" /> {f}</li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">{t('common.buyMore')}</Button>
                                    </CardFooter>
                                </Card>
                            </Link>

                            {/* 7.2 Basic (Popular) */}
                            <Link to="/register" className="group h-full block relative md:scale-105 z-10 min-w-[85vw] sm:min-w-[350px] md:min-w-0 snap-center">
                                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium z-20">{t('landing.payAsYouGo.popular')}</div>
                                <Card className="flex flex-col h-full border-primary shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden glass-effect-strong">
                                    <CardHeader>
                                        <CardTitle>{t('landing.payAsYouGo.basic.title')}</CardTitle>
                                        <div className="text-3xl font-bold mt-2">{t('landing.payAsYouGo.basic.price')}</div>
                                        <CardDescription>{t('landing.payAsYouGo.basic.credits')} <span className="text-green-500 font-bold">{t('landing.payAsYouGo.basic.bonus')}</span></CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-4">
                                        <div className="text-sm">{t('landing.payAsYouGo.basic.desc')}</div>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            {(t('landing.payAsYouGo.basic.features') as string[]).map((f, i) => (
                                                <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4" /> {f}</li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full group-hover:bg-primary/90">{t('common.buyMore')}</Button>
                                    </CardFooter>
                                </Card>
                            </Link>

                            {/* 7.3 Advanced */}
                            <Link to="/register" className="group h-full block min-w-[85vw] sm:min-w-[350px] md:min-w-0 snap-center">
                                <Card className="flex flex-col h-full hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden glass-effect-strong">
                                    <CardHeader>
                                        <CardTitle>{t('landing.payAsYouGo.advanced.title')}</CardTitle>
                                        <div className="text-3xl font-bold mt-2">{t('landing.payAsYouGo.advanced.price')}</div>
                                        <CardDescription>{t('landing.payAsYouGo.advanced.credits')} <span className="text-green-500 font-bold">{t('landing.payAsYouGo.advanced.bonus')}</span></CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-4">
                                        <div className="text-sm">{t('landing.payAsYouGo.advanced.desc')}</div>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            {(t('landing.payAsYouGo.advanced.features') as string[]).map((f, i) => (
                                                <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4" /> {f}</li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">{t('common.buyMore')}</Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        </div>
                        <CarouselDots count={3} activeIndex={paygIndex} />
                    </div>
                </section>

                {/* 8. Subscriptions (Redesigned - Stricter & Compact) */}
                <section className="py-16 glass-effect">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-10 relative z-10">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">{t('landing.subscriptions.title')}</h2>
                            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
                                {t('landing.subscriptions.subtitle')}
                            </p>
                        </div>
                        {/* Background Blob for Subscriptions */}
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

                        <div
                            className="flex overflow-x-auto pb-6 pt-8 gap-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible max-w-6xl mx-auto snap-x snap-mandatory scrollbar-hide relative z-10"
                            onScroll={(e) => handleScroll(e, setSubIndex)}
                        >
                            {/* BASIC */}
                            <Link to="/register" className="group h-full block min-w-[85vw] sm:min-w-[350px] lg:min-w-0 snap-center">
                                <Card className="flex flex-col h-full hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden glass-effect-strong">
                                    <CardHeader className="py-4">
                                        <CardTitle className="text-xl">{t('landing.subscriptions.basic.title')}</CardTitle>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-3xl font-bold">{t('landing.subscriptions.basic.price')}</span>
                                            <span className="text-sm text-muted-foreground">{t('landing.subscriptions.period')}</span>
                                        </div>
                                        <CardDescription className="mt-1 text-xs">{t('landing.subscriptions.basic.desc')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 py-2">
                                        <ul className="space-y-2 text-sm">
                                            {(t('landing.subscriptions.basic.features') as string[]).map((f, i) => {
                                                const Icon = basicIcons[i] || Check;
                                                return (
                                                    <li key={i} className="flex gap-2 items-start"><Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>{f}</span></li>
                                                );
                                            })}
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="py-4">
                                        <Button variant="outline" className="w-full h-10 group-hover:bg-primary group-hover:text-primary-foreground">{t('common.startUsing')}</Button>
                                    </CardFooter>
                                </Card>
                            </Link>

                            {/* PRO */}
                            <Link to="/register" className="group h-full block relative z-10 min-w-[85vw] sm:min-w-[350px] lg:min-w-0 snap-center">
                                <Card className="flex flex-col h-full border-primary bg-background shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden glass-effect-strong">
                                    <div className="absolute top-0 right-0 p-3">
                                        <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                            HIT
                                        </div>
                                    </div>
                                    <CardHeader className="py-4">
                                        <CardTitle className="text-xl text-primary">{t('landing.subscriptions.pro.title')}</CardTitle>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-3xl font-bold">{t('landing.subscriptions.pro.price')}</span>
                                            <span className="text-sm text-muted-foreground">{t('landing.subscriptions.period')}</span>
                                        </div>
                                        <CardDescription className="mt-1 text-primary/80 font-medium text-xs">{t('landing.subscriptions.pro.desc')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 py-2">
                                        <ul className="space-y-2 text-sm">
                                            {(t('landing.subscriptions.pro.features') as string[]).map((f, i) => {
                                                const Icon = proIcons[i] || Check;
                                                return (
                                                    <li key={i} className="flex gap-2 items-start"><Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>{f}</span></li>
                                                );
                                            })}
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="py-4">
                                        <Button className="w-full h-10 shadow-sm group-hover:bg-primary/90">{t('common.startUsing')}</Button>
                                    </CardFooter>
                                </Card>
                            </Link>

                            {/* STUDIO */}
                            <Link to="/register" className="group h-full block min-w-[85vw] sm:min-w-[350px] lg:min-w-0 snap-center">
                                <Card className="flex flex-col h-full hover:border-purple-500/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-slate-50 dark:bg-slate-900/50 cursor-pointer overflow-hidden glass-effect-strong">
                                    <CardHeader className="py-4">
                                        <CardTitle className="text-xl">{t('landing.subscriptions.studio.title')}</CardTitle>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-3xl font-bold">{t('landing.subscriptions.studio.price')}</span>
                                            <span className="text-sm text-muted-foreground">{t('landing.subscriptions.period')}</span>
                                        </div>
                                        <CardDescription className="mt-1 text-xs">{t('landing.subscriptions.studio.desc')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 py-2">
                                        <ul className="space-y-2 text-sm">
                                            {(t('landing.subscriptions.studio.features') as string[]).map((f, i) => {
                                                const Icon = studioIcons[i] || Check;
                                                return (
                                                    <li key={i} className="flex gap-2 items-start"><Icon className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" /> <span>{f}</span></li>
                                                );
                                            })}
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="py-4">
                                        <Button variant="outline" className="w-full h-10 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-colors">{t('common.startUsing')}</Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        </div>
                        <CarouselDots count={3} activeIndex={subIndex} />
                    </div>
                </section>

                {/* 8.2 FAQ (NEW: Accordion, 2 columns) */}
                <section id="faq" className="py-16 glass-effect">
                    <div className="container px-4 md:px-6 mx-auto max-w-6xl">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">{t('landing.faq.title')}</h2>
                        </div>

                        <Accordion type="multiple" className="w-full grid md:grid-cols-2 gap-x-8 gap-y-2">
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
                <section className="py-20 relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-primary/5"></div>
                    <div className="container px-4 md:px-6 mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('landing.finalCta.title')}</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('landing.finalCta.subtitle')}</p>
                        <div />
                        <Link to="/workbench">
                            <Button size="lg" className="px-8 text-lg">{t('landing.finalCta.button')}</Button>
                        </Link>
                    </div>
                </section>
            </main>

            {/* 10. Footer */}
            {/* 10. Footer */}
            <SiteFooter />

            <AuthDialog
                open={showAuthDialog}
                onOpenChange={setShowAuthDialog}
                defaultMode={authMode}
            />
        </div>
    )
}
