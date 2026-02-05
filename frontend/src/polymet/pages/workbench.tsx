import { useState, useEffect, useMemo } from "react"
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
import { PlusIcon, SparklesIcon, AlertCircle, Settings2, EraserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLanguage } from "@/polymet/components/language-provider"
import { useAuth } from "@/polymet/components/auth-provider"
import { useModels } from "@/hooks/use-models"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { LibraryWidget } from "@/polymet/components/library-widget"
import { useJobPolling } from "@/polymet/hooks/use-job-polling"
import { formatToResolutions } from "@/polymet/data/types"
import { normalizeModelInputs } from "@/polymet/data/transformers"

import type { ParameterValues, ImageFormatType, VideoFormatType, Generation } from "@/polymet/data/types"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { useLocation, useSearchParams } from "react-router-dom"
import { useModelSpec } from "@/polymet/hooks/use-model-spec"

export function Workbench() {
  const { t } = useLanguage()
  const { refreshUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [creationType, setCreationType] = useState<CreationType>(() => {
    const tab = searchParams.get('tab')
    return (tab === 'video') ? 'video' : 'image'
  })

  const [inputType, setInputType] = useState<InputType>("text")
  const [prompt, setPrompt] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('workbench_prompt') || ""
    }
    return ""
  })
  const [file, setFile] = useState<File | null>(null)

  // Persist prompt
  useEffect(() => {
    localStorage.setItem('workbench_prompt', prompt)
  }, [prompt])

  const location = useLocation()

  // Handle Cross-Page Prompt Reuse
  useEffect(() => {
    const locState = location.state as any
    if (locState?.appendPrompt) {
      const text = locState.appendPrompt
      setPrompt(prev => {
        if (prev.trim().endsWith(text.trim())) return prev
        const spacer = prev.trim().length > 0 ? "\n" : ""
        window.history.replaceState({}, '')
        return prev + spacer + text
      })
    }
  }, [location])

  // Sync URL -> State
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'video' && creationType !== 'video') {
      setCreationType('video')
    } else if (tab === 'image' && creationType !== 'image') {
      setCreationType('image')
    } else if (!tab) {
      // Default to image if param missing, optional but keeps URL clean
      // setCreationType('image') 
    }
  }, [searchParams, creationType])

  const handleCreationTypeChange = (type: CreationType) => {
    setCreationType(type)
    setSearchParams(prev => {
      prev.set('tab', type)
      return prev
    })
  }

  // Use Dynamic Models
  const { models, loading: modelsLoading, error: modelsError } = useModels()
  const [model, setModel] = useState("")

  // Select first model when loaded
  useEffect(() => {
    if (models.length > 0 && !model) {
      const flux = models.find(m => m.name.toLowerCase().includes("flux"))
      setModel(flux ? flux.id : models[0].id)
    }
  }, [models, model])

  const [loading, setLoading] = useState(false)
  const [refreshLibrary, setRefreshLibrary] = useState(0)
  const [lastGeneration, setLastGeneration] = useState<Generation | null>(null)

  // Polling Hook
  const { startPolling, anyPolling, activeGenerations, addOptimistic, markAsFailed } = useJobPolling({
    onSucceeded: (generation) => {
      setLastGeneration(generation)
      setRefreshLibrary(prev => prev + 1)
      refreshUser() // Update balance after success
    },
    onFailed: () => {
      setRefreshLibrary(prev => prev + 1)
    }
  })

  const selectedModel = models.find(m => m.id === model)
  const modelCredits = selectedModel?.credits ?? 5

  const { spec, loading: specLoading } = useModelSpec(selectedModel?.id || null)

  const [modelParameters, setModelParameters] = useState<any[]>([])
  const [modelConfigs, setModelConfigs] = useState<any[]>([])
  const [parameterValues, setParameterValues] = useState<ParameterValues>({})

  // DEBUG: Monitor Data Flow
  useEffect(() => {
    console.log("[Workbench Debug] Selected Model:", selectedModel?.id, selectedModel?.name)
    console.log("[Workbench Debug] Spec State:", { loading: specLoading, hasSpec: !!spec, specParams: spec?.parameters?.length })
    console.log("[Workbench Debug] Current Parameters:", modelParameters)
  }, [selectedModel, spec, specLoading, modelParameters])

  // Effect to sync Spec -> Internal State
  useEffect(() => {
    if (!selectedModel) {
      setModelParameters([])
      setModelConfigs([])
      return
    }

    // Phase 3 Logic: Use Spec ONLY if it has parameters
    if (spec && spec.parameters && spec.parameters.length > 0) {
      console.log("[Workbench Debug] Processing Spec:", spec)
      // Convert to compatible format
      const params = spec.parameters.filter(p => !p.hidden)
      const mappedParams = params.map(p => ({
        id: p.id,
        name: p.id,
        type: p.type,
        label: p.label,
        default_value: p.default,
        required: p.required,
        min: p.min,
        max: p.max,
        step: p.step,
        options: p.options,
        group: p.group_id
      })).sort((a, b) => {
        const score = (name: string) => {
          if (name === 'format') return 0
          if (name === 'aspect_ratio') return 0
          if (name === 'resolution' || name === 'size' || name === 'width' || name === 'height') return 1
          if (name === 'quality' || name === 'steps' || name === 'num_outputs') return 2
          return 10
        }
        return score(a.name) - score(b.name)
      })

      console.log("[Workbench Debug] Mapped Params:", mappedParams)
      setModelParameters(mappedParams)
      // Configs
      setModelConfigs(mappedParams.map(p => ({
        parameter_id: p.id,
        enabled: true,
        display_order: 0,
        custom_label: p.label
      })))

      // Defaults
      const defaults: ParameterValues = {}
      mappedParams.forEach(p => {
        if (p.default_value !== undefined) defaults[p.id] = p.default_value
      })
      setParameterValues(prev => ({ ...defaults, ...prev })) // Keep user edits? Or reset? Reset safer for now
      setParameterValues(defaults)

    } else if (!specLoading && !spec) {
      // Fallback to legacy if no spec found (or error)
      // Keeping legacy logic for stability during migration
      const sortedParams = normalizeModelInputs(selectedModel)
      setModelParameters(sortedParams)
      const initialValues: ParameterValues = {}
      sortedParams.forEach((param: any) => {
        if (param.default_value !== undefined) initialValues[param.id] = param.default_value
      })
      setParameterValues(initialValues)
    }
  }, [selectedModel, spec, specLoading])

  const handleParameterChange = (parameterId: string, value: any) => {
    setParameterValues(prev => {
      const newValues = { ...prev, [parameterId]: value }
      const param = modelParameters.find(p => p.id === parameterId)
      if (param?.name === 'format') {
        const resolutionParam = modelParameters.find(p => p.name === 'resolution' || p.name === 'size')
        if (resolutionParam) {
          const qualityParam = modelParameters.find(p => p.name === 'quality')
          const quality = qualityParam ? (newValues[qualityParam.id] as 'sd' | 'hd' | '4k') : 'hd'
          const availableResolutions = formatToResolutions(value as ImageFormatType | VideoFormatType, quality)
          if (availableResolutions.length > 0) {
            newValues[resolutionParam.id] = availableResolutions[availableResolutions.length - 1]
          }
        }
      }
      return newValues
    })
  }

  const handleClear = () => {
    setPrompt("")
    setFile(null)
    localStorage.removeItem('workbench_prompt')
  }

  const handleUsePrompt = (text: string) => {
    setPrompt(prev => {
      const spacer = prev.trim().length > 0 ? "\n" : ""
      return prev + spacer + text
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t('workbench.toasts.enterPrompt'))
      return
    }

    setLoading(true)
    // 1. Create a temporary ID and data for immediate feedback
    const tempId = `temp-${Date.now()}`
    const commonData: any = {
      prompt: prompt,
      kind: creationType,
      model_name: selectedModel?.name,
      input_type: inputType,
      format: parameterValues['format'] || 'square',
      resolution: parameterValues['resolution'] || '1080',
      width: creationType === 'image' ? (parameterValues['format'] === 'landscape' ? 1024 : parameterValues['format'] === 'portrait' ? 576 : 1024) : 1920,
      height: creationType === 'image' ? (parameterValues['format'] === 'landscape' ? 576 : parameterValues['format'] === 'portrait' ? 1024 : 1024) : 1080,
    }

    // 2. Add optimistic generation IMMEDIATELY
    addOptimistic(tempId, commonData)

    // Clear inputs immediately for "Fire and Forget" feeling
    if (inputType === "text") {
      setPrompt("")
      localStorage.removeItem('workbench_prompt')
    } else {
      setFile(null)
    }

    try {
      const payload = {
        model_id: model,
        prompt: commonData.prompt, // Use captured prompt
        kind: creationType,
        params: parameterValues
      }

      const res: any = await api.post<any>("/jobs", payload)

      // 3. Start polling with real ID, atomically replacing the temp ID
      startPolling(res.id, commonData, tempId)

    } catch (err: any) {
      console.error(err)
      let errorMessage = t('workbench.toasts.unknownError');
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = (err as any).detail || (err as any).message || JSON.stringify(err);
        if (typeof errorMessage === 'object') {
          errorMessage = (errorMessage as any).message || JSON.stringify(errorMessage);
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      toast.error(t('workbench.toasts.genFailed'), { description: errorMessage })

      // 4. Mark optimistic generation as failed
      markAsFailed(tempId, errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const isBoth = m.category === 'both'
      const matchesCreation = m.category === creationType || isBoth
      if (!matchesCreation) return false
      if (inputType === 'image') {
        return m.capabilities?.some(cap =>
          CAPABILITY_SCHEMA[cap]?.requiredInputs.includes('init_image')
        )
      }
      return true
    })
  }, [models, creationType, inputType])

  useEffect(() => {
    if (filteredModels.length === 0) return
    const currentIsValid = filteredModels.some(m => m.id === model)
    if (currentIsValid) return
    if (creationType === 'image') {
      const flux = filteredModels.find(m => m.name.toLowerCase().includes("flux"))
      setModel(flux ? flux.id : filteredModels[0].id)
    } else {
      setModel(filteredModels[0].id)
    }
  }, [filteredModels, model, creationType])

  const isGenerateDisabled = () => {
    if (inputType === "text" && !prompt.trim()) return true
    if (inputType === "image" && !file) return true
    if (!model || modelsLoading) return true
    return modelParameters.filter(p => p.required).some(p => {
      const val = parameterValues[p.id]
      return val === null || val === undefined || val === ""
    })
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t('workbench.appTitle')}
        </h1>
        <p className="text-lg text-muted-foreground/80 font-medium">
          {t('workbench.appSubtitle')}
        </p>
      </div>

      {modelsError && (
        <Alert variant="destructive" className="glass-effect">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('workbench.errorLoading')}</AlertTitle>
          <AlertDescription>
            {modelsError}. {t('workbench.errorLoadingDesc')}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Unified Card */}
      <Card className="overflow-hidden border-0 shadow-2xl glass-effect premium-gradient">
        <CardContent className="p-0">
          <div className="relative">
            {/* Top Controls Bar */}
            <div className="absolute top-0 left-0 right-0 bg-background/40 backdrop-blur-xl border-b border-white/10 p-3 z-10 flex flex-wrap items-center gap-4">
              <CreationTypeToggle value={creationType} onChange={handleCreationTypeChange} />
              <InputTypeToggle value={inputType} onChange={setInputType} creationType={creationType} />
            </div>

            {/* Input Area */}
            <div className="relative w-full flex min-h-[400px]">

              {/* Left File Sidebar - Only visible if model has file inputs */}
              {modelParameters.some(p => p.type === 'image' || p.name?.includes('image') || p.name === 'mask') && (
                <div className="w-[120px] shrink-0 border-r border-white/10 bg-white/5 flex flex-col items-center gap-4 py-6 pt-20 overflow-y-auto custom-scrollbar">
                  {modelParameters
                    .filter(p => p.type === 'image' || p.name?.includes('image') || p.name === 'mask')
                    .map(param => (
                      <div key={param.id} className="flex flex-col items-center gap-2 px-2">
                        <div className="relative group">
                          <button
                            onClick={() => document.getElementById(`file-${param.id}`)?.click()}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border border-white/10 overflow-hidden ${parameterValues[param.id] ? 'bg-primary/20 border-primary/50' : 'bg-white/5 hover:bg-white/10'
                              }`}
                            title={param.label}
                          >
                            {parameterValues[param.id] ? (
                              // Show preview if it's a file object or string URL
                              typeof parameterValues[param.id] === 'object' ? (
                                <img src={URL.createObjectURL(parameterValues[param.id])} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-xs font-bold text-primary">FILE</div>
                              )
                            ) : (
                              <PlusIcon className="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
                            )}
                          </button>
                          {/* Floating Label */}
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap bg-black/50 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {param.label}
                          </span>
                        </div>
                        <input
                          id={`file-${param.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleParameterChange(param.id, file)
                          }}
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* Main Prompt Area */}
              <div className="flex-1 relative">
                <Textarea
                  id="main-prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={creationType === "image" ? t('workbench.describeImage') : t('workbench.describeVideo')}
                  className="w-full h-full resize-none bg-transparent border-0 focus-visible:ring-0 text-xl md:text-2xl p-8 pt-20 pb-36 font-medium placeholder:text-muted-foreground/40"
                />
                <div className="absolute top-20 right-8 flex gap-2">
                  {/* Clear Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="glass-effect hover:bg-white/20 transition-all font-semibold gap-2 text-muted-foreground hover:text-white"
                    onClick={handleClear}
                    title="Очистить"
                  >
                    <EraserIcon className="w-4 h-4" />
                    <span className="sr-only md:not-sr-only">Очистить</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="glass-effect hover:bg-white/20 transition-all font-semibold gap-2"
                    onClick={() => console.log("Enhancing prompt...")}
                  >
                    <SparklesIcon className="w-4 h-4 text-primary" />
                    {t('workbench.enhance')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-background/60 backdrop-blur-2xl border-t border-white/10 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="shrink-0">
                  <ModelSelector
                    value={model}
                    onChange={setModel}
                    creationType={creationType}
                    models={filteredModels}
                    loading={modelsLoading}
                  />
                </div>

                {/* Parameter List: Split into Primary (Inline) and Advanced (Popover) */}
                <div className="flex flex-wrap items-center gap-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                  {/* 1. Primary Params (Format, Aspect Ratio) */}
                  {modelParameters
                    .filter(p => !p.hidden && (p.name === 'format' || p.name === 'aspect_ratio' || p.group === 'format'))
                    .map(param => (
                      <ModelParameterControl
                        key={param.id}
                        parameter={param}
                        config={modelConfigs.find(c => c.parameter_id === param.id)}
                        value={parameterValues[param.id]}
                        onChange={(val) => handleParameterChange(param.id, val)}
                        disabled={loading}
                        compact
                      />
                    ))}

                  {/* 2. Advanced Params (Popover) */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-primary">
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 glass-effect border-white/10" side="top" align="start">
                      <div className="p-3 border-b border-white/5 bg-white/5 font-semibold text-sm">
                        Advanced Settings
                      </div>
                      <ScrollArea className="h-[300px] p-4">
                        <div className="space-y-4">
                          {modelParameters
                            .filter(p => !p.hidden &&
                              !(p.type === 'image' || p.name?.includes('image') || p.name === 'mask') &&
                              !(p.name === 'format' || p.name === 'aspect_ratio' || p.group === 'format')
                            )
                            .map(param => (
                              <ModelParameterControl
                                key={param.id}
                                parameter={param}
                                config={modelConfigs.find(c => c.parameter_id === param.id)}
                                value={parameterValues[param.id]}
                                onChange={(val) => handleParameterChange(param.id, val)}
                                disabled={loading}
                                compact={false} // Full view for advanced settings
                              />
                            ))}

                          {/* Fallback if no advanced params */}
                          {modelParameters.filter(p => !p.hidden &&
                            !(p.type === 'image' || p.name?.includes('image') || p.name === 'mask') &&
                            !(p.name === 'format' || p.name === 'aspect_ratio' || p.group === 'format')
                          ).length === 0 && (
                              <div className="text-center text-muted-foreground text-xs py-4">
                                No advanced settings available
                              </div>
                            )}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="md:ml-auto">
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
        </CardContent>
      </Card>

      {/* Library Widget */}
      <div className="pt-4">
        <LibraryWidget
          refreshTrigger={refreshLibrary}
          newGeneration={lastGeneration}
          activeGenerations={activeGenerations}
          onUsePrompt={handleUsePrompt}
        />
      </div>

      {/* Community Gallery */}
      <Card className="border-0 shadow-xl glass-effect">
        <CardContent className="pt-8">
          <CommunityGallery onUsePrompt={handleUsePrompt} />
        </CardContent>
      </Card>
    </div>
  )
}