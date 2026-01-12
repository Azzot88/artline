import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormatSelectorV2 } from "@/polymet/components/format-selector-v2"
import { ResolutionSelectorV2 } from "@/polymet/components/resolution-selector-v2"
import type { ModelParameter, ModelParameterConfig, ImageFormatType, VideoFormatType } from "@/polymet/data/types"
import { getEffectiveDefault, getAllowedValues, getParameterLabel } from "@/polymet/data/model-parameters-data"

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
  
  // Use effective default if value is null/undefined
  const currentValue = value ?? effectiveDefault

  // Special handling for "format" parameter
  if (parameter.name === "format") {
    // Determine if it's image or video based on allowed values
    const isVideoFormat = allowedValues?.some(v => ["16:9", "9:16"].includes(String(v)))
    const type = isVideoFormat ? "video" : "image"
    
    return (
      <FormatSelectorV2
        value={currentValue as ImageFormatType | VideoFormatType}
        onChange={onChange}
        type={type}
        disabled={disabled}
        compact={compact}
      />
    )
  }

  // Special handling for "resolution" or "size" parameter
  if (parameter.name === "resolution" || parameter.name === "size") {
    // This should be hidden in most cases, but if shown, use ResolutionSelectorV2
    // Note: We need format context to show proper resolutions
    // For now, just show as regular select
  }

  // String type with enum = Select
  if (parameter.type === "string" && allowedValues) {
    if (compact) {
      return (
        <Select
          value={currentValue || ""}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger id={parameter.id} className="h-9">
            <SelectValue placeholder={label} />
          </SelectTrigger>
          <SelectContent>
            {allowedValues.map((val) => (
              <SelectItem key={String(val)} value={String(val)}>
                {String(val)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    
    return (
      <div className="space-y-2">
        <Label htmlFor={parameter.id}>
          {label}
          {parameter.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select
          value={currentValue || ""}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger id={parameter.id}>
            <SelectValue placeholder={`Выберите ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {allowedValues.map((val) => (
              <SelectItem key={String(val)} value={String(val)}>
                {String(val)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // String type without enum = Input or Textarea
  if (parameter.type === "string") {
    const isLongText = parameter.name.includes("prompt") || parameter.name.includes("description")
    
    if (isLongText) {
      return (
        <div className="space-y-2">
          <Label htmlFor={parameter.id}>
            {label}
            {parameter.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            id={parameter.id}
            value={currentValue || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Введите ${label.toLowerCase()}`}
            disabled={disabled}
            rows={4}
          />
        </div>
      )
    }
    
    return (
      <div className="space-y-2">
        <Label htmlFor={parameter.id}>
          {label}
          {parameter.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id={parameter.id}
          type="text"
          value={currentValue || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Введите ${label.toLowerCase()}`}
          disabled={disabled}
        />
      </div>
    )
  }

  // Integer/Number with enum = Select
  if ((parameter.type === "integer" || parameter.type === "number") && allowedValues) {
    if (compact) {
      return (
        <Select
          value={String(currentValue ?? "")}
          onValueChange={(val) => onChange(parameter.type === "integer" ? parseInt(val) : parseFloat(val))}
          disabled={disabled}
        >
          <SelectTrigger id={parameter.id} className="h-9">
            <SelectValue placeholder={label} />
          </SelectTrigger>
          <SelectContent>
            {allowedValues.map((val) => (
              <SelectItem key={String(val)} value={String(val)}>
                {String(val)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    
    return (
      <div className="space-y-2">
        <Label htmlFor={parameter.id}>
          {label}
          {parameter.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select
          value={String(currentValue ?? "")}
          onValueChange={(val) => onChange(parameter.type === "integer" ? parseInt(val) : parseFloat(val))}
          disabled={disabled}
        >
          <SelectTrigger id={parameter.id}>
            <SelectValue placeholder={`Выберите ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {allowedValues.map((val) => (
              <SelectItem key={String(val)} value={String(val)}>
                {String(val)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // Integer/Number with min/max = Slider + Input
  if ((parameter.type === "integer" || parameter.type === "number") && 
      parameter.min !== undefined && parameter.max !== undefined) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={parameter.id}>
            {label}
            {parameter.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <span className="text-sm text-muted-foreground">
            {currentValue ?? effectiveDefault}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Slider
            id={parameter.id}
            value={[currentValue ?? effectiveDefault ?? parameter.min]}
            onValueChange={(vals) => onChange(vals[0])}
            min={parameter.min}
            max={parameter.max}
            step={parameter.type === "integer" ? 1 : 0.1}
            disabled={disabled}
            className="flex-1"
          />
          <Input
            type="number"
            value={currentValue ?? effectiveDefault ?? ""}
            onChange={(e) => {
              const val = parameter.type === "integer" 
                ? parseInt(e.target.value) 
                : parseFloat(e.target.value)
              if (!isNaN(val)) onChange(val)
            }}
            min={parameter.min}
            max={parameter.max}
            step={parameter.type === "integer" ? 1 : 0.1}
            disabled={disabled}
            className="w-20"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{parameter.min}</span>
          <span>{parameter.max}</span>
        </div>
      </div>
    )
  }

  // Integer/Number without constraints = Input
  if (parameter.type === "integer" || parameter.type === "number") {
    return (
      <div className="space-y-2">
        <Label htmlFor={parameter.id}>
          {label}
          {parameter.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id={parameter.id}
          type="number"
          value={currentValue ?? ""}
          onChange={(e) => {
            const val = parameter.type === "integer" 
              ? parseInt(e.target.value) 
              : parseFloat(e.target.value)
            if (!isNaN(val)) onChange(val)
          }}
          placeholder={`Введите ${label.toLowerCase()}`}
          disabled={disabled}
        />
      </div>
    )
  }

  // Boolean = Switch
  if (parameter.type === "boolean") {
    return (
      <div className="flex items-center justify-between">
        <Label htmlFor={parameter.id} className="cursor-pointer">
          {label}
          {parameter.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Switch
          id={parameter.id}
          checked={currentValue ?? false}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      </div>
    )
  }

  // Array/Object = JSON textarea (fallback)
  if (parameter.type === "array" || parameter.type === "object") {
    return (
      <div className="space-y-2">
        <Label htmlFor={parameter.id}>
          {label} (JSON)
          {parameter.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Textarea
          id={parameter.id}
          value={typeof currentValue === "string" ? currentValue : JSON.stringify(currentValue, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              onChange(parsed)
            } catch {
              onChange(e.target.value)
            }
          }}
          placeholder={`Введите JSON для ${label.toLowerCase()}`}
          disabled={disabled}
          rows={4}
          className="font-mono text-sm"
        />
      </div>
    )
  }

  // Fallback
  return (
    <div className="space-y-2">
      <Label htmlFor={parameter.id}>
        {label}
        {parameter.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={parameter.id}
        value={String(currentValue ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Введите ${label.toLowerCase()}`}
        disabled={disabled}
      />
    </div>
  )
}