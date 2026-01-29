import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { HelmetProvider } from 'react-helmet-async'; // <--- Import this

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider> {/* <--- Wrap App with this */}
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)