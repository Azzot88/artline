import { useState, useEffect } from "react"
import { apiService } from "@/polymet/data/api-service"
import type { AdminStats } from "@/polymet/data/api-types"
import type { AIModel, Provider } from "@/polymet/data/models-data"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ServerIcon,
  ActivityIcon,
  TrendingUpIcon,
  UsersIcon,
  CoinsIcon,
  ImageIcon,
  VideoIcon,
  SettingsIcon,
  PlusIcon,
  SearchIcon,
  MoreVerticalIcon,
  RefreshCwIcon
} from "lucide-react"
import { Link } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/polymet/components/language-provider"

export function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useLanguage()

  // Real Data State
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [models, setModels] = useState<AIModel[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsData, modelsData, providersData] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getAdminModels(),
        apiService.getProviders()
      ])

      setStats(statsData)
      setModels(modelsData)

      // Enrich Providers for UI
      const enrichedProviders: Provider[] = providersData.map(p => {
        // Calculate stats from models
        const providerModels = modelsData.filter(m => m.provider.toLowerCase().includes(p.provider_id.toLowerCase()))
        const totalGens = providerModels.reduce((sum, m) => sum + (m.total_generations || 0), 0)

        return {
          provider_id: p.provider_id,
          name: p.provider_id.charAt(0).toUpperCase() + p.provider_id.slice(1), // Simple capitalization
          status: p.is_active ? "active" : "inactive",
          models_count: providerModels.length,
          total_generations: totalGens,
          logo: "https://github.com/polymet-ai.png" // Placeholder
        }
      })
      setProviders(enrichedProviders)

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate stats
  const totalModels = models.length
  const activeModels = models.filter(m => m.is_active).length // Backend uses is_active
  const totalProviders = providers.length
  const activeProviders = providers.filter(p => p.status === "active").length
  const totalGenerations = stats?.total_jobs || 0

  // Filter models
  const filteredModels = models.filter(model =>
    (model.display_name || model.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="p-8 text-center">Loading Dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCwIcon className="w-4 h-4" />
          </Button>
          <Badge variant="outline" className="text-xs px-3 py-1">
            {t('navigation.admin')}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.providers')}</CardTitle>
            <ServerIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProviders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeProviders} {t('common.active').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.models')}</CardTitle>
            <ActivityIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModels}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeModels} {t('common.active').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalGenerations')}</CardTitle>
            <TrendingUpIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGenerations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Jobs processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.users')}</CardTitle>
            <UsersIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total registered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Models Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>{t('dashboard.models')}</CardTitle>
              <CardDescription>Настройка параметров моделей</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button size="sm">
                <PlusIcon className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredModels.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No models found. Add one to get started.
              </div>
            )}
            {filteredModels.map((model) => (
              <div key={model.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${model.type === "image" ? "bg-blue-500/10" : "bg-purple-500/10"
                    }`}>
                    {model.type === "image" ? (
                      <ImageIcon className={`w-5 h-5 ${model.type === "image" ? "text-blue-500" : "text-purple-500"
                        }`} />
                    ) : (
                      <VideoIcon className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{model.display_name || model.name}</h3>
                      <Badge
                        variant={
                          model.is_active ? "default" : "outline" // Backend uses is_active boolean
                        }
                        className="flex-shrink-0"
                      >
                        {model.is_active ? t('common.active') : t('common.disabled')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{model.provider}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CoinsIcon className="w-3 h-3" />
                        {model.credits_per_generation || model.credits} {t('account.credits')}
                      </span>
                      {model.resolutions && model.resolutions.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{model.resolutions[model.resolutions.length - 1]}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/model-config/${model.id}`}>
                    <Button variant="outline" size="sm">
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      {t('common.settings')}
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVerticalIcon className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Подробности</DropdownMenuItem>
                      <DropdownMenuItem>Тестировать</DropdownMenuItem>
                      <DropdownMenuItem>{t('common.settings')}</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        {t('common.disabled')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Providers Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.providers')}</CardTitle>
              <CardDescription>Управление API провайдерами и их статусом</CardDescription>
            </div>
            <Button size="sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {providers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No providers found.
              </div>
            )}
            {providers.map((provider) => (
              <div key={provider.provider_id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <img
                    src={provider.logo}
                    alt={provider.name}
                    className="w-12 h-12 rounded-lg bg-muted"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{provider.name}</h3>
                      <Badge variant={provider.status === "active" ? "default" : "secondary"}>
                        {provider.status === "active" ? t('common.active') : provider.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{provider.models_count || 0} {t('dashboard.models').toLowerCase()}</span>
                      <span>•</span>
                      <span>{(provider.total_generations || 0).toLocaleString()} {t('dashboard.totalGenerations').toLowerCase()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    {t('common.settings')}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVerticalIcon className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Подробности</DropdownMenuItem>
                      <DropdownMenuItem>Редактировать API ключ</DropdownMenuItem>
                      <DropdownMenuItem>Проверить подключение</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        {t('common.disabled')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}