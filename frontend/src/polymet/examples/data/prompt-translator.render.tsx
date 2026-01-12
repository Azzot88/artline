import { BrowserRouter } from "react-router-dom"
import { useState } from "react"
import { 
  translatePromptFromEnglish, 
  translatePromptToEnglish,
  translatePromptWithAPI,
  detectPromptLanguage 
} from "@/polymet/data/prompt-translator"
import { LanguageCode } from "@/polymet/data/translations-data"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRightIcon, LanguagesIcon } from "lucide-react"

export default function PromptTranslatorRender() {
  const [inputPrompt, setInputPrompt] = useState("A futuristic city at sunset with flying cars and neon lights")
  const [outputPrompt, setOutputPrompt] = useState("")
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("en")
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("ru")

  const handleTranslate = async () => {
    const translated = await translatePromptWithAPI(inputPrompt, sourceLanguage, targetLanguage)
    setOutputPrompt(translated)
  }

  const handleDetectLanguage = () => {
    const detected = detectPromptLanguage(inputPrompt)
    setSourceLanguage(detected)
  }

  const examplePrompts = [
    { en: "A futuristic city at sunset with flying cars and neon lights", lang: "en" as LanguageCode },
    { en: "Magical forest with glowing mushrooms and fireflies", lang: "en" as LanguageCode },
    { en: "Cyberpunk street market with holographic signs", lang: "en" as LanguageCode },
  ]

  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Prompt Translation System</h2>
          <p className="text-muted-foreground">
            Демонстрация системы перевода промптов между языками
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Исходный промпт</CardTitle>
              <CardDescription>
                Введите промпт на любом языке
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Язык источника</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={sourceLanguage === "en" ? "default" : "outline"}
                    onClick={() => setSourceLanguage("en")}
                  >
                    🇬🇧 English
                  </Button>
                  <Button
                    size="sm"
                    variant={sourceLanguage === "ru" ? "default" : "outline"}
                    onClick={() => setSourceLanguage("ru")}
                  >
                    🇷🇺 Русский
                  </Button>
                  <Button
                    size="sm"
                    variant={sourceLanguage === "kk" ? "default" : "outline"}
                    onClick={() => setSourceLanguage("kk")}
                  >
                    🇰🇿 Қазақша
                  </Button>
                  <Button
                    size="sm"
                    variant={sourceLanguage === "ky" ? "default" : "outline"}
                    onClick={() => setSourceLanguage("ky")}
                  >
                    🇰🇬 Кыргызча
                  </Button>
                </div>
              </div>

              <Textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Введите промпт..."
                className="min-h-32"
              />

              <Button onClick={handleDetectLanguage} variant="outline" size="sm" className="w-full">
                <LanguagesIcon className="w-4 h-4 mr-2" />
                Определить язык автоматически
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Переведенный промпт</CardTitle>
              <CardDescription>
                Результат перевода
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Целевой язык</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={targetLanguage === "en" ? "default" : "outline"}
                    onClick={() => setTargetLanguage("en")}
                  >
                    🇬🇧 English
                  </Button>
                  <Button
                    size="sm"
                    variant={targetLanguage === "ru" ? "default" : "outline"}
                    onClick={() => setTargetLanguage("ru")}
                  >
                    🇷🇺 Русский
                  </Button>
                  <Button
                    size="sm"
                    variant={targetLanguage === "kk" ? "default" : "outline"}
                    onClick={() => setTargetLanguage("kk")}
                  >
                    🇰🇿 Қазақша
                  </Button>
                  <Button
                    size="sm"
                    variant={targetLanguage === "ky" ? "default" : "outline"}
                    onClick={() => setTargetLanguage("ky")}
                  >
                    🇰🇬 Кыргызча
                  </Button>
                </div>
              </div>

              <Textarea
                value={outputPrompt}
                readOnly
                placeholder="Результат перевода появится здесь..."
                className="min-h-32 bg-muted"
              />

              <Button onClick={handleTranslate} className="w-full">
                <ArrowRightIcon className="w-4 h-4 mr-2" />
                Перевести
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Примеры переводов</CardTitle>
            <CardDescription>
              Нажмите на пример, чтобы увидеть перевод
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {examplePrompts.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 text-left justify-start"
                  onClick={() => {
                    setInputPrompt(example.en)
                    setSourceLanguage(example.lang)
                  }}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Пример {index + 1}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {example.en}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LanguagesIcon className="w-5 h-5" />
              Как это работает
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>1. Хранение в базе данных:</strong>
              <p className="text-muted-foreground">Все промпты хранятся на английском языке для унификации</p>
            </div>
            <div>
              <strong>2. Отображение пользователю:</strong>
              <p className="text-muted-foreground">При загрузке промпты автоматически переводятся на текущий язык пользователя</p>
            </div>
            <div>
              <strong>3. Ввод пользователя:</strong>
              <p className="text-muted-foreground">Пользователь может писать на любом языке, промпт переводится на английский перед сохранением</p>
            </div>
            <div>
              <strong>4. Кэширование:</strong>
              <p className="text-muted-foreground">Переводы кэшируются для оптимизации производительности</p>
            </div>
            <div>
              <strong>5. API интеграция:</strong>
              <p className="text-muted-foreground">В продакшене используется Google Translate API, DeepL или собственный сервис перевода</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}