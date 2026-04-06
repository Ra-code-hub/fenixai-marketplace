// ============================================================
// src/context/AuthContext.jsx — Contexto global de autenticacion
// ============================================================
// Provee el estado del usuario autenticado Y su rol a toda la app.
// Roles: 'comprador' | 'vendedor' | 'admin'
// Uso: import { useAuth } from '@/context/AuthContext'
// ============================================================

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [user, setUser]       = useState(null)    // Usuario de Supabase Auth
  const [perfil, setPerfil]   = useState(null)    // Perfil con el rol
  const [loading, setLoading] = useState(true)    // Carga inicial

  // ---- Cargar perfil del usuario desde la tabla profiles ----
  const cargarPerfil = async (userId) => {
    if (!userId) { setPerfil(null); return }

    const { data } = await supabase
      .from('profiles')
      .select('id, rol')
      .eq('id', userId)
      .single()

    setPerfil(data || null)
  }

  useEffect(() => {
    // Obtener sesion activa al montar
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const usuarioActual = session?.user ?? null
      setUser(usuarioActual)
      await cargarPerfil(usuarioActual?.id)
      setLoading(false)
    })

    // Escuchar cambios de sesion
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const usuarioActual = session?.user ?? null
        setUser(usuarioActual)
        await cargarPerfil(usuarioActual?.id)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ---- Funciones de auth ----

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // ---- Cambiar rol a vendedor ----
  // Se llama cuando el comprador quiere abrir su tienda
  const convertirseEnVendedor = async () => {
    if (!user) return { error: 'No hay usuario autenticado' }

    const { error } = await supabase
      .from('profiles')
      .update({ rol: 'vendedor' })
      .eq('id', user.id)

    if (!error) {
      // Actualizar el perfil local sin recargar
      setPerfil(prev => ({ ...prev, rol: 'vendedor' }))
    }

    return { error }
  }

  const value = {
    user,
    perfil,
    loading,
    rol:       perfil?.rol || null,        // 'comprador' | 'vendedor' | 'admin'
    isAuth:    !!user,                     // true si hay sesion activa
    esAdmin:   perfil?.rol === 'admin',    // true si es administrador
    esVendedor: perfil?.rol === 'vendedor' || perfil?.rol === 'admin', // admin tambien puede vender
    esComprador: !!user,                   // todo usuario autenticado puede comprar
    signUp,
    signIn,
    signOut,
    convertirseEnVendedor,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth() debe usarse dentro de <AuthProvider>')
  return context
}