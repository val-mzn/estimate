import { initTheme } from './utils/initTheme'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import HomePage from './pages/HomePage.tsx'
import CreateRoomPage from './pages/CreateRoomPage.tsx'
import JoinRoomPage from './pages/JoinRoomPage.tsx'
import RoomPage from './pages/RoomPage.tsx'
import { useThemeStore } from './stores/themeStore'

// Initialize theme before React renders to prevent flash
initTheme()

// Sync store with initialized theme
useThemeStore.getState().setTheme(useThemeStore.getState().theme)

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'create-room',
        element: <CreateRoomPage />,
      },
      {
        path: 'join-room',
        element: <JoinRoomPage />,
      },
      {
        path: 'room/:roomCode',
        element: <RoomPage />,
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
