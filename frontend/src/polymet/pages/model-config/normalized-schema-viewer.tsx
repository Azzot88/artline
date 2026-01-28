
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { AIModel } from "@/polymet/data/models-data"

interface NormalizedSchemaViewerProps {
    model: AIModel
}

export function NormalizedSchemaViewer({ model }: NormalizedSchemaViewerProps) {
    const caps = model.normalized_caps_json || {}
    const inputs = caps.inputs || []

    if (!inputs || inputs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Normalized Capabilities</CardTitle>
                    <CardDescription>No strict schema defined. Backend will use permissive mode.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Verified Capabilities
                    <Badge variant="secondary">{inputs.length} Inputs</Badge>
                </CardTitle>
                <CardDescription>
                    Strict schema used by the Backend Normalizer.
                    These types and ranges are enforced before submission to Replicate.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Param Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Constraints</TableHead>
                                <TableHead>Default</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inputs.map((input: any) => (
                                <TableRow key={input.name}>
                                    <TableCell className="font-mono font-medium">{input.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{input.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        <ConstraintsView input={input} />
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {String(input.default ?? "-")}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <div className="mt-4 p-4 bg-muted/50 rounded-lg text-xs font-mono">
                    <h4 className="font-bold mb-2">Raw JSON</h4>
                    <pre className="overflow-x-auto">
                        {JSON.stringify(caps, null, 2)}
                    </pre>
                </div>
            </CardContent>
        </Card>
    )
}

function ConstraintsView({ input }: { input: any }) {
    if (input.type === 'select' && input.options) {
        return (
            <div className="flex flex-wrap gap-1">
                {input.options.map((o: any) => (
                    <span key={o} className="px-1 py-0.5 bg-secondary rounded text-[10px]">{o}</span>
                ))}
            </div>
        )
    }

    const parts = []
    if (input.min !== undefined) parts.push(`Min: ${input.min}`)
    if (input.max !== undefined) parts.push(`Max: ${input.max}`)
    if (input.maxLength) parts.push(`MaxLen: ${input.maxLength}`)

    if (parts.length === 0) return <span className="opacity-50">-</span>

    return <span>{parts.join(", ")}</span>
}
