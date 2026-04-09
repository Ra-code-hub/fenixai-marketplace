// ============================================================
// src/main.jsx — Punto de entrada de la aplicacion
// ============================================================

import { createRoot }    from 'react-dom/client'
import '@/styles/global.css'
import { AuthProvider }  from '@/context/AuthContext'
import { CartProvider }  from '@/context/CartContext'
import App               from './App'

const rootElement = document.getElementById('root')

createRoot(rootElement).render(
  <AuthProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </AuthProvider>
)