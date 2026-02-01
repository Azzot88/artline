import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import { useLanguage } from "@/polymet/prototypes/ai-workbench-app"

interface NewRoleCardProps {
    onClick: () => void
}

export function NewRoleCard({ onClick }: NewRoleCardProps) {
    const { t } = useLanguage()
    return (
        <Card
            className={cn(
                "cursor-pointer h-full min-h-[180px] border-dashed border-2 border-muted hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group flex flex-col items-center justify-center text-center p-6"
            )}
            onClick={onClick}
        >
            <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors duration-300">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </div>
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {t('team.createRole')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-[140px]">
                {t('team.createRoleDesc')}
            </p>
        </Card>
    )
}
