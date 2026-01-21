import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadCloudIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
    value?: string
    onChange: (url: string) => void
    label?: string
    accept?: string
    disabled?: boolean
    className?: string
}

// NOTE: This currently just acts as a URL input with visual flair. 
// A real implementation would integrate with S3 upload logic.
export function FileUploader({
    value,
    onChange,
    label,
    accept,
    disabled,
    className
}: FileUploaderProps) {
    // For now, allow manual URL entry
    return (
        <div className={cn("space-y-3", className)}>
            {label && <Label>{label}</Label>}

            {value ? (
                <div className="relative group border rounded-md overflow-hidden aspect-video bg-muted/20 flex items-center justify-center">
                    <img
                        src={value}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onChange("")}
                            disabled={disabled}
                        >
                            <XIcon className="w-4 h-4 mr-2" />
                            Remove
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="border-2 border-dashed rounded-md p-6 text-center hover:bg-muted/50 transition-colors">
                    <UploadCloudIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                        Enter a URL for your input {accept?.includes("video") ? "video" : "image"}
                    </p>
                    <Input
                        placeholder="https://..."
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                </div>
            )}
        </div>
    )
}
