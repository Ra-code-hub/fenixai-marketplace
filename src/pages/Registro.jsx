// ============================================================
// src/pages/Registro.jsx — Página de registro
// ============================================================
// Se renderiza en la ruta "/registro" dentro del Layout.
// No importa Header ni Footer — los hereda del Layout.
// ============================================================

import { useState }          from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth }           from '@/context/AuthContext'
import '@/styles/Registro.css' // CSS en carpeta styles/

export default function Registro() {

  // ---- Estado del formulario ----
  const [email, setEmail]         = useState('')    // Campo email
  const [password, setPassword]   = useState('')    // Campo contraseña
  const [confirmar, setConfirmar] = useState('')    // Campo confirmar contraseña
  const [error, setError]         = useState('')    // Mensaje de error
  const [cargando, setCargando]   = useState(false) // Estado de carga
  const [enviado, setEnviado]     = useState(false) // true cuando el email fue enviado

  // ---- Hooks ----
  const { signUp } = useAuth()
  const navigate   = useNavigate()

  // ---- Validación local antes de llamar a Supabase ----
  const validarFormulario = () => {
    // Las contraseñas deben coincidir
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden. Verifica que sean iguales.')
      return false
    }
    // Mínimo 8 caracteres (requisito de Supabase)
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return false
    }
    return true
  }

  // ---- Manejador del formulario ----
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validarFormulario()) return

    setCargando(true)

    // Crear cuenta en Supabase Auth
    const { error } = await signUp(email, password)

    if (error) {
      // Traducir errores al español
      if (error.message.includes('already registered')) {
        setError('Este email ya tiene una cuenta. ¿Quieres iniciar sesión?')
      } else if (error.message.includes('password')) {
        setError('La contraseña no cumple los requisitos mínimos de seguridad.')
      } else {
        setError('Ocurrió un error al crear tu cuenta. Intenta de nuevo.')
      }
      setCargando(false)
      return
    }

    // Registro exitoso — mostrar pantalla de confirmación de email
    setEnviado(true)
    setCargando(false)
  }

  // ---- Pantalla de confirmación (post-registro) ----
  if (enviado) {
    return (
      <div className="registro">
        <div className="registro__contenedor">
          <div className="registro__confirmacion">
            <span className="registro__confirmacion-icono" aria-hidden="true">📬</span>
            <h1 className="registro__titulo">¡Revisa tu correo!</h1>
            <p className="registro__confirmacion-texto">
              Te enviamos un link de confirmación a{' '}
              <strong>{email}</strong>.
              Haz clic en el link para activar tu cuenta y empezar a vender.
            </p>
            <p className="registro__confirmacion-nota">
              ¿No lo ves? Revisa la carpeta de spam o promociones.
            </p>
            <Link to="/login" className="btn-primary registro__btn-login">
              Ya confirmé mi email — Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---- Formulario de registro ----
  return (
    <div className="registro">
      <div className="registro__contenedor">

        {/* ---- Encabezado ---- */}
        <div className="registro__encabezado">
          <span className="registro__icono" aria-hidden="true">🔥</span>
          <h1 className="registro__titulo">Crea tu tienda gratis</h1>
          <p className="registro__subtitulo">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="registro__link">Inicia sesión</Link>
          </p>
        </div>

        {/* ---- Propuesta de valor ---- */}
        <div className="registro__beneficios">
          <span className="registro__beneficio">✓ Sin mensualidad hasta que vendas</span>
          <span className="registro__beneficio">✓ Pagos seguros con Nequi y PSE</span>
          <span className="registro__beneficio">✓ IA que mejora tus publicaciones</span>
        </div>

        {/* ---- Formulario ---- */}
        <form className="registro__form" onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className="registro__campo">
            <label htmlFor="email" className="registro__label">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className="registro__input"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={cargando}
            />
          </div>

          {/* Contraseña */}
          <div className="registro__campo">
            <label htmlFor="password" className="registro__label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="registro__input"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              disabled={cargando}
            />
            {/* Indicador de fortaleza — aparece al escribir */}
            {password.length > 0 && (
              <span className={`registro__fortaleza ${
                password.length >= 12 ? 'registro__fortaleza--fuerte' :
                password.length >= 8  ? 'registro__fortaleza--media'  :
                                        'registro__fortaleza--debil'
              }`}>
                {password.length >= 12 ? '🔒 Contraseña fuerte'       :
                 password.length >= 8  ? '⚠️ Contraseña aceptable'    :
                                         '❌ Muy corta (mín. 8 caracteres)'}
              </span>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="registro__campo">
            <label htmlFor="confirmar" className="registro__label">
              Confirmar contraseña
            </label>
            <input
              id="confirmar"
              type="password"
              className={`registro__input ${
                confirmar.length > 0 && password !== confirmar
                  ? 'registro__input--error' : ''
              }`}
              placeholder="Repite tu contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
              autoComplete="new-password"
              disabled={cargando}
            />
            {/* Error inline si no coinciden */}
            {confirmar.length > 0 && password !== confirmar && (
              <span className="registro__campo-error">Las contraseñas no coinciden</span>
            )}
          </div>

          {/* Error general */}
          {error && (
            <div className="registro__error" role="alert" aria-live="polite">
              <span className="registro__error-icono" aria-hidden="true">⚠️</span>
              {error}
              {error.includes('ya tiene una cuenta') && (
                <Link to="/login" className="registro__error-link">Ir al login →</Link>
              )}
            </div>
          )}

          {/* Botón de submit */}
          <button
            type="submit"
            className="btn-primary registro__btn"
            disabled={cargando || !email || !password || !confirmar || password !== confirmar}
          >
            {cargando ? 'Creando tu cuenta...' : 'Crear cuenta gratis'}
          </button>

          {/* Nota de términos */}
          <p className="registro__terminos">
            Al registrarte aceptas nuestros{' '}
            <Link to="/terminos" className="registro__link">Términos de servicio</Link>
            {' '}y la{' '}
            <Link to="/privacidad" className="registro__link">Política de privacidad</Link>.
          </p>

        </form>

      </div>
    </div>
  )
}
