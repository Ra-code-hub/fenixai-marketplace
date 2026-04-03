// ============================================================
// src/main.jsx — Punto de entrada de la aplicacion
// ============================================================

import { StrictMode }    from 'react'
import { createRoot }    from 'react-dom/client'
import '@/styles/global.css'
import { AuthProvider }  from '@/context/AuthContext'
import { CartProvider }  from '@/context/CartContext'  // Proveedor del carrito
import App               from './App'

const rootElement = document.getElementById('root')

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      {/* CartProvider envuelve la app para que useCart() funcione en cualquier componente */}
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </StrictMode>
)