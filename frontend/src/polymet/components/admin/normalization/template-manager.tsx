import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { BookTemplate, Save, Trash2 } from "lucide-react"
import { apiService } from "@/polymet/data/api-service"

export interface TemplateManagerProps {
    currentConfig: any
    onLoadConfig: (config: any) => void
}

export function TemplateManager({ currentConfig, onLoadConfig }: TemplateManagerProps) {
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
    const [newTemplateName, setNewTemplateName] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [mode, setMode] = useState<"load" | "save">("load")

    useEffect(() => {
        if (isOpen) fetchTemplates()
    }, [isOpen])

    async function fetchTemplates() {
        try {
            // Assuming apiService has getTemplates (we need to add it or call fetch directly)
            // For MVP let's use fetch since apiService update is separate step
            const res = await fetch("/api/admin/templates")
            if (res.ok) {
                const data = await res.json()
                setTemplates(data)
            }
        } catch (e) {
            console.error(e)
            toast.error("Failed to load templates")
        }
    }

    async function handleSave() {
        if (!newTemplateName.trim()) return
        try {
            const res = await fetch("/api/admin/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newTemplateName,
                    config: currentConfig,
                    description: "Created from builder"
                })
            })
            if (!res.ok) throw new Error("Failed")

            toast.success("Template saved")
            setNewTemplateName("")
            setMode("load")
            fetchTemplates()
        } catch (e) {
            toast.error("Failed to save template")
        }
    }

    async function handleLoad() {
        if (!selectedTemplateId) return
        try {
            const res = await fetch(`/api/admin/templates/${selectedTemplateId}`)
            if (res.ok) {
                const tmpl = await res.json()
                onLoadConfig(tmpl.config)
                toast.success(`Loaded template: ${tmpl.name}`)
                setIsOpen(false)
            }
        } catch (e) {
            toast.error("Failed to load template")
        }
    }

    async function handleDelete(id: string, e: React.MouseEvent) {
        e.stopPropagation()
        if (!confirm("Delete this template?")) return
        try {
            await fetch(`/api/admin/templates/${id}`, { method: "DELETE" })
            toast.success("Template deleted")
            fetchTemplates()
            if (selectedTemplateId === id) setSelectedTemplateId("")
        } catch (e) {
            toast.error("Failed to delete")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { setMode("load"); setIsOpen(true) }}>
                    <BookTemplate className="w-4 h-4 mr-2" />
                    Templates
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setMode("save"); setIsOpen(true) }}>
                    <Save className="w-4 h-4" />
                </Button>
            </div>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === "save" ? "Save as Template" : "Load Template"}</DialogTitle>
                    <DialogDescription>
                        {mode === "save"
                            ? "Save current normalization rules as a reusable template."
                            : "Apply a saved template to this model. Warning: This will overwrite current rules."}
                    </DialogDescription>
                </DialogHeader>

                {mode === "save" ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g. Flux Standard"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="space-y-4">
                            {templates.length === 0 && <p className="text-sm text-muted-foreground text-center">No templates found.</p>}

                            {templates.map(t => (
                                <div
                                    key={t.id}
                                    className={`flex items-center justify-between p-3 rounded border cursor-pointer hover:bg-muted ${selectedTemplateId === t.id ? 'border-primary ring-1 ring-primary' : ''}`}
                                    onClick={() => setSelectedTemplateId(t.id)}
                                >
                                    <div>
                                        <div className="font-medium text-sm">{t.name}</div>
                                        <div className="text-xs text-muted-foreground">{t.config_summary} rules</div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => handleDelete(t.id, e)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {mode === "save" ? (
                        <Button onClick={handleSave} disabled={!newTemplateName}>Save Template</Button>
                    ) : (
                        <Button onClick={handleLoad} disabled={!selectedTemplateId}>Load Template</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
