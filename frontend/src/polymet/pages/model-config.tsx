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
      setDescription(m.description || "") // Description might not be in backend model yet? AIModelRead doesn't have description.
      setCredits(m.credits?.toString() || "5")
      setIsActive(m.is_active)

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
        is_active: isActive
        // Description is not on backend yet
      })
      toast({ title: "Changes saved" })
    } catch (e) {
      toast({ title: "Failed to save", variant: "destructive" })
    } finally {
      setSaving(false)
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
              {model.provider} / {model.model_ref}
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
        </div>
      </div>
    </div>
  )
}