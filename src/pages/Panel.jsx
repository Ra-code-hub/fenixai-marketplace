// ============================================================
// src/pages/Panel.jsx — Panel del vendedor (dashboard)
// ============================================================
// Ruta: /panel (🔒 privada — requiere autenticación)
//
// Consultas a Supabase:
// 1. stores     → datos de la tienda del usuario autenticado
// 2. products   → conteo de productos activos
// 3. orders     → últimos 5 pedidos + total de ventas
//
// Si el usuario no tiene tienda creada → redirige a /crear-tienda
// ============================================================

import { useState, useEffect }   from 'react'
import { Link, useNavigate }     from 'react-router-dom'
import { useAuth }               from '@/context/AuthContext'
import { supabase }              from '@/lib/supabase'
import '@/styles/Panel.css'

// ---- Función auxiliar: formatear precio en pesos colombianos ----
// Convierte 45000 → "$45.000"
const formatearPrecio = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style:    'currency',
    currency: 'COP',
    minimumFractionDigits: 0, // Sin decimales para pesos colombianos
  }).format(valor)
}

// ---- Etiquetas de estado de pedidos en español ----
const ESTADOS_PEDIDO = {
  pendiente_pago:  { label: 'Pago pendiente',  clase: 'estado--pendiente' },
  pagado:          { label: 'Pagado',           clase: 'estado--pagado'    },
  en_preparacion:  { label: 'En preparación',   clase: 'estado--preparacion'},
  enviado:         { label: 'Enviado',          clase: 'estado--enviado'   },
  entregado:       { label: 'Entregado',        clase: 'estado--entregado' },
  completado:      { label: 'Completado',       clase: 'estado--completado'},
  disputa:         { label: 'En disputa',       clase: 'estado--disputa'   },
  reembolsado:     { label: 'Reembolsado',      clase: 'estado--reembolsado'},
  cancelado:       { label: 'Cancelado',        clase: 'estado--cancelado' },
}

