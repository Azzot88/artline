import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { apiService } from "@/polymet/data/api-service"
import { AIModel } from "@/polymet/data/models-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeftIcon,
  SaveIcon,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ParameterConfigEditor, ExposureConfig } from "@/polymet/components/parameter-config-editor"

export function ModelConfig() {
  const { modelId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [model, setModel] = useState<AIModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [displayName, setDisplayName] = useState("")
  const [credits, setCredits] = useState("5")
  const [isActive, setIsActive] = useState(false)

  // Advanced Config state
  const [modelRef, setModelRef] = useState("")
  const [capabilities, setCapabilities] = useState<any>(null)

  // Unified Config State
  type UIConfigState = {
    hidden_inputs: string[]
    defaults: Record<string, any>
    constraints: Record<string, any>
    custom_labels: Record<string, string>
  }
  const [uiConfig, setUiConfig] = useState<UIConfigState>({
    hidden_inputs: [],
    defaults: {},
    constraints: {},
    custom_labels: {}
  })

  const [fetchingSchema, setFetchingSchema] = useState(false)

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
      setCredits(m.credits_per_generation?.toString() || m.credits?.toString() || "5")
      setIsActive(m.is_active)
      setModelRef(m.model_ref || "")

      // Load UI config with fallbacks
      const savedConfig = m.ui_config || {}
      setUiConfig({
        hidden_inputs: savedConfig.hidden_inputs || [],
        defaults: savedConfig.defaults || {},
        constraints: savedConfig.constraints || {},
        custom_labels: savedConfig.custom_labels || {}
      })

      if (m.normalized_caps_json) {
        setCapabilities(m.normalized_caps_json)
      }

    } catch (e) {
      console.error(e)
      toast({ title: "Error loading model", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!modelId) return
    try {
      setSaving(true)
      await apiService.updateModel(modelId, {
        display_name: displayName,
        credits: parseInt(credits),
        is_active: isActive,
        model_ref: modelRef,
        ui_config: uiConfig,
        normalized_caps_json: capabilities
      })
      toast({ title: "Changes saved" })
    } catch (e) {
      toast({ title: "Failed to save", variant: "destructive" })
    } finally {
      setSaving(false)
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
      setCapabilities(res.normalized_caps)
      toast({ title: "Schema fetched successfully" })

      if (!displayName && res.normalized_caps.title) {
        setDisplayName(res.normalized_caps.title)
      }
    } catch (e: any) {
      console.error(e)
      toast({ title: "Failed to fetch schema", description: e.message || "Unknown error", variant: "destructive" })
    } finally {
      setFetchingSchema(false)
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

  // Helper to extract config for a specific parameter
  function getParamConfig(paramName: string): ParameterConfig {
    return {
      hidden: uiConfig.hidden_inputs.includes(paramName),
      default: uiConfig.defaults[paramName],
      min: uiConfig.constraints[paramName]?.min,
      max: uiConfig.constraints[paramName]?.max,
      allowed_values: uiConfig.constraints[paramName]?.allowed_values,
      custom_label: uiConfig.custom_labels[paramName]
    }
  }

  // Helper to update config for a specific parameter
  function updateParamConfig(paramName: string, newConfig: ParameterConfig) {
    setUiConfig(prev => {
      const next = { ...prev }

      // HIDDEN
      if (newConfig.hidden) {
        if (!next.hidden_inputs.includes(paramName)) next.hidden_inputs = [...next.hidden_inputs, paramName]
      } else {
        next.hidden_inputs = next.hidden_inputs.filter(n => n !== paramName)
      }

      // DEFAULTS
      if (newConfig.default !== undefined) {
        next.defaults = { ...next.defaults, [paramName]: newConfig.default }
      } else {
        const { [paramName]: _, ...rest } = next.defaults
        next.defaults = rest
      }

      // CUSTOM LABELS
      if (newConfig.custom_label) {
        next.custom_labels = { ...next.custom_labels, [paramName]: newConfig.custom_label }
      } else {
        const { [paramName]: _, ...rest } = next.custom_labels
        next.custom_labels = rest
      }

      // CONSTRAINTS (Nested)
      const constraints: any = {}
      if (newConfig.min !== undefined) constraints.min = newConfig.min
      if (newConfig.max !== undefined) constraints.max = newConfig.max
      if (newConfig.allowed_values !== undefined) constraints.allowed_values = newConfig.allowed_values

      if (Object.keys(constraints).length > 0) {
        next.constraints = { ...next.constraints, [paramName]: constraints }
      } else {
        const { [paramName]: _, ...rest } = next.constraints
        next.constraints = rest
      }

      return next
    })
  }

  if (loading) return <div className="p-8">Loading...</div>

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
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {model.display_name}
            </h1>
            <p className="text-muted-foreground">
              {model.provider} / {modelRef}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>Delete Model</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Replicate Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Model Parameters</CardTitle>
              <CardDescription>Fetch schema from Replicate to configure inputs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Model Ref (owner/name)</Label>
                  <Input value={modelRef} onChange={e => setModelRef(e.target.value)} placeholder="stability-ai/sdxl" />
                </div>
                <Button onClick={handleFetchSchema} disabled={fetchingSchema} variant="secondary">
                  {fetchingSchema ? "Fetching..." : "Fetch Schema"}
                </Button>
              </div>

              {capabilities && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm">Detected Inputs ({capabilities.inputs.length})</h4>
                    <Badge variant="outline">Schema Loaded</Badge>
                  </div>

                  {/* Parameter Editors List */}
                  <div className="space-y-2">
                    {capabilities.inputs.map((input: any) => (
                      <ParameterConfigEditor
                        key={input.name}
                        parameter={input}
                        config={getParamConfig(input.name)}
                        onChange={(newConfig) => updateParamConfig(input.name, newConfig)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Basic Info */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
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
                  <Label>Cost (Credits per run)</Label>
                  <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4">
              <Button size="lg" className="w-full" onClick={handleSave} disabled={saving}>
                <SaveIcon className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Info</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm">
                <p><strong>ID:</strong> {model.id}</p>
                <p><strong>Created:</strong> {model.created_at ? new Date(model.created_at).toLocaleDateString() : "-"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  )
}