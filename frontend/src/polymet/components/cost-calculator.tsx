import { CoinsIcon, ClockIcon, TrendingUpIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { ModelVersionCostSignals, ParameterValues, CostCalculation } from "@/polymet/data/types"
import { cn } from "@/lib/utils"

interface CostCalculatorProps {
  costSignals?: ModelVersionCostSignals
  parameters: ParameterValues
  className?: string
  showBreakdown?: boolean
}

// Credit conversion rate (example: $1 = 100 credits)
const USD_TO_CREDITS = 100

export function calculateCost(
  costSignals: ModelVersionCostSignals | undefined,
  parameters: ParameterValues
): CostCalculation {
  if (!costSignals) {
    // Fallback to fixed 5 credits
    return {
      credits: 5,
      currency: "USD"
    }
  }

  let costInUSD = 0
  let estimatedTimeSec: number | undefined

  switch (costSignals.cost_model) {
    case "by_fixed":
      costInUSD = costSignals.fixed_price_per_run || 0
      estimatedTimeSec = costSignals.avg_predict_time_sec
      
      // Adjust for quality parameter (e.g., DALL-E HD costs 2x)
      if (parameters.quality === "hd") {
        costInUSD *= 2
      }
      break

    case "by_time":
      // Base time estimate
      let predictedTime = costSignals.avg_predict_time_sec || 10
      
      // Adjust time based on parameters
      if (parameters.num_inference_steps) {
        // More steps = more time (linear approximation)
        const defaultSteps = 30
        predictedTime *= (parameters.num_inference_steps / defaultSteps)
      }
      
      if (parameters.duration) {
        // Video duration affects time
        predictedTime *= (parameters.duration / 4) // 4 sec is baseline
      }
      
      if (parameters.width && parameters.height) {
        // Higher resolution = more time
        const pixels = parameters.width * parameters.height
        const basePixels = 1024 * 1024
        predictedTime *= Math.sqrt(pixels / basePixels)
      }
      
      costInUSD = (costSignals.unit_price || 0) * predictedTime
      estimatedTimeSec = Math.round(predictedTime)
      break

    case "by_credits":
      // Direct credits (no USD conversion needed)
      return {
        credits: parameters.credits || 5,
        currency: costSignals.currency,
        estimated_time_sec: costSignals.avg_predict_time_sec
      }

    case "unknown":
    default:
      return {
        credits: 5,
        currency: "USD"
      }
  }

  // Convert USD to credits
  const credits = Math.ceil(costInUSD * USD_TO_CREDITS)

  return {
    credits,
    currency: costSignals.currency,
    estimated_time_sec: estimatedTimeSec
  }
}

export function CostCalculator({
  costSignals,
  parameters,
  className,
  showBreakdown = false
}: CostCalculatorProps) {
  const cost = calculateCost(costSignals, parameters)

  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Main Cost Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CoinsIcon className="w-4 h-4" />
              <span>Стоимость генерации</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">
                {cost.credits}
              </span>
              <span className="text-sm text-muted-foreground">кредитов</span>
            </div>
          </div>

          {/* Estimated Time */}
          {cost.estimated_time_sec && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ClockIcon className="w-3 h-3" />
                <span>Примерное время</span>
              </div>
              <span className="font-medium">
                ~{cost.estimated_time_sec} сек
              </span>
            </div>
          )}

          {/* Cost Model Info */}
          {showBreakdown && costSignals && (
            <div className="pt-3 border-t border-border space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Модель расчёта</span>
                <span className="font-medium">{costSignals.cost_model}</span>
              </div>
              
              {costSignals.cost_model === "by_fixed" && costSignals.fixed_price_per_run && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Базовая цена</span>
                  <span className="font-medium">
                    ${costSignals.fixed_price_per_run.toFixed(4)}
                  </span>
                </div>
              )}
              
              {costSignals.cost_model === "by_time" && (
                <>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Цена за секунду</span>
                    <span className="font-medium">
                      ${(costSignals.unit_price || 0).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Среднее время</span>
                    <span className="font-medium">
                      {costSignals.avg_predict_time_sec}s
                    </span>
                  </div>
                </>
              )}
              
              <div className="flex items-center gap-1 text-primary pt-1">
                <TrendingUpIcon className="w-3 h-3" />
                <span className="text-xs">
                  Цена может меняться в зависимости от параметров
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}