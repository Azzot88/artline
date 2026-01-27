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
import { PlusIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { AlertCircle } from "lucide-react"
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
  const { startPolling, anyPolling, activeGenerations } = useJobPolling({
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

  // Effect to sync Spec -> Internal State
  useEffect(() => {
    if (!selectedModel) {
      setModelParameters([])
      setModelConfigs([])
      return
    }

    if (spec) {
      // Phase 3 Logic: Use Spec
      const params = spec.parameters.filter(p => !p.hidden)
      // Convert to compatible format
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t('workbench.toasts.enterPrompt'))
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

      const res: any = await api.post<any>("/jobs", payload)

      const aspect = creationType === 'image' ? (parameterValues['format'] === 'landscape' ? 1024 / 576 : parameterValues['format'] === 'portrait' ? 576 / 1024 : 1) : 16 / 9;
      const width = creationType === 'image' ? (parameterValues['format'] === 'landscape' ? 1024 : parameterValues['format'] === 'portrait' ? 576 : 1024) : 1920;
      const height = creationType === 'image' ? (parameterValues['format'] === 'landscape' ? 576 : parameterValues['format'] === 'portrait' ? 1024 : 1024) : 1080;

      // Optimistic UI logic could go here, but useJobPolling handles the real state
      // toast.info("Generation started...")
      startPolling(res.id, {
        prompt: prompt,
        kind: creationType,
        width: width,
        height: height,
        model_name: selectedModel?.name,
        input_type: inputType,
        format: parameterValues['format'] || 'square',
        resolution: parameterValues['resolution'] || '1080'
      })

      if (inputType === "text") {
        setPrompt("")
        localStorage.removeItem('workbench_prompt')
      } else {
        setFile(null)
      }
    } catch (err: any) {
      console.error(err)
      console.error(err)
      let errorMessage = t('workbench.toasts.unknownError');
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        // Handle API error objects containing detail or message
        errorMessage = (err as any).detail || (err as any).message || JSON.stringify(err);
        // Handle specific object format {code: ..., message: ...}
        if (typeof errorMessage === 'object') {
          errorMessage = (errorMessage as any).message || JSON.stringify(errorMessage);
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      toast.error(t('workbench.toasts.genFailed'), { description: errorMessage })
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
            {inputType === "text" ? (
              <div className="relative w-full">
                <Textarea
                  id="main-prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={creationType === "image" ? t('workbench.describeImage') : t('workbench.describeVideo')}
                  className="w-full min-h-[400px] resize-none bg-transparent border-0 focus-visible:ring-0 text-xl md:text-2xl p-8 pt-20 pb-36 font-medium placeholder:text-muted-foreground/40"
                />
                <div className="absolute top-20 right-8">
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
            ) : (
              <div className="w-full min-h-[400px] p-8 pt-20 pb-36 flex flex-col items-center justify-center relative">
                <button
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="group flex flex-col items-center gap-4 p-12 rounded-3xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlusIcon className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-lg font-semibold text-muted-foreground">{t('workbench.describeImage')}</span>
                </button>
                <input id="file-input" type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {file && <p className="mt-4 text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">{file.name}</p>}
              </div>
            )}

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

                <div className="flex flex-wrap gap-2">
                  {modelParameters.slice(0, 3).map(param => (
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
                </div>

                <div className="md:ml-auto">
                  <GenerateButton
                    credits={modelCredits}
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled()}
                    loading={loading || anyPolling}
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
          onUsePrompt={(text) => {
            setPrompt(prev => {
              const spacer = prev.trim().length > 0 ? "\n" : ""
              return prev + spacer + text
            })
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </div>

      {/* Community Gallery */}
      <Card className="border-0 shadow-xl glass-effect">
        <CardContent className="pt-8">
          <CommunityGallery />
        </CardContent>
      </Card>
    </div>
  )
}