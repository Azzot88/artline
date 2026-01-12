import { LanguageCode } from "@/polymet/data/translations-data"

// Простой кэш переводов для оптимизации
const translationCache = new Map<string, string>()

// Словарь для базовых переводов (можно расширять)
const promptDictionary: Record<LanguageCode, Record<string, string>> = {
  ru: {
    // Общие термины
    "futuristic": "футуристический",
    "city": "город",
    "sunset": "закат",
    "flying cars": "летающие машины",
    "neon lights": "неоновые огни",
    "abstract": "абстрактный",
    "geometric patterns": "геометрические узоры",
    "vibrant colors": "яркие цвета",
    "minimalist": "минималистичный",
    "portrait": "портрет",
    "woman": "женщина",
    "black and white": "черно-белый",
    "magical forest": "волшебный лес",
    "glowing mushrooms": "светящиеся грибы",
    "fireflies": "светлячки",
    "cyberpunk": "киберпанк",
    "street market": "уличный рынок",
    "holographic signs": "голографические вывески",
    "serene": "безмятежный",
    "mountain landscape": "горный пейзаж",
    "aurora borealis": "северное сияние",
    "steampunk": "стимпанк",
    "airship": "дирижабль",
    "floating above clouds": "парящий над облаками",
    "underwater city": "подводный город",
    "bioluminescent": "биолюминесцентный",
    "architecture": "архитектура",
    "desert oasis": "пустынный оазис",
    "palm trees": "пальмы",
    "crystal clear water": "кристально чистая вода",
    "ancient temple": "древний храм",
    "ruins": "руины",
    "overgrown with vines": "заросший лианами",
    "cosmic nebula": "космическая туманность",
    "swirling colors": "закрученные цвета",
    "stars": "звезды",
    "modern architecture": "современная архитектура",
    "glass and steel": "стекло и сталь",
    "with": "с",
    "and": "и",
    "in": "в",
    "at": "на",
    "above": "над",
  },
  kk: {
    "futuristic": "болашақтық",
    "city": "қала",
    "sunset": "күн батысы",
    "flying cars": "ұшатын көліктер",
    "neon lights": "неон жарықтары",
    "abstract": "абстрактілі",
    "geometric patterns": "геометриялық үлгілер",
    "vibrant colors": "жарқын түстер",
    "minimalist": "минималистік",
    "portrait": "портрет",
    "woman": "әйел",
    "black and white": "қара-ақ",
    "magical forest": "сиқырлы орман",
    "glowing mushrooms": "жарқыраған саңырауқұлақтар",
    "fireflies": "жарқанаттар",
    "cyberpunk": "киберпанк",
    "street market": "көше базары",
    "holographic signs": "голографиялық белгілер",
    "serene": "тыныш",
    "mountain landscape": "таулы пейзаж",
    "aurora borealis": "солтүстік жарық",
    "steampunk": "стимпанк",
    "airship": "әуе кемесі",
    "floating above clouds": "бұлттар үстінде қалықтаған",
    "underwater city": "су асты қаласы",
    "bioluminescent": "биолюминесцентті",
    "architecture": "сәулет",
    "desert oasis": "шөл оазисі",
    "palm trees": "пальма ағаштары",
    "crystal clear water": "мөлдір су",
    "ancient temple": "ежелгі ғибадатхана",
    "ruins": "қирандылар",
    "overgrown with vines": "өсімдіктермен қапталған",
    "cosmic nebula": "ғарыштық тұман",
    "swirling colors": "айналмалы түстер",
    "stars": "жұлдыздар",
    "modern architecture": "заманауи сәулет",
    "glass and steel": "шыны және болат",
    "with": "бар",
    "and": "және",
    "in": "ішінде",
    "at": "кезінде",
    "above": "үстінде",
  },
  ky: {
    "futuristic": "келечектик",
    "city": "шаар",
    "sunset": "күн батышы",
    "flying cars": "учкан машиналар",
    "neon lights": "неон жарыктары",
    "abstract": "абстрактуу",
    "geometric patterns": "геометриялык үлгүлөр",
    "vibrant colors": "жаркын түстөр",
    "minimalist": "минималисттик",
    "portrait": "портрет",
    "woman": "аял",
    "black and white": "кара-ак",
    "magical forest": "сыйкырдуу токой",
    "glowing mushrooms": "жаркыраган козу карындар",
    "fireflies": "жарк чымындар",
    "cyberpunk": "киберпанк",
    "street market": "көчө базары",
    "holographic signs": "голографиялык белгилер",
    "serene": "тынч",
    "mountain landscape": "тоолуу пейзаж",
    "aurora borealis": "түндүк жарык",
    "steampunk": "стимпанк",
    "airship": "аба кемеси",
    "floating above clouds": "булуттардын үстүндө калкып",
    "underwater city": "суу астындагы шаар",
    "bioluminescent": "биолюминесценттик",
    "architecture": "архитектура",
    "desert oasis": "чөл оазиси",
    "palm trees": "пальма дарактары",
    "crystal clear water": "таза суу",
    "ancient temple": "байыркы ибадатхана",
    "ruins": "урандылар",
    "overgrown with vines": "өсүмдүктөр менен каптаган",
    "cosmic nebula": "космостук туман",
    "swirling colors": "айланма түстөр",
    "stars": "жылдыздар",
    "modern architecture": "заманбап архитектура",
    "glass and steel": "айнек жана болот",
    "with": "менен",
    "and": "жана",
    "in": "ичинде",
    "at": "учурунда",
    "above": "үстүндө",
  },
  en: {
    // English is the base language, no translation needed
  }
}

