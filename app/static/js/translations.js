const translations = {
    en: {
        // Nav
        nav_dashboard: "Dashboard",
        nav_admin: "Admin",
        nav_logout: "Logout",
        nav_back: "Back",
        
        // Sidebar - Balance
        balance_title: "Balance",
        balance_desc: "Credits (CR) used for image & video generation",
        buy_credits: "Buy 100 Credits ($10)",
        payment_integ: "(Payment integration required)",
        
        // Sidebar - Create Job
        create_job: "Create Job",
        format_label: "Format",
        model_label: "AI Model",
        prompt_label: "Prompt",
        prompt_placeholder: "A cinematic drone shot of a futuristic neon city...",
        generate_btn: "Generate",
        
        // Formats
        fmt_image: "Image",
        fmt_video: "Video",
        
        // Gallery
        gallery_title: "Your Gallery",
        no_jobs_title: "No jobs found",
        no_jobs_desc: "Start by creating your first masterpiece!",
        
        // Job Status
        status_queued: "Queued",
        status_running: "Running",
        status_succeeded: "Succeeded",
        status_failed: "Failed",
        
        // Modal
        modal_details: "Job Details",
        modal_id: "ID:",
        modal_date: "Date:",
        modal_status: "Status:",
        modal_cost: "Cost:",
        modal_prompt: "Prompt",
        modal_download: "Download Original"
    },
    ru: {
        nav_dashboard: "Дашборд",
        nav_admin: "Админка",
        nav_logout: "Выйти",
        nav_back: "Назад",
        
        balance_title: "Баланс",
        balance_desc: "Кредиты (CR) используются для генерации",
        buy_credits: "Купить 100 CR ($10)",
        payment_integ: "(Нужна интеграция оплаты)",
        
        create_job: "Создать",
        format_label: "Формат",
        model_label: "AI Модель",
        prompt_label: "Промпт",
        prompt_placeholder: "Кинематографичный кадр футуристичного города...",
        generate_btn: "Создать",
        
        fmt_image: "Изображение",
        fmt_video: "Видео",
        
        gallery_title: "Галерея",
        no_jobs_title: "Нет работ",
        no_jobs_desc: "Создайте свой первый шедевр!",
        
        status_queued: "В очереди",
        status_running: "В процессе",
        status_succeeded: "Готово",
        status_failed: "Ошибка",
        
        modal_details: "Детали работы",
        modal_id: "ID:",
        modal_date: "Дата:",
        modal_status: "Статус:",
        modal_cost: "Цена:",
        modal_prompt: "Промпт",
        modal_download: "Скачать оригинал"
    },
    kk: {
        nav_dashboard: "Басқару панелі",
        nav_admin: "Әкімші",
        nav_logout: "Шығу",
        nav_back: "Артқа",
        
        balance_title: "Баланс",
        balance_desc: "Генерация үшін кредиттер (CR) қолданылады",
        buy_credits: "100 CR сатып алу ($10)",
        payment_integ: "(Төлем жүйесі қосылмаған)",
        
        create_job: "Жаңа жұмыс",
        format_label: "Формат",
        model_label: "AI Моделі",
        prompt_label: "Промпт",
        prompt_placeholder: "Болашақ қаланың кинематографиялық көрінісі...",
        generate_btn: "Генерациялау",
        
        fmt_image: "Сурет",
        fmt_video: "Видео",
        
        gallery_title: "Галерея",
        no_jobs_title: "Жұмыстар жоқ",
        no_jobs_desc: "Алғашқы туындыңызды жасаңыз!",
        
        status_queued: "Кезекте",
        status_running: "Орындалуда",
        status_succeeded: "Дайын",
        status_failed: "Қате",
        
        modal_details: "Жұмыс мәліметтері",
        modal_id: "ID:",
        modal_date: "Күні:",
        modal_status: "Күйі:",
        modal_cost: "Құны:",
        modal_prompt: "Промпт",
        modal_download: "Түпнұсқаны жүктеу"
    },
    ky: {
        nav_dashboard: "Башкаруу панели",
        nav_admin: "Админ",
        nav_logout: "Чыгуу",
        nav_back: "Артка",
        
        balance_title: "Баланс",
        balance_desc: "Генерация үчүн кредиттер (CR) колдонулат",
        buy_credits: "100 CR сатып алуу ($10)",
        payment_integ: "(Төлөм системасы кошула элек)",
        
        create_job: "Жаңы жумуш",
        format_label: "Формат",
        model_label: "AI Модели",
        prompt_label: "Промпт",
        prompt_placeholder: "Келечектеги шаардын кинематографиялык көрүнүшү...",
        generate_btn: "Жаратуу",
        
        fmt_image: "Сүрөт",
        fmt_video: "Видео",
        
        gallery_title: "Галерея",
        no_jobs_title: "Жумуштар жок",
        no_jobs_desc: "Алгачкы шедевриңизди жаратыңыз!",
        
        status_queued: "Кезекте",
        status_running: "Аткарылууда",
        status_succeeded: "Даяр",
        status_failed: "Ката",
        
        modal_details: "Жумуш чоо-жайы",
        modal_id: "ID:",
        modal_date: "Күнү:",
        modal_status: "Абалы:",
        modal_cost: "Баасы:",
        modal_prompt: "Промпт",
        modal_download: "Түпнусканы жүктөө"
    }
};

function updateLanguage(lang) {
    if (!translations[lang]) return;
    
    // Save preference
    localStorage.setItem('artline_lang', lang);
    
    // Update all Tagged elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[lang][key];
            } else {
                // If element has children (like icons), we might execute a specialized replacement 
                // BUT for MVP we assume data-i18n elements only contain text or we use innerText.
                // To be safe with icons, let's look for text nodes? 
                // Or just replace content. Let's simplify: replace content.
                // If user put icon inside data-i18n element, it disappears.
                // Rule: data-i18n elements should be wrappers for text only.
                el.innerText = translations[lang][key];
            }
        }
    });

    // Update active state in switcher (if exists)
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('artline_lang') || 'en';
    updateLanguage(saved);
});
