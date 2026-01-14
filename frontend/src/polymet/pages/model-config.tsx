import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getModelById } from "@/polymet/data/models-data"
import {
  getModelParameters,
  getModelParameterConfigs,
  getModelCostSignals
} from "@/polymet/data/model-parameters-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeftIcon,
  SaveIcon,
  TestTubeIcon,
  CoinsIcon,
  ImageIcon,
  VideoIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  TrendingUpIcon
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/polymet/components/language-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ModelConfig() {
  const { modelId = "dalle-3" } = useParams()
  const model = getModelById(modelId)
  const { dict } = useLanguage()

  // Get model parameters and cost signals
  const parameters = getModelParameters(modelId)
  const parameterConfigs = getModelParameterConfigs(modelId)
  const costSignals = getModelCostSignals(modelId)

  // Form state
  const [name, setName] = useState(model?.name || "")
  const [description, setDescription] = useState(model?.description || "")
  const [credits, setCredits] = useState(model?.credits.toString() || "5")
  const [maxResolution, setMaxResolution] = useState(model?.maxResolution || "1024x1024")
  const [status, setStatus] = useState(model?.status || "active")
  const [apiEndpoint, setApiEndpoint] = useState(model?.apiEndpoint || "")
  const [enableRateLimiting, setEnableRateLimiting] = useState(true)
  const [enableCaching, setEnableCaching] = useState(true)

  // Parameter configs state (which parameters are enabled)
  const [parameterEnabled, setParameterEnabled] = useState<Record<string, boolean>>(
    parameterConfigs.reduce((acc, config) => {
      acc[config.parameter_id] = config.enabled
      return acc
    }, {} as Record<string, boolean>)
  )

  // Calculate how many non-prompt parameters are enabled
  const getNonPromptEnabledCount = () => {
    return parameters.filter(param => {
      const isPromptLike = param.name.toLowerCase().includes('prompt') ||
        param.name.toLowerCase().includes('description')
      return !isPromptLike && parameterEnabled[param.id]
    }).length
  }

  const toggleParameter = (parameterId: string) => {
    const param = parameters.find(p => p.id === parameterId)
    if (!param) return

    const isPromptLike = param.name.toLowerCase().includes('prompt') ||
      param.name.toLowerCase().includes('description')

    // If trying to enable a non-prompt parameter
    if (!parameterEnabled[parameterId] && !isPromptLike) {
      const currentCount = getNonPromptEnabledCount()
      if (currentCount >= 4) {
        alert('Нельзя включить более 4 параметров одновременно (исключая prompt-поля). Отключите другие параметры.')
        return
      }
    }

    setParameterEnabled(prev => ({
      ...prev,
      [parameterId]: !prev[parameterId]
    }))
  }

  if (!model) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircleIcon className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold">{dict.common.notFound}</h3>
            <p className="text-sm text-muted-foreground">
              Модель, которую вы ищете, не существует или была удалена.
            </p>
            <Link to="/dashboard">
              <Button variant="outline">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Назад к {dict.navigation.dashboard}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {model.name}
            </h1>
            <p className="text-muted-foreground">
              Настройка параметров модели
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1">
          {dict.navigation.admin}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>Общие сведения о модели</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{dict.dashboard.modelName}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">{dict.dashboard.modelProvider}</Label>
                  <Input
                    id="provider"
                    value={model.provider}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{dict.dashboard.modelDescription}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Тип</Label>
                  <Input
                    id="type"
                    value={model.type === "image" ? dict.common.image : dict.common.video}
                    disabled
                    className="bg-muted capitalize"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{dict.dashboard.modelStatus}</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{dict.common.active}</SelectItem>
                      <SelectItem value="inactive">{dict.common.disabled}</SelectItem>
                      <SelectItem value="maintenance">{dict.common.maintenance}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">{dict.dashboard.modelCredits}</Label>
                  <Input
                    id="credits"
                    type="number"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Техническая конфигурация</CardTitle>
              <CardDescription>API эндпоинты и технические настройки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiEndpoint">API эндпоинт</Label>
                <Input
                  id="apiEndpoint"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.example.com/v1/generate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxResolution">Максимальное разрешение</Label>
                <Select value={maxResolution} onValueChange={setMaxResolution}>
                  <SelectTrigger id="maxResolution">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512x512">512×512</SelectItem>
                    <SelectItem value="1024x1024">1024×1024</SelectItem>
                    <SelectItem value="1280x768">1280×768</SelectItem>
                    <SelectItem value="1920x1080">1920×1080</SelectItem>
                    <SelectItem value="2048x2048">2048×2048</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="rateLimiting">Ограничение запросов</Label>
                    <p className="text-xs text-muted-foreground">
                      Ограничить запросы на пользователя в минуту
                    </p>
                  </div>
                  <Switch
                    id="rateLimiting"
                    checked={enableRateLimiting}
                    onCheckedChange={setEnableRateLimiting}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="caching">Кэширование ответов</Label>
                    <p className="text-xs text-muted-foreground">
                      Кэшировать похожие запросы для снижения затрат
                    </p>
                  </div>
                  <Switch
                    id="caching"
                    checked={enableCaching}
                    onCheckedChange={setEnableCaching}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Parameters & Cost */}
          <Card>
            <CardHeader>
              <CardTitle>Параметры и стоимость</CardTitle>
              <CardDescription>
                Настройка параметров модели и расчёт стоимости генерации
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="parameters" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="parameters">Параметры ({parameters.length})</TabsTrigger>
                  <TabsTrigger value="cost">Стоимость</TabsTrigger>
                </TabsList>

                {/* Parameters Tab */}
                <TabsContent value="parameters" className="space-y-4 mt-4">
                  {/* Warning about 4 parameter limit */}
                  <div className="p-3 border border-primary/30 bg-primary/5 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircleIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-xs space-y-1">
                        <p className="font-medium text-primary">
                          Ограничение: максимум 4 параметра
                        </p>
                        <p className="text-muted-foreground">
                          Можно включить не более 4 параметров одновременно (исключая prompt-поля).
                          Текущее количество: <strong>{getNonPromptEnabledCount()}/4</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {parameters.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Параметры для этой модели не найдены</p>
                      <p className="text-xs mt-2">Импортируйте параметры из Replicate API</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {parameters.map(param => {
                        const config = parameterConfigs.find(c => c.parameter_id === param.id)
                        const isEnabled = parameterEnabled[param.id] ?? config?.enabled ?? false
                        const isPromptLike = param.name.toLowerCase().includes('prompt') ||
                          param.name.toLowerCase().includes('description')

                        return (
                          <div
                            key={param.id}
                            className={`p-3 border rounded-lg transition-colors ${isEnabled ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-muted/30'
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {config?.custom_label || param.name}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    {param.type}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {param.ui_group}
                                  </Badge>
                                  {param.required && (
                                    <Badge variant="destructive" className="text-xs">
                                      required
                                    </Badge>
                                  )}
                                  {isPromptLike && (
                                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                                      не учитывается в лимите
                                    </Badge>
                                  )}
                                </div>

                                <div className="text-xs text-muted-foreground space-y-1">
                                  {param.default_value !== null && param.default_value !== undefined && (
                                    <p>Default: {JSON.stringify(param.default_value)}</p>
                                  )}
                                  {param.enum && (
                                    <p>Values: {param.enum.slice(0, 3).join(", ")}{param.enum.length > 3 ? "..." : ""}</p>
                                  )}
                                  {config?.allowed_values && (
                                    <p className="text-primary">
                                      Admin allowed: {config.allowed_values.join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <Switch
                                checked={isEnabled}
                                onCheckedChange={() => toggleParameter(param.id)}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Включенные параметры будут доступны в Мастерской для настройки генерации
                    </p>
                  </div>
                </TabsContent>

                {/* Cost Tab */}
                <TabsContent value="cost" className="space-y-4 mt-4">
                  {costSignals ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border border-border rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Модель расчёта</p>
                          <p className="font-semibold">{costSignals.cost_model}</p>
                        </div>
                        <div className="p-3 border border-border rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Валюта</p>
                          <p className="font-semibold">{costSignals.currency}</p>
                        </div>
                      </div>

                      {costSignals.cost_model === "by_fixed" && costSignals.fixed_price_per_run && (
                        <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CoinsIcon className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">Фиксированная цена</span>
                            </div>
                            <span className="text-2xl font-bold text-primary">
                              ${costSignals.fixed_price_per_run.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      )}

                      {costSignals.cost_model === "by_time" && (
                        <div className="space-y-3">
                          <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CoinsIcon className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Цена за секунду</span>
                              </div>
                              <span className="text-2xl font-bold text-primary">
                                ${(costSignals.unit_price || 0).toFixed(4)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 border border-border rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">Среднее время</p>
                              <p className="font-semibold">{costSignals.avg_predict_time_sec}s</p>
                            </div>
                            <div className="p-3 border border-border rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">P50</p>
                              <p className="font-semibold">{costSignals.p50_predict_time_sec}s</p>
                            </div>
                            <div className="p-3 border border-border rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">P95</p>
                              <p className="font-semibold">{costSignals.p95_predict_time_sec}s</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {costSignals.hardware_class && (
                        <div className="p-3 border border-border rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Класс оборудования</p>
                          <p className="font-medium">{costSignals.hardware_class}</p>
                        </div>
                      )}

                      {costSignals.notes && (
                        <div className="p-3 border border-border rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Примечания</p>
                          <p className="text-sm">{costSignals.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                        <ClockIcon className="w-3 h-3" />
                        <span>Обновлено: {new Date(costSignals.updated_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Данные о стоимости не найдены</p>
                      <p className="text-xs mt-2">Добавьте информацию о стоимости для этой модели</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>{dict.dashboard.modelCapabilities}</CardTitle>
              <CardDescription>Возможности, поддерживаемые этой моделью</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {model.capabilities.map((capability) => (
                  <Badge key={capability} variant="secondary">
                    {capability}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="lg">
              <SaveIcon className="w-4 h-4 mr-2" />
              {dict.common.save}
            </Button>
            <Button variant="outline" size="lg">
              {dict.common.cancel}
            </Button>
            <Button variant="outline" size="lg" className="ml-auto">
              <TestTubeIcon className="w-4 h-4 mr-2" />
              Тестировать
            </Button>
          </div>
        </div>

        {/* Right Column - Info & Stats */}
        <div className="space-y-6">
          {/* Model Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Тип модели</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-3 ${model.type === "image" ? "bg-blue-500/10" : "bg-purple-500/10"
                }`}>
                {model.type === "image" ? (
                  <ImageIcon className="w-8 h-8 text-blue-500" />
                ) : (
                  <VideoIcon className="w-8 h-8 text-purple-500" />
                )}
              </div>
              <p className="text-center text-sm font-medium capitalize">Генерация {model.type === "image" ? dict.common.image.toLowerCase() : dict.common.video.toLowerCase()}</p>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Текущий статус</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{dict.dashboard.modelStatus}</span>
                <Badge variant={
                  model.status === "active" ? "default" :
                    model.status === "maintenance" ? "secondary" :
                      "outline"
                }>
                  {model.status === "active" ? dict.common.active : model.status === "maintenance" ? dict.common.maintenance : dict.common.disabled}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Последнее обновление</span>
                <span className="text-sm font-medium">{model.lastUpdated}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CoinsIcon className="w-4 h-4 text-primary" />
                Стоимость
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-primary mb-2">
                  {model.credits}
                </div>
                <p className="text-sm text-muted-foreground">{dict.dashboard.modelCredits}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                Журнал использования
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                Проверить подключение
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                Экспорт конфигурации
              </Button>
              <Separator className="my-2" />
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" size="sm">
                Отключить модель
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}