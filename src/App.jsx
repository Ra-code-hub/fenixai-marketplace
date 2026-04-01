// ============================================================
// src/App.jsx — Configuración central de rutas
// ============================================================
// Mapa de toda la aplicación.
// Todos los JSX viven en src/components/ o src/pages/
// Todos los CSS viven en src/styles/
//
// CÓMO AGREGAR UNA NUEVA PÁGINA:
// 1. Crear NombrePagina.jsx en src/pages/
// 2. Crear NombrePagina.css en src/styles/
// 3. Importar el componente aquí abajo
// 4. Agregar un <Route> dentro de las rutas del Layout
// ============================================================

import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// ---- Layout base (Header + Footer + Outlet) ----
import Layout   from '@/components/Layout'

// ---- Páginas ----
import Home     from '@/pages/Home'      // Ruta: /
import Login    from '@/pages/Login'     // Ruta: /login
import Registro from '@/pages/Registro'  // Ruta: /registro
import NotFound from '@/pages/NotFound'  // Ruta: * (cualquier URL no definida)

// ---- Próximas páginas (descomenta al crearlas) ----
// import CrearTienda   from '@/pages/CrearTienda'    // Ruta: /crear-tienda
// import TiendaPublica from '@/pages/TiendaPublica'  // Ruta: /tienda/:slug
// import NuevoProducto from '@/pages/NuevoProducto'  // Ruta: /tienda/:slug/nuevo-producto
// import Panel         from '@/pages/Panel'          // Ruta: /panel
// import Checkout      from '@/pages/Checkout'       // Ruta: /checkout/:orderId

// ---- Definición del router ----
const router = createBrowserRouter([
  {
    // Layout raíz — todas las páginas hijas heredan Header y Footer
    path: '/',
    element: <Layout />,
    children: [

      // Inicio
      {
        index: true,          // Equivale a path: '/'
        element: <Home />,
      },

      // Autenticación
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'registro',
        element: <Registro />,
      },

      // ---- Próximas rutas (descomenta al crearlas) ----
      // {
      //   path: 'crear-tienda',
      //   element: <CrearTienda />,
      // },
      // {
      //   path: 'tienda/:slug',
      //   element: <TiendaPublica />,
      // },
      // {
      //   path: 'tienda/:slug/nuevo-producto',
      //   element: <NuevoProducto />,
      // },
      // {
      //   path: 'panel',
      //   element: <Panel />,
      // },
      // {
      //   path: 'checkout/:orderId',
      //   element: <Checkout />,
      // },

      // Catch-all: cualquier URL no definida → 404
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])

// RouterProvider conecta el router con toda la aplicación
export default function App() {
  return <RouterProvider router={router} />
}
