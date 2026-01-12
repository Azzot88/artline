import { useState } from "react"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { ModelParameterControl } from "@/polymet/components/model-parameter-control"
import type { ModelParameter, ModelParameterConfig, UIGroup, ParameterValues } from "@/polymet/data/types"
import { cn } from "@/lib/utils"

interface ModelParametersGroupProps {
  parameters: ModelParameter[]
  configs: ModelParameterConfig[]
  values: ParameterValues
  onChange: (parameterId: string, value: any) => void
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
  disabled = false
}: ModelParametersGroupProps) {
  // Group parameters by ui_group
  const groupedParams = parameters.reduce((acc, param) => {
    const group = param.ui_group
    if (!acc[group]) acc[group] = []
    acc[group].push(param)
    return acc
  }, {} as Record<UIGroup, ModelParameter[]>)

  // Sort parameters within each group by display_order
  Object.keys(groupedParams).forEach(group => {
    groupedParams[group as UIGroup].sort((a, b) => {
      const configA = configs.find(c => c.parameter_id === a.id)
      const configB = configs.find(c => c.parameter_id === b.id)
      return (configA?.display_order ?? 999) - (configB?.display_order ?? 999)
    })
  })

  // State for collapsed groups (core is always expanded)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<UIGroup>>(
    new Set(GROUP_ORDER.filter(g => g !== "core" && groupedParams[g]?.length > 0))
  )

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
      {GROUP_ORDER.map(group => {
        const params = groupedParams[group]
        if (!params || params.length === 0) return null

        const isCollapsed = collapsedGroups.has(group)
        const isCore = group === "core"

        return (
          <div key={group} className="border border-border rounded-lg overflow-hidden">
            {/* Group Header */}
            <button
              onClick={() => !isCore && toggleGroup(group)}
              className={cn(
                "w-full px-4 py-3 flex items-center justify-between",
                "bg-muted/30 hover:bg-muted/50 transition-colors",
                isCore && "cursor-default hover:bg-muted/30"
              )}
              disabled={isCore}
            >
              <div className="flex items-center gap-2">
                {!isCore && (
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
              <div className="p-4 space-y-4 bg-background">
                {params.map(param => {
                  const config = configs.find(c => c.parameter_id === param.id)
                  
                  return (
                    <ModelParameterControl
                      key={param.id}
                      parameter={param}
                      config={config}
                      value={values[param.id]}
                      onChange={(value) => onChange(param.id, value)}
                      disabled={disabled}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}