// ============================================================
// src/pages/PanelPedidoDetalle.jsx — Detalle de un pedido
// ============================================================
// Ruta: /panel/pedidos/:id (privada)
//
// Muestra toda la informacion de un pedido y permite al
// vendedor cambiar el estado — incluyendo confirmar el pago
// cuando verifica la transferencia por Nequi.
// ============================================================

import { useState, useEffect }        from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth }                     from '@/context/AuthContext'
import { supabase }                    from '@/lib/supabase'
import '@/styles/PanelPedidoDetalle.css'

// ---- Formatear precio ----
const formatearPrecio = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(valor)
}

// ---- Formatear fecha completa ----
const formatearFechaCompleta = (fechaISO) => {
  return new Date(fechaISO).toLocaleDateString('es-CO', {
    weekday: 'long', day: '2-digit', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ---- Configuracion completa de estados ----
// Define que estados puede alcanzar cada estado actual
const FLUJO_ESTADOS = {
  pendiente_pago:  {
    label:      'Pago pendiente',
    clase:      'estado--pendiente',
    siguientes: ['pagado', 'cancelado'],
    descripcion: 'Esperando que el comprador realice la transferencia por Nequi.',
  },
  pagado: {
    label:      'Pagado',
    clase:      'estado--pagado',
    siguientes: ['en_preparacion', 'cancelado'],
    descripcion: 'Pago recibido y verificado. Prepara el pedido para envio.',
  },
  en_preparacion: {
    label:      'En preparacion',
    clase:      'estado--preparacion',
    siguientes: ['enviado'],
    descripcion: 'Estas preparando el pedido. El comprador ya sabe que va en camino.',
  },
  enviado: {
    label:      'Enviado',
    clase:      'estado--enviado',
    siguientes: ['entregado'],
    descripcion: 'El pedido fue enviado. Esperando confirmacion del comprador.',
  },
  entregado: {
    label:      'Entregado',
    clase:      'estado--entregado',
    siguientes: ['completado'],
    descripcion: 'El comprador recibio el pedido. Esperando confirmacion final.',
  },
  completado: {
    label:      'Completado',
    clase:      'estado--completado',
    siguientes: [],
    descripcion: 'Pedido completado. El pago sera transferido a tu cuenta.',
  },
  disputa: {
    label:      'En disputa',
    clase:      'estado--disputa',
    siguientes: [],
    descripcion: 'El comprador abrio una disputa. FenixAI esta revisando el caso.',
  },
  reembolsado: {
    label:      'Reembolsado',
    clase:      'estado--reembolsado',
    siguientes: [],
    descripcion: 'El pago fue reembolsado al comprador.',
  },
  cancelado: {
    label:      'Cancelado',
    clase:      'estado--cancelado',
    siguientes: [],
    descripcion: 'El pedido fue cancelado.',
  },
}

// ---- Labels de los botones de cambio de estado ----
const LABELS_ACCION = {
  pagado:         'Confirmar pago recibido',
  en_preparacion: 'Marcar como en preparacion',
  enviado:        'Marcar como enviado',
  entregado:      'Marcar como entregado',
  completado:     'Marcar como completado',
  cancelado:      'Cancelar pedido',
}

export default function PanelPedidoDetalle() {

  const { id }    = useParams()  // ID del pedido desde la URL
  const { user }  = useAuth()
  const navigate  = useNavigate()

  // ---- Estado de los datos ----
  const [pedido, setPedido]     = useState(null)
  const [producto, setProducto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError]       = useState('')

  // ---- Estado de cambio de estado ----
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [estadoExitoso, setEstadoExitoso]     = useState(false)

  // ---- Cargar pedido ----
  useEffect(() => {
    if (user && id) cargarPedido()
  }, [user, id])

  const cargarPedido = async () => {
    setCargando(true)
    try {
      // Obtener la tienda del vendedor
      const { data: tienda } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .eq('activo', true)
        .single()

      if (!tienda) { navigate('/panel'); return }

      // Obtener el pedido verificando que pertenece a esta tienda
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .eq('store_id', tienda.id) // Seguridad: solo pedidos de esta tienda
        .single()

      if (pedidoError || !pedidoData) {
        setError('Pedido no encontrado.')
        setCargando(false)
        return
      }

      setPedido(pedidoData)

      // Obtener el producto del pedido
      const { data: productoData } = await supabase
        .from('products')
        .select('id, nombre, precio, imagenes, categoria')
        .eq('id', pedidoData.product_id)
        .single()

      setProducto(productoData)

    } catch (err) {
      console.error('Error cargando pedido:', err)
      setError('Error al cargar el pedido.')
    } finally {
      setCargando(false)
    }
  }

  // ---- Cambiar estado del pedido ----
  const cambiarEstado = async (nuevoEstado) => {
    setCambiandoEstado(true)
    setError('')

    const { error } = await supabase
      .from('orders')
      .update({
        estado:         nuevoEstado,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', pedido.id)

    if (error) {
      setError('Error al actualizar el estado. Intenta de nuevo.')
      setCambiandoEstado(false)
      return
    }

    // Actualizar el estado local sin recargar
    setPedido(prev => ({ ...prev, estado: nuevoEstado }))
    setCambiandoEstado(false)
    setEstadoExitoso(true)
    setTimeout(() => setEstadoExitoso(false), 3000)
  }

  // ---- Estado de carga ----
  if (cargando) {
    return (
      <div className="pedido-detalle">
        <div className="container">
          <div className="pedido-detalle__cargando">
            <div className="pedido-detalle__skeleton pedido-detalle__skeleton--header" />
            <div className="pedido-detalle__skeleton pedido-detalle__skeleton--bloque" />
            <div className="pedido-detalle__skeleton pedido-detalle__skeleton--bloque" />
          </div>
        </div>
      </div>
    )
  }

  if (error && !pedido) {
    return (
      <div className="pedido-detalle">
        <div className="container">
          <div className="pedido-detalle__error-fatal">
            <p>{error}</p>
            <Link to="/panel/pedidos" className="btn-primary">
              Volver a pedidos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Datos del estado actual
  const estadoActual  = FLUJO_ESTADOS[pedido.estado] || { label: pedido.estado, clase: '', siguientes: [], descripcion: '' }
  const referencia    = pedido.id.slice(0, 6).toUpperCase()

  return (
    <div className="pedido-detalle">
      <div className="container">

        {/* ---- Navegacion ---- */}
        <Link to="/panel/pedidos" className="pedido-detalle__volver">
          Volver a pedidos
        </Link>

        {/* ---- Encabezado ---- */}
        <div className="pedido-detalle__encabezado">
          <div>
            <h1 className="pedido-detalle__titulo">
              Pedido <code className="pedido-detalle__referencia">#{referencia}</code>
            </h1>
            <p className="pedido-detalle__fecha">
              {formatearFechaCompleta(pedido.creado_en)}
            </p>
          </div>

          {/* Estado actual destacado */}
          <span className={`pedido-detalle__estado-badge ${estadoActual.clase}`}>
            {estadoActual.label}
          </span>
        </div>

        {/* ---- Layout: columna principal + lateral ---- */}
        <div className="pedido-detalle__layout">

          {/* ---- Columna principal ---- */}
          <div className="pedido-detalle__principal">

            {/* ---- Bloque: Gestion del estado ---- */}
            <div className="pedido-detalle__bloque">
              <h2 className="pedido-detalle__bloque-titulo">Estado del pedido</h2>

              {/* Descripcion del estado actual */}
              <p className="pedido-detalle__estado-desc">
                {estadoActual.descripcion}
              </p>

              {/* Notificacion de exito */}
              {estadoExitoso && (
                <div className="pedido-detalle__exito" role="status">
                  Estado actualizado correctamente.
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="pedido-detalle__error" role="alert">
                  {error}
                </div>
              )}

              {/* Botones de cambio de estado */}
              {estadoActual.siguientes.length > 0 && (
                <div className="pedido-detalle__acciones-estado">
                  {estadoActual.siguientes.map((siguienteEstado) => (
                    <button
                      key={siguienteEstado}
                      className={`pedido-detalle__btn-estado ${
                        siguienteEstado === 'cancelado'
                          ? 'pedido-detalle__btn-estado--cancelar'
                          : 'pedido-detalle__btn-estado--avanzar'
                      }`}
                      onClick={() => cambiarEstado(siguienteEstado)}
                      disabled={cambiandoEstado}
                      type="button"
                    >
                      {cambiandoEstado
                        ? 'Actualizando...'
                        : LABELS_ACCION[siguienteEstado] || siguienteEstado
                      }
                    </button>
                  ))}
                </div>
              )}

              {/* Timeline del flujo de estados */}
              <div className="pedido-detalle__timeline">
                {['pendiente_pago', 'pagado', 'en_preparacion', 'enviado', 'entregado', 'completado'].map((estado, index) => {
                  const config  = FLUJO_ESTADOS[estado]
                  const estados = ['pendiente_pago', 'pagado', 'en_preparacion', 'enviado', 'entregado', 'completado']
                  const indexActual  = estados.indexOf(pedido.estado)
                  const indexEste    = estados.indexOf(estado)
                  const esPasado     = indexEste < indexActual
                  const esActual     = estado === pedido.estado
                  const esFuturo     = indexEste > indexActual

                  return (
                    <div
                      key={estado}
                      className={`pedido-detalle__timeline-paso ${
                        esPasado  ? 'pedido-detalle__timeline-paso--pasado'  :
                        esActual  ? 'pedido-detalle__timeline-paso--actual'  :
                                    'pedido-detalle__timeline-paso--futuro'
                      }`}
                    >
                      {/* Indicador circular */}
                      <div className="pedido-detalle__timeline-punto">
                        {esPasado && <span>&#10003;</span>}
                        {esActual && <span>{index + 1}</span>}
                        {esFuturo && <span>{index + 1}</span>}
                      </div>
                      {/* Label del estado */}
                      <span className="pedido-detalle__timeline-label">
                        {config.label}
                      </span>
                    </div>
                  )
                })}
              </div>

            </div>

            {/* ---- Bloque: Datos del comprador ---- */}
            <div className="pedido-detalle__bloque">
              <h2 className="pedido-detalle__bloque-titulo">Datos del comprador</h2>

              <div className="pedido-detalle__datos-grid">

                <div className="pedido-detalle__dato">
                  <span className="pedido-detalle__dato-label">Nombre</span>
                  <span className="pedido-detalle__dato-valor">{pedido.buyer_name}</span>
                </div>

                <div className="pedido-detalle__dato">
                  <span className="pedido-detalle__dato-label">Email</span>
                  <a
                    href={`mailto:${pedido.buyer_email}`}
                    className="pedido-detalle__dato-link"
                  >
                    {pedido.buyer_email}
                  </a>
                </div>

                {pedido.buyer_phone && (
                  <div className="pedido-detalle__dato">
                    <span className="pedido-detalle__dato-label">Telefono</span>
                    <a
                      href={`https://wa.me/57${pedido.buyer_phone.replace(/\D/g, '')}`}
                      className="pedido-detalle__dato-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {pedido.buyer_phone} (WhatsApp)
                    </a>
                  </div>
                )}

                {pedido.direccion_entrega && (
                  <div className="pedido-detalle__dato">
                    <span className="pedido-detalle__dato-label">Direccion</span>
                    <span className="pedido-detalle__dato-valor">{pedido.direccion_entrega}</span>
                  </div>
                )}

                {pedido.ciudad_entrega && (
                  <div className="pedido-detalle__dato">
                    <span className="pedido-detalle__dato-label">Ciudad</span>
                    <span className="pedido-detalle__dato-valor">{pedido.ciudad_entrega}</span>
                  </div>
                )}

                {pedido.notas_vendedor && (
                  <div className="pedido-detalle__dato pedido-detalle__dato--ancho">
                    <span className="pedido-detalle__dato-label">Notas del comprador</span>
                    <span className="pedido-detalle__dato-valor">{pedido.notas_vendedor}</span>
                  </div>
                )}

              </div>
            </div>

            {/* ---- Bloque: Producto ---- */}
            {producto && (
              <div className="pedido-detalle__bloque">
                <h2 className="pedido-detalle__bloque-titulo">Producto</h2>

                <div className="pedido-detalle__producto">
                  {/* Imagen del producto */}
                  <div className="pedido-detalle__producto-imagen">
                    {producto.imagenes?.[0] ? (
                      <img
                        src={producto.imagenes[0]}
                        alt={producto.nombre}
                        className="pedido-detalle__producto-img"
                      />
                    ) : (
                      <div className="pedido-detalle__producto-sin-imagen">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  {/* Info del producto */}
                  <div className="pedido-detalle__producto-info">
                    <h3 className="pedido-detalle__producto-nombre">
                      {producto.nombre}
                    </h3>
                    {producto.categoria && (
                      <span className="pedido-detalle__producto-categoria">
                        {producto.categoria}
                      </span>
                    )}
                    <div className="pedido-detalle__producto-precios">
                      <span>{formatearPrecio(pedido.precio_unitario)} x {pedido.cantidad}</span>
                      <span className="pedido-detalle__producto-subtotal">
                        {formatearPrecio(pedido.precio_unitario * pedido.cantidad)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* ---- Lateral: resumen financiero ---- */}
          <aside className="pedido-detalle__lateral">

            {/* Resumen del pago */}
            <div className="pedido-detalle__bloque">
              <h2 className="pedido-detalle__bloque-titulo">Resumen del pago</h2>

              <div className="pedido-detalle__finanzas">

                <div className="pedido-detalle__finanza-fila">
                  <span>Subtotal</span>
                  <span>{formatearPrecio(pedido.total)}</span>
                </div>

                <div className="pedido-detalle__finanza-fila pedido-detalle__finanza-fila--comision">
                  <span>Comision FenixAI ({pedido.comision_porcentaje}%)</span>
                  <span>- {formatearPrecio(pedido.comision_monto)}</span>
                </div>

                <div className="pedido-detalle__finanza-separador" />

                <div className="pedido-detalle__finanza-fila pedido-detalle__finanza-fila--total">
                  <span>Tu ganancia</span>
                  <span className="pedido-detalle__ganancia">
                    {formatearPrecio(pedido.total - pedido.comision_monto)}
                  </span>
                </div>

              </div>

              {/* Nota sobre el desembolso */}
              <p className="pedido-detalle__nota-desembolso">
                Tu ganancia se transfiere cuando el pedido
                este en estado Completado.
              </p>
            </div>

            {/* Referencia del pedido */}
            <div className="pedido-detalle__bloque">
              <h2 className="pedido-detalle__bloque-titulo">Referencia</h2>
              <code className="pedido-detalle__referencia-grande">
                #{referencia}
              </code>
              <p className="pedido-detalle__referencia-nota">
                El comprador uso esta referencia en su transferencia por Nequi.
              </p>
            </div>

          </aside>

        </div>
      </div>
    </div>
  )
}