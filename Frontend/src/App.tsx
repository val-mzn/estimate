import { Outlet } from 'react-router'
import { ThemeToggle } from './components/ThemeToggle'
import { LanguageToggle } from './components/LanguageToggle'
import { Toaster } from './components/ui/sonner'

export default function App() {
  return (
    <>
      <Outlet />
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <Toaster />
    </>
  )
}