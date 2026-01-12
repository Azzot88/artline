import { BrowserRouter } from "react-router-dom"
import { 
  modelParameters, 
  modelParameterConfigs, 
  modelCostSignals,
  getModelWithParameters,
  getEnabledParameters,
  getParametersByGroup
} from "@/polymet/data/model-parameters-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2Icon, XCircleIcon, CoinsIcon, ClockIcon } from "lucide-react"

export default function ModelParametersDataRender() {
  const dalleWithParams = getModelWithParameters("dalle-3")
  const sdxlWithParams = getModelWithParameters("sdxl")
  const gen2WithParams = getModelWithParameters("runway-gen2")

  const models = [dalleWithParams, sdxlWithParams, gen2WithParams].filter(Boolean)

  return (
    <BrowserRouter>
      <div className="p-8 max-w-7xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Model Parameters & Configuration</h2>
          <p className="text-muted-foreground">
            Параметры моделей с настройками админки и расчётом стоимости
          </p>
        </div>

        {models.map(modelData => {
          if (!modelData) return null
          const { model, parameters, parameter_configs, cost_signals } = modelData
          const enabledParams = getEnabledParameters(model.id)
          
          return (
            <Card key={model.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{model.display_name}</CardTitle>
                    <CardDescription>{model.description}</CardDescription>
                  </div>
                  <Badge variant="outline">{model.provider}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cost Signals */}
                {cost_signals && (
                  <div className="p-4 border border-border rounded-lg bg-muted/30">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CoinsIcon className="w-4 h-4" />
                      Стоимость генерации
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Модель расчёта</p>
                        <p className="font-medium">{cost_signals.cost_model}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Валюта</p>
                        <p className="font-medium">{cost_signals.currency}</p>
                      </div>
                      {cost_signals.fixed_price_per_run && (
                        <div>
                          <p className="text-muted-foreground">Фикс. цена</p>
                          <p className="font-medium">${cost_signals.fixed_price_per_run}</p>
                        </div>
                      )}
                      {cost_signals.unit_price && (
                        <div>
                          <p className="text-muted-foreground">Цена за {cost_signals.unit}</p>
                          <p className="font-medium">${cost_signals.unit_price}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          Среднее время
                        </p>
                        <p className="font-medium">{cost_signals.avg_predict_time_sec}s</p>
                      </div>
                    </div>
                    {cost_signals.notes && (
                      <p className="text-xs text-muted-foreground mt-3 italic">
                        {cost_signals.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Parameters */}
                <div>
                  <h4 className="font-semibold mb-3">
                    Параметры ({enabledParams.length} из {parameters.length} включено)
                  </h4>
                  <div className="space-y-2">
                    {parameters.map(param => {
                      const config = parameter_configs.find(c => c.parameter_id === param.id)
                      const isEnabled = config?.enabled ?? false
                      
                      return (
                        <div 
                          key={param.id}
                          className={`p-3 border rounded-lg ${
                            isEnabled ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-muted/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {isEnabled ? (
                                  <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircleIcon className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className="font-medium">
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
                              </div>
                              
                              <div className="text-xs text-muted-foreground space-y-1 ml-6">
                                {param.default_value !== null && param.default_value !== undefined && (
                                  <p>Default: {JSON.stringify(param.default_value)}</p>
                                )}
                                {config?.override_default !== undefined && (
                                  <p className="text-primary">
                                    Admin override: {JSON.stringify(config.override_default)}
                                  </p>
                                )}
                                {param.min !== undefined && param.max !== undefined && (
                                  <p>Range: {param.min} - {param.max}</p>
                                )}
                                {param.enum && (
                                  <p>Values: {param.enum.join(", ")}</p>
                                )}
                                {config?.allowed_values && (
                                  <p className="text-primary">
                                    Admin allowed: {config.allowed_values.join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {isEnabled && (
                              <Badge variant="default" className="text-xs">
                                Order: {config?.display_order}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Как это работает</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>1. Параметры модели:</strong>
              <p className="text-muted-foreground">
                Парсятся из Replicate API и сохраняются в таблицу model_parameters
              </p>
            </div>
            <div>
              <strong>2. Конфигурация админа:</strong>
              <p className="text-muted-foreground">
                Админ включает/выключает параметры, ограничивает значения, меняет дефолты
              </p>
            </div>
            <div>
              <strong>3. Отображение в Мастерской:</strong>
              <p className="text-muted-foreground">
                Показываются только включенные параметры с учётом ограничений админа
              </p>
            </div>
            <div>
              <strong>4. Расчёт стоимости:</strong>
              <p className="text-muted-foreground">
                На основе cost_signals и выбранных параметров рассчитывается цена в кредитах
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}
