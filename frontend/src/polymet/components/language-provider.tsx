import React, { createContext, useContext, useEffect, useState } from 'react'
import { translations, Language } from '@/polymet/data/translations'

type Translations = typeof translations.ru

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (path: string) => any
  dict: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_KEY = 'polymet_language'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru')

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY) as Language
    if (saved && (saved === 'ru' || saved === 'kk' || saved === 'ky')) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj)
  }

  const t = (path: string) => {
    const value = getNestedValue(translations[language], path)
    if (value === undefined) {
      console.warn(`Missing translation for key: ${path} in language: ${language}`)
      return path
    }
    return value
  }

  const dict = translations[language]

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dict }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}