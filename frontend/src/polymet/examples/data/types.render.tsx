import { BrowserRouter } from "react-router-dom"
import { 
  JOB_STATUSES, 
  JOB_KINDS, 
  INPUT_TYPES, 
  FORMAT_TYPES, 
  RESOLUTION_TYPES,
  LANGUAGE_CODES,
  isJobStatus,
  isJobKind,
  isLanguageCode
} from "@/polymet/data/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TypesRender() {
  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Centralized Type Definitions</h2>
          <p className="text-muted-foreground">
            All TypeScript types aligned with backend database schema
          </p>
        </div>

        {/* Constants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Statuses</CardTitle>
              <CardDescription>Available generation statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {JOB_STATUSES.map(status => (
                  <Badge key={status} variant="outline">
                    {status}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Kinds</CardTitle>
              <CardDescription>Types of content generation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {JOB_KINDS.map(kind => (
                  <Badge key={kind} variant="outline">
                    {kind}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Input Types</CardTitle>
              <CardDescription>Generation input methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {INPUT_TYPES.map(type => (
                  <Badge key={type} variant="outline">
                    {type}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Format Types</CardTitle>
              <CardDescription>Image/video aspect ratios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {FORMAT_TYPES.map(format => (
                  <Badge key={format} variant="outline">
                    {format}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resolution Types</CardTitle>
              <CardDescription>Available resolutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {RESOLUTION_TYPES.map(res => (
                  <Badge key={res} variant="outline">
                    {res}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Language Codes</CardTitle>
              <CardDescription>Supported interface languages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_CODES.map(lang => (
                  <Badge key={lang} variant="outline">
                    {lang}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Type Guards Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Type Guards</CardTitle>
            <CardDescription>Runtime type checking utilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border border-border rounded-lg">
                <code className="text-sm">
                  isJobStatus("succeeded") = {String(isJobStatus("succeeded"))}
                </code>
              </div>
              <div className="p-3 border border-border rounded-lg">
                <code className="text-sm">
                  isJobKind("image") = {String(isJobKind("image"))}
                </code>
              </div>
              <div className="p-3 border border-border rounded-lg">
                <code className="text-sm">
                  isLanguageCode("ru") = {String(isLanguageCode("ru"))}
                </code>
              </div>
              <div className="p-3 border border-border rounded-lg">
                <code className="text-sm">
                  isLanguageCode("fr") = {String(isLanguageCode("fr"))}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Type Exports */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Available Type Exports</CardTitle>
            <CardDescription>Import these types in your components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              <p>• Generation, JobStatus, JobKind, InputType, FormatType, ResolutionType</p>
              <p>• AIModel, Provider, ModelStatus, ModelKind</p>
              <p>• User, LedgerEntry, Like, GuestProfile, LanguageCode</p>
              <p>• ApiResponse, PaginatedResponse</p>
              <p>• CreateGenerationRequest, UpdateUserRequest, PurchaseCreditsRequest</p>
              <p>• GenerationProgressMessage, GenerationFilters, GenerationSort</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}
