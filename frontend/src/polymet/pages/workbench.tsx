import { useState, useEffect } from "react"
import { CAPABILITY_SCHEMA } from "@/polymet/data/capabilities"
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
import { useLanguage } from "@/polymet/components/language-provider"
import { useAuth } from "@/polymet/components/auth-provider" // Import Auth Hook
import { useModels } from "@/hooks/use-models" // New Hook
import { api } from "@/lib/api" // API Client
import { toast } from "sonner" // Toast
import { GenerationOverlay } from "@/polymet/components/generation-overlay" // Import Overlay
import { LibraryWidget } from "@/polymet/components/library-widget"


import { formatToResolutions } from "@/polymet/data/types"

import type { ParameterValues, ImageFormatType, VideoFormatType, Generation } from "@/polymet/data/types"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useLocation } from "react-router-dom"

export function Workbench() {
  const { t } = useLanguage()
  const { refreshUser } = useAuth() // Get refreshUser
  const [creationType, setCreationType] = useState<CreationType>("image")
  const [inputType, setInputType] = useState<InputType>("text")
  const [prompt, setPrompt] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('workbench_prompt') || ""
    }
    return ""
  })

  // Persist prompt
  useEffect(() => {
    localStorage.setItem('workbench_prompt', prompt)
  }, [prompt])

  const location = useLocation()

  // Handle Cross-Page Prompt Reuse and Deduplication
  useEffect(() => {
    const locState = location.state as any
    if (locState?.appendPrompt) {
      const text = locState.appendPrompt

      // Prevent duplicate append if the text is already at the end
      setPrompt(prev => {
        if (prev.trim().endsWith(text.trim())) return prev

        const spacer = prev.trim().length > 0 ? "\n" : ""
        // Clear history state immediately after use
        window.history.replaceState({}, '')
        return prev + spacer + text
      })
    }
  }, [location])


  // Use Dynamic Models
  const { models, loading: modelsLoading, error: modelsError } = useModels()
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
  const [refreshLibrary, setRefreshLibrary] = useState(0)
  const [lastGeneration, setLastGeneration] = useState<Generation | null>(null)

  // Get model credits from dynamic list or fallback
  const selectedModel = models.find(m => m.id === model)
  const modelCredits = selectedModel?.credits ?? 5


  // Dynamic parameters state
  const [modelParameters, setModelParameters] = useState<any[]>([])
  const [modelConfigs, setModelConfigs] = useState<any[]>([])
  const [parameterValues, setParameterValues] = useState<ParameterValues>({})

  // Parse parameters when model changes
  useEffect(() => {
    if (!selectedModel) {
      setModelParameters([])
      setModelConfigs([])
      return
    }

    // Guard against missing inputs
    if (!selectedModel.inputs || !Array.isArray(selectedModel.inputs)) {
      console.warn("Model has no inputs or invalid inputs", selectedModel)
      setModelParameters([])
      setModelConfigs([])
      return
    }

    try {
      // Temporary parser to convert backend inputs array to frontend ModelParameter shape
      const params = selectedModel.inputs.map((input: any) => {
        if (!input) return null // Skip nulls

        let type = input.type || 'string'
        // Fix numeric types often coming as string/number in generic JSON
        if (type === 'integer') type = 'integer'
        if (type === 'number') type = 'number'

        return {
          id: input.name, // Use name as ID for simplicity in dynamic land
          name: input.name,
          type: type,
          default_value: input.default,
          required: input.required || false,
          enum: input.enum || input.allowed_values, // Check both typical fields
          min: input.min,
          max: input.max,
          ui_group: 'other' // We can refine this later
        }
      }).filter(Boolean) // Remove nulls

      // Sort: Format -> Size -> Quality -> Others
      // We can infer this!
      const sortedParams = params.sort((a: any, b: any) => {
        const score = (p: string) => {
          if (p === 'format') return 0
          if (p === 'width' || p === 'height' || p === 'size' || p === 'resolution') return 1
          if (p === 'quality' || p === 'steps') return 2
          return 10
        }
        return score(a.name) - score(b.name)
      })

      setModelParameters(sortedParams)

      // Generate default configs
      const configs = sortedParams.map((p: any) => ({
        parameter_id: p.id,
        enabled: true,
        display_order: 0,
        custom_label: p.name.charAt(0).toUpperCase() + p.name.slice(1) // Capitalize
      }))
      setModelConfigs(configs)

      // Set initial values
      const initialValues: ParameterValues = {}
      sortedParams.forEach((param: any) => {
        if (param.default_value !== undefined) {
          initialValues[param.id] = param.default_value
        }
      })
      setParameterValues(initialValues)

    } catch (e) {
      console.error("Failed to parse dynamic inputs", e)
      // Do not crash UI, just show no parameters
      setModelParameters([])
    }

  }, [selectedModel])

  // Backwards compatibility for render loop
  const displayParameters = modelParameters.slice(0, 4) // Show first 4 sorted
  const parameterConfigs = modelConfigs
  const allParameters = modelParameters


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

  // Polling State
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentJobStatus, setCurrentJobStatus] = useState<string>("idle") // idle, queued, processing, succeeded, failed
  const [currentJobLogs, setCurrentJobLogs] = useState<string>("")

  const pollJobStatus = async (jobId: string) => {
    let attempts = 0
    const maxAttempts = 60 // 2 minutes approx

    const interval = setInterval(async () => {
      attempts++
      if (attempts > maxAttempts) {
        clearInterval(interval)
        toast.error("Generation timed out")
        return
      }

      try {
        const job: any = await api.get(`/jobs/${jobId}`)

        // Update status in background if needed, but primarily we wait for terminal
        if (job.status === 'succeeded') {
          clearInterval(interval)
          toast.success(t('workbench.toasts.jobStarted'))

          // Map final job to Generation
          const width = job.format === "portrait" ? 768 : (job.format === "landscape" ? 1024 : 1024);
          const height = job.format === "portrait" ? 1024 : (job.format === "landscape" ? 768 : 1024);
          let cleanPrompt = job.prompt || "";
          if (cleanPrompt.includes("|")) cleanPrompt = cleanPrompt.split("|").pop().trim();
          else if (cleanPrompt.startsWith("[")) cleanPrompt = cleanPrompt.replace(/\[.*?\]\s*/, "").trim();

          const finalGen: Generation = {
            id: job.id,
            url: job.result_url || job.image,
            image: job.result_url || job.image,
            prompt: cleanPrompt,
            model: job.model_id || "Flux",
            provider: "replicate",
            credits: job.credits_spent || 1,
            likes: job.likes || 0,
            views: job.views || 0,
            userName: "Me",
            userAvatar: "https://github.com/shadcn.png",
            width: width,
            height: height,
            type: job.kind as any,
            kind: job.kind as any,
            timestamp: job.created_at,
            status: 'succeeded'
          }
          // Update the specific card (LibraryWidget handles updates by ID usually?)
          // We trigger LastGeneration update again with final data
          setLastGeneration(finalGen)
          setRefreshLibrary(prev => prev + 1)

        } else if (job.status === 'failed') {
          clearInterval(interval)
          // Refresh user balance to show refund if any
          await refreshUser()
          toast.error("Generation failed", { description: job.error_message || "Credits have been refunded." })
          // Optionally update card to failed state
        }
      } catch (e) {
        console.error("Poll error", e)
      }
    }, 2000)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t('workbench.toasts.enterPrompt'))
      return
    }

    setLoading(true)
    // We do NOT set isGenerating(true) to block UI anymore
    // setIsGenerating(true) 

    try {
      const payload = {
        model_id: model,
        prompt: prompt,
        kind: creationType,
        params: parameterValues
      }

      const res: any = await api.post<any>("/jobs", payload)

      // Optimistic UI: Create specific "Queued" Generation
      const width = 1024; // Default/Estimated
      const height = 1024;
      const optimisticGen: Generation = {
        id: res.id,
        url: "", // Empty for queuing
        image: "",
        prompt: prompt,
        model: model,
        provider: "replicate",
        credits: 1,
        likes: 0,
        views: 0,
        userName: "Me",
        userAvatar: "https://github.com/shadcn.png",
        width: width,
        height: height,
        type: creationType as any,
        kind: creationType as any,
        timestamp: new Date().toISOString(),
        status: 'queued'
      }

      setLastGeneration(optimisticGen)
      // We don't increment refreshLibrary yet, we want to inject this directly if possible.
      // But LibraryWidget might need refresh to fetch it if it relies on API.
      // Actually, LibraryWidget appends `newGeneration` to its list.

      toast.info("Generation started...")

      // Start polling in background
      pollJobStatus(res.id)

    } catch (err: any) {
      console.error(err)
      toast.error(t('workbench.toasts.genFailed'), { description: err.message || t('workbench.toasts.unknownError') })
    } finally {
      setLoading(false) // Unblock immediately
      // Clear input state immediately
      if (inputType === "text") {
        setPrompt("")
        localStorage.removeItem('workbench_prompt')
      }
      if (inputType === "image") setFile(null)
    }
  }

  // Filter models centrally to support auto-selection
  const filteredModels = useMemo(() => {
    return models.filter(m => {
      // 1. Filter by Creation Type (Image vs Video)
      const isBoth = m.category === 'both'
      const matchesCreation = m.category === creationType || isBoth

      if (!matchesCreation) return false

      // 2. Filter by Input Type (Text vs Image)
      if (inputType === 'image') {
        // Must support 'init_image' input
        // Check capabilities that require 'init_image'
        return m.capabilities?.some(cap =>
          CAPABILITY_SCHEMA[cap]?.requiredInputs.includes('init_image')
        )
      }
      return true
    })
  }, [models, creationType, inputType])

  // Auto-Select Model when list changes
  useEffect(() => {
    // If no models available, nothing to select
    if (filteredModels.length === 0) return

    // If current model is still valid in the new list, keep it
    const currentIsValid = filteredModels.some(m => m.id === model)
    if (currentIsValid) return

    // Otherwise, select the best default
    if (creationType === 'image') {
      const flux = filteredModels.find(m => m.name.toLowerCase().includes("flux"))
      setModel(flux ? flux.id : filteredModels[0].id)
    } else {
      // For video, just pick the first one (usually Veo or Kling)
      setModel(filteredModels[0].id)
    }

  }, [filteredModels, model, creationType])


  // Helper for disable state
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
          {t('workbench.appTitle')}
        </h1>
        <p className="text-muted-foreground">
          {t('workbench.appSubtitle')}
        </p>
      </div>

      {modelsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('workbench.errorLoading')}</AlertTitle>
          <AlertDescription>
            {modelsError}. {t('workbench.errorLoadingDesc')}
          </AlertDescription>
        </Alert>
      )}

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
                  placeholder={creationType === "image" ? t('workbench.describeImage') : t('workbench.describeVideo')}
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
                    {t('workbench.enhance')}
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
                    models={filteredModels}
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
                    loading={loading && !isGenerating} // Only show old spinner if not using overlay? or keep both? overlay implies loading.
                  />
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Library Widget - Dynamic Visibility */}
      <LibraryWidget
        refreshTrigger={refreshLibrary}
        newGeneration={lastGeneration}
        onUsePrompt={(text) => {
          setPrompt(prev => {
            const spacer = prev.trim().length > 0 ? "\n" : ""
            return prev + spacer + text
          })
          // Scroll to top to see input
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      {/* Community Gallery Card */}
      <Card>
        <CardContent className="pt-6">
          <CommunityGallery />
        </CardContent>
      </Card>
    </div >
  )
}