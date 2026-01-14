import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { useLanguage } from "@/polymet/components/language-provider"
import { Language } from "@/polymet/data/translations"

export function LanguageSwitcher({ variant = "ghost" }: { variant?: "ghost" | "outline" | "default" }) {
    const { language, setLanguage, t } = useLanguage()

    const labels: Record<Language, string> = {
        ru: "Русский",
        kk: "Қазақша",
        ky: "Кыргызча"
    }

    const flags: Record<Language, string> = {
        ru: "🇷🇺",
        kk: "🇰🇿",
        ky: "🇰🇬"
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">{labels[language]}</span>
                    <span className="sm:hidden">{flags[language]}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('ru')}>
                    🇷🇺 Русский
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('kk')}>
                    🇰🇿 Қазақша
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('ky')}>
                    🇰🇬 Кыргызча
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
