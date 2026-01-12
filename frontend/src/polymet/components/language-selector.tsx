import { useState } from "react"
import { GlobeIcon, CheckIcon, LoaderIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/polymet/components/language-provider"
import { getAvailableLanguages, LanguageCode } from "@/polymet/data/translations-data"

interface LanguageSelectorProps {
  isAdmin?: boolean
}

export function LanguageSelector({ isAdmin = false }: LanguageSelectorProps) {
  const { currentLanguage, setLanguage, t } = useLanguage()
  const [isChanging, setIsChanging] = useState(false)
  const availableLanguages = getAvailableLanguages(isAdmin)

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage)

  const handleLanguageChange = async (code: LanguageCode) => {
    setIsChanging(true)
    try {
      await setLanguage(code)
    } finally {
      // Small delay for smooth UX
      setTimeout(() => setIsChanging(false), 300)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" disabled={isChanging}>
          {isChanging ? (
            <LoaderIcon className="w-4 h-4 animate-spin" />
          ) : (
            <GlobeIcon className="w-4 h-4" />
          )}
          <span className="text-lg">{currentLang?.flag}</span>
          <span className="hidden sm:inline">{currentLang?.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availableLanguages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isChanging}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </div>
            {currentLanguage === lang.code && (
              <CheckIcon className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}