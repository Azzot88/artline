import { BrowserRouter } from "react-router-dom"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { Workbench } from "@/polymet/pages/workbench"
import { WorkbenchLayout } from "@/polymet/layouts/workbench-layout"

export default function WorkbenchRender() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <WorkbenchLayout>
          <Workbench />
        </WorkbenchLayout>
      </LanguageProvider>
    </BrowserRouter>
  )
}