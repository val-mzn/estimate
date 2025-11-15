import { Outlet } from 'react-router'
import { ThemeToggle } from './components/ThemeToggle'
import { Toaster } from './components/ui/sonner'

export default function App() {
  return (
    <>
      <Outlet />
      <ThemeToggle />
      <Toaster />
    </>
  )
}