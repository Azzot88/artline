import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { AuthProvider } from "@/polymet/components/auth-provider"
import { ProtectedRoute } from "@/polymet/components/protected-route"
import { AdminRoute } from "@/polymet/components/admin-route"
import { AppLayout } from "@/polymet/layouts/app-layout"

// Pages
import { Workbench } from "@/polymet/pages/workbench"
import { Library } from "@/polymet/pages/library"
import { Gallery } from "@/polymet/pages/gallery"
import { Account } from "@/polymet/pages/account"
import { Dashboard } from "@/polymet/pages/dashboard"
import { ModelConfig } from "@/polymet/pages/model-config"
import { InstanceDetail } from "@/polymet/pages/instance-detail"
import { Login } from "@/polymet/pages/login"
import { Register } from "@/polymet/pages/register"
import { AdminPanel } from "@/polymet/pages/admin-panel"
import { AdminReview } from "@/polymet/pages/admin-review"
import { UserProfile } from "@/polymet/pages/user-profile"
import { LandingPage } from "@/polymet/pages/landing-page"
import DocumentsPage from "@/polymet/pages/documents-page"

// Admin Suite
import { AdminLayout } from "@/polymet/pages/admin/layout"
import { AdminDashboard } from "@/polymet/pages/admin/dashboard"
import { AdminUsers } from "@/polymet/pages/admin/users"
import { AdminModels } from "@/polymet/pages/admin/models"
import { AdminProviders } from "@/polymet/pages/admin/providers"
import { AdminReports } from "@/polymet/pages/admin/reports"
import { SystemHealthPage as AdminSystem } from "@/polymet/pages/admin/system-health"

import { Toaster } from "@/components/ui/sonner"

export default function AIWorkbenchApp() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Public App Routes (Accessible by Guests) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landingpage" element={<LandingPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/workbench" element={<AppLayout><Workbench /></AppLayout>} />
            <Route path="/library" element={<AppLayout><Library /></AppLayout>} />
            <Route path="/gallery" element={<AppLayout><Gallery /></AppLayout>} />
            <Route path="/instance/:instanceId" element={<AppLayout><InstanceDetail /></AppLayout>} />

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
              </Route>
              {/* Keep Review separate for now if needed, or integrate? */}
              <Route path="/admin/review" element={<AppLayout><AdminReview /></AppLayout>} />
            </Route>

          </Routes>
          <Toaster />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  )
}