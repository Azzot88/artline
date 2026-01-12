import { BrowserRouter } from "react-router-dom"
import { INTEGRATION_CHECKLIST, ENDPOINTS, POLLING_RULES } from "@/polymet/data/API-INTEGRATION"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2Icon, CircleIcon } from "lucide-react"

export default function APIIntegrationRender() {
  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Integration Guide</h2>
          <p className="text-muted-foreground">
            Полное руководство по интеграции фронтенда с бэкендом
          </p>
        </div>

        {/* Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Setup</CardTitle>
              <CardDescription>Первоначальная настройка</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {INTEGRATION_CHECKLIST.setup.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CircleIcon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Development</CardTitle>
              <CardDescription>Разработка</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {INTEGRATION_CHECKLIST.development.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CircleIcon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Production</CardTitle>
              <CardDescription>Продакшн</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {INTEGRATION_CHECKLIST.production.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CircleIcon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>Available Endpoints</CardTitle>
            <CardDescription>Все доступные API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(ENDPOINTS).map(([key, endpoint]) => {
                const [method, path] = endpoint.split(" ")
                return (
                  <div key={key} className="flex items-center gap-2 p-3 border border-border rounded-lg">
                    <Badge variant={
                      method === "GET" ? "default" :
                      method === "POST" ? "secondary" :
                      method === "DELETE" ? "destructive" :
                      "outline"
                    }>
                      {method}
                    </Badge>
                    <code className="text-sm">{path}</code>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Polling Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Polling Rules</CardTitle>
            <CardDescription>Правила опроса статуса генерации</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Initial Interval</div>
                <div className="text-2xl font-bold">{POLLING_RULES.initialInterval}ms</div>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Max Interval</div>
                <div className="text-2xl font-bold">{POLLING_RULES.maxInterval}ms</div>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Backoff Threshold</div>
                <div className="text-2xl font-bold">{POLLING_RULES.backoffThreshold / 1000}s</div>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Stop Conditions</div>
                <div className="flex gap-2">
                  {POLLING_RULES.stopConditions.map(status => (
                    <Badge key={status} variant="outline">{status}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vite Config */}
        <Card>
          <CardHeader>
            <CardTitle>Vite Configuration</CardTitle>
            <CardDescription>Добавьте в vite.config.ts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg font-mono text-sm">
              <pre>{`export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})`}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">🚀 Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>1. Настройте vite proxy</strong> (см. выше)
            </div>
            <div>
              <strong>2. Импортируйте apiService:</strong>
              <code className="block mt-1 p-2 bg-background rounded">
                import &#123; apiService &#125; from "@/polymet/data/api-service"
              </code>
            </div>
            <div>
              <strong>3. Вызовите bootstrap при загрузке:</strong>
              <code className="block mt-1 p-2 bg-background rounded">
                const &#123; user, auth &#125; = await apiService.bootstrap()
              </code>
            </div>
            <div>
              <strong>4. Создайте генерацию:</strong>
              <code className="block mt-1 p-2 bg-background rounded">
                const &#123; job &#125; = await apiService.createJob(&#123;...&#125;)
              </code>
            </div>
            <div>
              <strong>5. Отслеживайте статус:</strong>
              <code className="block mt-1 p-2 bg-background rounded">
                await pollJobStatus(job.id, &#123; onProgress: ... &#125;)
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Files Created */}
        <Card>
          <CardHeader>
            <CardTitle>✅ Созданные файлы</CardTitle>
            <CardDescription>Готовая инфраструктура для интеграции</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                <code className="text-sm">@/polymet/data/api-client.tsx</code>
                <span className="text-xs text-muted-foreground">- HTTP клиент</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                <code className="text-sm">@/polymet/data/api-types.tsx</code>
                <span className="text-xs text-muted-foreground">- TypeScript типы</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                <code className="text-sm">@/polymet/data/api-service.tsx</code>
                <span className="text-xs text-muted-foreground">- API методы</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                <code className="text-sm">@/polymet/data/API-INTEGRATION.tsx</code>
                <span className="text-xs text-muted-foreground">- Документация</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}