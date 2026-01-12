import { BrowserRouter } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  RocketIcon, 
  PackageIcon, 
  ServerIcon, 
  GlobeIcon, 
  CheckCircle2Icon,
  AlertCircleIcon,
  CodeIcon,
  SettingsIcon
} from "lucide-react"

export default function DeploymentReadmeRender() {
  return (
    <BrowserRouter>
      <div className="p-8 max-w-6xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">AI Workbench</h1>
          <p className="text-xl text-muted-foreground">Deployment Guide</p>
        </div>

        {/* Quick Start */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <RocketIcon className="w-6 h-6" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-lg px-3 py-1">1</Badge>
                <code className="text-lg bg-background px-4 py-2 rounded border border-border">
                  npm run build
                </code>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-lg px-3 py-1">2</Badge>
                <code className="text-lg bg-background px-4 py-2 rounded border border-border">
                  npm run preview
                </code>
                <span className="text-muted-foreground">(optional)</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-lg px-3 py-1">3</Badge>
                <span className="text-lg">Deploy dist/ folder to your server</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageIcon className="w-5 h-5" />
                What's Included
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                <span>AI Workbench (Image/Video generation)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                <span>Gallery with filters and search</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                <span>Account & user settings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                <span>Admin dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                <span>Model configuration</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                <span>Multi-language (RU, KK, KY, EN)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                <span>Dark/Light mode</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                <span>Responsive design</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GlobeIcon className="w-5 h-5" />
                Deployment Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="p-2 border border-border rounded">GitHub Pages</div>
              <div className="p-2 border border-border rounded">Netlify</div>
              <div className="p-2 border border-border rounded">Vercel</div>
              <div className="p-2 border border-border rounded">AWS S3 + CloudFront</div>
              <div className="p-2 border border-border rounded">Cloudflare Pages</div>
              <div className="p-2 border border-border rounded">Your Own Server (Nginx)</div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">API Backend</p>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded">
                  <p className="text-sm text-muted-foreground mb-1">Default:</p>
                  <code className="text-sm">API_BASE_URL = "/api"</code>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-sm text-muted-foreground mb-1">Custom (.env.production):</p>
                  <code className="text-sm">VITE_API_BASE_URL=https://api.yourdomain.com</code>
                </div>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Routes (React Router)</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 border border-border rounded font-mono">/</div>
                <div className="p-2 border border-border rounded font-mono">/gallery</div>
                <div className="p-2 border border-border rounded font-mono">/account</div>
                <div className="p-2 border border-border rounded font-mono">/dashboard</div>
                <div className="p-2 border border-border rounded font-mono">/instance/:id</div>
                <div className="p-2 border border-border rounded font-mono">/model-config</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ServerIcon className="w-5 h-5" />
              Backend API Endpoints
            </CardTitle>
            <CardDescription>Expected endpoints from backend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
              <div className="space-y-1">
                <p className="font-semibold text-foreground mb-2">Authentication</p>
                <div className="text-muted-foreground">POST /api/auth/login</div>
                <div className="text-muted-foreground">POST /api/auth/logout</div>
                <div className="text-muted-foreground">GET /api/auth/me</div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground mb-2">Generations</p>
                <div className="text-muted-foreground">GET /api/generations</div>
                <div className="text-muted-foreground">POST /api/generations</div>
                <div className="text-muted-foreground">GET /api/generations/:id</div>
                <div className="text-muted-foreground">DELETE /api/generations/:id</div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground mb-2">Models</p>
                <div className="text-muted-foreground">GET /api/models</div>
                <div className="text-muted-foreground">GET /api/models/:id</div>
                <div className="text-muted-foreground">PUT /api/models/:id</div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground mb-2">User</p>
                <div className="text-muted-foreground">GET /api/user/profile</div>
                <div className="text-muted-foreground">PATCH /api/user/profile</div>
                <div className="text-muted-foreground">POST /api/user/credits/purchase</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircleIcon className="w-5 h-5" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">404 on page refresh</p>
              <p className="text-muted-foreground">Configure server to serve index.html for all routes</p>
            </div>
            <div>
              <p className="font-medium">CORS errors</p>
              <p className="text-muted-foreground">Use /api proxy or configure CORS on backend</p>
            </div>
            <div>
              <p className="font-medium">Blank page</p>
              <p className="text-muted-foreground">Check browser console and verify base URL</p>
            </div>
            <div>
              <p className="font-medium">API calls failing</p>
              <p className="text-muted-foreground">Check Network tab, verify backend URL and CORS</p>
            </div>
          </CardContent>
        </Card>

        {/* Production Checklist */}
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2Icon className="w-5 h-5" />
              Production Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {[
                "Build succeeds",
                "Test locally",
                "Backend URL configured",
                "CORS configured",
                "SPA routing configured",
                "SSL certificate installed",
                "All routes work",
                "API calls working",
                "Images loading",
                "Dark/Light mode working",
                "Language switching working",
                "Mobile responsive"
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 border border-border rounded text-center">
                <div className="text-2xl mb-1">🇷🇺</div>
                <div className="text-sm font-medium">Русский</div>
              </div>
              <div className="p-3 border border-border rounded text-center">
                <div className="text-2xl mb-1">🇰🇿</div>
                <div className="text-sm font-medium">Қазақша</div>
              </div>
              <div className="p-3 border border-border rounded text-center">
                <div className="text-2xl mb-1">🇰🇬</div>
                <div className="text-sm font-medium">Кыргызча</div>
              </div>
              <div className="p-3 border border-border rounded text-center">
                <div className="text-2xl mb-1">🇬🇧</div>
                <div className="text-sm font-medium">English</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files to Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CodeIcon className="w-5 h-5" />
              Key Files
            </CardTitle>
            <CardDescription>Important files for configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-mono">
            <div className="p-2 bg-muted rounded">@/polymet/data/api-client.tsx</div>
            <div className="p-2 bg-muted rounded">@/polymet/data/api-service.tsx</div>
            <div className="p-2 bg-muted rounded">@/polymet/prototypes/ai-workbench-app.tsx</div>
            <div className="p-2 bg-muted rounded">vite.config.ts</div>
            <div className="p-2 bg-muted rounded">.env.production</div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}