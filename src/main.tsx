import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { SecurityErrorBoundary } from './components/security/ErrorBoundary'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SecurityErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </SecurityErrorBoundary>
  </StrictMode>,
)
