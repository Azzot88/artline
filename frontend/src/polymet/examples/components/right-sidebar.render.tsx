import { BrowserRouter } from "react-router-dom"
import { RightSidebar } from "@/polymet/components/right-sidebar"

export default function RightSidebarRender() {
  return (
    <BrowserRouter>
      <div className="h-screen">
        <RightSidebar />
      </div>
    </BrowserRouter>
  )
}