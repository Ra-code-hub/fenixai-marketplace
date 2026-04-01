// ============================================================
// src/main.jsx — Punto de entrada de la aplicación
// ============================================================
// Este es el primer archivo que ejecuta React.
// Monta la aplicación en el div#root del index.html.
// También importa los estilos globales y envuelve
// la app con los proveedores de contexto globales.
// ============================================================

import { StrictMode } from 'react'   // Modo estricto: detecta problemas en desarrollo
import { createRoot } from 'react-dom/client' // API moderna de React 18 para montar

// ---- Estilos globales ----
// IMPORTANTE: importar PRIMERO para que los estilos de componentes
// puedan sobreescribir el reset cuando sea necesario
import '@/styles/global.css'

// ---- Proveedores de contexto ----
// AuthProvider envuelve toda la app para que useAuth() funcione en cualquier componente
import { AuthProvider } from '@/context/AuthContext'

// ---- Componente raíz con el router ----
import App from './App'

// Buscar el div#root en el index.html donde se montará React
const rootElement = document.getElementById('root')

// Crear la raíz de React y renderizar la aplicación
createRoot(rootElement).render(
  // StrictMode activa advertencias adicionales en modo desarrollo
  // No afecta la versión de producción (build)
  <StrictMode>
    {/* AuthProvider: hace que el estado de autenticación esté
        disponible en TODA la aplicación a través de useAuth() */}
    <AuthProvider>
      {/* App contiene el router con todas las rutas y páginas */}
      <App />
    </AuthProvider>
  </StrictMode>
)
