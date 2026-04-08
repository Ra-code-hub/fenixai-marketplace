// ============================================================
// src/context/AuthContext.jsx — Contexto global de autenticacion
// ============================================================
// Provee el estado del usuario autenticado Y su rol a toda la app.
// Roles: 'comprador' | 'vendedor' | 'admin'
// Uso: import { useAuth } from '@/context/AuthContext'
// ============================================================

const cargarPerfil = async (userId) => {
  if (!userId) { setPerfil(null); return }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, rol')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error cargando perfil:', error)
      // Si falla, asignar perfil basico para no bloquear la app
      setPerfil({ id: userId, rol: 'comprador' })
      return
    }

    setPerfil(data || { id: userId, rol: 'comprador' })
  } catch (err) {
    console.error('Error inesperado en perfil:', err)
    setPerfil({ id: userId, rol: 'comprador' })
  }
}