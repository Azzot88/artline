import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light")
    }

    return (
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="relative h-9 w-9 hover:bg-primary/10 group/theme transition-all">
            {/* Sun Icon: Visible in Light Mode (scale-100), Hidden in Dark Mode (scale-0) */}
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-muted-foreground group-hover/theme:text-primary" />

            {/* Moon Icon: Hidden in Light Mode (scale-0), Visible in Dark Mode (scale-100) */}
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-muted-foreground group-hover/theme:text-primary" />

            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
