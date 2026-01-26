import { useState, useEffect, useRef } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { apiService } from "@/polymet/data/api-service"
import { AIModel } from "@/polymet/data/models-data"
import { ModelPerformanceStats } from "@/polymet/data/api-types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    ArrowLeftIcon, SaveIcon, RefreshCwIcon, FileJsonIcon
} from "lucide-react"

import { useModelConfig } from "@/polymet/hooks/use-model-config"
import { ModelParametersGroup } from "@/polymet/components/model-parameters-group"

// Sub-Components
import { ModelConfigLayout } from "./layout"
import { BasicSettings } from "./basic-settings"
import { CapabilitiesCard } from "./capabilities-card"
import { SchemaConnector } from "./schema-connector"

export function ModelConfig() {
    const { modelId } = useParams()
    const navigate = useNavigate()

    // State
    const [model, setModel] = useState<AIModel | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [fetchingSchema, setFetchingSchema] = useState(false)

    // Form State
    const [displayName, setDisplayName] = useState("")
    const [description, setDescription] = useState("")
    const [coverImageUrl, setCoverImageUrl] = useState("")
    const [isActive, setIsActive] = useState(false)
    const [modelRef, setModelRef] = useState("")
    // Note: credits is number in new components, simplified handling
    const [credits, setCredits] = useState("5")

    // Advanced Hook
    const {
        parameters, configs, values, capabilities,
        updateValue, updateConfig, toggleCapability,
        loadSchema, resetValues,
        setParameters, setConfigs, setValues, setCapabilities
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

            // Init Fields
            setDisplayName(m.display_name || "")
            setDescription(m.description || "")
            setCoverImageUrl(m.cover_image_url || "")
            setCredits(m.credits_per_generation?.toString() || "5")
            setIsActive(m.is_active)
            setModelRef(m.model_ref || "")

            // Init Hook Data (Logic ported from old mono file)
            let uiConfig = m.ui_config || {}
            let caps = m.normalized_caps_json || {}

            // Parsers...
            if (typeof uiConfig === 'string') try { uiConfig = JSON.parse(uiConfig) } catch { }
            if (typeof caps === 'string') try { caps = JSON.parse(caps) } catch { }

            // A: Params
            if (caps._parameters) setParameters(caps._parameters)

            // B: Configs
            if (uiConfig.parameter_configs) setConfigs(uiConfig.parameter_configs)

            // C: Values
            if (uiConfig.default_values) {
                setValues(uiConfig.default_values)
            } else if (caps._parameters) {
                // Auto-init defaults from params
                const d: any = {}
                caps._parameters.forEach((p: any) => { if (p.default_value !== null) d[p.id] = p.default_value })
                setValues(d)
            }

            // D: Caps
            if (m.capabilities) setCapabilities(m.capabilities)
            else if (m.modes) setCapabilities(m.modes)

        } catch (e) {
            console.error(e)
            toast.error("Error loading model")
        } finally {
            setLoading(false)
        }
    }

    // File Upload Handlers
    async function handleUploadImage(file: File) {
        try {
            const res = await apiService.uploadModelImage(file)
            setCoverImageUrl(res.url)
            toast.success("Logo uploaded")
        } catch (e) {
            toast.error("Upload failed")
        }
    }

    // Schema Handlers
    async function handleFetch1() {
        if (!modelRef) return toast.error("Enter Model Ref")
        setFetchingSchema(true)
        try {
            const res = await apiService.fetchModelSchema(modelRef)
            const raw = res.raw_response || res.schema || res
            loadSchema(raw, modelRef)
            toast.success("Schema configured (v1)")
            if (!displayName && res.schema?.title) setDisplayName(res.schema.title)
        } catch (e: any) {
            toast.error("Fetch failed: " + e.message)
        } finally {
            setFetchingSchema(false)
        }
    }

    async function handleFetch2() {
        if (!modelRef) return toast.error("Enter Model Ref")
        setFetchingSchema(true)
        try {
            const res = await apiService.analyzeModel(modelRef)
            if (res.full_schema) {
                loadSchema(res.full_schema, modelRef)
                toast.success("Deep Analysis Complete")
                if (!displayName && res.full_schema.title) setDisplayName(res.full_schema.title)
            } else {
                toast.warning("Analysis done but no schema found")
            }
        } catch (e: any) {
            toast.error("Analysis failed: " + e.message)
        } finally {
            setFetchingSchema(false)
        }
    }

    async function handleSave() {
        if (!modelId) return
        try {
            setSaving(true)
            const payload = {
                display_name: displayName,
                description,
                credits_per_generation: parseInt(credits),
                is_active: isActive,
                cover_image_url: coverImageUrl,
                model_ref: modelRef,
                capabilities,
                ui_config: {
                    parameter_configs: configs,
                    default_values: values
                },
                normalized_caps_json: {
                    _parameters: parameters,
                    inputs: parameters.map(p => ({
                        name: p.name, type: p.type, required: p.required, default: p.default_value
                    }))
                }
            }
            await apiService.updateModel(modelId, payload)
            toast.success("Model saved successfully")
        } catch (e) {
            toast.error("Save failed")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Editor...</div>
    if (!model) return <div className="p-8">Model not found</div>

    return (
        <ModelConfigLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/models">
                            <Button variant="ghost" size="icon"><ArrowLeftIcon className="w-5 h-5" /></Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">{displayName || "New Model"}</h1>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">{model.provider}</Badge>
                                <span className="font-mono">{modelRef}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={resetValues} size="sm">
                            <RefreshCwIcon className="w-4 h-4 mr-2" /> Reset Defaults
                        </Button>
                        <Button onClick={handleSave} disabled={saving} size="sm">
                            <SaveIcon className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            }
            main={
                <>
                    <SchemaConnector
                        modelRef={modelRef}
                        setModelRef={setModelRef}
                        onFetch1={handleFetch1}
                        onFetch2={handleFetch2}
                        isFetching={fetchingSchema}
                        hasParams={parameters.length > 0}
                    />

                    {/* Parameter Editor */}
                    {parameters.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Parameter Configuration</h3>
                            <ModelParametersGroup
                                parameters={parameters}
                                configs={configs}
                                values={values}
                                onChange={updateValue}
                                onConfigChange={updateConfig}
                            />
                        </div>
                    )}
                </>
            }
            sidebar={
                <>
                    <BasicSettings
                        displayName={displayName}
                        setDisplayName={setDisplayName}
                        description={description}
                        setDescription={setDescription}
                        coverImageUrl={coverImageUrl}
                        setCoverImageUrl={setCoverImageUrl}
                        onUploadImage={handleUploadImage}
                    />
                    <CapabilitiesCard
                        capabilities={capabilities}
                        toggleCapability={toggleCapability}
                    />
                </>
            }
        />
    )
}
