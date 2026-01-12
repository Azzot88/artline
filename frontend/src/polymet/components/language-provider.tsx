import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { LanguageCode, Translations, getCurrentLanguage, getTranslation, changeLanguage } from "@/polymet/data/translations-data"

interface LanguageContextType {
  currentLanguage: LanguageCode
  translations: Translations
  setLanguage: (code: LanguageCode) => Promise<void>
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(getCurrentLanguage())
  const [translations, setTranslations] = useState<Translations>(getTranslation(currentLanguage))

  useEffect(() => {
    // Update translations when language changes
    setTranslations(getTranslation(currentLanguage))
  }, [currentLanguage])

  useEffect(() => {
    // Sync localStorage with cookie on mount (in case cookie was set by old GET endpoint)
    const initialLang = getCurrentLanguage()
    if (initialLang !== currentLanguage) {
      setCurrentLanguage(initialLang)
      localStorage.setItem('language', initialLang)
    }
  }, [])

  const handleSetLanguage = async (code: LanguageCode) => {
    try {
      // Call backend API to set cookie (no redirect)
      await changeLanguage(code)
      
      // Update local state immediately for instant UI update
      setCurrentLanguage(code)
    } catch (error) {
      console.error('Failed to change language:', error)
      
      // Even if backend fails, update UI (localStorage fallback is already handled)
      setCurrentLanguage(code)
    }
  }

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        translations,
        setLanguage: handleSetLanguage,
        t: translations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

// Custom hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

// Shorthand hook for translations only
export function useTranslations() {
  const { t } = useLanguage()
  return t
}