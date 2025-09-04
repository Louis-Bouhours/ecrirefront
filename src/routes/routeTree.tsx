import { createRootRouteWithContext, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { AuthForm } from '../components/AuthForm.tsx';
import ChatPage from '../components/ChatPage.tsx';

// Root route with typed context
export const rootRoute = createRootRouteWithContext<{ isAuthenticated: boolean }>()();

// Public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  component: AuthForm,
});

// Page de chat générale (publique pour tester rapidement)
const generalChatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'general-chat',
  component: ChatPage,
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
  context: {
    isAuthenticated: false,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}