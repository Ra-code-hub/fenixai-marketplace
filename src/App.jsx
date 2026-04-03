// ============================================================
// src/App.jsx — Configuracion central de rutas
// ============================================================

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout        from '@/components/Layout'
import RutaProtegida from '@/components/RutaProtegida'

// Paginas publicas
import Home          from '@/pages/Home'
import Login         from '@/pages/Login'
import Registro      from '@/pages/Registro'
import TiendaPublica from '@/pages/TiendaPublica'
import Carrito       from '@/pages/Carrito'
import NotFound      from '@/pages/NotFound'

// Paginas privadas
import CrearTienda   from '@/pages/CrearTienda'
import Panel         from '@/pages/Panel'
import NuevoProducto from '@/pages/NuevoProducto'
import Checkout      from '@/pages/Checkout'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [

      // ---- Rutas publicas ----
      { index: true,            element: <Home /> },
      { path: 'login',          element: <Login /> },
      { path: 'registro',       element: <Registro /> },
      { path: 'tienda/:slug',   element: <TiendaPublica /> },
      { path: 'tienda/:slug/carrito', element: <Carrito /> },

      // ---- Rutas privadas ----
      {
        path: 'crear-tienda',
        element: <RutaProtegida><CrearTienda /></RutaProtegida>,
      },
      {
        path: 'panel',
        element: <RutaProtegida><Panel /></RutaProtegida>,
      },
      {
        path: 'tienda/:slug/nuevo-producto',
        element: <RutaProtegida><NuevoProducto /></RutaProtegida>,
      },
      {
        path: 'tienda/:slug/checkout',
        element: <RutaProtegida><Checkout /></RutaProtegida>,
      },

      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}