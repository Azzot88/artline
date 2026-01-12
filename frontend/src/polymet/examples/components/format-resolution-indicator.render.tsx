import { BrowserRouter } from "react-router-dom"
import { FormatResolutionIndicator } from "@/polymet/components/format-resolution-indicator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FormatResolutionIndicatorRender() {
  return (
    <BrowserRouter>
      <div className="p-8 max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Format & Resolution Indicator</h2>
          <p className="text-muted-foreground">
            Индикатор текущего формата и разрешения
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Примеры индикаторов</CardTitle>
            <CardDescription>Различные комбинации формата и разрешения</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormatResolutionIndicator 
              format="1:1"
              resolution="1024x1024"
            />
            
            <FormatResolutionIndicator 
              format="16:9"
              resolution="1920x1080"
            />
            
            <FormatResolutionIndicator 
              format="2:3"
              resolution="1024x1536"
            />
            
            <FormatResolutionIndicator 
              format="9:16"
              resolution="1080x1920"
            />
            
            <FormatResolutionIndicator 
              format="3:2"
              resolution="3072x2048"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>В контексте Мастерской</CardTitle>
            <CardDescription>Как это будет выглядеть на странице</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-border rounded-lg bg-muted/30">
              <FormatResolutionIndicator 
                format="16:9"
                resolution="1920x1080"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}