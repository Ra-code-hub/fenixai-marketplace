// ============================================================
// src/pages/Login.jsx — Página de inicio de sesión
// ============================================================
// Se renderiza en la ruta "/login" dentro del Layout.
// No importa Header ni Footer — los hereda del Layout.
// ============================================================

import { useState }          from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth }           from '@/context/AuthContext'
import '@/styles/Login.css'   // CSS en carpeta styles/

export default function Login() {

  // ---- Estado del formulario ----
  const [email, setEmail]       = useState('')    // Valor del campo email
  const [password, setPassword] = useState('')    // Valor del campo contraseña
  const [error, setError]       = useState('')    // Mensaje de error visible al usuario
  const [cargando, setCargando] = useState(false) // true mientras procesa el login

  // ---- Hooks ----
  const { signIn } = useAuth()     // Función de inicio de sesión de Supabase
  const navigate   = useNavigate() // Para redirigir tras el login exitoso

  // ---- Manejador del formulario ----
  const handleSubmit = async (e) => {
    e.preventDefault() // Evitar que el formulario recargue la página
    setError('')
    setCargando(true)

    // Llamar a Supabase Auth con las credenciales
    const { error } = await signIn(email, password)

    if (error) {
      // Traducir errores técnicos de Supabase a mensajes en español
      if (error.message.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos. Verifica tus datos.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.')
      } else {
        setError('Ocurrió un error. Intenta de nuevo en unos segundos.')
      }
      setCargando(false)
      return
    }

    // Login exitoso — redirigir al panel del vendedor
    navigate('/panel')
  }

  return (
    <div className="login">
      <div className="login__contenedor">

        {/* ---- Encabezado ---- */}
        <div className="login__encabezado">
          <span className="login__icono" aria-hidden="true">🔥</span>
          <h1 className="login__titulo">Bienvenido de nuevo</h1>
          <p className="login__subtitulo">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="login__link">
              Crea tu tienda gratis
            </Link>
          </p>
        </div>

        {/* ---- Formulario ---- */}
        <form className="login__form" onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className="login__campo">
            <label htmlFor="email" className="login__label">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className="login__input"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={cargando}
            />
          </div>

          {/* Contraseña */}
          <div className="login__campo">
            <div className="login__label-fila">
              <label htmlFor="password" className="login__label">
                Contraseña
              </label>
              <Link to="/recuperar-contrasena" className="login__link-olvidaste">
                ¿La olvidaste?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="login__input"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={cargando}
            />
          </div>

          {/* Error general */}
          {error && (
            <div className="login__error" role="alert" aria-live="polite">
              <span className="login__error-icono" aria-hidden="true">⚠️</span>
              {error}
            </div>
          )}

          {/* Botón de submit */}
          <button
            type="submit"
            className="btn-primary login__btn"
            disabled={cargando || !email || !password}
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>

        </form>

        {/* ---- Separador ---- */}
        <div className="login__separador">
          <span className="login__separador-texto">o</span>
        </div>

        {/* ---- CTA registro ---- */}
        <div className="login__registro">
          <p className="login__registro-texto">¿Quieres vender en FenixAI?</p>
          <Link to="/registro" className="btn-secondary login__btn-registro">
            Crea tu tienda en 10 minutos
          </Link>
        </div>

      </div>
    </div>
  )
}
