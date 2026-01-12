import { BrowserRouter } from "react-router-dom"
import { useState } from "react"
import { CostCalculator } from "@/polymet/components/cost-calculator"
import { getModelCostSignals } from "@/polymet/data/model-parameters-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ParameterValues } from "@/polymet/data/types"

export default function CostCalculatorRender() {
  // DALL-E 3 parameters
  const [dalleParams, setDalleParams] = useState<ParameterValues>({
    quality: "standard"
  })

  // SDXL parameters
  const [sdxlParams, setSdxlParams] = useState<ParameterValues>({
    num_inference_steps: 30,
    width: 1024,
    height: 1024
  })

  // Runway Gen-2 parameters
  const [gen2Params, setGen2Params] = useState<ParameterValues>({
    duration: 4
  })

  const dalleCost = getModelCostSignals("dalle-3")
  const sdxlCost = getModelCostSignals("sdxl")
  const gen2Cost = getModelCostSignals("runway-gen2")

  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Cost Calculator</h2>
          <p className="text-muted-foreground">
            Динамический расчёт стоимости генерации на основе параметров
          </p>
        </div>

        <Tabs defaultValue="dalle" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dalle">DALL-E 3</TabsTrigger>
            <TabsTrigger value="sdxl">SDXL</TabsTrigger>
            <TabsTrigger value="gen2">Runway Gen-2</TabsTrigger>
          </TabsList>

          {/* DALL-E 3 */}
          <TabsContent value="dalle" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Parameters</CardTitle>
                  <CardDescription>Измените параметры для пересчёта</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <Select
                      value={dalleParams.quality}
                      onValueChange={(val) => setDalleParams({ ...dalleParams, quality: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="hd">HD (2x cost)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <CostCalculator
                costSignals={dalleCost}
                parameters={dalleParams}
                showBreakdown
              />
            </div>
          </TabsContent>

          {/* SDXL */}
          <TabsContent value="sdxl" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Parameters</CardTitle>
                  <CardDescription>Измените параметры для пересчёта</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Inference Steps</Label>
                      <span className="text-sm text-muted-foreground">
                        {sdxlParams.num_inference_steps}
                      </span>
                    </div>
                    <Slider
                      value={[sdxlParams.num_inference_steps]}
                      onValueChange={(vals) => setSdxlParams({ ...sdxlParams, num_inference_steps: vals[0] })}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select
                      value={`${sdxlParams.width}x${sdxlParams.height}`}
                      onValueChange={(val) => {
                        const [w, h] = val.split("x").map(Number)
                        setSdxlParams({ ...sdxlParams, width: w, height: h })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="512x512">512x512</SelectItem>
                        <SelectItem value="768x768">768x768</SelectItem>
                        <SelectItem value="1024x1024">1024x1024</SelectItem>
                        <SelectItem value="1536x1536">1536x1536</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <CostCalculator
                costSignals={sdxlCost}
                parameters={sdxlParams}
                showBreakdown
              />
            </div>
          </TabsContent>

          {/* Runway Gen-2 */}
          <TabsContent value="gen2" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Parameters</CardTitle>
                  <CardDescription>Измените параметры для пересчёта</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Duration (seconds)</Label>
                      <span className="text-sm text-muted-foreground">
                        {gen2Params.duration}s
                      </span>
                    </div>
                    <Slider
                      value={[gen2Params.duration]}
                      onValueChange={(vals) => setGen2Params({ ...gen2Params, duration: vals[0] })}
                      min={4}
                      max={10}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>

              <CostCalculator
                costSignals={gen2Cost}
                parameters={gen2Params}
                showBreakdown
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Как работает расчёт</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>by_fixed:</strong> Фиксированная цена за генерацию (DALL-E 3)
            </p>
            <p>
              <strong>by_time:</strong> Цена зависит от времени генерации, которое зависит от параметров (SDXL, Runway)
            </p>
            <p className="text-muted-foreground">
              Курс конвертации: $1 = 100 кредитов
            </p>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}
