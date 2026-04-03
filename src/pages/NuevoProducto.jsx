// ============================================================
// src/pages/NuevoProducto.jsx — Crear nuevo producto con IA
// ============================================================
// Ruta: /tienda/:slug/nuevo-producto (privada)
//
// Flujo:
// 1. Vendedor llena los datos del producto
// 2. Opcionalmente usa el boton de IA para mejorar la descripcion
// 3. La IA (Groq) genera una descripcion optimizada para ventas
// 4. El vendedor revisa y guarda
// 5. INSERT en la tabla products de Supabase
// 6. Redirige a la tienda publica
//
// NOTA SOBRE LA IA:
// La llamada a Groq se hace desde el frontend solo en desarrollo.
// En produccion debe moverse a una Edge Function de Supabase
// para no exponer la API key en el bundle del cliente.
// ============================================================

import { useState, useEffect }  from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth }              from '@/context/AuthContext'
import { supabase }             from '@/lib/supabase'
import '@/styles/NuevoProducto.css'

// ---- Categorias de productos disponibles ----
const CATEGORIAS = [
  'Ropa y accesorios',
  'Calzado',
  'Bolsos y carteras',
  'Joyeria y bisuteria',
  'Belleza y cuidado personal',
  'Hogar y decoracion',
  'Comida y bebidas',
  'Arte y manualidades',
  'Tecnologia',
  'Juguetes y bebes',
  'Deportes',
  'Libros y papeleria',
  'Mascotas',
  'Otro',
]

