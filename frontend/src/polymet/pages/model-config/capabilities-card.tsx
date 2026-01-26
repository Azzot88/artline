import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    ImageIcon, VideoIcon, MicIcon, TypeIcon,
    ScalingIcon, BrushIcon, MusicIcon
} from "lucide-react"

interface CapabilitiesCardProps {
    capabilities: string[]
    toggleCapability: (cap: string) => void
}

const CAPABILITY_OPTIONS = [
    { id: "text-to-image", label: "Text to Image", icon: ImageIcon, color: "text-rose-500" },
    { id: "image-to-image", label: "Image to Image", icon: ImageIcon, color: "text-rose-500" },
    { id: "text-to-video", label: "Text to Video", icon: VideoIcon, color: "text-purple-500" },
    { id: "image-to-video", label: "Image to Video", icon: VideoIcon, color: "text-purple-500" },
    { id: "text-to-audio", label: "Text to Audio", icon: MicIcon, color: "text-yellow-500" },
    { id: "inpainting", label: "Inpainting", icon: BrushIcon, color: "text-indigo-500" },
    { id: "upscale", label: "Upscaling", icon: ScalingIcon, color: "text-cyan-500" },
]

export function CapabilitiesCard({ capabilities, toggleCapability }: CapabilitiesCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Capabilities</CardTitle>
                <CardDescription>What can this model do?</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-2">
                    {CAPABILITY_OPTIONS.map((opt) => {
                        const isEnabled = capabilities.includes(opt.id)
                        const Icon = opt.icon

                        return (
                            <div
                                key={opt.id}
                                className={`
                                    flex items-center space-x-3 p-3 rounded-md border transition-all
                                    ${isEnabled ? "bg-accent/30 border-primary/50" : "bg-background border-transparent hover:bg-muted"}
                                `}
                                onClick={() => toggleCapability(opt.id)}
                            >
                                <Checkbox
                                    checked={isEnabled}
                                    onCheckedChange={() => toggleCapability(opt.id)}
                                    className="data-[state=checked]:bg-primary"
                                />
                                <div className={`p-2 rounded-full bg-muted/50 ${isEnabled ? opt.color : "text-muted-foreground"}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium leading-none">{opt.label}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
