// ============================================================
// src/context/AuthContext.jsx — Contexto global de autenticación
// ============================================================
// Provee el estado del usuario autenticado a toda la app.
// Cualquier componente puede consumirlo con el hook useAuth().
// Uso: import { useAuth } from '@/context/AuthContext'
// ============================================================

import { createContext, useContext, useEffect, useState } from 'react' // Hooks de React
import { supabase } from '@/lib/supabase' // Cliente de Supabase

// Crear el contexto vacío — se llenará con el Provider
const AuthContext = createContext(null)

// ---- Provider ---- //
// Envuelve la app en App.jsx y distribuye el estado de auth
export function AuthProvider({ children }) {

  // Estado del usuario actual (null = no autenticado)
  const [user, setUser] = useState(null)

  // Estado de carga inicial — mientras se verifica la sesión
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Paso 1: obtener la sesión activa al montar la app
    // Supabase la recupera de localStorage automáticamente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null) // Si hay sesión, guardar el usuario
      setLoading(false)              // Ya terminó la verificación inicial
    })

    // Paso 2: suscribirse a cambios de sesión en tiempo real
    // Se dispara al hacer login, logout o cuando el token se refresca
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null) // Actualizar usuario con cada cambio
      }
    )

    // Cleanup: cancelar la suscripción cuando el componente se desmonte
    return () => subscription.unsubscribe()
  }, []) // Array vacío = solo se ejecuta una vez al montar

  // ---- Funciones de auth ---- //

  // Registrar nuevo usuario con email y contraseña
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error } // Devolver ambos para manejo en el componente
  }

  // Iniciar sesión con email y contraseña
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  // Cerrar sesión del usuario actual
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // Valor que se comparte con toda la app a través del contexto
  const value = {
    user,       // Objeto del usuario actual (o null)
    loading,    // true mientras se carga la sesión inicial
    signUp,     // Función para registrarse
    signIn,     // Función para iniciar sesión
    signOut,    // Función para cerrar sesión
    isAuth: !!user, // Booleano: true si hay usuario autenticado
  }

  return (
    // Proveer el valor a todos los componentes hijos
    // Mientras carga la sesión, no mostrar nada para evitar flash
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// ---- Hook personalizado ---- //
// Simplifica el consumo del contexto: const { user } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext)

  // Si se usa fuera del Provider, lanzar error descriptivo
  if (!context) {
    throw new Error('useAuth() debe usarse dentro de <AuthProvider>')
  }

  return context
}
