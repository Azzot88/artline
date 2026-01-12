import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CoinsIcon, 
  CreditCardIcon, 
  UserIcon, 
  MailIcon,
  CalendarIcon,
  TrendingUpIcon,
  ImageIcon,
  VideoIcon,
  DownloadIcon,
  GlobeIcon
} from "lucide-react"
import { generations } from "@/polymet/data/generations-data"
import { useTranslations } from "@/polymet/components/language-provider"
import { LanguageSelector } from "@/polymet/components/language-selector"

export function Account() {
  const [name, setName] = useState("Yusuf Hilmi")
  const [email, setEmail] = useState("yusuf@example.com")
  const t = useTranslations()
  
  // Mock user role - in real app, get from auth context
  const isAdmin = true
  
  // Mock user data
  const userStats = {
    credits: 250,
    totalGenerations: generations.length,
    imageGenerations: generations.filter(g => g.type === "image").length,
    videoGenerations: generations.filter(g => g.type === "video").length,
    totalCreditsUsed: generations.reduce((sum, g) => g.credits + sum, 0),
    memberSince: "January 2024"
  }

  // Recent transactions
  const transactions = [
    { id: 1, type: "purchase", amount: 100, date: "2024-01-15", description: "Credit Purchase" },
    { id: 2, type: "usage", amount: -5, date: "2024-01-15", description: "DALL-E 3 Generation" },
    { id: 3, type: "usage", amount: -4, date: "2024-01-14", description: "SDXL Generation" },
    { id: 4, type: "purchase", amount: 50, date: "2024-01-10", description: "Credit Purchase" },
    { id: 5, type: "usage", amount: -15, date: "2024-01-09", description: "Gen-2 Video" }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {t.account}
        </h1>
        <p className="text-muted-foreground">
          {t.profileDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile & Credits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t.profile}</CardTitle>
              <CardDescription>{t.profileDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <Button variant="outline" size="sm">{t.edit}</Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG или GIF. Макс 2МБ.</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Полное имя</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="w-4 h-4" />
                <span>Участник с {userStats.memberSince}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button>{t.save}</Button>
                <Button variant="outline">{t.cancel}</Button>
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GlobeIcon className="w-5 h-5" />
                {t.language}
              </CardTitle>
              <CardDescription>{t.selectLanguage}</CardDescription>
            </CardHeader>
            <CardContent>
              <LanguageSelector isAdmin={isAdmin} />
            </CardContent>
          </Card>

          {/* Credit History */}
          <Card>
            <CardHeader>
              <CardTitle>{t.creditBalance}</CardTitle>
              <CardDescription>{t.purchaseHistory}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === "purchase" 
                          ? "bg-green-500/10" 
                          : "bg-orange-500/10"
                      }`}>
                        {transaction.type === "purchase" ? (
                          <CreditCardIcon className={`w-5 h-5 ${
                            transaction.type === "purchase" 
                              ? "text-green-500" 
                              : "text-orange-500"
                          }`} />
                        ) : (
                          <CoinsIcon className="w-5 h-5 text-orange-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${
                      transaction.type === "purchase" 
                        ? "text-green-500" 
                        : "text-orange-500"
                    }`}>
                      {transaction.amount > 0 ? "+" : ""}{transaction.amount} {t.credits}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats & Credits */}
        <div className="space-y-6">
          {/* Credits Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CoinsIcon className="w-5 h-5 text-primary" />
                {t.creditBalance}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className="text-5xl font-bold text-primary mb-2">
                  {userStats.credits}
                </div>
                <p className="text-sm text-muted-foreground">{t.credits}</p>
              </div>
              
              <Button className="w-full" size="lg">
                <CreditCardIcon className="w-4 h-4 mr-2" />
                {t.buyMore}
              </Button>

              <div className="pt-4 border-t border-border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.creditsUsed}</span>
                  <span className="font-medium">{userStats.totalCreditsUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.avgCreditsPerGen}</span>
                  <span className="font-medium">
                    {Math.round(userStats.totalCreditsUsed / userStats.totalGenerations)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5" />
                {t.quickStats}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm">{t.image}</span>
                  </div>
                  <span className="text-lg font-semibold">{userStats.imageGenerations}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <VideoIcon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm">{t.video}</span>
                  </div>
                  <span className="text-lg font-semibold">{userStats.videoGenerations}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t.totalGenerations}</span>
                  <span className="text-xl font-bold">{userStats.totalGenerations}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <DownloadIcon className="w-4 h-4 mr-2" />
                {t.download}
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Подписка</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="mb-3">Бесплатный план</Badge>
              <p className="text-xs text-muted-foreground mb-4">
                Обновитесь до Pro для неограниченных генераций и приоритетного доступа
              </p>
              <Button variant="outline" className="w-full" size="sm">
                Обновить до Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}