import { createRootRouteWithContext, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router'
import { AuthForm } from '../components/AuthForm.tsx'
import ChatPage from '../components/ChatPage.tsx'
import { authService } from '../../services/authService.ts'

// Root route with typed context
export const rootRoute = createRootRouteWithContext<{ isAuthenticated: boolean }>()({
  beforeLoad: async () => {
    try {
      await authService.me()
      return { isAuthenticated: true }
    } catch {
      return { isAuthenticated: false }
    }
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  component: AuthForm,
  beforeLoad: ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: '/general-chat' })
    }
  },
})

const generalChatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'general-chat',
  component: ChatPage,
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
})

// Protected parent route (declare first, then attach children to avoid self-reference in initializer)
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/', // layout route
  component: () => <Outlet />,
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
    // Default redirect when hitting '/'
    throw redirect({ to: '/general-chat' })
  },
})

// Child of protected route (declared after protectedRoute to avoid TS7022/TS7023)
const logoutRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: 'logout',
  component: () => <div>Logout</div>,
})

// Attach children after declarations
protectedRoute.addChildren([logoutRoute])

// Route tree
export const routeTree = rootRoute.addChildren([loginRoute, generalChatRoute, protectedRoute])

// Router configuration
export const router = createRouter({
  routeTree,
  // Initial context (updated by rootRoute.beforeLoad)
  context: { isAuthenticated: false } as { isAuthenticated: boolean },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}