import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageIcon, XIcon } from "lucide-react"

interface BasicSettingsProps {
    displayName: string
    setDisplayName: (v: string) => void
    description: string
    setDescription: (v: string) => void
    coverImageUrl: string
    setCoverImageUrl: (v: string) => void
    onUploadImage: (file: File) => Promise<void>
}

export function BasicSettings({
    displayName, setDisplayName,
    description, setDescription,
    coverImageUrl, setCoverImageUrl,
    onUploadImage
}: BasicSettingsProps) {

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) await onUploadImage(file)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Basic Settings</CardTitle>
                <CardDescription>Public facing information about the model.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Flux Pro" />
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px]"
                        placeholder="Describe what this model does..."
                    />
                </div>

                <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <div className="flex items-start gap-4">
                        {coverImageUrl ? (
                            <div className="relative group w-32 h-32 rounded-lg overflow-hidden border">
                                <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setCoverImageUrl("")}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/20 text-muted-foreground">
                                <ImageIcon className="w-8 h-8 opacity-50" />
                            </div>
                        )}
                        <div className="flex-1 space-y-2">
                            <Input type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
                            <p className="text-[10px] text-muted-foreground">
                                Upload a representative image (PNG/JPG). Ideally 1:1 aspect ratio.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
