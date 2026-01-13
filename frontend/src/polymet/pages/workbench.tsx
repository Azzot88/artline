import { useState, useEffect } from "react"
import { CreationTypeToggle, CreationType } from "@/polymet/components/creation-type-toggle"
import { InputTypeToggle, InputType } from "@/polymet/components/input-type-toggle"
import { ModelSelector } from "@/polymet/components/model-selector"
import { ModelParameterControl } from "@/polymet/components/model-parameter-control"
import { GenerateButton } from "@/polymet/components/generate-button"
import { FormatResolutionIndicator } from "@/polymet/components/format-resolution-indicator"
import { Card, CardContent } from "@/components/ui/card"
import { CommunityGallery } from "@/polymet/components/community-gallery"
import { Textarea } from "@/components/ui/textarea"
import { PlusIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/polymet/components/language-provider"
import { useModels } from "@/hooks/use-models" // New Hook
import { api } from "@/lib/api" // API Client
import { toast } from "sonner" // Toast

import {
  getEnabledParameters,
  getModelParameterConfigs,
  getEffectiveDefault
} from "@/polymet/data/model-parameters-data"
import { formatToResolutions } from "@/polymet/data/types"
import type { ParameterValues, ImageFormatType, VideoFormatType } from "@/polymet/data/types"

export function Workbench() {
  const t = useTranslations()
  const [creationType, setCreationType] = useState<CreationType>("image")
  const [inputType, setInputType] = useState<InputType>("text")
  const [prompt, setPrompt] = useState("")
  const [file, setFile] = useState<File | null>(null)

  // Use Dynamic Models
  const { models, loading: modelsLoading } = useModels()
  const [model, setModel] = useState("")

  // Select first model when loaded
  useEffect(() => {
    if (models.length > 0 && !model) {
      // Prefer Flux if available, else first
      const flux = models.find(m => m.name.toLowerCase().includes("flux"))
      setModel(flux ? flux.id : models[0].id)
    }
  }, [models, model])

  const [loading, setLoading] = useState(false)

  // Dynamic parameters based on selected model
  const [parameterValues, setParameterValues] = useState<ParameterValues>({})

  // Get model parameters (max 4, excluding prompt/negative_prompt)
  const allParameters = getEnabledParameters(model)
  const parameterConfigs = getModelParameterConfigs(model)

  // Filter out prompt-like parameters and limit to 4
  // Format parameter is ALWAYS shown first if present
  const formatParam = allParameters.find(p => p.name === 'format')
  const otherParams = allParameters
    .filter(p =>
      p.name !== 'format' &&
      !p.name.toLowerCase().includes('prompt') &&
      !p.name.toLowerCase().includes('description') &&
      !p.name.toLowerCase().includes('width') &&
      !p.name.toLowerCase().includes('height') &&
      !p.name.toLowerCase().includes('size')
    )

  // Combine: format first, then other parameters (max 4 total)
  const displayParameters = formatParam
    ? [formatParam, ...otherParams].slice(0, 4)
    : otherParams.slice(0, 4)

  // Get model credits from dynamic list or fallback
  const selectedModel = models.find(m => m.id === model)
  // Backend doesn't send credits yet? Default to 5
  // If backend updated to send credits, use it.
  const modelCredits = 5

  // Initialize parameter values with defaults when model changes
  useEffect(() => {
    const initialValues: ParameterValues = {}
    allParameters.forEach(param => {
      const config = parameterConfigs.find(c => c.parameter_id === param.id)
      initialValues[param.id] = getEffectiveDefault(param, config)
    })
    setParameterValues(initialValues)
  }, [model])

  const handleParameterChange = (parameterId: string, value: any) => {
    setParameterValues(prev => {
      const newValues = { ...prev, [parameterId]: value }

      // If format changed, auto-calculate resolution
      const param = allParameters.find(p => p.id === parameterId)
      if (param?.name === 'format') {
        // Find resolution/size parameter
        const resolutionParam = allParameters.find(p =>
          p.name === 'resolution' || p.name === 'size'
        )

        if (resolutionParam) {
          // Get quality from quality parameter if exists
          const qualityParam = allParameters.find(p => p.name === 'quality')
          const quality = qualityParam ? newValues[qualityParam.id] : 'hd'

          // Map quality to resolution quality
          const resQuality = quality === 'hd' ? 'hd' : quality === '4k' ? '4k' : 'sd'

          // Get available resolutions for this format
          const availableResolutions = formatToResolutions(value as ImageFormatType | VideoFormatType, resQuality)

          // Set to first available resolution (usually the best quality)
          if (availableResolutions.length > 0) {
            newValues[resolutionParam.id] = availableResolutions[availableResolutions.length - 1]
          }
        }
      }

      return newValues
    })
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    setLoading(true)

    try {
      const payload = {
        model_id: model,
        prompt: prompt,
        kind: creationType,
        params: parameterValues
      }

      const res = await api.post<any>("/jobs", payload)
      toast.success("Job started!", { description: "You can view progress in the gallery." })

      // Reset or redirect?
      // Typically stay on workbench or go to dashboard
    } catch (err: any) {
      console.error(err)
      toast.error("Generation Failed", { description: err.message || "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  const isGenerateDisabled = () => {
    if (inputType === "text" && !prompt.trim()) return true
    if (inputType === "image" && !file) return true
    if (!model) return true
    if (modelsLoading) return true

    // Check required parameters
    const requiredParams = allParameters.filter(p => p.required)
    for (const param of requiredParams) {
      const value = parameterValues[param.id]
      if (value === null || value === undefined || value === "") {
        return true
      }
    }

    return false
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {t.appTitle}
        </h1>
        <p className="text-muted-foreground">
          {t.appSubtitle}
        </p>
      </div>

      {/* Main Unified Card - Large Textarea with Controls Inside */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Large Main Textarea Area */}
          <div className="relative">
            {/* Top Controls Bar - Input Type Toggle */}
            <div className="absolute top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border p-4 z-10">
              <div className="flex flex-wrap items-center gap-4">
                <CreationTypeToggle value={creationType} onChange={setCreationType} />
                <InputTypeToggle
                  value={inputType}
                  onChange={setInputType}
                  creationType={creationType}
                />
              </div>
            </div>

            {/* Textarea - Hidden when Image-to-X mode is active */}
            {inputType === "text" ? (
              <div className="relative w-full">
                <Textarea
                  id="main-prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={creationType === "image" ? t.describeImage : t.describeVideo}
                  maxLength={1000}
                  className="w-full min-h-[400px] md:min-h-[400px] resize-y border-0 focus-visible:ring-0 text-base p-6 pt-24 pb-32"
                />
                {/* Enhance Button - Inside textarea, floating right */}
                <div className="absolute top-24 right-6 z-20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Enhance prompt logic here
                      console.log("Enhancing prompt:", prompt)
                    }}
                  >
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    {t.enhance}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full min-h-[400px] md:min-h-[400px] p-6 pt-24 pb-32 relative">
                {/* Small Upload Icon at Top Left */}
                <div className="absolute top-24 left-6">
                  <button
                    onClick={() => document.getElementById('file-input')?.click()}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <PlusIcon className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file && (
                    <p className="text-xs text-muted-foreground mt-2 max-w-[100px] truncate">
                      {file.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Controls Bar - Content-Driven Responsive Layout */}
            <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
              {/* Format & Resolution Indicator */}
              {(() => {
                const formatParam = allParameters.find(p => p.name === 'format')
                const resolutionParam = allParameters.find(p => p.name === 'resolution' || p.name === 'size')

                if (formatParam && resolutionParam) {
                  const format = parameterValues[formatParam.id]
                  const resolution = parameterValues[resolutionParam.id]

                  if (format && resolution) {
                    return (
                      <div className="mb-3">
                        <FormatResolutionIndicator
                          format={format}
                          resolution={resolution}
                        />
                      </div>
                    )
                  }
                }
                return null
              })()}

              <div className="flex flex-wrap items-end gap-3">
                {/* Model Selector */}
                <div className="flex-shrink-0 w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
                  <ModelSelector
                    value={model}
                    onChange={setModel}
                    creationType={creationType}
                    models={models}
                    loading={modelsLoading}
                  />
                </div>

                {/* Dynamic Parameters (max 4) - Format is always first */}
                {displayParameters.map(param => {
                  const config = parameterConfigs.find(c => c.parameter_id === param.id)
                  const isFormat = param.name === 'format'

                  return (
                    <div
                      key={param.id}
                      className={`flex-shrink-0 w-full sm:w-auto ${isFormat ? 'sm:min-w-[120px] sm:max-w-[150px]' : 'sm:min-w-[150px] sm:max-w-[200px]'}`}
                    >
                      <ModelParameterControl
                        parameter={param}
                        config={config}
                        value={parameterValues[param.id]}
                        onChange={(val) => handleParameterChange(param.id, val)}
                        disabled={loading}
                        compact
                      />
                    </div>
                  )
                })}

                {/* Generate Button */}
                <div className="flex-shrink-0 w-full sm:w-auto sm:ml-auto">
                  <GenerateButton
                    credits={modelCredits}
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled()}
                    loading={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

      {/* Community Gallery Card */ }
  <Card>
    <CardContent className="pt-6">
      <CommunityGallery />
    </CardContent>
  </Card>
    </div >
  )
}