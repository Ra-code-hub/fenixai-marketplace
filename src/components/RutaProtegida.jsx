// ============================================================
// src/components/RutaProtegida.jsx — Guardia de rutas privadas
// ============================================================
// Protege páginas que solo deben ver usuarios autenticados.
// Se usa en App.jsx envolviendo las rutas privadas.
//
// Flujo:
//   1. Mientras Supabase verifica la sesión → muestra nada (loading)
//   2. Si hay usuario autenticado            → muestra la página
//   3. Si no hay usuario                     → redirige a /login
//
// Uso en App.jsx:
//   element: <RutaProtegida><MiPagina /></RutaProtegida>
// ============================================================

import { Navigate } from 'react-router-dom' // Para redirigir sin recargar la página
import { useAuth }  from '@/context/AuthContext' // Estado global de autenticación

export default function RutaProtegida({ children }) {

  // Obtener el estado de autenticación del contexto global
  // - isAuth: true si hay usuario con sesión activa
  // - loading: true mientras Supabase verifica la sesión en localStorage
  const { isAuth, loading } = useAuth()

  // ---- Caso 1: Supabase aún está verificando la sesión ----
  // Esto ocurre los primeros milisegundos al cargar la app.
  // Si mostramos algo antes de saber si hay sesión, habrá un
  // "flash" donde el usuario sin sesión ve brevemente la página privada.
  // La solución es no renderizar nada hasta tener certeza.
  if (loading) {
    // Retornar null no muestra nada — el Layout sigue visible
    // (el header y footer permanecen, solo el contenido queda en blanco)
    return null
  }

  // ---- Caso 2: No hay usuario autenticado ----
  // Navigate hace una redirección programática — igual que si el usuario
  // hubiera escrito /login en la barra del navegador.
  // replace={true} evita que /panel quede en el historial del navegador,
  // así el botón "atrás" no regresa a la página protegida.
  if (!isAuth) {
    return <Navigate to="/login" replace />
  }

  // ---- Caso 3: Usuario autenticado ---- 
  // Renderizar la página protegida que viene como children.
  // Ejemplo: si children es <Panel />, se muestra el Panel.
  return children
}