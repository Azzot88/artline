
import React, { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
// Removing react-query import
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useModel } from "@/polymet/hooks/use-model"
import { useAuth } from "@/polymet/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from "@/components/ui/resizable"
import {
    ArrowLeft,
    Save,
    RefreshCw,
    Eye
} from "lucide-react"

import { NormalizationBuilder } from "@/polymet/components/admin/normalization/normalization-builder"
import { ModelParameterControl } from "@/polymet/components/model-parameter-control"
import { useDebounce } from "@/polymet/hooks/use-debounce"
import { toast } from "sonner"

export function NormalizationPage() {
    const { modelId } = useParams()
    const navigate = useNavigate()
    const { token } = useAuth()

    // Local State
    const [model, setModel] = useState<any>(null)
    const [isLoadingModel, setIsLoadingModel] = useState(true)
    const [config, setConfig] = useState<any>({})
    const [previewSpec, setPreviewSpec] = useState<any>(null)
    const [isPreviewLoading, setIsPreviewLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // 1. Fetch Model Data
    useEffect(() => {
        if (!modelId || !token) return

        let cancelled = false

        async function fetchModel() {
            try {
                setIsLoadingModel(true)
                const res = await fetch(`/api/admin/models/${modelId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (!res.ok) throw new Error("Failed to load model")
                const data = await res.json()

                if (!cancelled) {
                    setModel(data)
                    // Sync config
                    if (data.ui_config) {
                        setConfig(data.ui_config || {})
                    }
                }
            } catch (err) {
                console.error(err)
                toast.error("Failed to load model")
            } finally {
                if (!cancelled) setIsLoadingModel(false)
            }
        }

        fetchModel()
        return () => { cancelled = true }
    }, [modelId, token])

    // 2. Preview Logic (Debounced)
    const debouncedConfig = useDebounce(config, 500)

    useEffect(() => {
        if (!model?.raw_schema_json || !token) return

        let cancelled = false

        async function fetchPreview() {
            try {
                setIsPreviewLoading(true)
                const res = await fetch('/api/admin/models/preview-normalization', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        raw_schema: model.raw_schema_json,
                        normalization_config: debouncedConfig,
                        provider_id: model.provider
                    })
                })
                if (!res.ok) throw new Error("Preview failed")
                const data = await res.json()

                if (!cancelled) {
                    setPreviewSpec(data)
                }
            } catch (err) {
                console.error(err)
                // Silent fail for preview is usually better than spamming toasts
            } finally {
                if (!cancelled) setIsPreviewLoading(false)
            }
        }

        fetchPreview()
        return () => { cancelled = true }
    }, [model, debouncedConfig, token])

    // 3. Save Handler
    const handleSave = async () => {
        if (!modelId || !token) return

        try {
            setIsSaving(true)
            const res = await fetch(`/api/admin/models/${modelId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ui_config: config
                })
            })
            if (!res.ok) throw new Error("Save failed")

            toast.success("Normalization rules saved")
            // Optionally refetch model or update local state if needed
        } catch (err) {
            console.error(err)
            toast.error("Failed to save rules")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoadingModel) return <div className="p-8">Loading...</div>

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <div className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/models')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="font-semibold text-lg leading-none">
                            {model?.display_name || "Unknown Model"}
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">Normalization Workshop</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? "Saving..." : "Save Rules"}
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal">

                    {/* BUILDER PANEL */}
                    <ResizablePanel defaultSize={60} minSize={30}>
                        <NormalizationBuilder
                            rawSchema={model?.raw_schema_json}
                            config={config}
                            onChange={setConfig}
                        />
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* PREVIEW PANEL */}
                    <ResizablePanel defaultSize={40} minSize={20}>
                        <div className="h-full flex flex-col bg-muted/30 border-l">
                            <div className="p-2 border-b bg-background/50 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium px-2">
                                    <Eye className="w-4 h-4 text-blue-500" />
                                    Live Preview
                                </div>
                                {isPreviewLoading && <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />}
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto">
                                {/* Mock Workbench Card */}
                                <div className="max-w-md mx-auto bg-card border rounded-xl shadow-sm p-4 space-y-6">
                                    {previewSpec?.groups?.map((group: any) => {
                                        const groupParams = previewSpec.parameters.filter((p: any) => p.group_id === group.id)
                                        if (groupParams.length === 0) return null

                                        return (
                                            <div key={group.id} className="space-y-4">
                                                <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground border-b pb-1">
                                                    {group.label}
                                                </h4>
                                                <div className="space-y-4">
                                                    {groupParams.map((param: any) => (
                                                        <div key={param.id}>
                                                            {/* We assume ModelParameterControl handles label rendering */}
                                                            <ModelParameterControl
                                                                param={param}
                                                                value={param.default}
                                                                onChange={() => { }} // Read-only preview
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {!previewSpec && (
                                        <div className="text-center py-10 text-muted-foreground">
                                            Generating Preview...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}
