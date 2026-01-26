import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DownloadIcon, ActivityIcon, CheckCircle2, AlertCircle } from "lucide-react"

interface SchemaConnectorProps {
    modelRef: string
    setModelRef: (v: string) => void
    onFetch1: () => Promise<void>
    onFetch2: () => Promise<void>
    isFetching: boolean
    hasParams: boolean
}

export function SchemaConnector({
    modelRef, setModelRef,
    onFetch1, onFetch2,
    isFetching, hasParams
}: SchemaConnectorProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Schema Connector</CardTitle>
                <CardDescription>
                    Connect to Replicate to auto-configure parameters.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-4 items-end bg-muted/20 p-4 rounded-lg border">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium">Replicate Model ID</label>
                        <Input
                            value={modelRef}
                            onChange={(e) => setModelRef(e.target.value)}
                            placeholder="owner/name"
                            className="font-mono"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={onFetch1}
                            disabled={isFetching || !modelRef}
                            title="Legacy Fetch"
                        >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Fetch 1.0
                        </Button>
                        <Button
                            onClick={onFetch2}
                            disabled={isFetching || !modelRef}
                            className="bg-primary hover:bg-primary/90"
                            title="Deep Analysis"
                        >
                            <ActivityIcon className="w-4 h-4 mr-2" />
                            Fetch 2.0
                        </Button>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        {hasParams ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Connected
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No Schema
                            </Badge>
                        )}
                    </div>
                    {hasParams && (
                        <span className="text-xs text-muted-foreground">Parameters loaded/configured.</span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
