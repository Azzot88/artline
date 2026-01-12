import { BrowserRouter } from "react-router-dom"
import { languages, translations, getAvailableLanguages, getTranslation } from "@/polymet/data/translations-data"

export default function TranslationsDataRender() {
  const adminLanguages = getAvailableLanguages(true)
  const userLanguages = getAvailableLanguages(false)

  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Languages</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">For Regular Users</h3>
            <div className="flex gap-3">
              {userLanguages.map(lang => (
                <div key={lang.code} className="px-4 py-2 border border-border rounded-lg">
                  <span className="text-2xl mr-2">{lang.flag}</span>
                  <span className="font-medium">{lang.nativeName}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">For Admins</h3>
            <div className="flex gap-3">
              {adminLanguages.map(lang => (
                <div key={lang.code} className="px-4 py-2 border border-border rounded-lg">
                  <span className="text-2xl mr-2">{lang.flag}</span>
                  <span className="font-medium">{lang.nativeName}</span>
                  {lang.adminOnly && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                      Admin only
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Translation Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {languages.map(lang => {
              const t = getTranslation(lang.code)
              return (
                <div key={lang.code} className="p-4 border border-border rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="text-2xl">{lang.flag}</span>
                    {lang.nativeName}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Workbench:</span>
                      <span className="font-medium">{t.workbench}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gallery:</span>
                      <span className="font-medium">{t.gallery}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Generate:</span>
                      <span className="font-medium">{t.generate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Settings:</span>
                      <span className="font-medium">{t.settings}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </BrowserRouter>
  )
}