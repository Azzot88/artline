import { BrowserRouter } from "react-router-dom"
import { useState } from "react"
import { FormatSelectorV2 } from "@/polymet/components/format-selector-v2"
import type { ImageFormatType, VideoFormatType } from "@/polymet/data/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FormatSelectorV2Render() {
  const [imageFormat, setImageFormat] = useState<ImageFormatType>("1:1")
  const [videoFormat, setVideoFormat] = useState<VideoFormatType>("16:9")

  return (
    <BrowserRouter>
      <div className="p-8 max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Format Selector V2</h2>
          <p className="text-muted-foreground">
            Выбор формата с иконками для изображений и видео
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Формат изображения</CardTitle>
              <CardDescription>Normal mode</CardDescription>
            </CardHeader>
            <CardContent>
              <FormatSelectorV2 
                value={imageFormat}
                onChange={setImageFormat}
                type="image"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Selected: {imageFormat}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Формат видео</CardTitle>
              <CardDescription>Normal mode</CardDescription>
            </CardHeader>
            <CardContent>
              <FormatSelectorV2 
                value={videoFormat}
                onChange={setVideoFormat}
                type="video"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Selected: {videoFormat}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compact Mode</CardTitle>
              <CardDescription>Для использования в Мастерской</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="w-[150px]">
                  <FormatSelectorV2 
                    value={imageFormat}
                    onChange={setImageFormat}
                    type="image"
                    compact
                  />
                </div>
                <div className="w-[150px]">
                  <FormatSelectorV2 
                    value={videoFormat}
                    onChange={setVideoFormat}
                    type="video"
                    compact
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BrowserRouter>
  )
}