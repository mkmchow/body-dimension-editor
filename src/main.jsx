// At the very top of your main entry file (e.g., main.jsx)
localStorage.removeItem('leva'); // or localStorage.clear() if safe

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
