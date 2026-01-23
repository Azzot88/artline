import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { InfoIcon, MaximizeIcon, ZapIcon, LayersIcon, HardDriveIcon, CogIcon } from "lucide-react"

import { FormatSelectorV2 } from "@/polymet/components/format-selector-v2"
import { DynamicList } from "@/polymet/components/smart-inputs/dynamic-list"
import { ColorPicker } from "@/polymet/components/smart-inputs/color-picker"
import { FileUploader } from "@/polymet/components/smart-inputs/file-uploader"
import { DualSlider } from "@/polymet/components/smart-inputs/dual-slider"

import type { ModelParameter, ModelParameterConfig, ImageFormatType, VideoFormatType } from "@/polymet/data/types"
import { getEffectiveDefault, getAllowedValues, getParameterLabel } from "@/polymet/data/types"
import { cn } from "@/lib/utils"

interface ModelParameterControlProps {
  parameter: ModelParameter
  config?: ModelParameterConfig
  value: any
  onChange: (value: any) => void
  disabled?: boolean
  compact?: boolean // For inline display in workbench
}

export function ModelParameterControl({
  parameter,
  config,
  value,
  onChange,
  disabled = false,
  compact = false
}: ModelParameterControlProps) {
  const label = getParameterLabel(parameter, config)
  const allowedValues = getAllowedValues(parameter, config)
  const effectiveDefault = getEffectiveDefault(parameter, config)
  const description = config?.description || parameter.description

  // Use effective default if value is null/undefined
  const currentValue = value ?? effectiveDefault

  // --- Helper: Label + Tooltip ---
  const getParameterIcon = (name: string) => {
    const n = name.toLowerCase()
    if (n === 'format' || n === 'aspect_ratio') return <LayersIcon className="w-3.5 h-3.5" />
    if (n === 'resolution' || n === 'size' || n === 'width' || n === 'height') return <MaximizeIcon className="w-3.5 h-3.5" />
    if (n === 'quality' || n === 'steps' || n === 'cfg' || n === 'strength') return <ZapIcon className="w-3.5 h-3.5" />
    if (n.includes('format') || n.includes('output')) return <HardDriveIcon className="w-3.5 h-3.5" />
    return <CogIcon className="w-3.5 h-3.5" />
  }

  const LabelWithTooltip = () => (
    <div className="flex items-center gap-2 mb-2 transition-colors group">
      {getParameterIcon(parameter.name)}
      <Label htmlFor={parameter.id} className="cursor-pointer text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
        {label}
        {parameter.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {description && (
        <Popover>
          <PopoverTrigger asChild>
            <InfoIcon className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help" />
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3 text-sm">
            {description}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )

  // --- Special Handlers ---

  // 1. Format Selector
  if (parameter.name === "format") {
    const isVideoFormat = allowedValues?.some(v => ["16:9", "9:16"].includes(String(v)))
    const type = isVideoFormat ? "video" : "image"

    return (
      <FormatSelectorV2
        value={currentValue as ImageFormatType | VideoFormatType}
        onChange={onChange}
        type={type}
        disabled={disabled}
        compact={compact}
        allowedValues={allowedValues}
      />
    )
  }

  // 2. File/Image Upload
  if (parameter.name.includes("image") || parameter.name.includes("file") || parameter.format === "uri") {
    return (
      <FileUploader
        label={!compact ? label : undefined}
        value={currentValue}
        onChange={onChange}
        disabled={disabled}
        accept={parameter.name.includes("image") ? "image/*" : undefined}
      />
    )
  }

  // 3. Color Picker
  if (parameter.format === "color" || parameter.name.includes("color")) {
    return (
      <ColorPicker
        label={!compact ? label : undefined}
        value={currentValue}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

  // --- Standard Types ---

  // 4. Enumerations (Select)
  if ((parameter.enum || allowedValues) && parameter.type !== 'array') {
    const options = allowedValues || parameter.enum || []
    const strValue = currentValue !== undefined && currentValue !== null ? String(currentValue) : undefined

    return (
      <div className={cn("w-[110px]", compact ? "" : "space-y-1")}>
        {!compact && <LabelWithTooltip />}
        <Select
          value={strValue}
          onValueChange={(val) => {
            // Restore type if numeric
            if (parameter.type === 'integer' || parameter.type === 'number') {
              onChange(Number(val))
            } else {
              onChange(val)
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className={cn("w-full bg-background/50 border-white/10 glass-effect gap-2 justify-start", compact ? "h-9" : "h-10")}>
            <div className="flex items-center gap-2 text-xs font-semibold overflow-hidden">
              <div className="text-primary/70 shrink-0">{getParameterIcon(parameter.name)}</div>
              <SelectValue placeholder={label} />
            </div>
          </SelectTrigger>
          <SelectContent className="glass-effect border-white/10 min-w-[110px]">
            {options.map((opt: any) => (
              <SelectItem key={String(opt)} value={String(opt)} className="focus:bg-primary/10 focus:text-primary cursor-pointer px-2">
                <span className="text-xs font-medium">{String(opt)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }


  // 5. Booleans (Switch)
  if (parameter.type === "boolean") {
    return (
      <div className="flex items-center justify-between">
        <LabelWithTooltip />
        <Switch
          id={parameter.id}
          checked={currentValue === true || currentValue === "true"}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      </div>
    )
  }

  // 6. Numeric Ranges (Slider + Input)
  if ((parameter.type === "integer" || parameter.type === "number") &&
    parameter.min !== undefined && parameter.max !== undefined) {

    const step = parameter.step || (parameter.type === "integer" ? 1 : 0.01)

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <LabelWithTooltip />
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentValue ?? effectiveDefault}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Slider
            value={[Number(currentValue ?? effectiveDefault ?? parameter.min)]}
            onValueChange={(vals) => onChange(vals[0])}
            min={parameter.min}
            max={parameter.max}
            step={step}
            disabled={disabled}
            className="flex-1"
          />
          <Input
            type="number"
            className="w-20 h-9"
            value={currentValue ?? ""}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (!isNaN(val)) onChange(val)
            }}
            min={parameter.min}
            max={parameter.max}
            step={step}
            disabled={disabled}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>{parameter.min}</span>
          <span>{parameter.max}</span>
        </div>
      </div>
    )
  }

  // 7. Arrays (Dynamic List)
  if (parameter.type === "array") {
    return (
      <DynamicList
        label={!compact ? label : undefined}
        value={Array.isArray(currentValue) ? currentValue : []}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

  // 8. Long Text
  if (parameter.type === "string" && (parameter.name.includes("prompt") || parameter.format === "multiline")) {
    return (
      <div className="space-y-2">
        {!compact && <LabelWithTooltip />}
        <Textarea
          value={currentValue || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={4}
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      </div>
    )
  }

  // 9. Default Fallback (Input)
  return (
    <div className="space-y-2">
      {!compact && <LabelWithTooltip />}
      <Input
        type={parameter.type === "number" || parameter.type === "integer" ? "number" : "text"}
        value={currentValue ?? ""}
        onChange={(e) => {
          const val = e.target.value
          if (parameter.type === "number" || parameter.type === "integer") {
            onChange(val === "" ? undefined : Number(val))
          } else {
            onChange(val)
          }
        }}
        disabled={disabled}
        placeholder={`Enter ${label}...`}
      />
    </div>
  )
}