import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { UserProvider } from "@/polymet/components/user-provider" // New
import { AppLayout } from "@/polymet/layouts/app-layout"
import { Workbench } from "@/polymet/pages/workbench"
import { Gallery } from "@/polymet/pages/gallery"
import { Account } from "@/polymet/pages/account"
import { Dashboard } from "@/polymet/pages/dashboard"
import { ModelConfig } from "@/polymet/pages/model-config"
import { InstanceDetail } from "@/polymet/pages/instance-detail"

export default function AIWorkbenchApp() {
  return (
    <Router>
      <LanguageProvider>
        <UserProvider>
          <Routes>
            <Route path="/" element={<AppLayout><Workbench /></AppLayout>} />
            <Route path="/workbench" element={<AppLayout><Workbench /></AppLayout>} />
            <Route path="/gallery" element={<AppLayout><Gallery /></AppLayout>} />
            <Route path="/instance/:instanceId" element={<AppLayout><InstanceDetail /></AppLayout>} />
            <Route path="/account" element={<AppLayout><Account /></AppLayout>} />
            <Route path="/dashboard" element={<AppLayout showRightSidebar={false}><Dashboard /></AppLayout>} />
            <Route path="/model-config" element={<AppLayout showRightSidebar={false}><ModelConfig /></AppLayout>} />
            <Route path="/model-config/:modelId" element={<AppLayout showRightSidebar={false}><ModelConfig /></AppLayout>} />
          </Routes>
        </UserProvider>
      </LanguageProvider>
    </Router>
  )
}