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

  const [user, setUser]       = useState(null)
  const [perfil, setPerfil]   = useState(null)
  const [loading, setLoading] = useState(true)

  const cargarPerfil = async (userId) => {
    if (!userId) { setPerfil(null); return }
  
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, rol')
        .eq('id', userId)
        .single()
  
      console.log('PERFIL DATA:', data)
      console.log('PERFIL ERROR:', error)
      console.log('USER ID:', userId)
  
      if (error) {
        setPerfil({ id: userId, rol: 'comprador' })
        return
      }
  
      setPerfil(data || { id: userId, rol: 'comprador' })
    } catch (err) {
      console.error('Error inesperado:', err)
      setPerfil({ id: userId, rol: 'comprador' })
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          const u = session?.user ?? null
          setUser(u)
          if (u) await cargarPerfil(u.id)
          else setPerfil(null)
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
    )
  
    supabase.auth.getSession()
  
    return () => subscription.unsubscribe()
  }, [])

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          const u = session?.user ?? null
          setUser(u)
          if (u) await cargarPerfil(u.id)
          else setPerfil(null)
        } catch (err) {
          console.error(err)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp   = async (email, password) => supabase.auth.signUp({ email, password })
  const signIn   = async (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut  = async () => supabase.auth.signOut()

  const convertirseEnVendedor = async () => {
    if (!user) return { error: 'No autenticado' }
    const { error } = await supabase.from('profiles').update({ rol: 'vendedor' }).eq('id', user.id)
    if (!error) setPerfil(prev => ({ ...prev, rol: 'vendedor' }))
    return { error }
  }

  const value = {
    user, perfil, loading,
    rol:         perfil?.rol || null,
    isAuth:      !!user,
    esAdmin:     perfil?.rol === 'admin',
    esVendedor:  perfil?.rol === 'vendedor' || perfil?.rol === 'admin',
    esComprador: !!user,
    signUp, signIn, signOut, convertirseEnVendedor,
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