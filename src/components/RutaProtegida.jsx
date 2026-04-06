// ============================================================
// src/components/RutaProtegida.jsx — Guardia de rutas privadas
// ============================================================
// Protege rutas segun autenticacion y rol del usuario.
//
// Uso basico (solo requiere estar autenticado):
//   <RutaProtegida><MiPagina /></RutaProtegida>
//
// Uso con rol especifico:
//   <RutaProtegida rol="vendedor"><CrearTienda /></RutaProtegida>
//   <RutaProtegida rol="admin"><AdminPanel /></RutaProtegida>
// ============================================================

import { Navigate } from 'react-router-dom'
import { useAuth }  from '@/context/AuthContext'

export default function RutaProtegida({ children, rol }) {

  const { isAuth, loading, perfil, esAdmin } = useAuth()

  // Mientras verifica la sesion no mostrar nada
  if (loading) return null

  // Sin sesion — redirigir al login
  if (!isAuth) return <Navigate to="/login" replace />

  // Si se requiere rol especifico, verificarlo
  if (rol) {
    // Admin siempre tiene acceso a todo
    if (esAdmin) return children

    // Verificar que el rol del usuario coincide con el requerido
    if (perfil?.rol !== rol) {
      // Vendedor intentando acceder a admin → inicio
      if (rol === 'admin') return <Navigate to="/" replace />

      // Comprador intentando acceder a rutas de vendedor → pagina para convertirse
      if (rol === 'vendedor') return <Navigate to="/quiero-vender" replace />

      // Cualquier otro caso → inicio
      return <Navigate to="/" replace />
    }
  }

  // Todo bien — mostrar la pagina
  return children
}