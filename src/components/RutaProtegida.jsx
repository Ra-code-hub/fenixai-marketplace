import { Navigate } from 'react-router-dom'
import { useAuth }  from '@/context/AuthContext'

export default function RutaProtegida({ children, rol }) {

  const { isAuth, loading, perfil, esAdmin } = useAuth()

  // Esperar a que cargue la sesion Y el perfil
  if (loading || (isAuth && !perfil)) return null

  // Sin sesion — ir al login
  if (!isAuth) return <Navigate to="/login" replace />

  // Sin rol requerido — dejar pasar
  if (!rol) return children

  // Admin siempre tiene acceso a todo
  if (esAdmin) return children

  // Verificar rol
  if (perfil?.rol !== rol) {
    if (rol === 'admin')    return <Navigate to="/"              replace />
    if (rol === 'vendedor') return <Navigate to="/quiero-vender" replace />
    return <Navigate to="/" replace />
  }

  return children
}