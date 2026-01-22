import { useState, useEffect, useMemo } from "react"
import { ChevronDownIcon, ChevronRightIcon, SearchIcon, XIcon } from "lucide-react"
import { ModelParameterAdminControl } from "@/polymet/components/model-parameter-admin-control"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ModelParameter, ModelParameterConfig, UIGroup, ParameterValues } from "@/polymet/data/types"
import { getParameterLabel } from "@/polymet/data/model-parameters-data"
import { cn } from "@/lib/utils"

interface ModelParametersGroupProps {
  parameters: ModelParameter[]
  configs: ModelParameterConfig[]
  values: ParameterValues
  onChange: (parameterId: string, value: any) => void
  onConfigChange: (parameterId: string, updates: Partial<ModelParameterConfig>) => void
  disabled?: boolean
}

const GROUP_LABELS: Record<UIGroup, string> = {
  core: "Основные параметры",
  format: "Формат и размер",
  quality: "Качество",
  advanced: "Расширенные настройки",
  safety: "Безопасность",
  debug: "Отладка",
  other: "Другие параметры"
}

const GROUP_ORDER: UIGroup[] = ["core", "format", "quality", "advanced", "safety", "debug", "other"]

export function ModelParametersGroup({
  parameters,
  configs,
  values,
  onChange,
  onConfigChange,
  disabled = false
}: ModelParametersGroupProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter parameters based on search
  const filteredParameters = useMemo(() => {
    if (!searchTerm) return parameters
    const lower = searchTerm.toLowerCase()
    return parameters.filter(p => {
      const config = configs.find(c => c.parameter_id === p.id)
      const label = getParameterLabel(p, config).toLowerCase()
      return p.name.toLowerCase().includes(lower) || label.includes(lower)
    })
  }, [parameters, configs, searchTerm])

  // Group parameters by ui_group
  const groupedParams = useMemo(() => {
    const groups = filteredParameters.reduce((acc, param) => {
      const group = param.ui_group
      if (!acc[group]) acc[group] = []
      acc[group].push(param)
      return acc
    }, {} as Record<UIGroup, ModelParameter[]>)

    // Sort parameters within each group by display_order
    Object.keys(groups).forEach(group => {
      groups[group as UIGroup].sort((a, b) => {
        const configA = configs.find(c => c.parameter_id === a.id)
        const configB = configs.find(c => c.parameter_id === b.id)
        return (configA?.display_order ?? 999) - (configB?.display_order ?? 999)
      })
    })
    return groups
  }, [filteredParameters, configs])

  // State for collapsed groups (core is always expanded)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<UIGroup>>(
    new Set(GROUP_ORDER.filter(g => g !== "core"))
  )

  // Auto-expand on search
  useEffect(() => {
    if (searchTerm) {
      setCollapsedGroups(new Set()) // Expand all
    } else {
      // Reset to defaults (collapse everything except core)
      setCollapsedGroups(new Set(GROUP_ORDER.filter(g => g !== "core")))
    }
  }, [searchTerm])

  const toggleGroup = (group: UIGroup) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-9"
          placeholder="Search parameters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-9 w-9 hover:bg-transparent"
            onClick={() => setSearchTerm("")}
          >
            <XIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Groups */}
      {GROUP_ORDER.map(group => {
        const params = groupedParams[group]
        if (!params || params.length === 0) return null

        const isCollapsed = collapsedGroups.has(group)
        const isCore = group === "core" && !searchTerm // Core is only special when not searching

        return (
          <div key={group} className="border border-border rounded-lg overflow-hidden transition-all">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group)}
              className={cn(
                "w-full px-4 py-3 flex items-center justify-between",
                "bg-muted/30 hover:bg-muted/50 transition-colors",
                isCore && "cursor-default hover:bg-muted/30"
              )}
              disabled={isCore}
            >
              <div className="flex items-center gap-2">
                {(!isCore || searchTerm) && (
                  isCollapsed ? (
                    <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                  )
                )}
                <span className="font-semibold">{GROUP_LABELS[group]}</span>
                <span className="text-xs text-muted-foreground">
                  ({params.length})
                </span>
              </div>
            </button>

            {/* Group Content */}
            {!isCollapsed && (
              <div className="p-4 space-y-4 bg-background animate-in slide-in-from-top-2 duration-200">
                {params.map(param => {
                  const config = configs.find(c => c.parameter_id === param.id)

                  return (
                    <ModelParameterAdminControl
                      key={param.id}
                      parameter={param}
                      config={config}
                      currentValue={values[param.id]}
                      onConfigChange={(updates) => onConfigChange(param.id, updates)}
                      onValueChange={(value) => onChange(param.id, value)}
                    />
                  )
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {filteredParameters.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No parameters found matching "{searchTerm}"
        </div>
      )}
    </div>
  )
}