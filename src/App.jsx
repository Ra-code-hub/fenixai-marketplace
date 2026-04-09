// ============================================================
// src/App.jsx — Configuracion central de rutas
// ============================================================
// ROLES:
// sin rol requerido → cualquier visitante
// rol="vendedor"    → solo vendedores y admin
// rol="admin"       → solo el administrador
// ============================================================

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout             from '@/components/Layout'
import RutaProtegida      from '@/components/RutaProtegida'

// Paginas publicas
import Home               from '@/pages/Home'
import Login              from '@/pages/Login'
import Registro           from '@/pages/Registro'
import TiendaPublica      from '@/pages/TiendaPublica'
import Carrito            from '@/pages/Carrito'
import QuieroVender       from '@/pages/QuieroVender'
import NotFound           from '@/pages/NotFound'

// Paginas de vendedor
import CrearTienda        from '@/pages/CrearTienda'
import Panel              from '@/pages/Panel'
import PanelPedidos       from '@/pages/PanelPedidos'
import PanelPedidoDetalle from '@/pages/PanelPedidoDetalle'
import NuevoProducto      from '@/pages/NuevoProducto'

// Paginas de comprador autenticado
import Checkout           from '@/pages/Checkout'

// Paginas de admin
import Admin              from '@/pages/Admin'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [

      // ======================================================
      // RUTAS PUBLICAS — cualquier visitante
      // ======================================================
      { index: true,                  element: <Home /> },
      { path: 'login',                element: <Login /> },
      { path: 'registro',             element: <Registro /> },
      { path: 'tienda/:slug',         element: <TiendaPublica /> },
      { path: 'tienda/:slug/carrito', element: <Carrito /> },
      { path: 'quiero-vender',        element: <QuieroVender /> },

      // ======================================================
      // RUTAS DE COMPRADOR — requiere sesion (cualquier rol)
      // ======================================================
      {
        path: 'tienda/:slug/checkout',
        element: <RutaProtegida><Checkout /></RutaProtegida>,
      },

      // ======================================================
      // RUTAS DE VENDEDOR — requiere rol 'vendedor' o 'admin'
      // ======================================================
      {
        path: 'crear-tienda',
        element: <RutaProtegida rol="vendedor"><CrearTienda /></RutaProtegida>,
      },
      {
        path: 'panel',
        element: <RutaProtegida rol="vendedor"><Panel /></RutaProtegida>,
      },
      {
        path: 'panel/pedidos',
        element: <RutaProtegida rol="vendedor"><PanelPedidos /></RutaProtegida>,
      },
      {
        path: 'panel/pedidos/:id',
        element: <RutaProtegida rol="vendedor"><PanelPedidoDetalle /></RutaProtegida>,
      },
      {
        path: 'tienda/:slug/nuevo-producto',
        element: <RutaProtegida rol="vendedor"><NuevoProducto /></RutaProtegida>,
      },

      // ======================================================
      // RUTAS DE ADMIN — solo rol 'admin'
      // ======================================================
      {
        path: 'admin',
        element: <Admin />,
      },
      // Proximas rutas de admin:
      // { path: 'admin/pedidos',    element: <RutaProtegida rol="admin"><AdminPedidos /></RutaProtegida> },
      // { path: 'admin/tiendas',    element: <RutaProtegida rol="admin"><AdminTiendas /></RutaProtegida> },
      // { path: 'admin/disputas',   element: <RutaProtegida rol="admin"><AdminDisputas /></RutaProtegida> },
      // { path: 'admin/usuarios',   element: <RutaProtegida rol="admin"><AdminUsuarios /></RutaProtegida> },

      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}