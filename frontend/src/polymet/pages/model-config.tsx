import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { apiService } from "@/polymet/data/api-service"
import { AIModel } from "@/polymet/data/models-data" // Keep this type for now or switch to api-types
import {
  getModelParameters,
  getModelParameterConfigs,
  getModelCostSignals
} from "@/polymet/data/model-parameters-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeftIcon,
  SaveIcon,
  TestTubeIcon,
  CoinsIcon,
  ImageIcon,
  VideoIcon,
  AlertCircleIcon,
  ClockIcon
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ModelConfig() {
  const { modelId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [model, setModel] = useState<AIModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [displayName, setDisplayName] = useState("")
  const [description, setDescription] = useState("")
  const [credits, setCredits] = useState("5")
  const [isActive, setIsActive] = useState(false)

  // Advanced Config state
  const [modelRef, setModelRef] = useState("")
  const [capabilities, setCapabilities] = useState<any>(null)
  const [uiConfig, setUiConfig] = useState<any>({})
  const [fetchingSchema, setFetchingSchema] = useState(false)

  // Advanced config from params (mocked for now as we transition)
  const parameters = modelId ? getModelParameters(modelId) : []
  const costSignals = modelId ? getModelCostSignals(modelId) : null

  useEffect(() => {
    if (!modelId) return
    loadModel(modelId)
  }, [modelId])

  async function loadModel(id: string) {
    try {
      setLoading(true)
      const res = await apiService.getModel(id)
      // The API returns { model: ... } or just the model depending on endpoint. 
      // apiService.getModel returns GetModelResponse { model: AIModel }
      // Wait, apiService.getModel calls /models/{id}, which returns AIModel directly based on my router implementation?
      // Let's check router... router returns `m` (AIModelRead).
      // apiService.getModel definition in api-types says { model: AIModel }. 
      // Actually my backend returns just the model object. The api-service types might be slightly off or specific to an envelope.
      // I'll assume it returns the model directly or I'll inspect. 
      // SAFEST: check if res.model exists, otherwise use res.

      const m = (res as any).model || res
      setModel(m)

      // Init form
      setDisplayName(m.display_name || "")
      setDescription(m.description || "")
      setCredits(m.credits_per_generation?.toString() || m.credits?.toString() || "5")
      setIsActive(m.is_active)
      setModelRef(m.model_ref || "")
      setUiConfig(m.ui_config || {})

      // If we have normalized caps, load them (future proofing)
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
      // res contains { raw_response, normalized_caps }
      setCapabilities(res.normalized_caps)
      toast({ title: "Schema fetched successfully" })

      // Auto-populate display name if empty
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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="space-y-2">
                <Label>Cost (Credits per run)</Label>
                <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="lg" onClick={handleSave} disabled={saving}>
              <SaveIcon className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Info</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm">
                <p><strong>ID:</strong> {model.id}</p>
                <p><strong>Created:</strong> {model.created_at ? new Date(model.created_at).toLocaleDateString() : "-"}</p>
              </div>
            </CardContent>
          </Card>

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
                  {fetchingSchema ? "Fetching..." : "Fetch"}
                </Button>
              </div>

              {capabilities && (
                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm">Detected Inputs ({capabilities.inputs.length})</h4>
                    <Badge variant="outline">Schema Loaded</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
                    {capabilities.inputs.map((input: any) => {
                      const isVisible = uiConfig?.hidden_inputs ? !uiConfig.hidden_inputs.includes(input.name) : true

                      return (
                        <div key={input.name} className="flex items-center justify-between p-2 hover:bg-muted rounded text-sm group">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={isVisible}
                              onCheckedChange={(checked) => {
                                const currentHidden = uiConfig?.hidden_inputs || []
                                let newHidden

                                if (!checked) {
                                  // Hide it
                                  newHidden = [...currentHidden, input.name]
                                } else {
                                  // Show it (remove from hidden)
                                  newHidden = currentHidden.filter((n: string) => n !== input.name)
                                }

                                setUiConfig({
                                  ...uiConfig,
                                  hidden_inputs: newHidden
                                })
                              }}
                            />
                            <div>
                              <div className="font-medium">{input.name}</div>
                              <div className="text-xs text-muted-foreground">{input.label} ({input.type})</div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                            {input.default !== undefined ? `Default: ${input.default}` : "No default"}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
            )}
                </CardContent>
        </Card>
        </div>
      </div>
    </div >
  )
}