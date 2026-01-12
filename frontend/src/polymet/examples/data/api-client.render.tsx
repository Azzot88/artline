import { BrowserRouter } from "react-router-dom"
import { api, ApiError, isApiError, getErrorMessage, getErrorCode, API_ERROR_CODES } from "@/polymet/data/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { AlertCircleIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react"

export default function ApiClientRender() {
  const [testResult, setTestResult] = useState<{
    type: "success" | "error" | "loading"
    message: string
    code?: string
  } | null>(null)

  const testApiCall = async (endpoint: string, method: "GET" | "POST") => {
    setTestResult({ type: "loading", message: "Testing..." })
    
    try {
      let result
      if (method === "GET") {
        result = await api.get(endpoint)
      } else {
        result = await api.post(endpoint, { test: true })
      }
      
      setTestResult({
        type: "success",
        message: `Success! Response: ${JSON.stringify(result).slice(0, 100)}...`
      })
    } catch (error) {
      setTestResult({
        type: "error",
        message: getErrorMessage(error),
        code: getErrorCode(error)
      })
    }
  }

  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Client</h2>
          <p className="text-muted-foreground">
            Централизованный клиент для всех API запросов с type-safety и error handling
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">✅ Основные возможности</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Автоматическая отправка cookies (credentials: 'include')</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Type-safe методы для GET, POST, PUT, PATCH, DELETE</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Стандартизированная обработка ошибок</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Автоматический JSON parsing</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Network error handling</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔒 Error Codes</CardTitle>
              <CardDescription>Поддерживаемые коды ошибок</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(API_ERROR_CODES).map(([key, code]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {code}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Example */}
        <Card>
          <CardHeader>
            <CardTitle>Примеры использования</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg font-mono text-sm space-y-2">
              <div className="text-muted-foreground">// GET request</div>
              <div>const user = await api.get&lt;User&gt;("/me")</div>
              
              <div className="text-muted-foreground mt-4">// POST request</div>
              <div>const job = await api.post&lt;Job&gt;("/jobs", &#123;</div>
              <div className="ml-4">model_id: "dalle-3",</div>
              <div className="ml-4">prompt: "A cat"</div>
              <div>&#125;)</div>
              
              <div className="text-muted-foreground mt-4">// Error handling</div>
              <div>try &#123;</div>
              <div className="ml-4">await api.get("/jobs/123")</div>
              <div>&#125; catch (error) &#123;</div>
              <div className="ml-4">if (isApiError(error)) &#123;</div>
              <div className="ml-8">console.log(error.code, error.message)</div>
              <div className="ml-4">&#125;</div>
              <div>&#125;</div>
            </div>

            {/* Test Buttons */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => testApiCall("/me", "GET")}
                  disabled={testResult?.type === "loading"}
                >
                  Test GET /api/me
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => testApiCall("/jobs", "GET")}
                  disabled={testResult?.type === "loading"}
                >
                  Test GET /api/jobs
                </Button>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.type === "success" ? "bg-green-500/10 border-green-500/30" :
                  testResult.type === "error" ? "bg-red-500/10 border-red-500/30" :
                  "bg-blue-500/10 border-blue-500/30"
                }`}>
                  <div className="flex items-start gap-2">
                    {testResult.type === "loading" && (
                      <Loader2Icon className="w-4 h-4 animate-spin mt-0.5" />
                    )}
                    {testResult.type === "success" && (
                      <CheckCircle2Icon className="w-4 h-4 text-green-500 mt-0.5" />
                    )}
                    {testResult.type === "error" && (
                      <AlertCircleIcon className="w-4 h-4 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      {testResult.code && (
                        <Badge variant="outline" className="mb-2">
                          {testResult.code}
                        </Badge>
                      )}
                      <p className="text-sm">{testResult.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Integration Notes */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">📝 Интеграция с бэкендом</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>Base URL:</strong> <code className="px-2 py-1 bg-muted rounded">/api</code>
              <p className="text-muted-foreground mt-1">
                В dev режиме проксируется на backend через vite.config.ts
              </p>
            </div>
            <div>
              <strong>Authentication:</strong> HttpOnly cookies
              <p className="text-muted-foreground mt-1">
                Автоматически отправляются с каждым запросом (credentials: 'include')
              </p>
            </div>
            <div>
              <strong>Content-Type:</strong> application/json
              <p className="text-muted-foreground mt-1">
                Все запросы и ответы в JSON формате
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}