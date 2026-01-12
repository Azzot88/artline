import { BrowserRouter } from "react-router-dom"
import { apiService, pollJobStatus } from "@/polymet/data/api-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Loader2Icon, CheckCircle2Icon, XCircleIcon } from "lucide-react"
import type { Job } from "@/polymet/data/api-types"

export default function ApiServiceRender() {
  const [testResult, setTestResult] = useState<{
    type: "idle" | "loading" | "success" | "error"
    message: string
    data?: any
  }>({ type: "idle", message: "" })

  const testEndpoint = async (name: string, fn: () => Promise<any>) => {
    setTestResult({ type: "loading", message: `Testing ${name}...` })
    
    try {
      const result = await fn()
      setTestResult({
        type: "success",
        message: `✅ ${name} successful`,
        data: result
      })
    } catch (error: any) {
      setTestResult({
        type: "error",
        message: `❌ ${name} failed: ${error.message}`
      })
    }
  }

  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Service</h2>
          <p className="text-muted-foreground">
            Type-safe методы для всех backend endpoints
          </p>
        </div>

        {/* Available Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔐 Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-mono">
              <div>apiService.bootstrap()</div>
              <div>apiService.login(credentials)</div>
              <div>apiService.logout()</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎨 Jobs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-mono">
              <div>apiService.createJob(request)</div>
              <div>apiService.getJob(jobId)</div>
              <div>apiService.listJobs()</div>
              <div>apiService.deleteJob(jobId)</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🤖 Models</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-mono">
              <div>apiService.listModels()</div>
              <div>apiService.getModel(modelId)</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🖼️ Gallery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-mono">
              <div>apiService.getGallery(filters)</div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Примеры использования</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg font-mono text-sm space-y-3">
              <div>
                <div className="text-muted-foreground mb-1">// Bootstrap on app load</div>
                <div>const &#123; user, auth, features &#125; = await apiService.bootstrap()</div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1">// Create generation</div>
                <div>const &#123; job &#125; = await apiService.createJob(&#123;</div>
                <div className="ml-4">model_id: "dalle-3",</div>
                <div className="ml-4">prompt: "A cat",</div>
                <div className="ml-4">input_type: "text",</div>
                <div className="ml-4">parameters: &#123;&#125;,</div>
                <div className="ml-4">is_public: true</div>
                <div>&#125;)</div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1">// Poll job status</div>
                <div>const finalJob = await pollJobStatus(job.id, &#123;</div>
                <div className="ml-4">onProgress: (job) =&gt; console.log(job.progress),</div>
                <div className="ml-4">onSuccess: (job) =&gt; console.log(job.result_url),</div>
                <div className="ml-4">onError: (job) =&gt; console.error(job.error_message)</div>
                <div>&#125;)</div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1">// List models</div>
                <div>const &#123; models &#125; = await apiService.listModels()</div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1">// Get gallery</div>
                <div>const &#123; jobs &#125; = await apiService.getGallery(&#123;</div>
                <div className="ml-4">limit: 20,</div>
                <div className="ml-4">offset: 0</div>
                <div>&#125;)</div>
              </div>
            </div>

            {/* Test Buttons */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  onClick={() => testEndpoint("Bootstrap", () => apiService.bootstrap())}
                  disabled={testResult.type === "loading"}
                >
                  Test Bootstrap
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => testEndpoint("List Models", () => apiService.listModels())}
                  disabled={testResult.type === "loading"}
                >
                  Test List Models
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => testEndpoint("List Jobs", () => apiService.listJobs())}
                  disabled={testResult.type === "loading"}
                >
                  Test List Jobs
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => testEndpoint("Gallery", () => apiService.getGallery())}
                  disabled={testResult.type === "loading"}
                >
                  Test Gallery
                </Button>
              </div>

              {/* Test Result */}
              {testResult.type !== "idle" && (
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
                      <XCircleIcon className="w-4 h-4 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">{testResult.message}</p>
                      {testResult.data && (
                        <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Polling Utility */}
        <Card>
          <CardHeader>
            <CardTitle>Polling Utility</CardTitle>
            <CardDescription>Автоматическое отслеживание статуса генерации</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold mb-2">pollJobStatus(jobId, options)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Автоматически опрашивает статус каждые 2-5 секунд</li>
                <li>• Увеличивает интервал до 5с после 30 секунд</li>
                <li>• Останавливается при достижении succeeded/failed</li>
                <li>• Поддерживает AbortSignal для отмены</li>
                <li>• Вызывает callbacks для progress/success/error</li>
              </ul>
            </div>

            <div className="p-4 bg-muted rounded-lg font-mono text-sm">
              <div>const job = await pollJobStatus("job-123", &#123;</div>
              <div className="ml-4">onProgress: (job) =&gt; &#123;</div>
              <div className="ml-8">console.log(`Progress: $&#123;job.progress&#125;%`)</div>
              <div className="ml-4">&#125;,</div>
              <div className="ml-4">onSuccess: (job) =&gt; &#123;</div>
              <div className="ml-8">console.log(`Done: $&#123;job.result_url&#125;`)</div>
              <div className="ml-4">&#125;,</div>
              <div className="ml-4">signal: abortController.signal</div>
              <div>&#125;)</div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Notes */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">📝 Готово к интеграции</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>✅ API Client:</strong> Готов к использованию с credentials: 'include'
            </div>
            <div>
              <strong>✅ Type Safety:</strong> Все методы типизированы
            </div>
            <div>
              <strong>✅ Error Handling:</strong> Стандартизированная обработка ошибок
            </div>
            <div>
              <strong>✅ Polling:</strong> Реализован контракт с бэкендом (2s → 5s backoff)
            </div>
            <div>
              <strong>🔧 Настройка:</strong> Добавьте proxy в vite.config.ts:
              <code className="block mt-2 p-2 bg-background rounded">
                server: &#123; proxy: &#123; '/api': 'http://localhost:8000' &#125; &#125;
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}