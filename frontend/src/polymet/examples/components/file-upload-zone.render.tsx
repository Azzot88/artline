import { BrowserRouter } from "react-router-dom"
import { FileUploadZone } from "@/polymet/components/file-upload-zone"
import { useState } from "react"

export default function FileUploadZoneRender() {
  const [file, setFile] = useState<File | null>(null)

  return (
    <BrowserRouter>
      <div className="p-8 max-w-2xl space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-3">Default Upload Zone</h3>
          <FileUploadZone onFileSelect={setFile} />
          {file && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {file.name}
            </p>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-3">Disabled State</h3>
          <FileUploadZone onFileSelect={() => {}} disabled />
        </div>
      </div>
    </BrowserRouter>
  )
}