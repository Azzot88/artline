import { BrowserRouter } from "react-router-dom"
import { LanguageProvider, useLanguage } from "@/polymet/components/language-provider"
import { Button } from "@/components/ui/button"

function LanguageDemo() {
  const { currentLanguage, t, setLanguage } = useLanguage()

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Language Context Demo</h2>
        <p className="text-muted-foreground">Current language: {currentLanguage}</p>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Translations:</h3>
        <div className="p-4 border border-border rounded-lg space-y-2">
          <p><strong>{t.workbench}</strong></p>
          <p><strong>{t.gallery}</strong></p>
          <p><strong>{t.account}</strong></p>
          <p><strong>{t.generate}</strong></p>
          <p><strong>{t.settings}</strong></p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Change Language:</h3>
        <div className="flex gap-2">
          <Button onClick={() => setLanguage("ru")} variant={currentLanguage === "ru" ? "default" : "outline"}>
            🇷🇺 Русский
          </Button>
          <Button onClick={() => setLanguage("kk")} variant={currentLanguage === "kk" ? "default" : "outline"}>
            🇰🇿 Қазақша
          </Button>
          <Button onClick={() => setLanguage("ky")} variant={currentLanguage === "ky" ? "default" : "outline"}>
            🇰🇬 Кыргызча
          </Button>
          <Button onClick={() => setLanguage("en")} variant={currentLanguage === "en" ? "default" : "outline"}>
            🇬🇧 English
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function LanguageProviderRender() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <LanguageDemo />
      </LanguageProvider>
    </BrowserRouter>
  )
}