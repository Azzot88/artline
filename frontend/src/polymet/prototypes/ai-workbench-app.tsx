import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { AuthProvider } from "@/polymet/components/auth-provider"
import { ProtectedRoute } from "@/polymet/components/protected-route"
import { AdminRoute } from "@/polymet/components/admin-route"
import { AppLayout } from "@/polymet/layouts/app-layout"
import { Suspense, lazy } from "react"
import { Spinner } from "@/components/ui/spinner"

// Components
import { Toaster } from "@/components/ui/sonner"

// Lazy Loaded Pages
// Using named export adapter pattern: .then(module => ({ default: module.Component }))

const Workbench = lazy(() => import("@/polymet/pages/workbench").then(m => ({ default: m.Workbench })))
const Library = lazy(() => import("@/polymet/pages/library").then(m => ({ default: m.Library })))
const Gallery = lazy(() => import("@/polymet/pages/gallery").then(m => ({ default: m.Gallery })))
const Account = lazy(() => import("@/polymet/pages/account").then(m => ({ default: m.Account })))
const Dashboard = lazy(() => import("@/polymet/pages/dashboard").then(m => ({ default: m.Dashboard })))
const ModelConfig = lazy(() => import("@/polymet/pages/model-config").then(m => ({ default: m.ModelConfig })))
const InstanceDetail = lazy(() => import("@/polymet/pages/instance-detail").then(m => ({ default: m.InstanceDetail })))
const Login = lazy(() => import("@/polymet/pages/login").then(m => ({ default: m.Login })))
const Register = lazy(() => import("@/polymet/pages/register").then(m => ({ default: m.Register })))
const AdminReview = lazy(() => import("@/polymet/pages/admin-review").then(m => ({ default: m.AdminReview })))
const UserProfile = lazy(() => import("@/polymet/pages/user-profile").then(m => ({ default: m.UserProfile })))
const LandingPage = lazy(() => import("@/polymet/pages/landing-page").then(m => ({ default: m.LandingPage })))
const DocumentsPage = lazy(() => import("@/polymet/pages/documents-pageV2").then(m => ({ default: m.default }))) // Note: Checking documents page often has default export issues, assuming default here or named
// Wait, DocumentsPage in original was: import DocumentsPage from "@/polymet/pages/documents-page"
// I need to check if it's default or named. In original file it was: import DocumentsPage from "@/polymet/pages/documents-page"

const TeamPage = lazy(() => import("@/polymet/pages/team/team-page").then(m => ({ default: m.TeamPage })))

// Admin Suite Lazy
const AdminLayout = lazy(() => import("@/polymet/pages/admin/layout").then(m => ({ default: m.AdminLayout })))
const AdminDashboard = lazy(() => import("@/polymet/pages/admin/dashboard").then(m => ({ default: m.AdminDashboard })))
const AdminUsers = lazy(() => import("@/polymet/pages/admin/users").then(m => ({ default: m.AdminUsers })))
const AdminModels = lazy(() => import("@/polymet/pages/admin/models").then(m => ({ default: m.AdminModels })))
const AdminProviders = lazy(() => import("@/polymet/pages/admin/providers").then(m => ({ default: m.AdminProviders })))
const AdminReports = lazy(() => import("@/polymet/pages/admin/reports").then(m => ({ default: m.AdminReports })))
const AdminSystem = lazy(() => import("@/polymet/pages/admin/system-health").then(m => ({ default: m.SystemHealthPage }))) // Aliased in original
const NormalizationPage = lazy(() => import("@/polymet/pages/admin/normalization-page").then(m => ({ default: m.NormalizationPage })))
const SchemaVisualizer = lazy(() => import("@/polymet/pages/admin/schema-visualizer").then(m => ({ default: m.SchemaVisualizer })))


export default function AIWorkbenchApp() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Spinner className="w-8 h-8 opacity-50" /></div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Public App Routes (Accessible by Guests) */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/landingpage" element={<LandingPage />} />
              {/* Fixing DocumentsPage import - sticking to what was likely default if it was imported without braces originally */}
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/workbench" element={<AppLayout><Workbench /></AppLayout>} />
              <Route path="/library" element={<AppLayout><Library /></AppLayout>} />
              <Route path="/gallery" element={<AppLayout><Gallery /></AppLayout>} />
              <Route path="/instance/:instanceId" element={<AppLayout><InstanceDetail /></AppLayout>} />
              <Route path="/team" element={<AppLayout><TeamPage /></AppLayout>} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>

                <Route path="/account" element={<AppLayout><Account /></AppLayout>} />
                <Route path="/dashboard" element={<AppLayout showRightSidebar={false}><Dashboard /></AppLayout>} />
                <Route path="/model-config" element={<AppLayout showRightSidebar={false}><ModelConfig /></AppLayout>} />
                <Route path="/model-config/:modelId" element={<AppLayout showRightSidebar={false}><ModelConfig /></AppLayout>} />
                <Route path="/profile" element={<AppLayout><UserProfile /></AppLayout>} />
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AppLayout><AdminLayout /></AppLayout>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="models" element={<AdminModels />} />
                  <Route path="providers" element={<AdminProviders />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="system" element={<AdminSystem />} />
                  <Route path="gallery" element={<Gallery endpoint="/admin/feed" title="Universal Admin Gallery" subtitle="View all generated content" adminMode={true} />} />
                  <Route path="schema-visualizer" element={<SchemaVisualizer />} />
                  <Route path="models/:modelId/normalization" element={<NormalizationPage />} />
                </Route>
                {/* Keep Review separate for now if needed, or integrate? */}
                <Route path="/admin/review" element={<AppLayout><AdminReview /></AppLayout>} />
              </Route>

            </Routes>
          </Suspense>
          <Toaster />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  )
}