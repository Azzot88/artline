import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { apiService } from "@/polymet/data/api-service"
import { AIModel } from "@/polymet/data/models-data"
import { ModelPerformanceStats } from "@/polymet/data/api-types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeftIcon,
  SaveIcon,
  RefreshCwIcon,
  FileJsonIcon,
  DownloadIcon,
  ActivityIcon,
  RefreshCcw
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useModelConfig } from "@/polymet/hooks/use-model-config"
import { ModelParametersGroup } from "@/polymet/components/model-parameters-group"

export function ModelConfig() {
  const { modelId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [model, setModel] = useState<AIModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchingSchema, setFetchingSchema] = useState(false)
  const [stats, setStats] = useState<ModelPerformanceStats | null>(null)
  const [syncingStats, setSyncingStats] = useState(false)

  // Basic Form State
  const [displayName, setDisplayName] = useState("")
  const [description, setDescription] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [credits, setCredits] = useState("5")
  const [isActive, setIsActive] = useState(false)
  const [modelRef, setModelRef] = useState("")

  // Advanced State Hook
  const {
    parameters,
    configs,
    values,
    capabilities,
    updateValue,
    updateConfig,
    toggleCapability,
    loadSchema,
    resetValues,
    setParameters,
    setConfigs,
    setValues,
    setCapabilities
  } = useModelConfig({ modelId: modelId || "" })

  useEffect(() => {
    if (!modelId) return
    loadModel(modelId)
  }, [modelId])

  async function loadModel(id: string) {
    try {
      setLoading(true)
      const res = await apiService.getAdminModel(id)
      const m = (res as any).model || res
      setModel(m)

      // Init form
      setDisplayName(m.display_name || "")
      setDescription(m.description || "")
      setCoverImageUrl(m.cover_image_url || "")
      setCredits(m.credits_per_generation?.toString() || m.credits?.toString() || "5")
      setIsActive(m.is_active)
      setModelRef(m.model_ref || "")

      // Load UI Config (Legacy or New)
      let uiConfig = m.ui_config || {}
      if (typeof uiConfig === 'string') {
        try { uiConfig = JSON.parse(uiConfig) } catch { }
      }

      // Load Parameters (Backend Norm Caps)
      let caps = m.normalized_caps_json
      if (typeof caps === 'string') {
        try { caps = JSON.parse(caps) } catch { }
      }

      // Restore State
      if (caps && caps._parameters) {
        // New Format: stored in normalized_caps_json._parameters
        setParameters(caps._parameters)
      }

      if (uiConfig.parameter_configs) {
        setConfigs(uiConfig.parameter_configs)
      }

      if (uiConfig.default_values) {
        setValues(uiConfig.default_values)
      } else {
        // Try to init values from params if no defaults saved
        if (caps && caps._parameters) {
          const defaults: any = {}
          caps._parameters.forEach((p: any) => {
            if (p.default_value !== null) defaults[p.id] = p.default_value
          })
          setValues(defaults)
        }
      }

      // Restore Capabilities
      if (m.capabilities) {
        setCapabilities(m.capabilities)
      } else if (m.modes) {
        setCapabilities(m.modes)
      }

    } catch (e) {
      console.error(e)
      toast({ title: "Error loading model", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleFetchSchema() {
    if (!modelRef) {
      toast({ title: "Enter a Model Ref first", variant: "destructive" })
      return
    }
    setFetchingSchema(true)
    try {
      const res = await apiService.fetchModelSchema(modelRef)

      // Process Schema
      // The API returns the raw schema or normalized caps. 
      // Assuming it returns the raw schema in a field like 'schema' or 'openapi_schema'
      // If the backend already normalizes, we might need to adjust.
      // For now, let's assume we get the raw Replicate schema structure in `res.schema` or `res` itself.

      const rawSchema = res.raw_response || res.schema || res // Adjust based on actual API response

      loadSchema(rawSchema, modelRef)

      toast({ title: "Schema fetched and parsed successfully" })

      if (!displayName && res.schema?.title) {
        setDisplayName(res.schema.title)
      }
    } catch (e: any) {
      console.error(e)
      toast({ title: "Failed to fetch schema", description: e.message || "Unknown error", variant: "destructive" })
    } finally {
      setFetchingSchema(false)
    }
  }



  async function handleAnalyzeModel() {
    if (!modelRef) {
      toast({ title: "Enter a Model Ref first", variant: "destructive" })
      return
    }
    setFetchingSchema(true)
    try {
      const res = await apiService.analyzeModel(modelRef)
      console.log("Analyze Result:", res)

      // Use the full schema from the deep analysis
      if (res.full_schema) {
        loadSchema(res.full_schema, modelRef)
        toast({ title: "Deep Analysis Complete", description: `Parsed ${Object.keys(res.inputs || {}).length} inputs.` })
        if (!displayName && res.full_schema.title) setDisplayName(res.full_schema.title)
      } else {
        toast({ title: "Analysis complete but no schema found", variant: "warning" })
      }
    } catch (e: any) {
      console.error(e)
      toast({ title: "Analysis failed", description: e.message || "Unknown error", variant: "destructive" })
    } finally {
      setFetchingSchema(false)
    }
  }

  async function handleSave() {
    if (!modelId) return
    try {
      setSaving(true)

      // Construct Payload
      const payload = {
        display_name: displayName,
        description: description,
        credits: parseInt(credits),
        is_active: isActive,
        cover_image_url: coverImageUrl,
        model_ref: modelRef,

        // Save Configs and Defaults in ui_config
        capabilities: capabilities,
        ui_config: {
          parameter_configs: configs,
          default_values: values,
          // Legacy for compatibility if needed
          parameters: configs.reduce((acc, c) => ({ ...acc, [c.parameter_id]: c }), {})
        },

        // Save Parameters definition in normalized_caps_json for validation/parsing on backend
        normalized_caps_json: {
          _parameters: parameters, // Store our parsed structure
          // Also store legacy simple input list if needed for backend compat
          inputs: parameters.map(p => ({
            name: p.name,
            type: p.type,
            required: p.required,
            default: p.default_value
          }))
        }
      }

      await apiService.updateModel(modelId, payload)
      toast({ title: "Changes saved successfully" })
    } catch (e) {
      toast({ title: "Failed to save", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handleSyncStats() {
    if (!modelId) return
    setSyncingStats(true)
    try {
      const s = await apiService.syncModelStats(modelId)
      setStats(s)
      toast({ title: "Stats synced successfully" })
    } catch (e) {
      console.error(e)
      toast({ title: "Failed to sync stats", variant: "destructive" })
    } finally {
      setSyncingStats(false)
    }
  }

  async function handleDelete() {
    if (!modelId || !confirm("Delete this model permanently?")) return
    try {
      await apiService.deleteModel(modelId)
      navigate("/admin")
      toast({ title: "Model deleted" })
    } catch (e) {
      toast({ title: "Failed to delete", variant: "destructive" })
    }
  }

  if (loading) return <div className="p-8 flex items-center justify-center h-96">Loading...</div>

  if (!model) {
    return (
      <div className="space-y-6 container mx-auto p-8">
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold">Model not found</h3>
          <Link to="/admin">
            <Button variant="outline" className="mt-4">Back to Admin</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-6 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-8 px-8 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin?tab=models">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {model.display_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {model.provider} / {modelRef}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileJsonIcon className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Model Configuration Export</DialogTitle>
              </DialogHeader>
              <pre className="bg-muted p-4 rounded-md text-xs font-mono whitespace-pre-wrap overflow-auto max-h-96">
                {JSON.stringify({
                  parameters,
                  configs,
                  values
                }, null, 2)}
              </pre>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={resetValues}>
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Reset Defaults
          </Button>

          <Button onClick={handleSave} disabled={saving}>
            <SaveIcon className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Replicate Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Parameter Schema</CardTitle>
              <CardDescription>
                Configure how this model's inputs are exposed to users.
                Fetch schema from Replicate to auto-populate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4 items-end bg-muted/20 p-4 rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label>Replicate Model ID (owner/name)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={modelRef}
                      onChange={e => setModelRef(e.target.value)}
                      placeholder="stability-ai/sdxl"
                      className="font-mono"
                    />
                    <div className="text-xs text-muted-foreground self-center whitespace-nowrap">
                      {parameters.length > 0 ? `${parameters.length} params loaded` : "No schema loaded"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleFetchSchema} disabled={fetchingSchema} variant="secondary">
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    {fetchingSchema ? "Fetching..." : "Fetch 1.0"}
                  </Button>
                  <Button onClick={handleAnalyzeModel} disabled={fetchingSchema} variant="default">
                    <ActivityIcon className="w-4 h-4 mr-2" />
                    Fetch 2.0
                  </Button>
                </div>
              </div>

              {parameters.length > 0 ? (
                <ModelParametersGroup
                  parameters={parameters}
                  configs={configs}
                  values={values}
                  onChange={updateValue}
                  onConfigChange={updateConfig}
                />
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                  Enter a model reference and click "Fetch Schema" to configure parameters.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Basic Info */}
        <div className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle>Capabilities</CardTitle>
              <CardDescription>Select supported generation modes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {[
                  "text-to-image",
                  "image-to-image",
                  "text-to-video",
                  "image-to-video",
                  "text-to-audio",
                  "inpainting",
                  "upscale"
                ].map(cap => {
                  const isEnabled = capabilities?.includes(cap) || false
                  return (
                    <div key={cap} className={`flex items-center space-x-2 transition-opacity ${isEnabled ? "opacity-100" : "opacity-50"}`}>
                      <Checkbox
                        id={`cap-${cap}`}
                        checked={isEnabled}
                        onCheckedChange={() => toggleCapability(cap)}
                      />
                      <label
                        htmlFor={`cap-${cap}`}
                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${!isEnabled && "line-through text-muted-foreground"}`}
                      >
                        {cap.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                      </label>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSyncStats} disabled={syncingStats}>
                {syncingStats ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <ActivityIcon className="h-3 w-3" />}
              </Button>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Avg Time (24h)</div>
                      <div className="font-mono font-medium">{stats.avg_predict_time_24h ? `${stats.avg_predict_time_24h.toFixed(1)}s` : "-"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Avg Time (7d)</div>
                      <div className="font-mono font-medium">{stats.avg_predict_time_7d ? `${stats.avg_predict_time_7d.toFixed(1)}s` : "-"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Runs (7d)</div>
                      <div className="font-mono font-medium">{stats.total_runs_7d}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Est. Cost</div>
                      <div className="font-mono font-medium text-green-600">
                        {stats.est_cost_per_run ? `$${stats.est_cost_per_run.toFixed(4)}` : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Button variant="outline" size="sm" onClick={handleSyncStats} disabled={syncingStats}>
                    Sync Stats
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <div className="relative">
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter model description..."
                  />
                  {/* Auto-fill from schema option? */}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Model Logo / Cover</Label>
                <div className="flex items-center gap-4">
                  {coverImageUrl ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-muted group">
                      <img src={coverImageUrl} alt="Logo" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setCoverImageUrl("")}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/30 text-muted-foreground">
                      <span className="text-[10px]">No Logo</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      className="text-xs"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const res = await apiService.uploadModelImage(file)
                          setCoverImageUrl(res.url)
                          toast({ title: "Logo uploaded" })
                        } catch (err) {
                          toast({ title: "Upload failed", variant: "destructive" })
                        }
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Upload a PNG/JPG. Will be stored in S3.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={isActive ? "active" : "inactive"} onValueChange={v => setIsActive(v === "active")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cost (Credits/run)</Label>
                <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Metadata</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono text-xs">{model.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{model.created_at ? new Date(model.created_at).toLocaleDateString() : "-"}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-6 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                Delete Model
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}