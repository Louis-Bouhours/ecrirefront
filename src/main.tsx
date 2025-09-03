import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Version temporaire en attendant que les routes se génèrent
// eslint-disable-next-line react-refresh/only-export-components
function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Ecrirefront</h1>
      <p>Configuration des routes en cours...</p>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)