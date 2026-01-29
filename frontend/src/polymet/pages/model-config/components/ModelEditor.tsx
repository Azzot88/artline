
import React from 'react'
import { useNavigate } from "react-router-dom"
import { useModelEditor } from '../hooks/use-model-editor'
import { ParameterCard } from '../parameter-card'
import { Button } from "@/components/ui/button"
import { Loader2, Save, Undo, Eye, Image as ImageIcon, ArrowLeft } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ModelEditorProps {
    modelId: string
}

export function ModelEditor({ modelId }: ModelEditorProps) {
    const navigate = useNavigate()
    const {
        state,
        isLoading,
        isSaving,
        updateMetadata,
        updateParameter,
        save,
        reset,
        fetchSchema
    } = useModelEditor(modelId)

    const diffPreview = React.useMemo(() => {
        if (!state) return null

        const config: Record<string, any> = {}
        const pricing: any[] = []

        state.parameters.forEach(p => {
            if (p.hidden || p.labelOverride || (p.visibleToTiers && p.visibleToTiers.length < 3)) {
                config[p.id] = {
                    visible: !p.hidden,
                    label_override: p.labelOverride,
                    access_tiers: p.visibleToTiers
                }
            }
            p.options?.forEach(opt => {
                if (opt.price > 0) pricing.push({ param: p.id, val: opt.value, price: opt.price })
            })
        })
        return {
            display_name: state.displayName,
            credits: state.creditsPerGeneration,
            ui_config: config,
            pricing_rules: pricing
        }
    }, [state])

    if (isLoading || !state) {
        return <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/admin/models")}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-2xl font-bold tracking-tight">Configuration: {state.displayName}</h2>
                    {state.isDirty && <span className="text-xs text-amber-500 font-mono font-bold bg-amber-500/10 px-2 py-1 rounded">(Unsaved Changes)</span>}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={reset} disabled={!state.isDirty}>
                        <Undo className="w-4 h-4 mr-2" /> Reset
                    </Button>
                    <Button size="sm" onClick={save} disabled={!state.isDirty || isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">

                {/* LEFT: Parameters */}
                <div className="lg:col-span-2 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">Parameters</h3>
                        <span className="text-xs text-muted-foreground">{state.parameters.length} items from backend schema</span>
                    </div>
                    <ScrollArea className="h-[calc(100vh-200px)] pr-4 pb-10">
                        <div className="space-y-4 pb-24">
                            {state.parameters.map(param => (
                                <ParameterCard
                                    key={param.id}
                                    parameter={param}
                                    onChange={(updates) => updateParameter(param.id, updates)}
                                />
                            ))}
                            {state.parameters.length === 0 && (
                                <div className="text-center p-8 border border-dashed rounded text-muted-foreground flex flex-col items-center gap-4">
                                    <p>No parameters found in schema definition.</p>
                                    <Button variant="outline" onClick={fetchSchema} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Fetch Schema from Replicate
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* RIGHT: Sidebar (Settings + Preview) */}
                <div className="space-y-6 overflow-auto pr-2 pb-20 h-[calc(100vh-200px)]">

                    {/* Basic Settings Card */}
                    <Card>
                        <CardHeader className="py-3 px-4 bg-muted/20">
                            <CardTitle className="text-sm font-bold">General Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-4">
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input
                                    value={state.displayName || ""}
                                    onChange={(e) => updateMetadata({ displayName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={state.description || ""}
                                    onChange={(e) => updateMetadata({ description: e.target.value })}
                                    className="min-h-[80px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Credits / Run</Label>
                                    <Input
                                        type="number"
                                        value={state.creditsPerGeneration}
                                        onChange={(e) => updateMetadata({ creditsPerGeneration: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                {/* Future: Active Toggle? */}
                            </div>

                            <div className="space-y-2">
                                <Label>Cover Image URL</Label>
                                <div className="flex gap-2">
                                    <div className="relative w-10 h-10 aspect-square rounded overflow-hidden bg-muted border shrink-0">
                                        {state.coverImageUrl ? (
                                            <img src={state.coverImageUrl} className="object-cover w-full h-full" alt="Cover" />
                                        ) : <ImageIcon className="w-4 h-4 m-auto text-muted-foreground" />}
                                    </div>
                                    <Input
                                        value={state.coverImageUrl || ""}
                                        onChange={(e) => updateMetadata({ coverImageUrl: e.target.value })}
                                        className="flex-1"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview Card */}
                    <div className="bg-muted/10 rounded-lg border p-4">
                        <h3 className="font-semibold mb-2 flex items-center gap-2 text-xs uppercase text-muted-foreground"><Eye className="w-4 h-4" /> Live Config Payload</h3>
                        <pre className="text-[10px] font-mono text-muted-foreground overflow-auto p-2 bg-muted/20 rounded max-h-[300px]">
                            {JSON.stringify(diffPreview, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    )
}
