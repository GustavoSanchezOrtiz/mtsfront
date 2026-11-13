import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AppRouter } from './routes/AppRouter.jsx'
import './index.css'
import { registerServiceWorker } from './registerServiceWorker'

// Registro del Service Worker para funcionamiento como PWA
registerServiceWorker()

/**
 * En @heroui/react v3 los componentes son autónomos y no requieren Provider monolítico.
 * Mantenemos HeroUIProvider como wrapper seguro para compatibilidad de arquitectura.
 */
const HeroUIProvider = ({ children }) => <>{children}</>;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "TU_CLIENT_ID"}>
      <HeroUIProvider>
        <main className="dark text-foreground bg-background min-h-screen">
          <AppRouter />
        </main>
      </HeroUIProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
