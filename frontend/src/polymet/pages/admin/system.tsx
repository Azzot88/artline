import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function AdminSystem() {
    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">System</h2>
            <Card>
                <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>Server status and configuration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-mono">v1.2.0</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Environment</span>
                        <span className="font-mono">Production</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Database</span>
                        <span className="text-green-500 font-medium">Connected</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
