
import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
    const queryClient = useQueryClient()

    // 1. Fetch Model Data
    const { data: model, isLoading } = useQuery({
        queryKey: ['admin-model', modelId],
        queryFn: async () => {
            const res = await fetch(`/api/admin/models/${modelId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Failed to load model")
            return res.json()
        }
    })

    // 2. Local State for Config
    const [config, setConfig] = useState<any>({})

    // Sync initial state
    useEffect(() => {
        if (model?.ui_config) {
            setConfig(model.ui_config || {})
        }
    }, [model])

    // 3. Preview Logic (Debounced)
    const debouncedConfig = useDebounce(config, 500)

    const { data: previewSpec, isFetching: isPreviewLoading } = useQuery({
        queryKey: ['normalization-preview', modelId, debouncedConfig],
        queryFn: async () => {
            if (!model?.raw_schema_json) return null

            const res = await fetch('/api/admin/models/preview-normalization', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: \`Bearer \${token}\`
              },
              body: JSON.stringify({
                  raw_schema: model.raw_schema_json,
                  normalization_config: debouncedConfig,
                  provider_id: model.provider
              })
          })
          if (!res.ok) throw new Error("Preview failed")
          return res.json()
      },
      enabled: !!model?.raw_schema_json
  })
  
  // 4. Save Mutation
  const saveMutation = useMutation({
      mutationFn: async (newConfig: any) => {
           const res = await fetch(`/ api / admin / models / ${ modelId }`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${ token }`
              },
              body: JSON.stringify({
                  ui_config: newConfig
              })
          })
          if (!res.ok) throw new Error("Save failed")
          return res.json()
      },
      onSuccess: () => {
          toast.success("Normalization rules saved")
          queryClient.invalidateQueries({ queryKey: ['admin-model', modelId] })
      },
      onError: () => toast.error("Failed to save rules")
  })

  if (isLoading) return <div className="p-8">Loading...</div>
  
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
                    onClick={() => saveMutation.mutate(config)}
                    disabled={saveMutation.isPending}
                    className="gap-2"
                 >
                    <Save className="w-4 h-4" />
                    {saveMutation.isPending ? "Saving..." : "Save Rules"}
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
                                                        {/* Or we render label manually here for clarity */}
                                                        <ModelParameterControl 
                                                            param={param}
                                                            value={param.default}
                                                            onChange={() => {}} // Read-only preview
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
