import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { queryClient } from './lib/api'
import './i18n'
import './index.css'

// Import components and pages
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'
import { Feed } from './pages/Feed'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'
import { Admin } from './pages/Admin'
import { PostDetail } from './pages/PostDetail'
import { LoginForm } from './components/auth/LoginForm'
import { RegisterForm } from './components/auth/RegisterForm'
import { SearchPage } from './pages/Search'
import { Notifications } from './pages/Notifications'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'feed', element: <Feed /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'post/:id', element: <PostDetail /> },
      { path: 'profile/:id?', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
      { path: 'admin', element: <Admin /> },
    ],
  },
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/register',
    element: <RegisterForm />,
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)