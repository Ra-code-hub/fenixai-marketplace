// ============================================================
// src/components/Layout.jsx — Layout base de la aplicación
// ============================================================
// Envuelve todas las páginas con Header y Footer.
// Las páginas se renderizan en <Outlet /> según la URL.
//
//   ┌────────────────────┐
//   │       HEADER       │
//   ├────────────────────┤
//   │   <Outlet />       │  ← aquí va cada página
//   ├────────────────────┤
//   │       FOOTER       │
//   └────────────────────┘
// ============================================================

import { Outlet, ScrollRestoration } from 'react-router-dom'  // Outlet = slot de la página
import Header                        from '@/components/Header' // Componente en components/
import Footer                        from '@/components/Footer' // Componente en components/
import '@/styles/Layout.css'                                    // CSS en styles/

export default function Layout() {
  return (
    // Contenedor raíz — ocupa al menos el alto completo de la pantalla
    <div className="layout">

      {/* Header sticky siempre visible */}
      <Header />

      {/* Área principal — se expande para empujar el footer al fondo */}
      <main className="layout__main" id="contenido-principal">
        {/* Aquí React Router renderiza la página correspondiente a la URL */}
        <Outlet />
      </main>

      {/* Footer siempre al fondo */}
      <Footer />

      {/* Vuelve al inicio de la página al navegar entre rutas */}
      <ScrollRestoration />

    </div>
  )
}
