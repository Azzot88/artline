import { BrowserRouter } from "react-router-dom"
import { useState } from "react"
import { ResolutionSelectorV2, getDefaultResolution } from "@/polymet/components/resolution-selector-v2"
import { FormatSelectorV2 } from "@/polymet/components/format-selector-v2"
import type { ImageFormatType, VideoFormatType } from "@/polymet/data/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResolutionSelectorV2Render() {
  const [imageFormat, setImageFormat] = useState<ImageFormatType>("1:1")
  const [imageResolution, setImageResolution] = useState(getDefaultResolution("1:1"))
  
  const [videoFormat, setVideoFormat] = useState<VideoFormatType>("16:9")
  const [videoResolution, setVideoResolution] = useState(getDefaultResolution("16:9"))

  // Update resolution when format changes
  const handleImageFormatChange = (format: ImageFormatType) => {
    setImageFormat(format)
    setImageResolution(getDefaultResolution(format))
  }

  const handleVideoFormatChange = (format: VideoFormatType) => {
    setVideoFormat(format)
    setVideoResolution(getDefaultResolution(format))
  }

  return (
    <BrowserRouter>
      <div className="p-8 max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Resolution Selector V2</h2>
          <p className="text-muted-foreground">
            Выбор разрешения на основе выбранного формата
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Изображение</CardTitle>
              <CardDescription>Формат + разрешение</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormatSelectorV2 
                value={imageFormat}
                onChange={handleImageFormatChange}
                type="image"
              />
              <ResolutionSelectorV2 
                value={imageResolution}
                onChange={setImageResolution}
                format={imageFormat}
              />
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">Выбрано:</p>
                <p className="text-muted-foreground">
                  Формат: {imageFormat} • Разрешение: {imageResolution}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Видео</CardTitle>
              <CardDescription>Формат + разрешение</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormatSelectorV2 
                value={videoFormat}
                onChange={handleVideoFormatChange}
                type="video"
              />
              <ResolutionSelectorV2 
                value={videoResolution}
                onChange={setVideoResolution}
                format={videoFormat}
              />
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">Выбрано:</p>
                <p className="text-muted-foreground">
                  Формат: {videoFormat} • Разрешение: {videoResolution}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compact Mode</CardTitle>
              <CardDescription>Для Мастерской (inline)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="w-[150px]">
                  <FormatSelectorV2 
                    value={imageFormat}
                    onChange={handleImageFormatChange}
                    type="image"
                    compact
                  />
                </div>
                <div className="w-[150px]">
                  <ResolutionSelectorV2 
                    value={imageResolution}
                    onChange={setImageResolution}
                    format={imageFormat}
                    compact
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Restrictions</CardTitle>
              <CardDescription>Ограниченные разрешения</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResolutionSelectorV2 
                value={imageResolution}
                onChange={setImageResolution}
                format={imageFormat}
                allowedResolutions={["512x512", "1024x1024"]} // Admin limited
              />
              <p className="text-xs text-muted-foreground">
                Админ разрешил только SD и HD качество
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </BrowserRouter>
  )
}