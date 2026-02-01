import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { User, Settings2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/polymet/components/language-provider"

interface RoleCardProps {
    role: {
        id: string
        name: string
        description: string
        style: string
        isActive: boolean
    }
    onClick: () => void
    isSelected?: boolean
}

export function RoleCard({ role, onClick, isSelected }: RoleCardProps) {
    const { t } = useLanguage()
    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md group relative overflow-hidden",
                isSelected ? "border-primary ring-1 ring-primary shadow-lg bg-primary/5" : "border-border"
            )}
            onClick={onClick}
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <CardHeader className="pb-2 space-y-0">
                <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform duration-300">
                        <User className="w-6 h-6" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>
                <CardTitle className="text-lg font-semibold leading-none tracking-tight group-hover:text-primary transition-colors">
                    {role.name}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                    {role.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>{role.style}</span>
                    </div>
                    {role.isActive && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200">
                            {t('common.active')}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
