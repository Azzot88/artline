import { BrowserRouter } from "react-router-dom"
import { useState } from "react"
import { ModelParameterControl } from "@/polymet/components/model-parameter-control"
import { getModelParameters, getModelParameterConfigs } from "@/polymet/data/model-parameters-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ModelParameterControlRender() {
  const sdxlParams = getModelParameters("sdxl")
  const sdxlConfigs = getModelParameterConfigs("sdxl")
  
  // State for all parameters
  const [values, setValues] = useState<Record<string, any>>({})

  const handleChange = (paramId: string, value: any) => {
    setValues(prev => ({ ...prev, [paramId]: value }))
  }

  // Get only enabled parameters (max 4 non-prompt)
  const enabledParams = sdxlParams
    .filter(p => {
      const config = sdxlConfigs.find(c => c.parameter_id === p.id)
      return config?.enabled
    })
    .filter(p => 
      !p.name.toLowerCase().includes('prompt') && 
      !p.name.toLowerCase().includes('description')
    )
    .slice(0, 4)

  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Model Parameter Controls</h2>
          <p className="text-muted-foreground">
            Универсальные контролы для всех типов параметров
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Normal Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Normal Mode</CardTitle>
              <CardDescription>Полноразмерные контролы с лейблами</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sdxlParams.slice(0, 4).map(param => {
                const config = sdxlConfigs.find(c => c.parameter_id === param.id)
                
                return (
                  <ModelParameterControl
                    key={param.id}
                    parameter={param}
                    config={config}
                    value={values[param.id]}
                    onChange={(val) => handleChange(param.id, val)}
                  />
                )
              })}
            </CardContent>
          </Card>

          {/* Compact Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Compact Mode</CardTitle>
              <CardDescription>Компактные контролы для Мастерской (max 4)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {enabledParams.map(param => {
                  const config = sdxlConfigs.find(c => c.parameter_id === param.id)
                  
                  return (
                    <div key={param.id} className="flex-shrink-0 w-[150px]">
                      <ModelParameterControl
                        parameter={param}
                        config={config}
                        value={values[param.id]}
                        onChange={(val) => handleChange(param.id, val)}
                        compact
                      />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Current Values</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(values, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}
