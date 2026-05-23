import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './AppV2.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { DataProvider } from './context/DataContext.tsx'
import { DialogsProvider } from './components/DialogsContext.tsx'
import { initializeStorage } from './lib/initializeStorage'
import './index.css'

// Initialize storage buckets on app start
initializeStorage().catch(console.warn)

const container = document.getElementById('root')
if (!container) throw new Error('No #root element found')

createRoot(container).render(
  <StrictMode>
    <AuthProvider>
      <DataProvider>
        <DialogsProvider>
          <App />
        </DialogsProvider>
      </DataProvider>
    </AuthProvider>
  </StrictMode>
)