/**
 * Переводит промпт с английского на указанный язык
 * В реальном приложении здесь был бы API вызов к сервису перевода
 */
export function translatePromptFromEnglish(
  englishPrompt: string,
  targetLanguage: LanguageCode
): string {
  // Если целевой язык - английский, возвращаем как есть
  if (targetLanguage === "en") {
    return englishPrompt
  }

  // Проверяем кэш
  const cacheKey = `${englishPrompt}:${targetLanguage}`
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  // Простой перевод через словарь (для демонстрации)
  let translatedPrompt = englishPrompt.toLowerCase()
  const dictionary = promptDictionary[targetLanguage]

  // Сортируем ключи по длине (сначала длинные фразы, потом короткие слова)
  const sortedKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length)

  for (const englishPhrase of sortedKeys) {
    const translation = dictionary[englishPhrase]
    // Используем регулярное выражение для замены целых слов/фраз
    const regex = new RegExp(`\\b${englishPhrase}\\b`, "gi")
    translatedPrompt = translatedPrompt.replace(regex, translation)
  }

  // Сохраняем в кэш
  translationCache.set(cacheKey, translatedPrompt)

  return translatedPrompt
}

/**
 * Переводит промпт с любого языка на английский
 * В реальном приложении здесь был бы API вызов к сервису перевода
 */
export function translatePromptToEnglish(
  prompt: string,
  sourceLanguage: LanguageCode
): string {
  // Если исходный язык - английский, возвращаем как есть
  if (sourceLanguage === "en") {
    return prompt
  }

  // Проверяем кэш
  const cacheKey = `${prompt}:en`
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  // Простой обратный перевод через словарь (для демонстрации)
  let englishPrompt = prompt.toLowerCase()
  const dictionary = promptDictionary[sourceLanguage]

  // Создаем обратный словарь
  const reverseDictionary: Record<string, string> = {}
  for (const [english, translated] of Object.entries(dictionary)) {
    reverseDictionary[translated.toLowerCase()] = english
  }

  // Сортируем ключи по длине (сначала длинные фразы, потом короткие слова)
  const sortedKeys = Object.keys(reverseDictionary).sort((a, b) => b.length - a.length)

  for (const translatedPhrase of sortedKeys) {
    const english = reverseDictionary[translatedPhrase]
    const regex = new RegExp(`\\b${translatedPhrase}\\b`, "gi")
    englishPrompt = englishPrompt.replace(regex, english)
  }

  // Сохраняем в кэш
  translationCache.set(cacheKey, englishPrompt)

  return englishPrompt
}

/**
 * В реальном приложении эта функция будет вызывать API перевода
 * Например: Google Translate API, DeepL API, или собственный сервис
 */
export async function translatePromptWithAPI(
  prompt: string,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): Promise<string> {
  // Если языки совпадают, возвращаем как есть
  if (sourceLanguage === targetLanguage) {
    return prompt
  }

  // Проверяем кэш
  const cacheKey = `${prompt}:${sourceLanguage}:${targetLanguage}`
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  // TODO: Здесь должен быть реальный API вызов
  // Пример:
  // const response = await fetch('/api/translate', {
  //   method: 'POST',
  //   body: JSON.stringify({ text: prompt, from: sourceLanguage, to: targetLanguage })
  // })
  // const data = await response.json()
  // const translated = data.translatedText

  // Для демонстрации используем простой перевод
  let translated: string
  if (targetLanguage === "en") {
    translated = translatePromptToEnglish(prompt, sourceLanguage)
  } else if (sourceLanguage === "en") {
    translated = translatePromptFromEnglish(prompt, targetLanguage)
  } else {
    // Переводим через английский как промежуточный язык
    const english = translatePromptToEnglish(prompt, sourceLanguage)
    translated = translatePromptFromEnglish(english, targetLanguage)
  }

  // Сохраняем в кэш
  translationCache.set(cacheKey, translated)

  return translated
}

/**
 * Очищает кэш переводов
 */
export function clearTranslationCache(): void {
  translationCache.clear()
}

/**
 * Определяет язык промпта (упрощенная версия)
 * В реальном приложении использовать библиотеку определения языка
 */
export function detectPromptLanguage(prompt: string): LanguageCode {
  const text = prompt.toLowerCase()

  // Проверяем на кириллицу
  const hasCyrillic = /[а-яёА-ЯЁ]/.test(text)
  if (!hasCyrillic) {
    return "en"
  }

  // Проверяем специфичные буквы для каждого языка
  const hasKazakh = /[әіңғүұқөһ]/i.test(text)
  const hasKyrgyz = /[үөң]/i.test(text)

  if (hasKazakh) return "kk"
  if (hasKyrgyz) return "ky"
  return "ru"
}