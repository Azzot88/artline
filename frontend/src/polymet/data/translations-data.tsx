export type LanguageCode = "ru" | "kk" | "ky" | "en"

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
  flag: string
  adminOnly?: boolean
}

export const languages: Language[] = [
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақша", flag: "🇰🇿" },
  { code: "ky", name: "Kyrgyz", nativeName: "Кыргызча", flag: "🇰🇬" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", adminOnly: true },
]

export interface Translations {
  // Navigation
  workbench: string
  gallery: string
  account: string
  dashboard: string
  modelConfig: string
  settings: string
  logout: string

  // Header
  appTitle: string
  appSubtitle: string
  buyMore: string
  credits: string

  // Creation Type
  image: string
  video: string

  // Input Type
  textToImage: string
  imageToImage: string
  textToVideo: string
  videoToVideo: string

  // Form Labels
  describeImage: string
  describeVideo: string
  model: string
  format: string
  duration: string
  resolution: string
  enhance: string

  // Format Options
  square: string
  horizontal: string
  vertical: string

  // Duration Options
  seconds: string

  // Resolution Options
  quality: string

  // Buttons
  generate: string
  cancel: string
  retry: string
  download: string
  delete: string
  save: string
  edit: string
  viewAll: string

  // Status
  pending: string
  processing: string
  completed: string
  failed: string
  cancelled: string

  // Messages
  generating: string
  queued: string
  generationFailed: string
  insufficientCredits: string
  sessionExpired: string
  uploadFile: string
  dragDropFile: string

  // Gallery
  communityGallery: string
  myGenerations: string
  publicGallery: string
  curatedGallery: string
  noGenerations: string
  createFirst: string
  likes: string
  views: string
  instances: string
  instance: string
  galleries: string

  // Account
  profile: string
  profileDescription: string
  creditBalance: string
  purchaseHistory: string
  generationHistory: string
  totalGenerations: string
  creditsUsed: string
  avgCreditsPerGen: string

  // Quick Stats
  quickStats: string

  // Admin
  admin: string
  providers: string
  models: string
  users: string
  totalUsers: string
  activeModels: string
  modelStatus: string
  providerStatus: string

  // Model Config
  modelName: string
  modelDescription: string
  modelCapabilities: string
  modelCredits: string
  modelProvider: string
  active: string
  maintenance: string
  disabled: string

  // Errors
  error: string
  errorOccurred: string
  tryAgain: string
  notFound: string
  unauthorized: string
  serverError: string

  // Language
  language: string
  selectLanguage: string
}

export const translations: Record<LanguageCode, Translations> = {
  ru: {
    // Navigation
    workbench: "Мастерская",
    gallery: "Галерея",
    account: "Аккаунт",
    dashboard: "Панель управления",
    modelConfig: "Настройка моделей",
    settings: "Настройки",
    logout: "Выход",

    // Header
    appTitle: "Мастерская",
    appSubtitle: "Создавайте потрясающие изображения и видео с помощью ИИ",
    buyMore: "Купить ещё",
    credits: "кредитов",

    // Creation Type
    image: "Изображение",
    video: "Видео",

    // Input Type
    textToImage: "Текст в изображение",
    imageToImage: "Изображение в изображение",
    textToVideo: "Текст в видео",
    videoToVideo: "Видео в видео",

    // Form Labels
    describeImage: "Опишите изображение, которое хотите создать...",
    describeVideo: "Опишите видео, которое хотите создать...",
    model: "Модель",
    format: "Формат",
    duration: "Длительность",
    resolution: "Разрешение",
    enhance: "Улучшить",

    // Format Options
    square: "Квадрат",
    horizontal: "Горизонтальный",
    vertical: "Вертикальный",

    // Duration Options
    seconds: "сек",

    // Resolution Options
    quality: "Качество",

    // Buttons
    generate: "Сгенерировать",
    cancel: "Отмена",
    retry: "Повторить",
    download: "Скачать",
    delete: "Удалить",
    save: "Сохранить",
    edit: "Редактировать",
    viewAll: "Смотреть всё",

    // Status
    pending: "В очереди",
    processing: "Генерация",
    completed: "Завершено",
    failed: "Ошибка",
    cancelled: "Отменено",

    // Messages
    generating: "Генерация...",
    queued: "В очереди...",
    generationFailed: "Генерация не удалась",
    insufficientCredits: "Недостаточно кредитов",
    sessionExpired: "Сессия истекла. Войдите снова.",
    uploadFile: "Загрузить файл",
    dragDropFile: "Перетащите файл сюда",

    // Gallery
    communityGallery: "Галерея сообщества",
    myGenerations: "Мои работы",
    publicGallery: "Публичная галерея",
    curatedGallery: "Избранное",
    noGenerations: "Пока нет работ",
    createFirst: "Создайте первую!",
    likes: "лайков",
    views: "просмотров",
    instances: "Экземпляры",
    instance: "Экземпляр",
    galleries: "Галереи",

    // Account
    profile: "Профиль",
    profileDescription: "Управление профилем и кредитами",
    creditBalance: "Баланс кредитов",
    purchaseHistory: "История покупок",
    generationHistory: "История генераций",
    totalGenerations: "Всего генераций",
    creditsUsed: "Использовано кредитов",
    avgCreditsPerGen: "Средний расход",

    // Quick Stats
    quickStats: "Быстрая статистика",

    // Admin
    admin: "Администратор",
    providers: "Провайдеры",
    models: "Модели",
    users: "Пользователи",
    totalUsers: "Всего пользователей",
    activeModels: "Активных моделей",
    modelStatus: "Статус модели",
    providerStatus: "Статус провайдера",

    // Model Config
    modelName: "Название модели",
    modelDescription: "Описание",
    modelCapabilities: "Возможности",
    modelCredits: "Стоимость в кредитах",
    modelProvider: "Провайдер",
    active: "Активна",
    maintenance: "Обслуживание",
    disabled: "Отключена",

    // Errors
    error: "Ошибка",
    errorOccurred: "Произошла ошибка",
    tryAgain: "Попробуйте снова",
    notFound: "Не найдено",
    unauthorized: "Нет доступа",
    serverError: "Ошибка сервера",

    // Language
    language: "Язык",
    selectLanguage: "Выберите язык",
  },

  kk: {
    // Navigation
    workbench: "Шеберхана",
    gallery: "Галерея",
    account: "Аккаунт",
    dashboard: "Басқару панелі",
    modelConfig: "Модельдерді баптау",
    settings: "Баптаулар",
    logout: "Шығу",

    // Header
    appTitle: "Шеберхана",
    appSubtitle: "AI көмегімен керемет суреттер мен бейнелер жасаңыз",
    buyMore: "Тағы сатып алу",
    credits: "кредит",

    // Creation Type
    image: "Сурет",
    video: "Бейне",

    // Input Type
    textToImage: "Мәтіннен суретке",
    imageToImage: "Суреттен суретке",
    textToVideo: "Мәтіннен бейнеге",
    videoToVideo: "Бейнеден бейнеге",

    // Form Labels
    describeImage: "Жасағыңыз келетін суретті сипаттаңыз...",
    describeVideo: "Жасағыңыз келетін бейнені сипаттаңыз...",
    model: "Модель",
    format: "Формат",
    duration: "Ұзақтығы",
    resolution: "Ажыратымдылық",
    enhance: "Жақсарту",

    // Format Options
    square: "Шаршы",
    horizontal: "Көлденең",
    vertical: "Тік",

    // Duration Options
    seconds: "сек",

    // Resolution Options
    quality: "Сапа",

    // Buttons
    generate: "Жасау",
    cancel: "Болдырмау",
    retry: "Қайталау",
    download: "Жүктеп алу",
    delete: "Жою",
    save: "Сақтау",
    edit: "Өңдеу",
    viewAll: "Барлығын көру",

    // Status
    pending: "Кезекте",
    processing: "Жасалуда",
    completed: "Аяқталды",
    failed: "Қате",
    cancelled: "Болдырылмады",

    // Messages
    generating: "Жасалуда...",
    queued: "Кезекте...",
    generationFailed: "Жасау сәтсіз аяқталды",
    insufficientCredits: "Кредит жеткіліксіз",
    sessionExpired: "Сессия аяқталды. Қайта кіріңіз.",
    uploadFile: "Файл жүктеу",
    dragDropFile: "Файлды осы жерге апарыңыз",

    // Gallery
    communityGallery: "Қауымдастық галереясы",
    myGenerations: "Менің жұмыстарым",
    publicGallery: "Ашық галерея",
    curatedGallery: "Таңдаулы",
    noGenerations: "Әлі жұмыстар жоқ",
    createFirst: "Бірінші жасаңыз!",
    likes: "ұнатулар",
    views: "қарау",
    instances: "Данектер",
    instance: "Данек",
    galleries: "Галереялар",

    // Account
    profile: "Профиль",
    profileDescription: "Профильді және кредиттерді басқару",
    creditBalance: "Кредит балансы",
    purchaseHistory: "Сатып алу тарихы",
    generationHistory: "Жасау тарихы",
    totalGenerations: "Барлық жасалғандар",
    creditsUsed: "Пайдаланылған кредиттер",
    avgCreditsPerGen: "Орташа шығын",

    // Quick Stats
    quickStats: "Жылдам статистика",

    // Admin
    admin: "Әкімші",
    providers: "Провайдерлер",
    models: "Модельдер",
    users: "Пайдаланушылар",
    totalUsers: "Барлық пайдаланушылар",
    activeModels: "Белсенді модельдер",
    modelStatus: "Модель мәртебесі",
    providerStatus: "Провайдер мәртебесі",

    // Model Config
    modelName: "Модель атауы",
    modelDescription: "Сипаттама",
    modelCapabilities: "Мүмкіндіктер",
    modelCredits: "Кредиттегі құны",
    modelProvider: "Провайдер",
    active: "Белсенді",
    maintenance: "Қызмет көрсету",
    disabled: "Өшірілген",

    // Errors
    error: "Қате",
    errorOccurred: "Қате орын алды",
    tryAgain: "Қайталап көріңіз",
    notFound: "Табылмады",
    unauthorized: "Қол жетімді емес",
    serverError: "Сервер қатесі",

    // Language
    language: "Тіл",
    selectLanguage: "Тілді таңдаңыз",
  },

  ky: {
    // Navigation
    workbench: "Устакана",
    gallery: "Галерея",
    account: "Аккаунт",
    dashboard: "Башкаруу панели",
    modelConfig: "Моделдерди тууралоо",
    settings: "Тууралоолор",
    logout: "Чыгуу",

    // Header
    appTitle: "Устакана",
    appSubtitle: "AI жардамы менен укмуштуудай сүрөттөрдү жана видеолорду жаратыңыз",
    buyMore: "Дагы сатып алуу",
    credits: "кредит",

    // Creation Type
    image: "Сүрөт",
    video: "Видео",

    // Input Type
    textToImage: "Текстен сүрөткө",
    imageToImage: "Сүрөттөн сүрөткө",
    textToVideo: "Текстен видеого",
    videoToVideo: "Видеодон видеого",

    // Form Labels
    describeImage: "Жаратууну каалаган сүрөттү сүрөттөп бериңиз...",
    describeVideo: "Жаратууну каалаган видеону сүрөттөп бериңиз...",
    model: "Модель",
    format: "Формат",
    duration: "Узактыгы",
    resolution: "Чечилиши",
    enhance: "Жакшыртуу",

    // Format Options
    square: "Квадрат",
    horizontal: "Горизонталдуу",
    vertical: "Вертикалдуу",

    // Duration Options
    seconds: "сек",

    // Resolution Options
    quality: "Сапат",

    // Buttons
    generate: "Жаратуу",
    cancel: "Жокко чыгаруу",
    retry: "Кайталоо",
    download: "Жүктөп алуу",
    delete: "Өчүрүү",
    save: "Сактоо",
    edit: "Өзгөртүү",
    viewAll: "Баарын көрүү",

    // Status
    pending: "Кезекте",
    processing: "Жаралууда",
    completed: "Аяктады",
    failed: "Ката",
    cancelled: "Жокко чыгарылды",

    // Messages
    generating: "Жаралууда...",
    queued: "Кезекте...",
    generationFailed: "Жаратуу ишке ашпады",
    insufficientCredits: "Кредит жетишсиз",
    sessionExpired: "Сессия бүттү. Кайра кириңиз.",
    uploadFile: "Файл жүктөө",
    dragDropFile: "Файлды бул жерге алып келиңиз",

    // Gallery
    communityGallery: "Коомдук галерея",
    myGenerations: "Менин иштерим",
    publicGallery: "Ачык галерея",
    curatedGallery: "Тандалмалар",
    noGenerations: "Али иштер жок",
    createFirst: "Биринчисин жаратыңыз!",
    likes: "жактыруулар",
    views: "көрүүлөр",
    instances: "Экземплярлар",
    instance: "Экземпляр",
    galleries: "Галереялар",

    // Account
    profile: "Профиль",
    profileDescription: "Профилди жана кредиттерди башкаруу",
    creditBalance: "Кредит балансы",
    purchaseHistory: "Сатып алуу тарыхы",
    generationHistory: "Жаратуу тарыхы",
    totalGenerations: "Бардык жаратылгандар",
    creditsUsed: "Колдонулган кредиттер",
    avgCreditsPerGen: "Орточо чыгым",

    // Quick Stats
    quickStats: "Тез статистика",

    // Admin
    admin: "Администратор",
    providers: "Провайдерлер",
    models: "Моделдер",
    users: "Колдонуучулар",
    totalUsers: "Бардык колдонуучулар",
    activeModels: "Активдүү моделдер",
    modelStatus: "Модель статусу",
    providerStatus: "Провайдер статусу",

    // Model Config
    modelName: "Модель аталышы",
    modelDescription: "Сүрөттөмө",
    modelCapabilities: "Мүмкүнчүлүктөр",
    modelCredits: "Кредиттеги наркы",
    modelProvider: "Провайдер",
    active: "Активдүү",
    maintenance: "Тейлөө",
    disabled: "Өчүрүлгөн",

    // Errors
    error: "Ката",
    errorOccurred: "Ката пайда болду",
    tryAgain: "Кайра аракет кылыңыз",
    notFound: "Табылган жок",
    unauthorized: "Жеткиликтүү эмес",
    serverError: "Сервер катасы",

    // Language
    language: "Тил",
    selectLanguage: "Тилди тандаңыз",
  },

  en: {
    // Navigation
    workbench: "Workshop",
    gallery: "Gallery",
    account: "Account",
    dashboard: "Dashboard",
    modelConfig: "Model Config",
    settings: "Settings",
    logout: "Logout",

    // Header
    appTitle: "Workshop",
    appSubtitle: "Create stunning images and videos with AI-powered generation",
    buyMore: "Buy More",
    credits: "credits",

    // Creation Type
    image: "Image",
    video: "Video",

    // Input Type
    textToImage: "Text-to-Image",
    imageToImage: "Image-to-Image",
    textToVideo: "Text-to-Video",
    videoToVideo: "Video-to-Video",

    // Form Labels
    describeImage: "Describe the image you want to create...",
    describeVideo: "Describe the video you want to create...",
    model: "Model",
    format: "Format",
    duration: "Duration",
    resolution: "Resolution",
    enhance: "Enhance",

    // Format Options
    square: "Square",
    horizontal: "Horizontal",
    vertical: "Vertical",

    // Duration Options
    seconds: "sec",

    // Resolution Options
    quality: "Quality",

    // Buttons
    generate: "Generate",
    cancel: "Cancel",
    retry: "Retry",
    download: "Download",
    delete: "Delete",
    save: "Save",
    edit: "Edit",
    viewAll: "View All",

    // Status
    pending: "Pending",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",

    // Messages
    generating: "Generating...",
    queued: "Queued...",
    generationFailed: "Generation failed",
    insufficientCredits: "Insufficient credits",
    sessionExpired: "Session expired. Please log in again.",
    uploadFile: "Upload file",
    dragDropFile: "Drag and drop file here",

    // Gallery
    communityGallery: "Community Gallery",
    myGenerations: "My Generations",
    publicGallery: "Public Gallery",
    curatedGallery: "Curated",
    noGenerations: "No generations yet",
    createFirst: "Create your first one!",
    likes: "likes",
    views: "views",
    instances: "Instances",
    instance: "Instance",
    galleries: "Galleries",

    // Account
    profile: "Profile",
    profileDescription: "Manage your profile and credits",
    creditBalance: "Credit Balance",
    purchaseHistory: "Purchase History",
    generationHistory: "Generation History",
    totalGenerations: "Total Generations",
    creditsUsed: "Credits Used",
    avgCreditsPerGen: "Avg. Credits/Gen",

    // Quick Stats
    quickStats: "Quick Stats",

    // Admin
    admin: "Admin",
    providers: "Providers",
    models: "Models",
    users: "Users",
    totalUsers: "Total Users",
    activeModels: "Active Models",
    modelStatus: "Model Status",
    providerStatus: "Provider Status",

    // Model Config
    modelName: "Model Name",
    modelDescription: "Description",
    modelCapabilities: "Capabilities",
    modelCredits: "Credits Cost",
    modelProvider: "Provider",
    active: "Active",
    maintenance: "Maintenance",
    disabled: "Disabled",

    // Errors
    error: "Error",
    errorOccurred: "An error occurred",
    tryAgain: "Try again",
    notFound: "Not found",
    unauthorized: "Unauthorized",
    serverError: "Server error",

    // Language
    language: "Language",
    selectLanguage: "Select language",
  },
}

// Helper function to get available languages based on user role
export function getAvailableLanguages(isAdmin: boolean): Language[] {
  if (isAdmin) {
    return languages
  }
  return languages.filter(lang => !lang.adminOnly)
}

// Helper function to get translation
export function getTranslation(lang: LanguageCode): Translations {
  return translations[lang] || translations.ru
}

// Helper function to get cookie value
function getCookieValue(name: string): string | null {
  const cookies = document.cookie.split("; ")
  const cookie = cookies.find(row => row.startsWith(`${name}=`))
  return cookie ? cookie.split("=")[1] : null
}

// Helper function to get current language from cookie or localStorage
export function getCurrentLanguage(): LanguageCode {
  // 1. Check cookie first (set by backend)
  const cookieLang = getCookieValue("artline_lang")
  if (cookieLang && ["ru", "kk", "ky", "en"].includes(cookieLang)) {
    return cookieLang as LanguageCode
  }
  
  // 2. Fallback to localStorage (for offline/development)
  const storedLang = localStorage.getItem("language")
  if (storedLang && ["ru", "kk", "ky", "en"].includes(storedLang)) {
    return storedLang as LanguageCode
  }
  
  // 3. Default to Russian
  return "ru"
}

// Helper function to change language via backend API
export async function changeLanguage(code: LanguageCode): Promise<void> {
  try {
    // Call new backend API endpoint
    const response = await fetch('/api/lang', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
      credentials: 'include', // Important: include cookies
    })

    if (!response.ok) {
      throw new Error(`Failed to change language: ${response.status}`)
    }

    const data = await response.json()
    
    // Also save to localStorage as backup
    localStorage.setItem('language', code)
    
    return data
  } catch (error) {
    console.error('Error changing language:', error)
    
    // Fallback: save to localStorage only if API fails
    localStorage.setItem('language', code)
    
    // Re-throw to let caller handle the error
    throw error
  }
}