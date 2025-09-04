import { createRootRouteWithContext, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { AuthForm } from '../components/AuthForm.tsx';
import ChatPage from '../components/ChatPage.tsx';
import {authService} from "../../services/authService.ts";

// Root route with typed context
export const rootRoute = createRootRouteWithContext<{ isAuthenticated: boolean }>()({
    beforeLoad: async () => {
        try {
            await authService.me();
            return { isAuthenticated: true };
        } catch {
            return { isAuthenticated: false };
        }
    },
});

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'login',
    component: AuthForm,
    beforeLoad: ({ context }) => {
        if (context.isAuthenticated) {
            throw redirect({ to: '/general-chat' });
        }
    },
});

// Page de chat générale (publique pour tester rapidement)
const generalChatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'general-chat',
  component: ChatPage,
    beforeLoad: ({ context }) => {
        if (!context.isAuthenticated) {
            throw redirect({ to: '/login' });
        }
    },
});

// Protected parent route
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/', // layout route with Outlet
  component: () => <Outlet />,
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    throw redirect({ to: '/general-chat'})
  },
}).addChildren([
  createRoute({
    getParentRoute: () => protectedRoute,
    path: 'logout',
    component: () => <div>Logout</div>,
  }),
]);

// Route tree
export const routeTree = rootRoute.addChildren([
  loginRoute,
  generalChatRoute,
  protectedRoute,
]);

// Router configuration
export const router = createRouter({
  routeTree,
    context: undefined as any,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}