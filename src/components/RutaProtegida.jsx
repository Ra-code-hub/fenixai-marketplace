import { Navigate } from 'react-router-dom'
import { useAuth }  from '@/context/AuthContext'

export default function RutaProtegida({ children, rol }) {

  const { isAuth, loading, perfil, esAdmin } = useAuth()

  // Mientras verifica la sesion o carga el perfil — no hacer nada
  if (loading) return null

  // Si requiere rol pero el perfil aun no cargo — esperar
  if (rol && !perfil) return null

  // Sin sesion — redirigir al login
  if (!isAuth) return <Navigate to="/login" replace />

  // Verificar rol si se requiere
  if (rol) {
    if (esAdmin) return children

    if (perfil?.rol !== rol) {
      if (rol === 'admin')    return <Navigate to="/"             replace />
      if (rol === 'vendedor') return <Navigate to="/quiero-vender" replace />
      return <Navigate to="/" replace />
    }
  }

  return children
}