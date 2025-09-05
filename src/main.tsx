import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routes/routeTree.tsx';
import './index.css';

// Crée le routeur avec la configuration
const router = createRouter({
  routeTree,
  context: {
    isAuthenticated: false,
  },
});

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    //<StrictMode>
      <RouterProvider router={router} />
    //</StrictMode>,
  );
}
