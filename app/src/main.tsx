import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import "./i18n";
import { ThemeProvider } from './components/ThemeProvider'
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <Toaster position="top-center" expand={true}/>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)