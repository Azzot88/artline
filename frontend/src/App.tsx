import AIWorkbenchApp from "@/polymet/prototypes/ai-workbench-app"
import { LanguageProvider } from "@/polymet/components/language-provider"
import { ThemeProvider } from "@/components/theme-provider"


export default function AIWorkbenchAppRender() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AIWorkbenchApp />
    </ThemeProvider>
  )
}