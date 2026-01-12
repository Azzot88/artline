/**
 * API INTEGRATION GUIDE
 * 
 * Полное руководство по интеграции фронтенда с бэкендом
 */

// ============================================================================
// 📋 CHECKLIST ДЛЯ ИНТЕГРАЦИИ
// ============================================================================

/*

## 1. Настройка Vite Proxy (ОБЯЗАТЕЛЬНО)

Добавьте в `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // URL вашего бэкенда
        changeOrigin: true,
      }
    }
  }
})
```

Это обеспечит:
- Отсутствие CORS ошибок в dev режиме
- Автоматическую отправку cookies
- Прозрачную работу с /api endpoints


## 2. Структура файлов (УЖЕ ГОТОВО ✅)

```
@/polymet/data/
  ├── api-client.tsx      - HTTP клиент с error handling
  ├── api-types.tsx       - Типы запросов/ответов
  ├── api-service.tsx     - Методы для всех endpoints
  └── API-INTEGRATION.tsx - Эта документация
```


## 3. Использование в компонентах

### Вариант A: Прямое использование apiService

```typescript
import { apiService } from "@/polymet/data/api-service"
import { isApiError } from "@/polymet/data/api-client"

function MyComponent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const { job } = await apiService.createJob({
        model_id: "dalle-3",
        prompt: "A cat",
        input_type: "text",
        parameters: {},
        is_public: true
      })

      // Start polling
      const finalJob = await pollJobStatus(job.id, {
        onProgress: (job) => console.log(`Progress: ${job.progress}%`),
        onSuccess: (job) => console.log(`Done: ${job.result_url}`),
      })

      // Handle success
      console.log("Generation complete!", finalJob.result_url)
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message)
        
        // Handle specific errors
        if (err.code === "insufficient_credits") {
          // Show "Buy Credits" dialog
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleSubmit} disabled={loading}>
      {loading ? "Generating..." : "Generate"}
    </button>
  )
}
```

### Вариант B: С React Query (РЕКОМЕНДУЕТСЯ)

```typescript
import { useMutation, useQuery } from "@tanstack/react-query"
import { apiService, pollJobStatus } from "@/polymet/data/api-service"

function MyComponent() {
  // Bootstrap on mount
  const { data: bootstrap } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => apiService.bootstrap()
  })

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: apiService.createJob,
    onSuccess: async (response) => {
      // Start polling
      const finalJob = await pollJobStatus(response.job.id)
      console.log("Done!", finalJob.result_url)
    }
  })

  return (
    <div>
      <p>Balance: {bootstrap?.auth.balance} credits</p>
      <button 
        onClick={() => createJobMutation.mutate({
          model_id: "dalle-3",
          prompt: "A cat",
          input_type: "text",
          parameters: {},
          is_public: true
        })}
        disabled={createJobMutation.isPending}
      >
        Generate
      </button>
    </div>
  )
}
```


## 4. Основные сценарии использования

### A. Bootstrap (при загрузке приложения)

```typescript
// В корневом компоненте или App.tsx
useEffect(() => {
  apiService.bootstrap()
    .then(({ user, auth, features }) => {
      console.log("User:", user)
      console.log("Balance:", auth.balance)
      console.log("Is Guest:", user.is_guest)
    })
}, [])
```

### B. Создание генерации

```typescript
const { job } = await apiService.createJob({
  model_id: "dalle-3",
  prompt: "A beautiful sunset",
  input_type: "text",
  parameters: {
    format: "1:1",
    quality: "standard"
  },
  is_public: true
})

console.log("Job created:", job.id, job.status) // "queued"
```

### C. Polling статуса

```typescript
const finalJob = await pollJobStatus(job.id, {
  onProgress: (job) => {
    console.log(`Progress: ${job.progress}%`)
    // Update UI with progress
  },
  onSuccess: (job) => {
    console.log(`Success! URL: ${job.result_url}`)
    // Show result image
  },
  onError: (job) => {
    console.error(`Failed: ${job.error_message}`)
    // Show error message
  }
})
```

### D. Отмена polling

```typescript
const abortController = new AbortController()

pollJobStatus(job.id, {
  signal: abortController.signal
})

// Later, to cancel:
abortController.abort()
```

### E. Получение списка моделей

```typescript
const { models } = await apiService.listModels()

models.forEach(model => {
  console.log(model.name, model.credits)
})
```

### F. Галерея

```typescript
const { jobs, total } = await apiService.getGallery({
  limit: 20,
  offset: 0,
  model_id: "dalle-3" // optional filter
})
```


## 5. Обработка ошибок

### Коды ошибок (из бэкенд контракта)

```typescript
import { API_ERROR_CODES, isApiError } from "@/polymet/data/api-client"

try {
  await apiService.createJob(...)
} catch (error) {
  if (isApiError(error)) {
    switch (error.code) {
      case API_ERROR_CODES.UNAUTHORIZED:
        // Redirect to login
        break
      
      case API_ERROR_CODES.INSUFFICIENT_CREDITS:
        // Show "Buy Credits" dialog
        break
      
      case API_ERROR_CODES.VALIDATION_ERROR:
        // Show validation errors
        console.log(error.details)
        break
      
      case API_ERROR_CODES.PROVIDER_ERROR:
        // Show "Provider is down" message
        break
      
      default:
        // Generic error message
        alert(error.message)
    }
  }
}
```


## 6. TypeScript типы

Все типы уже определены и экспортированы:

```typescript
import type {
  Job,
  JobStatus,
  BootstrapResponse,
  CreateJobRequest,
  GalleryFilters
} from "@/polymet/data/api-types"

// Type guards
import { 
  isTerminalStatus, 
  isJobSucceeded, 
  isJobFailed 
} from "@/polymet/data/api-types"

const job: Job = await apiService.getJob("job-123")

if (isTerminalStatus(job.status)) {
  console.log("Job finished!")
}

if (isJobSucceeded(job)) {
  // TypeScript knows job.result_url is string (not null)
  console.log(job.result_url)
}
```


## 7. Тестирование интеграции

### Шаг 1: Проверьте proxy

```bash
# Запустите бэкенд на порту 8000
# Запустите фронтенд
npm run dev

# Откройте браузер и проверьте Network tab
# Все запросы к /api должны проксироваться на localhost:8000
```

### Шаг 2: Тест Bootstrap

```typescript
// В консоли браузера
import { apiService } from "@/polymet/data/api-service"

const result = await apiService.bootstrap()
console.log(result)
// Должен вернуть: { user: {...}, auth: {...}, features: {...} }
```

### Шаг 3: Тест создания Job

```typescript
const { job } = await apiService.createJob({
  model_id: "dalle-3",
  prompt: "Test",
  input_type: "text",
  parameters: {},
  is_public: true
})

console.log(job.id, job.status) // должен быть "queued"
```

### Шаг 4: Тест Polling

```typescript
import { pollJobStatus } from "@/polymet/data/api-service"

const finalJob = await pollJobStatus(job.id, {
  onProgress: (j) => console.log("Progress:", j.progress)
})

console.log("Final status:", finalJob.status)
```


## 8. Production настройки

В production режиме:

1. **Удалите proxy из vite.config.ts** (не нужен в production)
2. **Настройте CORS на бэкенде** для вашего фронтенд домена
3. **Используйте HTTPS** для безопасной передачи cookies
4. **Настройте SameSite cookies** на бэкенде

Пример CORS настройки на бэкенде (FastAPI):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,  # CRITICAL для cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```


## 9. Миграция с mock данных

Когда бэкенд будет готов, замените mock данные:

### Было (mock):
```typescript
import { generations } from "@/polymet/data/generations-data"
```

### Стало (API):
```typescript
const { jobs } = await apiService.listJobs()
```

### Было (mock):
```typescript
import { aiModels } from "@/polymet/data/models-data"
```

### Стало (API):
```typescript
const { models } = await apiService.listModels()
```


## 10. Troubleshooting

### Проблема: CORS ошибки

**Решение:** Проверьте vite proxy и CORS настройки на бэкенде

### Проблема: Cookies не отправляются

**Решение:** Убедитесь что:
- credentials: 'include' установлен (уже есть в api-client)
- SameSite=None на бэкенде (для cross-origin)
- HTTPS в production

### Проблема: 401 Unauthorized

**Решение:** Вызовите apiService.bootstrap() при загрузке приложения

### Проблема: Polling не останавливается

**Решение:** Проверьте что бэкенд возвращает terminal status (succeeded/failed)


## 11. Следующие шаги

1. ✅ Настройте vite proxy
2. ✅ Протестируйте apiService.bootstrap()
3. ✅ Протестируйте создание job
4. ✅ Протестируйте polling
5. ✅ Замените mock данные на API calls
6. ✅ Добавьте React Query для кэширования
7. ✅ Настройте error boundaries
8. ✅ Добавьте loading states
9. ✅ Протестируйте на production

*/

export const INTEGRATION_CHECKLIST = {
  setup: [
    "Configure vite proxy",
    "Test /api/me endpoint",
    "Verify cookies are sent",
  ],
  development: [
    "Replace mock data with API calls",
    "Add error handling",
    "Implement polling for jobs",
    "Add loading states",
  ],
  production: [
    "Remove vite proxy",
    "Configure CORS on backend",
    "Use HTTPS",
    "Test in production environment",
  ],
}

export const ENDPOINTS = {
  bootstrap: "GET /api/me",
  login: "POST /api/auth/login",
  logout: "POST /api/auth/logout",
  createJob: "POST /api/jobs",
  getJob: "GET /api/jobs/:id",
  listJobs: "GET /api/jobs",
  deleteJob: "DELETE /api/jobs/:id",
  listModels: "GET /api/models",
  getModel: "GET /api/models/:id",
  gallery: "GET /api/gallery",
}

export const POLLING_RULES = {
  initialInterval: 2000, // 2s
  maxInterval: 5000, // 5s
  backoffThreshold: 30000, // 30s
  stopConditions: ["succeeded", "failed"],
}