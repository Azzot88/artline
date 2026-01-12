import { UploadIcon, XIcon, FileIcon } from "lucide-react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileUploadZoneProps {
  onFileSelect: (file: File | null) => void
  accept?: string
  maxSize?: number
  disabled?: boolean
}

export function FileUploadZone({ 
  onFileSelect, 
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
      return false
    }
    setError("")
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    onFileSelect(null)
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
      
      {selectedFile ? (
        <div className="border-2 border-border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={disabled}
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
            isDragging && "border-primary bg-primary/5",
            !isDragging && "border-border hover:border-primary/50 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UploadIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drop your file here or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum file size: {maxSize / (1024 * 1024)}MB
              </p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-xs text-destructive mt-2">{error}</p>
      )}
    </div>
  )
}