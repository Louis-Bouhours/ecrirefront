import { createRootRouteWithContext, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { AuthForm } from '../components/AuthForm.tsx';
import { ChatRoom } from '../components/ChatRoom.tsx';

// Root route with typed context
export const rootRoute = createRootRouteWithContext<{ isAuthenticated: boolean }>()();

// Public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  component: AuthForm,
});

const chatTokenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'chat/token',
  component: ChatRoom,
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
  // Add other protected children here as needed
]);

// Route tree
export const routeTree = rootRoute.addChildren([
  loginRoute,
  chatTokenRoute,
  protectedRoute,
]);

// Router configuration
export const router = createRouter({
  routeTree,
  context: {
    isAuthenticated: false,
  },
});

// Types for TanStack Router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}