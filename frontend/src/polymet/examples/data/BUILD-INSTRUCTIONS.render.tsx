import { BrowserRouter } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2Icon, PackageIcon, ServerIcon, RocketIcon, AlertCircleIcon } from "lucide-react"

export default function BuildInstructionsRender() {
  return (
    <BrowserRouter>
      <div className="p-8 max-w-5xl space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">📦 Build Instructions</h2>
          <p className="text-muted-foreground">
            Simple guide to export your React app as static files
          </p>
        </div>

        {/* Quick Start */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RocketIcon className="w-5 h-5" />
              Quick Start
            </CardTitle>
            <CardDescription>Get your app deployed in 3 steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="mt-1">1</Badge>
                <div>
                  <p className="font-medium">Build the app</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">npm run build</code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-1">2</Badge>
                <div>
                  <p className="font-medium">Upload dist/ folder to your server</p>
                  <p className="text-sm text-muted-foreground">Any static hosting works</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-1">3</Badge>
                <div>
                  <p className="font-medium">Configure SPA routing</p>
                  <p className="text-sm text-muted-foreground">Serve index.html for all routes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Build Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="w-5 h-5" />
              What You Get
            </CardTitle>
            <CardDescription>Production-ready static files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500 mt-1" />
                <div>
                  <p className="font-medium text-sm">Optimized Build</p>
                  <p className="text-xs text-muted-foreground">Minified JS & CSS</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500 mt-1" />
                <div>
                  <p className="font-medium text-sm">Code Splitting</p>
                  <p className="text-xs text-muted-foreground">Faster page loads</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500 mt-1" />
                <div>
                  <p className="font-medium text-sm">Cache Busting</p>
                  <p className="text-xs text-muted-foreground">Hashed filenames</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2Icon className="w-4 h-4 text-green-500 mt-1" />
                <div>
                  <p className="font-medium text-sm">Static Files</p>
                  <p className="text-xs text-muted-foreground">Deploy anywhere</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ServerIcon className="w-5 h-5" />
              API Configuration
            </CardTitle>
            <CardDescription>Backend integration setup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Default Configuration:</p>
              <code className="text-sm bg-muted px-3 py-2 rounded block">
                API_BASE_URL = "/api"
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                All API calls go to: https://yourdomain.com/api/...
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Custom Backend URL:</p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Create .env.production:</p>
                <code className="text-sm bg-muted px-3 py-2 rounded block">
                  VITE_API_BASE_URL=https://api.yourdomain.com
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deployment Options */}
        <Card>
          <CardHeader>
            <CardTitle>Deployment Options</CardTitle>
            <CardDescription>Where you can deploy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                "GitHub Pages",
                "Netlify",
                "Vercel",
                "AWS S3",
                "Cloudflare Pages",
                "Your Server"
              ].map(platform => (
                <div key={platform} className="p-3 border border-border rounded-lg text-center">
                  <p className="text-sm font-medium">{platform}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircleIcon className="w-5 h-5" />
              Common Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">404 on page refresh?</p>
              <p className="text-muted-foreground">Configure server to serve index.html for all routes</p>
            </div>
            <div>
              <p className="font-medium">CORS errors?</p>
              <p className="text-muted-foreground">Set up /api proxy or configure CORS on backend</p>
            </div>
            <div>
              <p className="font-medium">Blank page?</p>
              <p className="text-muted-foreground">Check browser console and verify base URL</p>
            </div>
          </CardContent>
        </Card>

        {/* Routes */}
        <Card>
          <CardHeader>
            <CardTitle>App Routes</CardTitle>
            <CardDescription>All routes handled by React Router</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between p-2 border border-border rounded">
                <span>/</span>
                <span className="text-muted-foreground">Workbench</span>
              </div>
              <div className="flex justify-between p-2 border border-border rounded">
                <span>/gallery</span>
                <span className="text-muted-foreground">Gallery</span>
              </div>
              <div className="flex justify-between p-2 border border-border rounded">
                <span>/instance/:id</span>
                <span className="text-muted-foreground">Instance Detail</span>
              </div>
              <div className="flex justify-between p-2 border border-border rounded">
                <span>/account</span>
                <span className="text-muted-foreground">Account</span>
              </div>
              <div className="flex justify-between p-2 border border-border rounded">
                <span>/dashboard</span>
                <span className="text-muted-foreground">Dashboard</span>
              </div>
              <div className="flex justify-between p-2 border border-border rounded">
                <span>/model-config</span>
                <span className="text-muted-foreground">Model Config</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BrowserRouter>
  )
}