import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SparklesIcon } from "lucide-react"

export function RightSidebar() {

  return (
    <div className="flex h-full w-80 flex-col border-l border-border bg-background overflow-y-auto">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <h2 className="font-semibold">Activity</h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Tips */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-primary" />
              Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Use specific adjectives for better results</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Try different models for varied styles</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Lower resolution = fewer credits</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}