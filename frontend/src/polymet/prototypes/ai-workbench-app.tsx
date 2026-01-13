import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { AuthProvider } from "@/polymet/components/auth-provider"
import { ProtectedRoute } from "@/polymet/components/protected-route"
import { AdminRoute } from "@/polymet/components/admin-route"
import { AppLayout } from "@/polymet/layouts/app-layout"

// Pages
import { Workbench } from "@/polymet/pages/workbench"
import { Gallery } from "@/polymet/pages/gallery"
import { Account } from "@/polymet/pages/account"
import { Dashboard } from "@/polymet/pages/dashboard"
import { ModelConfig } from "@/polymet/pages/model-config"
import { InstanceDetail } from "@/polymet/pages/instance-detail"
import { Login } from "@/polymet/pages/login"
import { Register } from "@/polymet/pages/register"
import { AdminPanel } from "@/polymet/pages/admin-panel"
import { UserProfile } from "@/polymet/pages/user-profile"
import { LandingPage } from "@/polymet/pages/landing-page"

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
            <Route path="/workbench" element={<AppLayout><Workbench /></AppLayout>} />
            <Route path="/gallery" element={<AppLayout><Gallery /></AppLayout>} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/instance/:instanceId" element={<AppLayout><InstanceDetail /></AppLayout>} />
              <Route path="/account" element={<AppLayout><Account /></AppLayout>} />
              <Route path="/dashboard" element={<AppLayout showRightSidebar={false}><Dashboard /></AppLayout>} />
              <Route path="/model-config" element={<AppLayout showRightSidebar={false}><ModelConfig /></AppLayout>} />
              <Route path="/model-config/:modelId" element={<AppLayout showRightSidebar={false}><ModelConfig /></AppLayout>} />
              <Route path="/profile" element={<AppLayout><UserProfile /></AppLayout>} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AppLayout><AdminPanel /></AppLayout>} />
            </Route>

          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  )
}