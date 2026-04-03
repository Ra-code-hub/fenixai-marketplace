// ============================================================
// src/pages/CrearTienda.jsx — Página para crear una tienda
// ============================================================
// Ruta: /crear-tienda (🔒 privada — requiere autenticación)
// Solo se muestra si el usuario tiene sesión activa.
//
// Flujo:
// 1. Vendedor llena el formulario con los datos de su tienda
// 2. El slug se genera automáticamente desde el nombre
// 3. Se verifica que el slug no esté en uso en Supabase
// 4. Se inserta el registro en la tabla stores
// 5. Redirige al panel del vendedor
// ============================================================

import { useState, useEffect }  from 'react'
import { useNavigate }          from 'react-router-dom'
import { useAuth }              from '@/context/AuthContext' // Para obtener el user.id
import { supabase }             from '@/lib/supabase'       // Cliente de Supabase
import '@/styles/CrearTienda.css'

// ---- Función auxiliar: generar slug desde el nombre ----
// Convierte "Ropa de Rag 🔥" → "ropa-de-rag"
// El slug es el identificador único de la tienda en la URL
const generarSlug = (texto) => {
  return texto
    .toLowerCase()                          // Todo en minúsculas
    .normalize('NFD')                       // Descomponer caracteres con tilde
    .replace(/[\u0300-\u036f]/g, '')        // Eliminar los diacríticos (tildes)
    .replace(/[^a-z0-9\s-]/g, '')          // Eliminar caracteres especiales y emojis
    .trim()                                 // Quitar espacios al inicio y al final
    .replace(/\s+/g, '-')                   // Reemplazar espacios con guiones
    .replace(/-+/g, '-')                    // Eliminar guiones duplicados
    .slice(0, 50)                           // Máximo 50 caracteres
}

