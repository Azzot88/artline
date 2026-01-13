
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Zap, Shield, Globe, Image as ImageIcon, Video, Sparkles, Wand2, Layers, Cpu, BarChart } from "lucide-react"

export function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            {/* 2. Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between mx-auto px-4 md:px-6">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <span>ИИ Мастерская</span>
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm font-medium">
                        <a href="#products" className="hover:text-primary transition-colors">Продукты</a>
                        <a href="#features" className="hover:text-primary transition-colors">Возможности</a>
                        <a href="#pricing" className="hover:text-primary transition-colors">Тарифы</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost" size="sm">Войти</Button>
                        </Link>
                        <Link to="/register">
                            <Button size="sm">Регистрация</Button>
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
                            Новинка: Поддержка VEO 3 и Nano Banana
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl xl:text-6xl max-w-4xl mx-auto">
                            Встречайте вашего нового <span className="text-primary">ИИ помощника</span>
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Единая платформа, объединяющая VEO 3, Nano Banana, Flux, SDXL, Stable Diffusion и другие лучшие генеративные модели для создания контента профессионального уровня.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link to="/register">
                                <Button size="lg" className="px-8 w-full sm:w-auto text-base">Начать использовать</Button>
                            </Link>
                            <a href="#pricing">
                                <Button size="lg" variant="outline" className="px-8 w-full sm:w-auto text-base">Посмотреть тарифы</Button>
                            </a>
                        </div>

                        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                                <Check className="h-4 w-4 text-green-500" /> 15+ ИИ моделей
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Check className="h-4 w-4 text-green-500" /> Гибкая система цены
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Check className="h-4 w-4 text-green-500" /> 24/7 Доступность
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Products Block */}
                <section id="products" className="py-20 bg-muted/30">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight">Наши продукты</h2>
                            <p className="text-muted-foreground mt-4 text-lg">Инструменты для реализации любых творческих идей</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <Card className="hover:shadow-lg transition-shadow bg-background/50 border-primary/10">
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-4">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                    <CardTitle>Генерация Изображений</CardTitle>
                                    <CardDescription>Text-to-Image (VEO 3, Nano Banana, Flux, SDXL)</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Создавайте потрясающие изображения за секунды. Фотореализм, иллюстрации, 3D-арт. Поддержка различных форматов и стилей.</p>
                                </CardContent>
                                <CardFooter>
                                    <Link to="/register" className="w-full">
                                        <Button className="w-full group">
                                            Создать изображение <Wand2 className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow bg-background/50 border-primary/10">
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 flex items-center justify-center mb-4">
                                        <Video className="h-6 w-6" />
                                    </div>
                                    <CardTitle>Анимация и Видео</CardTitle>
                                    <CardDescription>Image-to-Video / Text-to-Video</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Оживите свои изображения с помощью нейросетей. Контроль длительности и динамики. Превращение статичного арта в захватывающие ролики.</p>
                                </CardContent>
                                <CardFooter>
                                    <Link to="/register" className="w-full">
                                        <Button className="w-full group">
                                            Создать видео <Video className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
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
                        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Сценарии использования</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex flex-col items-center text-center p-6 border rounded-xl hover:bg-muted/50 transition-colors">
                                <div className="mb-4 p-3 bg-primary/10 rounded-full text-primary"><Sparkles className="h-6 w-6" /></div>
                                <h3 className="font-semibold text-lg mb-2">Креативный дизайн</h3>
                                <p className="text-sm text-muted-foreground">Логотипы, концепт-арты, визуализация идей.</p>
                            </div>
                            <div className="flex flex-col items-center text-center p-6 border rounded-xl hover:bg-muted/50 transition-colors">
                                <div className="mb-4 p-3 bg-primary/10 rounded-full text-primary"><BarChart className="h-6 w-6" /></div>
                                <h3 className="font-semibold text-lg mb-2">Маркетинг и SMM</h3>
                                <p className="text-sm text-muted-foreground">Уникальные баннеры, рекламные креативы, контент для соцсетей.</p>
                            </div>
                            <div className="flex flex-col items-center text-center p-6 border rounded-xl hover:bg-muted/50 transition-colors">
                                <div className="mb-4 p-3 bg-primary/10 rounded-full text-primary"><Cpu className="h-6 w-6" /></div>
                                <h3 className="font-semibold text-lg mb-2">Игровая индустрия</h3>
                                <p className="text-sm text-muted-foreground">Ассеты, текстуры, персонажи.</p>
                            </div>
                            <div className="flex flex-col items-center text-center p-6 border rounded-xl hover:bg-muted/50 transition-colors">
                                <div className="mb-4 p-3 bg-primary/10 rounded-full text-primary"><Video className="h-6 w-6" /></div>
                                <h3 className="font-semibold text-lg mb-2">Видео-продакшн</h3>
                                <p className="text-sm text-muted-foreground">Анимированные заставки, моушн-дизайн.</p>
                            </div>
                            <div className="flex flex-col items-center text-center p-6 border rounded-xl hover:bg-muted/50 transition-colors">
                                <div className="mb-4 p-3 bg-primary/10 rounded-full text-primary"><Layers className="h-6 w-6" /></div>
                                <h3 className="font-semibold text-lg mb-2">Личное использование</h3>
                                <p className="text-sm text-muted-foreground">Аватарки, обои, эксперименты с ИИ.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. Why US */}
                <section id="features" className="py-20 bg-muted/30">
                    <div className="container px-4 md:px-6 mx-auto">
                        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Почему ИИ Мастерская?</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-4">
                                <div className="font-bold text-xl flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Мощные ИИ модели</div>
                                <p className="text-muted-foreground">Доступ к передовым моделям Flux.1 (Schnell, Pro) и SDXL через единый интерфейс.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="font-bold text-xl flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Молниеносная скорость</div>
                                <p className="text-muted-foreground">Генерация изображений за секунды благодаря оптимизированным пайплайнам.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="font-bold text-xl flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Безопасность</div>
                                <p className="text-muted-foreground">Ваши промпты и результаты защищены. Мы ценим вашу приватность.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="font-bold text-xl flex items-center gap-2"><Check className="h-5 w-5 text-primary" /> 99.9% аптайм</div>
                                <p className="text-muted-foreground">Надежная работа 24/7. Платформа всегда доступна, когда вам нужно.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 7. Pay-as-you-go Pricing */}
                <section id="pricing" className="py-20">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight">Тарифы (Pay-as-you-go)</h2>
                            <p className="text-muted-foreground mt-4 text-lg">Кредиты не сгорают. Платите только за то, что используете.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {/* 7.1 Starter */}
                            <Card className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>Стартовый</CardTitle>
                                    <div className="text-3xl font-bold mt-2">100₽</div>
                                    <CardDescription>100 кредитов</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="text-sm">Для начинающих и тех, кто хочет попробовать.</div>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Все базовые модели</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Генерация изображений</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Кредиты навсегда</li>
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link to="/register" className="w-full">
                                        <Button variant="outline" className="w-full">Купить пакет</Button>
                                    </Link>
                                </CardFooter>
                            </Card>

                            {/* 7.2 Basic (Popular) */}
                            <Card className="flex flex-col relative border-primary shadow-lg scale-105">
                                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">Популярный</div>
                                <CardHeader>
                                    <CardTitle>Базовый</CardTitle>
                                    <div className="text-3xl font-bold mt-2">500₽</div>
                                    <CardDescription>550 кредитов <span className="text-green-500 font-bold">(+50 бонус)</span></CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="text-sm">Оптимальный выбор для регулярного творчества.</div>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Все возможности Стартового</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Возможность генерации видео</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Выгодный курс</li>
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link to="/register" className="w-full">
                                        <Button className="w-full">Купить пакет</Button>
                                    </Link>
                                </CardFooter>
                            </Card>

                            {/* 7.3 Advanced */}
                            <Card className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>Продвинутый</CardTitle>
                                    <div className="text-3xl font-bold mt-2">1500₽</div>
                                    <CardDescription>2000 кредитов <span className="text-green-500 font-bold">(+500 бонус)</span></CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="text-sm">Для профессионалов и больших объемов задач.</div>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Максимальный объем</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Скачивание в высоком качестве</li>
                                        <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Приоритетная поддержка</li>
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link to="/register" className="w-full">
                                        <Button variant="outline" className="w-full">Купить пакет</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* 8. Subscriptions (Compact) */}
                <section className="py-16 bg-muted/30">
                    <div className="container px-4 md:px-6 mx-auto">
                        <h3 className="text-2xl font-bold tracking-tight text-center mb-8">Или выберите ежемесячную подписку</h3>
                        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Ультима</CardTitle>
                                    <div className="text-2xl font-bold">490₽ <span className="text-sm font-normal text-muted-foreground">/ мес</span></div>
                                    <div className="text-sm text-muted-foreground">200 кредитов</div>
                                </CardHeader>
                                <CardFooter>
                                    <Link to="/register" className="w-full"><Button size="sm" variant="secondary" className="w-full">Подписаться</Button></Link>
                                </CardFooter>
                            </Card>
                            <Card className="border-primary/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Профессиональный</CardTitle>
                                    <div className="text-2xl font-bold">1490₽ <span className="text-sm font-normal text-muted-foreground">/ мес</span></div>
                                    <div className="text-sm text-muted-foreground">750 кредитов</div>
                                </CardHeader>
                                <CardFooter>
                                    <Link to="/register" className="w-full"><Button size="sm" className="w-full">Подписаться</Button></Link>
                                </CardFooter>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Бизнес</CardTitle>
                                    <div className="text-2xl font-bold">4990₽ <span className="text-sm font-normal text-muted-foreground">/ мес</span></div>
                                    <div className="text-sm text-muted-foreground">3000 кредитов</div>
                                </CardHeader>
                                <CardFooter>
                                    <Link to="/register" className="w-full"><Button size="sm" variant="secondary" className="w-full">Подписаться</Button></Link>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* 9. Final CTA */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-primary/5"></div>
                    <div className="container px-4 md:px-6 mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Готовы начать творить?</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Присоединяйтесь к тысячам креаторов, использующих ИИ Мастерская.</p>
                        <Link to="/register">
                            <Button size="lg" className="px-8 text-lg">Начать использовать</Button>
                        </Link>
                        <div className="text-sm text-muted-foreground space-x-4">
                            <span>✨ Регистрация за 30 секунд</span>
                            <span>💳 Пополнение на любую сумму</span>
                        </div>
                    </div>
                </section>
            </main>

            {/* 10. Footer */}
            <footer className="bg-muted py-12 text-sm">
                <div className="container px-4 md:px-6 mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 font-bold text-lg">
                            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <span>ИИ Мастерская</span>
                        </div>
                        <div className="text-muted-foreground">
                            <p>Email: workbenchai@gmx.com</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <h3 className="font-semibold text-foreground">Юридическая информация</h3>
                        <div className="text-muted-foreground space-y-1">
                            <p>Общество с ограниченной ответственностью "Мирекс"</p>
                            <p>Юридический адрес: Кыргызская Республика, г.Бишкек, Первомайский район, ул.Озерное-7, 65, уч.641</p>
                            <p>ИНН KG 01207202210245</p>
                            <p>ИНН RUS 9909690541</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Документы</h3>
                        <ul className="space-y-2 text-muted-foreground">
                            <li><a href="#" className="hover:underline hover:text-primary">Условия использования</a></li>
                            <li><a href="#" className="hover:underline hover:text-primary">Конфиденциальность</a></li>
                        </ul>
                    </div>
                </div>
                <div className="container mx-auto px-4 mt-8 pt-8 border-t text-center text-muted-foreground">
                    © {new Date().getFullYear()} ИИ Мастерская. Все права защищены.
                </div>
            </footer>
        </div>
    )
}