export default function Panel() {

  // ---- Estado de los datos ----
  const [tienda, setTienda]             = useState(null)  // Datos de la tienda
  const [stats, setStats]               = useState({      // Estadísticas del panel
    totalProductos: 0,   // Número de productos activos
    totalPedidos:   0,   // Número total de pedidos
    totalVentas:    0,   // Suma de ventas completadas en COP
  })
  const [pedidosRecientes, setPedidosRecientes] = useState([]) // Últimos 5 pedidos
  const [cargando, setCargando]         = useState(true)  // Estado de carga inicial
  const [error, setError]               = useState('')    // Error de carga

  // ---- Hooks ----
  const { user }  = useAuth()    // Usuario autenticado
  const navigate  = useNavigate() // Para redirigir si no tiene tienda

  // ---- Cargar datos del panel al montar el componente ----
  useEffect(() => {
    if (user) cargarDatos() // Solo cargar si hay usuario autenticado
  }, [user]) // Dependencia: se ejecuta cuando cambia el usuario

  // ---- Función principal de carga de datos ----
  const cargarDatos = async () => {
    setCargando(true)
    setError('')

    try {
      // ---- Paso 1: Obtener la tienda del usuario ----
      const { data: tiendaData, error: tiendaError } = await supabase
        .from('stores')
        .select('*')              // Todos los campos de la tienda
        .eq('user_id', user.id)  // Solo la tienda de este usuario
        .eq('activo', true)       // Solo tiendas activas
        .single()                 // Esperamos exactamente una tienda

      if (tiendaError) {
        if (tiendaError.code === 'PGRST116') {
          // No encontró tienda — redirigir a crear tienda
          navigate('/crear-tienda')
          return
        }
        throw tiendaError // Otro error — lanzar para el catch
      }

      setTienda(tiendaData) // Guardar datos de la tienda

      // ---- Paso 2: Contar productos activos de esta tienda ----
      const { count: totalProductos } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true }) // head:true = solo el conteo
        .eq('store_id', tiendaData.id)
        .eq('activo', true)

      // ---- Paso 3: Obtener pedidos de esta tienda ----
      const { data: pedidosData } = await supabase
        .from('orders')
        .select(`
          id,
          buyer_name,
          total,
          estado,
          creado_en,
          cantidad
        `)                              // Solo los campos necesarios para el panel
        .eq('store_id', tiendaData.id) // Solo pedidos de esta tienda
        .order('creado_en', { ascending: false }) // Más recientes primero
        .limit(5)                       // Solo los últimos 5 para el panel

      // ---- Paso 4: Calcular total de ventas completadas ----
      const { data: ventasData } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', tiendaData.id)
        .in('estado', ['completado', 'entregado']) // Solo ventas exitosas

      // Sumar todos los totales de ventas completadas
      const totalVentas = ventasData?.reduce(
        (suma, pedido) => suma + (pedido.total || 0), 0
      ) || 0

      // ---- Paso 5: Contar total de pedidos (todos los estados) ----
      const { count: totalPedidos } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', tiendaData.id)

      // ---- Actualizar el estado con todos los datos obtenidos ----
      setStats({
        totalProductos: totalProductos || 0,
        totalPedidos:   totalPedidos   || 0,
        totalVentas,
      })

      setPedidosRecientes(pedidosData || [])

    } catch (err) {
      // Capturar cualquier error inesperado
      setError('Error cargando el panel. Intenta recargar la página.')
      console.error('Error en el panel:', err)
    } finally {
      // Siempre quitar el estado de carga, con o sin error
      setCargando(false)
    }
  }

  // ---- Formatear fecha de pedido ----
  // Convierte "2024-03-15T10:30:00Z" → "15 mar 2024"
  const formatearFecha = (fechaISO) => {
    return new Date(fechaISO).toLocaleDateString('es-CO', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
    })
  }

  // ---- Estado de carga ----
  if (cargando) {
    return (
      <div className="panel">
        <div className="container">
          <div className="panel__cargando">
            {/* Esqueletos de carga — dan sensación de velocidad */}
            <div className="panel__skeleton panel__skeleton--titulo" />
            <div className="panel__skeleton-grid">
              <div className="panel__skeleton panel__skeleton--stat" />
              <div className="panel__skeleton panel__skeleton--stat" />
              <div className="panel__skeleton panel__skeleton--stat" />
            </div>
            <div className="panel__skeleton panel__skeleton--tabla" />
          </div>
        </div>
      </div>
    )
  }

  // ---- Estado de error ----
  if (error) {
    return (
      <div className="panel">
        <div className="container">
          <div className="panel__error">
            <span aria-hidden="true">⚠️</span>
            <p>{error}</p>
            {/* Botón para reintentar la carga */}
            <button
              className="btn-primary"
              onClick={cargarDatos}
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- Panel principal ----
  return (
    <div className="panel">
      <div className="container">

        {/* ---- Encabezado del panel ---- */}
        <div className="panel__encabezado">
          <div className="panel__bienvenida">

            {/* Avatar de la tienda con inicial */}
            <div className="panel__avatar">
              {tienda?.nombre?.charAt(0).toUpperCase() || '🏪'}
            </div>

            <div className="panel__bienvenida-texto">
              {/* Nombre de la tienda */}
              <h1 className="panel__titulo">
                {tienda?.nombre}
              </h1>
              {/* Estado de verificación */}
              <span className={`panel__verificacion ${
                tienda?.verificado
                  ? 'panel__verificacion--ok'
                  : 'panel__verificacion--pendiente'
              }`}>
                {tienda?.verificado
                  ? '✓ Tienda verificada'
                  : '⏳ Verificación pendiente'}
              </span>
            </div>
          </div>

          {/* Acciones rápidas del encabezado */}
          <div className="panel__acciones-header">
            {/* Ver tienda pública */}
            <Link
              to={`/tienda/${tienda?.slug}`}
              className="btn-secondary panel__btn-ver"
              target="_blank" // Abrir en nueva pestaña
              rel="noopener noreferrer"
            >
              Ver mi tienda →
            </Link>
          </div>
        </div>

        {/* ---- Banner de verificación pendiente ---- */}
        {/* Solo se muestra si la tienda no está verificada */}
        {!tienda?.verificado && (
          <div className="panel__banner-verificacion">
            <span aria-hidden="true">🪪</span>
            <div>
              <strong>Completa tu verificación</strong>
              <p>
                Para recibir pagos necesitas verificar tu identidad con cédula
                y cuenta bancaria. Es rápido y solo se hace una vez.
              </p>
            </div>
            <Link to="/verificacion" className="panel__banner-btn">
              Verificar ahora
            </Link>
          </div>
        )}

        {/* ---- Tarjetas de estadísticas ---- */}
        <div className="panel__stats">

          {/* Stat: Productos */}
          <div className="panel__stat">
            <span className="panel__stat-icono" aria-hidden="true">📦</span>
            <div className="panel__stat-datos">
              <span className="panel__stat-valor">{stats.totalProductos}</span>
              <span className="panel__stat-label">Productos activos</span>
            </div>
          </div>

          {/* Stat: Pedidos */}
          <div className="panel__stat">
            <span className="panel__stat-icono" aria-hidden="true">🛒</span>
            <div className="panel__stat-datos">
              <span className="panel__stat-valor">{stats.totalPedidos}</span>
              <span className="panel__stat-label">Pedidos recibidos</span>
            </div>
          </div>

          {/* Stat: Ventas totales */}
          <div className="panel__stat panel__stat--destacado">
            <span className="panel__stat-icono" aria-hidden="true">💰</span>
            <div className="panel__stat-datos">
              <span className="panel__stat-valor">
                {formatearPrecio(stats.totalVentas)}
              </span>
              <span className="panel__stat-label">Ventas completadas</span>
            </div>
          </div>

        </div>

        {/* ---- Acciones rápidas ---- */}
        <div className="panel__acciones">
          <h2 className="panel__seccion-titulo">Acciones rápidas</h2>
          <div className="panel__acciones-grid">

            {/* Agregar nuevo producto */}
            <Link
              to={`/tienda/${tienda?.slug}/nuevo-producto`}
              className="panel__accion"
            >
              <span className="panel__accion-icono" aria-hidden="true">➕</span>
              <div>
                <strong className="panel__accion-titulo">Nuevo producto</strong>
                <p className="panel__accion-desc">
                  Publica un producto con IA que mejora la descripción
                </p>
              </div>
            </Link>

            {/* Ver pedidos */}
            <Link to="/panel/pedidos" className="panel__accion">
              <span className="panel__accion-icono" aria-hidden="true">📋</span>
              <div>
                <strong className="panel__accion-titulo">Ver pedidos</strong>
                <p className="panel__accion-desc">
                  Gestiona y actualiza el estado de tus pedidos
                </p>
              </div>
            </Link>

            {/* Editar tienda */}
            <Link to="/panel/editar-tienda" className="panel__accion">
              <span className="panel__accion-icono" aria-hidden="true">✏️</span>
              <div>
                <strong className="panel__accion-titulo">Editar tienda</strong>
                <p className="panel__accion-desc">
                  Cambia el nombre, logo, descripción y ciudad
                </p>
              </div>
            </Link>

            {/* Verificación */}
            <Link to="/verificacion" className="panel__accion">
              <span className="panel__accion-icono" aria-hidden="true">🪪</span>
              <div>
                <strong className="panel__accion-titulo">Verificación</strong>
                <p className="panel__accion-desc">
                  Sube tu cédula y cuenta bancaria para recibir pagos
                </p>
              </div>
            </Link>

          </div>
        </div>

        {/* ---- Últimos pedidos ---- */}
        <div className="panel__pedidos">
          <div className="panel__pedidos-header">
            <h2 className="panel__seccion-titulo">Últimos pedidos</h2>
            {/* Link a la lista completa de pedidos */}
            {stats.totalPedidos > 5 && (
              <Link to="/panel/pedidos" className="panel__pedidos-ver-todos">
                Ver todos →
              </Link>
            )}
          </div>

          {pedidosRecientes.length === 0 ? (
            // ---- Estado vacío — sin pedidos aún ----
            <div className="panel__pedidos-vacio">
              <span aria-hidden="true">🛒</span>
              <p>Aún no tienes pedidos.</p>
              <p className="panel__pedidos-vacio-sub">
                Comparte el link de tu tienda para empezar a vender.
              </p>
              {/* Botón para copiar el link de la tienda */}
              <button
                className="btn-primary panel__btn-compartir"
                type="button"
                onClick={() => {
                  // Copiar URL de la tienda al portapapeles
                  navigator.clipboard.writeText(
                    `${window.location.origin}/tienda/${tienda?.slug}`
                  )
                  alert('¡Link copiado! Compártelo en Instagram y WhatsApp.')
                }}
              >
                Copiar link de mi tienda
              </button>
            </div>
          ) : (
            // ---- Tabla de pedidos recientes ----
            <div className="panel__pedidos-tabla">

              {/* Cabecera de la tabla */}
              <div className="panel__pedidos-cabecera">
                <span>Comprador</span>
                <span>Total</span>
                <span>Estado</span>
                <span>Fecha</span>
              </div>

              {/* Filas de pedidos */}
              {pedidosRecientes.map((pedido) => {
                // Obtener la configuración del estado del pedido
                const estadoConfig = ESTADOS_PEDIDO[pedido.estado] || {
                  label: pedido.estado,
                  clase: ''
                }

                return (
                  <Link
                    key={pedido.id}             // Key única para React
                    to={`/pedido/${pedido.id}`} // Link al detalle del pedido
                    className="panel__pedido-fila"
                  >
                    {/* Nombre del comprador */}
                    <span className="panel__pedido-comprador">
                      {pedido.buyer_name}
                    </span>

                    {/* Total del pedido */}
                    <span className="panel__pedido-total">
                      {formatearPrecio(pedido.total)}
                    </span>

                    {/* Badge de estado */}
                    <span className={`panel__pedido-estado ${estadoConfig.clase}`}>
                      {estadoConfig.label}
                    </span>

                    {/* Fecha del pedido */}
                    <span className="panel__pedido-fecha">
                      {formatearFecha(pedido.creado_en)}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* ---- Plan actual ---- */}
        <div className="panel__plan">
          <div className="panel__plan-info">
            <span className="panel__plan-badge">
              Plan {tienda?.plan?.charAt(0).toUpperCase() + tienda?.plan?.slice(1)}
            </span>
            <p className="panel__plan-desc">
              {tienda?.plan === 'gratis'
                ? 'Comisión del 8% por venta. Pasa al plan Pro y paga solo 4%.'
                : tienda?.plan === 'pro'
                ? 'Comisión del 4% por venta. ¡Estás ahorrando con Pro!'
                : 'Comisión del 2.5% por venta. Máximo ahorro con Agencia.'}
            </p>
          </div>
          {/* CTA para mejorar el plan — solo en plan gratis */}
          {tienda?.plan === 'gratis' && (
            <Link to="/planes" className="panel__plan-btn">
              Mejorar a Pro
            </Link>
          )}
        </div>

      </div>
    </div>
  )
}