// ---- Funcion auxiliar: formatear precio mientras escribe ----
// Convierte "45000" en "45.000" para mejor legibilidad
const formatearPrecioInput = (valor) => {
  // Remover todo lo que no sea numero
  const soloNumeros = valor.replace(/\D/g, '')
  // Agregar puntos de miles
  return soloNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// ---- Funcion auxiliar: limpiar precio para guardar ----
// Convierte "45.000" a 45000 (numero entero)
const limpiarPrecio = (valor) => {
  return parseInt(valor.replace(/\./g, ''), 10) || 0
}

export default function NuevoProducto() {

  // ---- Obtener el slug de la URL ----
  const { slug } = useParams()

  // ---- Estado del formulario ----
  const [nombre, setNombre]           = useState('')   // Nombre del producto
  const [descripcion, setDescripcion] = useState('')   // Descripcion del producto
  const [precioInput, setPrecioInput] = useState('')   // Precio formateado para mostrar
  const [stock, setStock]             = useState('1')  // Cantidad disponible
  const [categoria, setCategoria]     = useState('')   // Categoria del producto

  // ---- Estado de la IA ----
  const [mejorandoIA, setMejorandoIA] = useState(false)  // true mientras Groq procesa
  const [iaUsada, setIaUsada]         = useState(false)  // true si ya se uso la IA
  const [errorIA, setErrorIA]         = useState('')     // Error de la llamada a Groq

  // ---- Estado de la UI ----
  const [guardando, setGuardando]   = useState(false) // true mientras guarda en Supabase
  const [error, setError]           = useState('')    // Error general
  const [tiendaId, setTiendaId]     = useState(null) // ID de la tienda del vendedor

  // ---- Hooks ----
  const { user }  = useAuth()
  const navigate  = useNavigate()

  // ---- Verificar que el vendedor es dueno de esta tienda ----
  // Al montar, buscar la tienda por slug y verificar que pertenece al usuario
  useEffect(() => {
    if (user && slug) verificarTienda()
  }, [user, slug])

  const verificarTienda = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)          // Buscar por slug
      .eq('user_id', user.id)   // Verificar que es del usuario actual
      .eq('activo', true)
      .single()

    if (error || !data) {
      // Si no es su tienda, redirigir al panel
      navigate('/panel')
      return
    }

    // Guardar el ID de la tienda para el INSERT del producto
    setTiendaId(data.id)
  }

  // ---- Manejar cambio en el campo de precio ----
  // Formatea el numero mientras el vendedor escribe
  const handlePrecioChange = (e) => {
    const valorFormateado = formatearPrecioInput(e.target.value)
    setPrecioInput(valorFormateado)
  }

  // ---- Llamada a Groq para mejorar la descripcion ----
  const mejorarConIA = async () => {
    // Validar que haya al menos el nombre del producto
    if (!nombre.trim()) {
      setErrorIA('Escribe primero el nombre del producto para que la IA pueda ayudarte.')
      return
    }

    setMejorandoIA(true)
    setErrorIA('')

    try {
      // Construir el prompt para Groq
      // Le damos contexto del marketplace colombiano para respuestas relevantes
      const prompt = `Eres un experto en marketing para vendedores colombianos en redes sociales.
      
Mejora la descripcion de este producto para que sea mas atractiva, convincente y optimizada para ventas en un marketplace colombiano.

Producto: ${nombre}
Descripcion actual: ${descripcion || 'Sin descripcion todavia'}
${categoria ? `Categoria: ${categoria}` : ''}

Escribe una descripcion de maximo 150 palabras que:
- Sea directa y resalte los beneficios para el comprador
- Use un tono cercano y colombiano (sin modismos exagerados)
- Incluya detalles relevantes del producto
- Genere confianza y ganas de comprar
- NO uses asteriscos, listas con guiones ni formato markdown
- Solo texto corrido, maximo 3 parrafos cortos

Responde UNICAMENTE con la descripcion mejorada, sin presentaciones ni explicaciones.`

      // Llamar a la API de Groq
      const respuesta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`, // Key del .env
        },
        body: JSON.stringify({
          model:       'llama-3.3-70b-versatile', // Modelo de Groq
          max_tokens:  300,                        // Limite de tokens en la respuesta
          temperature: 0.7,                        // Creatividad moderada
          messages: [
            {
              role:    'user',
              content: prompt,
            }
          ],
        }),
      })

      if (!respuesta.ok) {
        throw new Error(`Error de Groq: ${respuesta.status}`)
      }

      const data = await respuesta.json()

      // Extraer el texto de la respuesta de Groq
      const descripcionMejorada = data.choices?.[0]?.message?.content?.trim()

      if (descripcionMejorada) {
        setDescripcion(descripcionMejorada) // Reemplazar con la descripcion mejorada
        setIaUsada(true)                    // Marcar que se uso la IA
      } else {
        throw new Error('La IA no devolvio una respuesta valida')
      }

    } catch (err) {
      console.error('Error con Groq:', err)
      // Mensaje de error amigable segun el tipo de fallo
      if (err.message.includes('401')) {
        setErrorIA('La API key de Groq no es valida. Verifica tu archivo .env.')
      } else if (err.message.includes('429')) {
        setErrorIA('Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.')
      } else {
        setErrorIA('No se pudo mejorar la descripcion ahora. Puedes escribirla manualmente.')
      }
    } finally {
      setMejorandoIA(false) // Quitar el estado de carga siempre
    }
  }

  // ---- Guardar el producto en Supabase ----
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones basicas antes de enviar
    const precioNumerico = limpiarPrecio(precioInput)

    if (precioNumerico < 0) {
      setError('El precio no puede ser negativo.')
      return
    }

    if (parseInt(stock, 10) < 0) {
      setError('El stock no puede ser negativo.')
      return
    }

    setGuardando(true)

    // INSERT del producto en Supabase
    const { error: errorSupabase } = await supabase
      .from('products')
      .insert([
        {
          store_id:    tiendaId,              // ID de la tienda del vendedor
          nombre:      nombre.trim(),          // Nombre sin espacios extra
          descripcion: descripcion.trim() || null, // null si esta vacio
          precio:      precioNumerico,         // Precio como entero en COP
          stock:       parseInt(stock, 10),    // Stock como entero
          categoria:   categoria || null,      // null si no selecciono
          activo:      true,                   // Producto activo desde el inicio
          imagenes:    [],                     // Sin imagenes por ahora
        }
      ])

    if (errorSupabase) {
      setError('Error al guardar el producto. Intenta de nuevo.')
      console.error('Error guardando producto:', errorSupabase)
      setGuardando(false)
      return
    }

    // Producto guardado — redirigir a la tienda publica
    navigate(`/tienda/${slug}`)
  }

  return (
    <div className="nuevo-producto">
      <div className="container">

        {/* ---- Navegacion de regreso ---- */}
        <Link to={`/tienda/${slug}`} className="nuevo-producto__volver">
          Volver a mi tienda
        </Link>

        {/* ---- Encabezado ---- */}
        <div className="nuevo-producto__encabezado">
          <h1 className="nuevo-producto__titulo">Nuevo producto</h1>
          <p className="nuevo-producto__subtitulo">
            Completa los datos de tu producto. Usa el asistente de IA
            para crear una descripcion que genere mas ventas.
          </p>
        </div>

        {/* ---- Formulario ---- */}
        <div className="nuevo-producto__layout">
          <form
            className="nuevo-producto__form"
            onSubmit={handleSubmit}
            noValidate
          >

            {/* ---- Nombre ---- */}
            <div className="nuevo-producto__campo">
              <label htmlFor="nombre" className="nuevo-producto__label">
                Nombre del producto
                <span className="nuevo-producto__requerido"> *</span>
              </label>
              <input
                id="nombre"
                type="text"
                className="nuevo-producto__input"
                placeholder="Ej: Blusa de lino manga larga color crema"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                maxLength={100}
                disabled={guardando}
              />
              <span className="nuevo-producto__contador">
                {nombre.length}/100
              </span>
            </div>

            {/* ---- Descripcion con boton de IA ---- */}
            <div className="nuevo-producto__campo">
              <div className="nuevo-producto__label-fila">
                <label htmlFor="descripcion" className="nuevo-producto__label">
                  Descripcion
                  <span className="nuevo-producto__opcional"> (opcional)</span>
                </label>

                {/* Boton de mejorar con IA */}
                <button
                  type="button"
                  className={`nuevo-producto__btn-ia ${mejorandoIA ? 'nuevo-producto__btn-ia--cargando' : ''} ${iaUsada ? 'nuevo-producto__btn-ia--usada' : ''}`}
                  onClick={mejorarConIA}
                  disabled={mejorandoIA || guardando || !nombre.trim()}
                  title={!nombre.trim() ? 'Escribe el nombre del producto primero' : 'Mejorar descripcion con IA'}
                >
                  {/* Texto del boton segun el estado */}
                  {mejorandoIA
                    ? 'Generando...'
                    : iaUsada
                    ? 'Mejorar de nuevo'
                    : 'Mejorar con IA'}
                </button>
              </div>

              <textarea
                id="descripcion"
                className="nuevo-producto__textarea"
                placeholder="Describe tu producto: materiales, tallas, colores, caracteristicas especiales... O usa el boton de IA para generar una descripcion automaticamente."
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value)
                  if (iaUsada) setIaUsada(false) // Si edita manualmente, resetear el estado
                }}
                maxLength={500}
                rows={5}
                disabled={guardando || mejorandoIA}
              />

              {/* Indicadores debajo del textarea */}
              <div className="nuevo-producto__textarea-footer">
                {/* Error de la IA */}
                {errorIA && (
                  <span className="nuevo-producto__error-ia">{errorIA}</span>
                )}
                {/* Indicador de que la IA mejoro la descripcion */}
                {iaUsada && !errorIA && (
                  <span className="nuevo-producto__ia-ok">
                    Descripcion mejorada por IA. Puedes editarla si quieres.
                  </span>
                )}
                {/* Contador de caracteres */}
                <span className="nuevo-producto__contador nuevo-producto__contador--derecha">
                  {descripcion.length}/500
                </span>
              </div>
            </div>

            {/* ---- Precio y Stock en fila ---- */}
            <div className="nuevo-producto__fila">

              {/* Precio */}
              <div className="nuevo-producto__campo">
                <label htmlFor="precio" className="nuevo-producto__label">
                  Precio (COP)
                  <span className="nuevo-producto__requerido"> *</span>
                </label>
                <div className="nuevo-producto__input-precio">
                  {/* Prefijo del signo de pesos */}
                  <span className="nuevo-producto__precio-prefijo">$</span>
                  <input
                    id="precio"
                    type="text"
                    inputMode="numeric"   // Teclado numerico en movil
                    className="nuevo-producto__input nuevo-producto__input--precio"
                    placeholder="0"
                    value={precioInput}
                    onChange={handlePrecioChange}
                    required
                    disabled={guardando}
                  />
                </div>
                {/* Aviso sobre el umbral de comision */}
                {limpiarPrecio(precioInput) > 0 && limpiarPrecio(precioInput) < 13000 && (
                  <span className="nuevo-producto__aviso-precio">
                    Productos bajo $13.000 no generan comision de plataforma.
                  </span>
                )}
              </div>

              {/* Stock */}
              <div className="nuevo-producto__campo">
                <label htmlFor="stock" className="nuevo-producto__label">
                  Unidades disponibles
                  <span className="nuevo-producto__requerido"> *</span>
                </label>
                <input
                  id="stock"
                  type="number"
                  className="nuevo-producto__input"
                  placeholder="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min="0"      // No puede ser negativo
                  max="9999"   // Limite razonable
                  required
                  disabled={guardando}
                />
              </div>

            </div>

            {/* ---- Categoria ---- */}
            <div className="nuevo-producto__campo">
              <label htmlFor="categoria" className="nuevo-producto__label">
                Categoria
                <span className="nuevo-producto__opcional"> (opcional)</span>
              </label>
              <select
                id="categoria"
                className="nuevo-producto__select"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                disabled={guardando}
              >
                <option value="">Selecciona una categoria</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* ---- Nota de imagenes ---- */}
            {/* La subida de imagenes se construye en una siguiente iteracion */}
            <div className="nuevo-producto__nota-imagenes">
              <p>
                La subida de imagenes estara disponible en la proxima
                actualizacion. Por ahora puedes publicar el producto
                sin imagen y agregarla despues.
              </p>
            </div>

            {/* ---- Error general ---- */}
            {error && (
              <div className="nuevo-producto__error" role="alert">
                <span aria-hidden="true">&#9888;</span>
                {error}
              </div>
            )}

            {/* ---- Botones de accion ---- */}
            <div className="nuevo-producto__acciones">
              {/* Cancelar — volver a la tienda */}
              <Link
                to={`/tienda/${slug}`}
                className="btn-secondary nuevo-producto__btn-cancelar"
              >
                Cancelar
              </Link>

              {/* Guardar producto */}
              <button
                type="submit"
                className="btn-primary nuevo-producto__btn-guardar"
                disabled={guardando || !nombre.trim() || !precioInput || !stock}
              >
                {guardando ? 'Guardando...' : 'Publicar producto'}
              </button>
            </div>

          </form>

          {/* ---- Panel informativo lateral ---- */}
          <aside className="nuevo-producto__lateral">

            {/* Consejos para una buena descripcion */}
            <div className="nuevo-producto__consejo">
              <h3 className="nuevo-producto__consejo-titulo">
                Consejos para vender mas
              </h3>
              <ul className="nuevo-producto__consejo-lista">
                <li>Menciona los materiales o ingredientes del producto</li>
                <li>Incluye tallas, medidas o presentaciones disponibles</li>
                <li>Describe el beneficio principal para el comprador</li>
                <li>Si tiene envio rapido o entrega en tu ciudad, dilo</li>
                <li>Un buen nombre con palabras clave ayuda a que te encuentren</li>
              </ul>
            </div>

            {/* Informacion sobre comisiones */}
            <div className="nuevo-producto__comisiones">
              <h3 className="nuevo-producto__consejo-titulo">
                Sobre las comisiones
              </h3>
              <p className="nuevo-producto__comisiones-texto">
                Solo cobramos comision por productos con precio igual o
                mayor a $13.000 COP. En el plan Gratis la comision
                es del 8% sobre cada venta completada.
              </p>
            </div>

          </aside>
        </div>

      </div>
    </div>
  )
}
