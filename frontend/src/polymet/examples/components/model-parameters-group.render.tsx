import { BrowserRouter } from "react-router-dom"
import { useState } from "react"
import { ModelParametersGroup } from "@/polymet/components/model-parameters-group"
import { getModelParameters, getModelParameterConfigs, getEnabledParameters } from "@/polymet/data/model-parameters-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ParameterValues } from "@/polymet/data/types"

export default function ModelParametersGroupRender() {
  const [dalleValues, setDalleValues] = useState<ParameterValues>({})
  const [sdxlValues, setSdxlValues] = useState<ParameterValues>({})
  const [gen2Values, setGen2Values] = useState<ParameterValues>({})

  const handleDalleChange = (paramId: string, value: any) => {
    setDalleValues(prev => ({ ...prev, [paramId]: value }))
  }

  const handleSdxlChange = (paramId: string, value: any) => {
    setSdxlValues(prev => ({ ...prev, [paramId]: value }))
  }

  const handleGen2Change = (paramId: string, value: any) => {
    setGen2Values(prev => ({ ...prev, [paramId]: value }))
  }

  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Model Parameters Groups</h2>
          <p className="text-muted-foreground">
            Параметры сгруппированы по категориям с возможностью сворачивания
          </p>
        </div>

        <Tabs defaultValue="dalle" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dalle">DALL-E 3</TabsTrigger>
            <TabsTrigger value="sdxl">SDXL</TabsTrigger>
            <TabsTrigger value="gen2">Runway Gen-2</TabsTrigger>
          </TabsList>

          <TabsContent value="dalle" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>DALL-E 3 Parameters</CardTitle>
                <CardDescription>
                  {getEnabledParameters("dalle-3").length} параметров включено
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModelParametersGroup
                  parameters={getEnabledParameters("dalle-3")}
                  configs={getModelParameterConfigs("dalle-3")}
                  values={dalleValues}
                  onChange={handleDalleChange}
                />
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm">Current Values</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(dalleValues, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sdxl" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SDXL Parameters</CardTitle>
                <CardDescription>
                  {getEnabledParameters("sdxl").length} параметров включено
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModelParametersGroup
                  parameters={getEnabledParameters("sdxl")}
                  configs={getModelParameterConfigs("sdxl")}
                  values={sdxlValues}
                  onChange={handleSdxlChange}
                />
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm">Current Values</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(sdxlValues, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gen2" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Runway Gen-2 Parameters</CardTitle>
                <CardDescription>
                  {getEnabledParameters("runway-gen2").length} параметров включено
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModelParametersGroup
                  parameters={getEnabledParameters("runway-gen2")}
                  configs={getModelParameterConfigs("runway-gen2")}
                  values={gen2Values}
                  onChange={handleGen2Change}
                />
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm">Current Values</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(gen2Values, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BrowserRouter>
  )
}
