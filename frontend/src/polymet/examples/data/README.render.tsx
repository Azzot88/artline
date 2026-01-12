import { BrowserRouter } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2Icon, AlertCircleIcon, InfoIcon } from "lucide-react"

export default function READMERender() {
  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Data Layer Documentation</h2>
          <p className="text-muted-foreground">
            Complete guide to TypeScript types and backend schema alignment
          </p>
        </div>

        {/* Schema Alignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2Icon className="w-5 h-5 text-green-500" />
              Backend Schema Alignment
            </CardTitle>
            <CardDescription>All types are synchronized with database schema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 border border-border rounded">
                <span className="font-mono">users</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-mono text-primary">user-data.tsx</span>
              </div>
              <div className="flex items-center justify-between p-2 border border-border rounded">
                <span className="font-mono">jobs</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-mono text-primary">generations-data.tsx</span>
              </div>
              <div className="flex items-center justify-between p-2 border border-border rounded">
                <span className="font-mono">ai_models</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-mono text-primary">models-data.tsx</span>
              </div>
              <div className="flex items-center justify-between p-2 border border-border rounded">
                <span className="font-mono">ledger_entries</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-mono text-primary">user-data.tsx</span>
              </div>
              <div className="flex items-center justify-between p-2 border border-border rounded">
                <span className="font-mono">likes</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-mono text-primary">user-data.tsx</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InfoIcon className="w-5 h-5 text-blue-500" />
              New Fields Added
            </CardTitle>
            <CardDescription>Fields added to match backend schema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Generation</h4>
                <div className="space-y-1 text-sm">
                  <Badge variant="outline">status</Badge>
                  <Badge variant="outline">progress</Badge>
                  <Badge variant="outline">input_type</Badge>
                  <Badge variant="outline">format</Badge>
                  <Badge variant="outline">resolution</Badge>
                  <Badge variant="outline">views</Badge>
                  <Badge variant="outline">completed_at</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">AI Model</h4>
                <div className="space-y-1 text-sm">
                  <Badge variant="outline">model_ref</Badge>
                  <Badge variant="outline">ui_config</Badge>
                  <Badge variant="outline">cover_image_url</Badge>
                  <Badge variant="outline">credits_per_generation</Badge>
                  <Badge variant="outline">total_generations</Badge>
                  <Badge variant="outline">average_rating</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">User</h4>
                <div className="space-y-1 text-sm">
                  <Badge variant="outline">username</Badge>
                  <Badge variant="outline">avatar_url</Badge>
                  <Badge variant="outline">balance</Badge>
                  <Badge variant="outline">total_generations</Badge>
                  <Badge variant="outline">language</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Ledger Entry</h4>
                <div className="space-y-1 text-sm">
                  <Badge variant="outline">related_job_id</Badge>
                  <Badge variant="outline">payment_amount</Badge>
                  <Badge variant="outline">payment_currency</Badge>
                  <Badge variant="outline">balance_before</Badge>
                  <Badge variant="outline">balance_after</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Migration Guide */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircleIcon className="w-5 h-5 text-yellow-500" />
              Migration Guide
            </CardTitle>
            <CardDescription>Update existing code to use new field names</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 border border-border rounded-lg">
                <p className="font-semibold mb-2">Generation Fields:</p>
                <div className="space-y-1 font-mono text-xs">
                  <p><span className="text-red-500">gen.type</span> → <span className="text-green-500">gen.kind</span></p>
                  <p><span className="text-red-500">gen.url</span> → <span className="text-green-500">gen.result_url</span></p>
                  <p><span className="text-red-500">gen.userName</span> → <span className="text-green-500">gen.user_name</span></p>
                  <p><span className="text-red-500">gen.isPublic</span> → <span className="text-green-500">gen.is_public</span></p>
                </div>
              </div>
              <div className="p-3 border border-border rounded-lg">
                <p className="font-semibold mb-2">Model Fields:</p>
                <div className="space-y-1 font-mono text-xs">
                  <p><span className="text-red-500">model.name</span> → <span className="text-green-500">model.display_name</span></p>
                  <p><span className="text-red-500">model.status</span> → <span className="text-green-500">model.is_active</span></p>
                  <p><span className="text-red-500">model.credits</span> → <span className="text-green-500">model.credits_per_generation</span></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Helper Functions */}
        <Card>
          <CardHeader>
            <CardTitle>Helper Functions</CardTitle>
            <CardDescription>Utility functions for data access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Generations</h4>
                <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                  <li>getPublicGenerations()</li>
                  <li>getCuratedGenerations()</li>
                  <li>getGenerationsByUser()</li>
                  <li>getGenerationUrl()</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Models</h4>
                <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                  <li>getActiveModels()</li>
                  <li>getModelsByProvider()</li>
                  <li>getModelName()</li>
                  <li>isModelActive()</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Users</h4>
                <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                  <li>getUserById()</li>
                  <li>getUserLedger()</li>
                  <li>hasUserLiked()</li>
                  <li>calculateUserBalance()</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}
