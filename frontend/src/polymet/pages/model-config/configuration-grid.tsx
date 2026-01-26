
import { UIParameter } from "@/polymet/data/api-types"
import { ModelParameterConfig } from "@/polymet/data/types"
import { VisualParamCard } from "./visual-param-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface ConfigurationGridProps {
    parameters: UIParameter[]
    configs: Record<string, ModelParameterConfig>
    onConfigChange: (paramId: string, newConfig: Partial<ModelParameterConfig>) => void
}

export function ConfigurationGrid({ parameters, configs, onConfigChange }: ConfigurationGridProps) {
    const [search, setSearch] = useState("")

    // Group params
    const basicParams = parameters.filter(p => !p.group_id || p.group_id === "basic")
    const advancedParams = parameters.filter(p => p.group_id === "advanced")

    const filterParams = (list: UIParameter[]) => {
        if (!search) return list
        return list.filter(p => p.id.includes(search) || p.label?.toLowerCase().includes(search.toLowerCase()))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Filter parameters..."
                        className="pl-9 h-9 bg-background/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                    <TabsTrigger value="all">All ({parameters.length})</TabsTrigger>
                    <TabsTrigger value="basic">Basic ({basicParams.length})</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced ({advancedParams.length})</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="all" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filterParams(parameters).map((param) => (
                                <VisualParamCard
                                    key={param.id}
                                    param={param}
                                    config={configs[param.id] || { parameter_id: param.id, enabled: true, display_order: 0 }}
                                    onConfigChange={onConfigChange}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="basic" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filterParams(basicParams).map((param) => (
                                <VisualParamCard
                                    key={param.id}
                                    param={param}
                                    config={configs[param.id] || { parameter_id: param.id, enabled: true, display_order: 0 }}
                                    onConfigChange={onConfigChange}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filterParams(advancedParams).map((param) => (
                                <VisualParamCard
                                    key={param.id}
                                    param={param}
                                    config={configs[param.id] || { parameter_id: param.id, enabled: true, display_order: 0 }}
                                    onConfigChange={onConfigChange}
                                />
                            ))}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
