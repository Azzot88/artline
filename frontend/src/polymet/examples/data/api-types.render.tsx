import { BrowserRouter } from "react-router-dom"
import { 
  DEFAULT_POLLING_CONFIG, 
  isTerminalStatus, 
  isJobSucceeded, 
  isJobFailed,
  type Job,
  type BootstrapResponse 
} from "@/polymet/data/api-types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2Icon, XCircleIcon, ClockIcon, Loader2Icon } from "lucide-react"

export default function ApiTypesRender() {
  // Example jobs in different states
  const exampleJobs: Job[] = [
    {
      id: "job-1",
      status: "queued",
      result_url: null,
      error_message: null,
      progress: 0,
      synced: true,
      model_id: "dalle-3",
      prompt: "A cat",
      input_type: "text",
      parameters: {},
      is_public: true,
      credits_cost: 5,
      user_id: "user-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "job-2",
      status: "processing",
      result_url: null,
      error_message: null,
      progress: 45,
      synced: true,
      model_id: "dalle-3",
      prompt: "A dog",
      input_type: "text",
      parameters: {},
      is_public: true,
      credits_cost: 5,
      user_id: "user-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "job-3",
      status: "succeeded",
      result_url: "https://example.com/result.jpg",
      error_message: null,
      progress: 100,
      synced: true,
      model_id: "dalle-3",
      prompt: "A bird",
      input_type: "text",
      parameters: {},
      is_public: true,
      credits_cost: 5,
      user_id: "user-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "job-4",
      status: "failed",
      result_url: null,
      error_message: "Provider timeout",
      progress: 0,
      synced: true,
      model_id: "dalle-3",
      prompt: "A fish",
      input_type: "text",
      parameters: {},
      is_public: true,
      credits_cost: 5,
      user_id: "user-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  const exampleBootstrap: BootstrapResponse = {
    user: {
      id: "user-123",
      email: "user@example.com",
      is_guest: false,
    },
    auth: {
      mode: "user",
      balance: 250,
    },
    features: {
      can_toggle_public: true,
    },
  }

  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Types</h2>
          <p className="text-muted-foreground">
            Типы запросов и ответов, выровненные с бэкенд контрактом
          </p>
        </div>

        {/* Job State Machine */}
        <Card>
          <CardHeader>
            <CardTitle>Job State Machine</CardTitle>
            <CardDescription>Состояния генерации и их переходы</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-4 p-6 bg-muted rounded-lg">
              <Badge variant="outline">queued</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="outline">processing</Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="default" className="bg-green-500">succeeded</Badge>
              <span className="text-muted-foreground">OR</span>
              <Badge variant="destructive">failed</Badge>
            </div>

            <div className="space-y-3">
              {exampleJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    {job.status === "queued" && <ClockIcon className="w-5 h-5 text-muted-foreground" />}
                    {job.status === "processing" && <Loader2Icon className="w-5 h-5 text-blue-500 animate-spin" />}
                    {job.status === "succeeded" && <CheckCircle2Icon className="w-5 h-5 text-green-500" />}
                    {job.status === "failed" && <XCircleIcon className="w-5 h-5 text-red-500" />}
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{job.prompt}</span>
                        <Badge 
                          variant={
                            job.status === "succeeded" ? "default" :
                            job.status === "failed" ? "destructive" :
                            "outline"
                          }
                          className={job.status === "succeeded" ? "bg-green-500" : ""}
                        >
                          {job.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Progress: {job.progress}%
                        {job.result_url && ` • Result: ${job.result_url.slice(0, 30)}...`}
                        {job.error_message && ` • Error: ${job.error_message}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {isTerminalStatus(job.status) ? "✅ Stop polling" : "🔄 Continue polling"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Polling Config */}
        <Card>
          <CardHeader>
            <CardTitle>Polling Configuration</CardTitle>
            <CardDescription>Настройки для отслеживания статуса генерации</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Initial Interval</div>
                <div className="text-2xl font-bold">{DEFAULT_POLLING_CONFIG.initialInterval}ms</div>
                <div className="text-xs text-muted-foreground mt-1">Начальный интервал опроса</div>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Max Interval</div>
                <div className="text-2xl font-bold">{DEFAULT_POLLING_CONFIG.maxInterval}ms</div>
                <div className="text-xs text-muted-foreground mt-1">Максимальный интервал</div>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Backoff Threshold</div>
                <div className="text-2xl font-bold">{DEFAULT_POLLING_CONFIG.backoffThreshold / 1000}s</div>
                <div className="text-xs text-muted-foreground mt-1">Когда увеличить интервал</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bootstrap Response */}
        <Card>
          <CardHeader>
            <CardTitle>Bootstrap Response (GET /api/me)</CardTitle>
            <CardDescription>Первый запрос при загрузке приложения</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg font-mono text-sm">
              <pre>{JSON.stringify(exampleBootstrap, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Type Guards */}
        <Card>
          <CardHeader>
            <CardTitle>Type Guards</CardTitle>
            <CardDescription>Утилиты для проверки типов</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border border-border rounded-lg">
              <code className="text-sm">isTerminalStatus(status)</code>
              <p className="text-xs text-muted-foreground mt-1">
                Проверяет, является ли статус терминальным (succeeded или failed)
              </p>
            </div>
            <div className="p-3 border border-border rounded-lg">
              <code className="text-sm">isJobSucceeded(job)</code>
              <p className="text-xs text-muted-foreground mt-1">
                Проверяет успешность и гарантирует наличие result_url
              </p>
            </div>
            <div className="p-3 border border-border rounded-lg">
              <code className="text-sm">isJobFailed(job)</code>
              <p className="text-xs text-muted-foreground mt-1">
                Проверяет ошибку и гарантирует наличие error_message
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Integration Notes */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">📝 Контракт с бэкендом</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>Job States:</strong> queued → processing → succeeded OR failed
            </div>
            <div>
              <strong>Polling:</strong> Start at 2s, backoff to 5s after 30s, stop on terminal status
            </div>
            <div>
              <strong>Synced Flag:</strong> synced=true означает, что DB синхронизирована с провайдером
            </div>
            <div>
              <strong>Terminal Statuses:</strong> succeeded, failed - прекратить polling
            </div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}