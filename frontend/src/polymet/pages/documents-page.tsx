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
                                <p>1. {t('common.brand')} (далее "Платформа") предоставляет доступ к инструментам искусственного интеллекта для генерации изображений и видео.</p>
                                <p>2. Использование Платформы означает полное и безоговорочное согласие с данными условиями. Если вы не согласны, пожалуйста, прекратите использование сервиса.</p>
                                <p>3. Запрещено использовать Платформу для создания незаконного, порнографического, экстремистского или оскорбительного контента.</p>
                                <p>4. Платформа предоставляется на условиях "как есть". Мы не гарантируем бесперебойную работу, отсутствие ошибок или соответствие сервиса конкретным целям пользователя.</p>
                                <p>5. Права на сгенерированный контент принадлежат пользователю, при условии соблюдения условий использования и оплаты соответствующих тарифов (коммерческая лицензия в платных тарифах).</p>
                                <p>6. Мы оставляем за собой право изменять тарифы, функциональность и данные условия в одностороннем порядке с уведомлением на сайте.</p>
                                <p>7. Возврат средств за купленные кредиты осуществляется только в случае технической невозможности предоставления услуги по вине Платформы.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('documents.tabs.privacy')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p>1. Мы собираем минимально необходимые данные для работы сервиса: адрес электронной почты, хэш пароля, историю генераций и платежные данные (обрабатываются платежным оператором).</p>
                                <p>2. Ваши данные не передаются третьим лицам без вашего согласия, за исключением случаев, предусмотренных законодательством или необходимых для обеспечения работы сервиса (хостинг, процессинг).</p>
                                <p>3. Мы используем файлы cookie для аутентификации, сохранения настроек (включая выбор языка) и аналитики использования сайта.</p>
                                <p>4. Сгенерированные изображения могут храниться на наших серверах для истории. Вы можете удалить их в личном кабинете.</p>
                                <p>5. Вы имеете право запросить удаление своего аккаунта и всех связанных данных, написав в службу поддержки.</p>
                                <p>6. Мы принимаем разумные меры технической и организационной защиты ваших данных.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="about">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('documents.tabs.about')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p className="font-medium text-foreground text-base">{t('common.brand')} — это инновационная платформа для креаторов, дизайнеров и маркетологов.</p>
                                <p>Мы объединяем лучшие генеративные нейросети мира (VEO 3, Nano Banana, Flux, SDXL) в единый удобный интерфейс, делая технологии будущего доступными каждому.</p>
                                <div className="pt-4 space-y-2">
                                    <p><strong>Компания:</strong> LLC "Mirex"</p>
                                    <p><strong>Адрес:</strong> Кыргызская Республика, г.Бишкек, Первомайский район, ул.Озерное-7, 65, уч.641</p>
                                    <p><strong>ИНН:</strong> KG 01207202210245</p>
                                    <p><strong>Контакты:</strong> support@artline.ai</p>
                                </div>
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