export default function CrearTienda() {

  // ---- Estado del formulario ----
  const [nombre, setNombre]           = useState('')    // Nombre de la tienda
  const [descripcion, setDescripcion] = useState('')    // Descripción de la tienda
  const [ciudad, setCiudad]           = useState('')    // Ciudad del vendedor
  const [slug, setSlug]               = useState('')    // Slug generado automáticamente

  // ---- Estado de la UI ----
  const [error, setError]             = useState('')    // Mensaje de error general
  const [cargando, setCargando]       = useState(false) // true mientras se guarda
  const [slugDisponible, setSlugDisponible] = useState(null) // true/false/null

  // ---- Hooks ----
  const { user }  = useAuth()    // Usuario autenticado — necesitamos su id
  const navigate  = useNavigate() // Para redirigir al panel tras crear la tienda

  // ---- Ciudades de Colombia para el selector ----
  const ciudades = [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
    'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué',
    'Manizales', 'Pasto', 'Neiva', 'Villavicencio', 'Armenia',
    'Valledupar', 'Montería', 'Sincelejo', 'Popayán', 'Tunja',
    'Otra ciudad',
  ]

  // ---- Efecto: generar slug automáticamente al escribir el nombre ----
  // Se ejecuta cada vez que cambia el campo nombre
  useEffect(() => {
    if (nombre.trim()) {
      const slugGenerado = generarSlug(nombre) // Convertir nombre a slug
      setSlug(slugGenerado)                    // Actualizar el slug en el estado
      setSlugDisponible(null)                  // Resetear disponibilidad al cambiar
    } else {
      setSlug('')            // Si no hay nombre, limpiar el slug
      setSlugDisponible(null)
    }
  }, [nombre]) // Dependencia: se ejecuta cuando nombre cambia

  // ---- Verificar disponibilidad del slug en Supabase ----
  // Se llama cuando el campo nombre pierde el foco (onBlur)
  const verificarSlug = async () => {
    if (!slug) return // Si no hay slug, no verificar

    // Consultar si ya existe una tienda con ese slug
    const { data, error } = await supabase
      .from('stores')
      .select('id')        // Solo necesitamos saber si existe, no todos los datos
      .eq('slug', slug)    // Filtrar por slug exacto
      .single()            // Esperamos máximo un resultado

    if (error && error.code === 'PGRST116') {
      // PGRST116 = no se encontró ningún registro → slug disponible
      setSlugDisponible(true)
    } else if (data) {
      // Se encontró un registro → slug ya en uso
      setSlugDisponible(false)
    }
  }

  // ---- Manejador del formulario ----
  const handleSubmit = async (e) => {
    e.preventDefault() // Evitar recarga de la página
    setError('')

    // Validar que el slug esté disponible antes de intentar insertar
    if (slugDisponible === false) {
      setError('Ese nombre de tienda ya está en uso. Intenta con uno diferente.')
      return
    }

    setCargando(true)

    // ---- INSERT en la tabla stores ----
    const { data, error } = await supabase
      .from('stores')
      .insert([
        {
          user_id:     user.id,      // ID del vendedor autenticado
          nombre:      nombre.trim(), // Nombre sin espacios extra
          descripcion: descripcion.trim() || null, // null si está vacío
          slug:        slug,          // Slug generado automáticamente
          ciudad:      ciudad || null, // null si no seleccionó ciudad
          plan:        'gratis',      // Plan inicial siempre es gratis
          verificado:  false,         // Empieza sin verificar
          activo:      true,          // Tienda activa desde el inicio
        }
      ])
      .select() // Retornar el registro insertado para obtener el id
      .single()

    if (error) {
      // Error de slug duplicado (violación de constraint único en Supabase)
      if (error.code === '23505') {
        setError('Ese nombre de tienda ya está en uso. Intenta con uno diferente.')
      } else {
        setError('Ocurrió un error al crear tu tienda. Intenta de nuevo.')
        console.error('Error creando tienda:', error) // Log para debugging
      }
      setCargando(false)
      return
    }

    // ---- Tienda creada exitosamente ----
    // Redirigir al panel del vendedor
    navigate('/panel')
  }

  return (
    <div className="crear-tienda">
      <div className="container">

        {/* ---- Encabezado de la página ---- */}
        <div className="crear-tienda__encabezado">
          <h1 className="crear-tienda__titulo">Crea tu tienda</h1>
          <p className="crear-tienda__subtitulo">
            En menos de 5 minutos tienes tu tienda lista para vender.
            Sin mensualidad hasta que realices tu primera venta.
          </p>
        </div>

        {/* ---- Layout: formulario + preview ---- */}
        <div className="crear-tienda__layout">

          {/* ---- Formulario ---- */}
          <form
            className="crear-tienda__form"
            onSubmit={handleSubmit}
            noValidate
          >

            {/* ---- Nombre de la tienda ---- */}
            <div className="crear-tienda__campo">
              <label htmlFor="nombre" className="crear-tienda__label">
                Nombre de tu tienda <span className="crear-tienda__requerido">*</span>
              </label>
              <input
                id="nombre"
                type="text"
                className="crear-tienda__input"
                placeholder="Ej: Ropa de Rag, Accesorios Luna..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)} // Actualizar nombre
                onBlur={verificarSlug}   // Verificar slug cuando el campo pierde foco
                required
                maxLength={60}           // Límite razonable para nombres de tienda
                disabled={cargando}
              />
              {/* Contador de caracteres */}
              <span className="crear-tienda__contador">
                {nombre.length}/60
              </span>
            </div>

            {/* ---- URL de la tienda (slug — solo lectura) ---- */}
            {slug && (
              <div className="crear-tienda__campo">
                <label className="crear-tienda__label">
                  URL de tu tienda
                </label>
                {/* Campo visual de la URL — no editable */}
                <div className={`crear-tienda__url ${
                  slugDisponible === false ? 'crear-tienda__url--error' :
                  slugDisponible === true  ? 'crear-tienda__url--ok'    : ''
                }`}>
                  {/* Prefijo fijo de la URL */}
                  <span className="crear-tienda__url-prefijo">
                    fenixai.co/tienda/
                  </span>
                  {/* Slug generado */}
                  <span className="crear-tienda__url-slug">{slug}</span>
                </div>

                {/* Indicador de disponibilidad del slug */}
                {slugDisponible === true && (
                  <span className="crear-tienda__slug-ok">
                    ✓ Nombre disponible
                  </span>
                )}
                {slugDisponible === false && (
                  <span className="crear-tienda__slug-error">
                    ✗ Este nombre ya está en uso. Cambia el nombre de tu tienda.
                  </span>
                )}
              </div>
            )}

            {/* ---- Descripción ---- */}
            <div className="crear-tienda__campo">
              <label htmlFor="descripcion" className="crear-tienda__label">
                Descripción de tu tienda
                <span className="crear-tienda__opcional"> (opcional)</span>
              </label>
              <textarea
                id="descripcion"
                className="crear-tienda__textarea"
                placeholder="Cuéntales a tus clientes qué vendes, qué te hace especial..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={300}       /* Límite de descripción */
                rows={3}              /* Altura inicial del textarea */
                disabled={cargando}
              />
              {/* Contador de caracteres del textarea */}
              <span className="crear-tienda__contador">
                {descripcion.length}/300
              </span>
            </div>

            {/* ---- Ciudad ---- */}
            <div className="crear-tienda__campo">
              <label htmlFor="ciudad" className="crear-tienda__label">
                Ciudad
                <span className="crear-tienda__opcional"> (opcional)</span>
              </label>
              <select
                id="ciudad"
                className="crear-tienda__select"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                disabled={cargando}
              >
                {/* Opción por defecto vacía */}
                <option value="">Selecciona tu ciudad</option>
                {/* Generar opciones desde el array de ciudades */}
                {ciudades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* ---- Error general ---- */}
            {error && (
              <div className="crear-tienda__error" role="alert" aria-live="polite">
                <span aria-hidden="true">⚠️</span>
                {error}
              </div>
            )}

            {/* ---- Botón de submit ---- */}
            <button
              type="submit"
              className="btn-primary crear-tienda__btn"
              // Deshabilitado si falta el nombre, el slug no está disponible, o está cargando
              disabled={cargando || !nombre.trim() || slugDisponible === false}
            >
              {cargando ? 'Creando tu tienda...' : 'Crear mi tienda gratis 🔥'}
            </button>

            {/* Nota sobre el plan gratuito */}
            <p className="crear-tienda__nota">
              Empiezas en el plan <strong>Gratis</strong> — sin costo hasta que vendas.
              Solo pagamos el 8% de comisión sobre cada venta completada.
            </p>

          </form>

          {/* ---- Panel de preview ---- */}
          {/* Vista previa de cómo se verá la tienda */}
          <div className="crear-tienda__preview">
            <p className="crear-tienda__preview-titulo">Vista previa</p>

            {/* Card de preview de la tienda */}
            <div className="crear-tienda__preview-card">

              {/* Avatar placeholder del logo */}
              <div className="crear-tienda__preview-avatar">
                {/* Muestra la inicial del nombre o un ícono por defecto */}
                {nombre ? nombre.charAt(0).toUpperCase() : '🏪'}
              </div>

              {/* Nombre de la tienda en el preview */}
              <h2 className="crear-tienda__preview-nombre">
                {nombre || 'Nombre de tu tienda'}
              </h2>

              {/* Descripción en el preview */}
              <p className="crear-tienda__preview-descripcion">
                {descripcion || 'La descripción de tu tienda aparecerá aquí.'}
              </p>

              {/* Ciudad en el preview */}
              {ciudad && (
                <span className="crear-tienda__preview-ciudad">
                  📍 {ciudad}
                </span>
              )}

              {/* Badge de verificación pendiente */}
              <div className="crear-tienda__preview-badges">
                <span className="crear-tienda__preview-badge">
                  Plan Gratis
                </span>
              </div>

            </div>

            {/* Mensaje informativo del preview */}
            <p className="crear-tienda__preview-nota">
              Así verán tu tienda los compradores. Puedes personalizar
              el logo y más detalles desde tu panel.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}