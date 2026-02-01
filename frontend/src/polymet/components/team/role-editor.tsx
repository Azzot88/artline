import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Save, Wand2 } from "lucide-react"
import { useLanguage } from "@/polymet/prototypes/ai-workbench-app"

interface RoleEditorProps {
    role?: any // Replace with proper type later
    onClose: () => void
    onSave?: (role: any) => void
}

export function RoleEditor({ role, onClose, onSave }: RoleEditorProps) {
    const { t } = useLanguage()
    return (
        <Card className="mb-8 border-primary/20 shadow-lg bg-background/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-primary" />
                        {role ? t('team.editRole') : t('team.newRole')}
                    </CardTitle>
                    <CardDescription>
                        {t('team.configureDesc')}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button size="sm" onClick={() => onSave?.(role)}>
                        <Save className="w-4 h-4 mr-2" />
                        {t('team.saveAccess')}
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('team.roleName')}</Label>
                            <Input id="name" placeholder={t('team.roleNamePlaceholder')} defaultValue={role?.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">{t('team.description')}</Label>
                            <Textarea
                                id="description"
                                placeholder={t('team.descriptionPlaceholder')}
                                className="h-24 resize-none"
                                defaultValue={role?.description}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4 border border-dashed border-muted-foreground/20 h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                            <Wand2 className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">{t('team.styleConfig')}</p>
                            <p className="text-xs opacity-70 mt-1">{t('team.comingSoon')}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
