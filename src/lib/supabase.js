// ============================================================
// src/lib/supabase.js — Cliente de Supabase
// ============================================================
// Este archivo crea y exporta una única instancia del cliente
// de Supabase para reutilizar en toda la app.
// Importar siempre desde aquí: import { supabase } from '@/lib/supabase'
// ============================================================

import { createClient } from '@supabase/supabase-js' // SDK oficial de Supabase

// URL del proyecto — viene de las variables de entorno (.env.local)
// Vite expone las variables prefijadas con VITE_ al frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// Clave pública anon — segura para el cliente (no es la service_role)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación temprana: si faltan las variables, lanzar error claro
// Evita errores crípticos en tiempo de ejecución
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '⚠️ Faltan variables de entorno de Supabase.\n' +
    'Copia .env.example a .env.local y completa los valores.'
  )
}

// Crear y exportar el cliente único de Supabase
// Este objeto es el punto de entrada para auth, database y storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Guardar la sesión en localStorage para persistir entre recargas
    persistSession: true,
    // Actualizar el token automáticamente antes de que expire
    autoRefreshToken: true,
    // Detectar el código de auth en la URL al volver de OAuth o email magic link
    detectSessionInUrl: true,
  },
})
