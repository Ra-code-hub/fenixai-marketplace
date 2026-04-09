// ============================================================
// src/pages/Admin.jsx — Panel de administracion (solo admin)
// ============================================================
// Ruta: /admin (privada — solo rol 'admin')
//
// Dashboard central con vision completa de la plataforma:
// - Resumen de metricas generales
// - Pedidos pendientes de confirmacion de pago
// - Tiendas pendientes de verificacion
// - Acceso rapido a todas las secciones de gestion
// ============================================================

import { useState, useEffect }  from 'react'
import { Link }                 from 'react-router-dom'
import { supabase }             from '@/lib/supabase'
import '@/styles/Admin.css'

const { esAdmin } = useAuth()

// Si no es admin, no mostrar nada
if (!esAdmin) return (
  <div style={{padding: '40px', textAlign: 'center'}}>
    <h2>Acceso restringido</h2>
    <p>No tienes permisos para ver esta página.</p>
  </div>
)

// ---- Formatear precio ----
const formatearPrecio = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(valor)
}

// ---- Formatear fecha ----
const formatearFecha = (fechaISO) => {
  return new Date(fechaISO).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ---- Configuracion de estados ----
const ESTADOS = {
  pendiente_pago:  { label: 'Pago pendiente',  clase: 'estado--pendiente' },
  pagado:          { label: 'Pagado',           clase: 'estado--pagado' },
  en_preparacion:  { label: 'En preparacion',   clase: 'estado--preparacion' },
  enviado:         { label: 'Enviado',          clase: 'estado--enviado' },
  entregado:       { label: 'Entregado',        clase: 'estado--entregado' },
  completado:      { label: 'Completado',       clase: 'estado--completado' },
  disputa:         { label: 'En disputa',       clase: 'estado--disputa' },
  cancelado:       { label: 'Cancelado',        clase: 'estado--cancelado' },
}

export default function Admin() {

  // ---- Estado de metricas ----
  const [metricas, setMetricas] = useState({
    totalTiendas:       0,
    tiendasActivas:     0,
    tiendasPendientes:  0,
    totalPedidos:       0,
    pedidosPendientes:  0,
    pedidosDisputa:     0,
    ventasTotales:      0,
    comisionesTotales:  0,
  })

  // ---- Estado de listas ----
  const [pedidosPendientes, setPedidosPendientes]   = useState([]) // Pagos por confirmar
  const [tiendasPendientes, setTiendasPendientes]   = useState([]) // Verificaciones pendientes
  const [cargando, setCargando]                     = useState(true)

  // ---- Cargar todos los datos al montar ----
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)

    try {
      // ---- Metricas de tiendas ----
      const { data: todasTiendas } = await supabase
        .from('stores')
        .select('id, verificado, activo')

      const tiendasActivas    = todasTiendas?.filter(t => t.activo) || []
      const tiendasSinVerif   = todasTiendas?.filter(t => !t.verificado && t.activo) || []

      // ---- Metricas de pedidos ----
      const { data: todosPedidos } = await supabase
        .from('orders')
        .select('id, total, comision_monto, estado, creado_en, buyer_name, store_id')
        .order('creado_en', { ascending: false })

      const pendientesPago  = todosPedidos?.filter(p => p.estado === 'pendiente_pago') || []
      const enDisputa       = todosPedidos?.filter(p => p.estado === 'disputa') || []
      const completados     = todosPedidos?.filter(p =>
        p.estado === 'completado' || p.estado === 'entregado'
      ) || []

      const ventasTotales    = completados.reduce((s, p) => s + p.total, 0)
      const comisionesTotales = completados.reduce((s, p) => s + p.comision_monto, 0)

      // ---- Tiendas pendientes de verificacion ----
      const { data: tiendasPendData } = await supabase
        .from('stores')
        .select('id, nombre, slug, ciudad, creado_en')
        .eq('verificado', false)
        .eq('activo', true)
        .order('creado_en', { ascending: false })
        .limit(5)

      // Actualizar estado
      setMetricas({
        totalTiendas:      todasTiendas?.length || 0,
        tiendasActivas:    tiendasActivas.length,
        tiendasPendientes: tiendasSinVerif.length,
        totalPedidos:      todosPedidos?.length || 0,
        pedidosPendientes: pendientesPago.length,
        pedidosDisputa:    enDisputa.length,
        ventasTotales,
        comisionesTotales,
      })

      setPedidosPendientes(pendientesPago.slice(0, 8)) // Mostrar los 8 mas recientes
      setTiendasPendientes(tiendasPendData || [])

    } catch (err) {
      console.error('Error cargando datos admin:', err)
    } finally {
      setCargando(false)
    }
  }

  // ---- Confirmar pago manualmente ----
  const confirmarPago = async (pedidoId) => {
    const { error } = await supabase
      .from('orders')
      .update({ estado: 'pagado' })
      .eq('id', pedidoId)

    if (!error) {
      // Quitar el pedido de la lista de pendientes
      setPedidosPendientes(prev => prev.filter(p => p.id !== pedidoId))
      // Actualizar el contador
      setMetricas(prev => ({
        ...prev,
        pedidosPendientes: prev.pedidosPendientes - 1,
      }))
    }
  }

  // ---- Verificar tienda ----
  const verificarTienda = async (tiendaId) => {
    const { error } = await supabase
      .from('stores')
      .update({ verificado: true })
      .eq('id', tiendaId)

    if (!error) {
      setTiendasPendientes(prev => prev.filter(t => t.id !== tiendaId))
      setMetricas(prev => ({
        ...prev,
        tiendasPendientes: prev.tiendasPendientes - 1,
      }))
    }
  }

  if (cargando) {
    return (
      <div className="admin">
        <div className="container">
          <div className="admin__cargando">
            {[1,2,3,4].map(i => (
              <div key={i} className="admin__skeleton" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin">
      <div className="container">

        {/* ---- Encabezado ---- */}
        <div className="admin__encabezado">
          <div>
            <h1 className="admin__titulo">Panel de administracion</h1>
            <p className="admin__subtitulo">Vision completa de FenixAI Marketplace</p>
          </div>
          <button
            className="admin__btn-recargar"
            onClick={cargarDatos}
            type="button"
          >
            Actualizar datos
          </button>
        </div>

        {/* ---- Metricas principales ---- */}
        <div className="admin__metricas">

          <div className="admin__metrica">
            <span className="admin__metrica-valor">
              {formatearPrecio(metricas.comisionesTotales)}
            </span>
            <span className="admin__metrica-label">Comisiones ganadas</span>
          </div>

          <div className="admin__metrica">
            <span className="admin__metrica-valor">
              {formatearPrecio(metricas.ventasTotales)}
            </span>
            <span className="admin__metrica-label">Ventas totales</span>
          </div>

          <div className="admin__metrica">
            <span className="admin__metrica-valor">{metricas.totalPedidos}</span>
            <span className="admin__metrica-label">Pedidos recibidos</span>
          </div>

          <div className="admin__metrica">
            <span className="admin__metrica-valor">{metricas.tiendasActivas}</span>
            <span className="admin__metrica-label">Tiendas activas</span>
          </div>

        </div>

        {/* ---- Alertas de accion urgente ---- */}
        {(metricas.pedidosPendientes > 0 || metricas.pedidosDisputa > 0) && (
          <div className="admin__alertas">
            {metricas.pedidosPendientes > 0 && (
              <div className="admin__alerta admin__alerta--pago">
                <strong>{metricas.pedidosPendientes}</strong> pedidos esperando
                confirmacion de pago
              </div>
            )}
            {metricas.pedidosDisputa > 0 && (
              <div className="admin__alerta admin__alerta--disputa">
                <strong>{metricas.pedidosDisputa}</strong> disputas abiertas
                requieren atencion
              </div>
            )}
          </div>
        )}

        {/* ---- Layout: dos columnas ---- */}
        <div className="admin__layout">

          {/* ---- Columna izquierda ---- */}
          <div className="admin__columna">

            {/* Pedidos pendientes de pago */}
            <div className="admin__bloque">
              <div className="admin__bloque-header">
                <h2 className="admin__bloque-titulo">
                  Pagos por confirmar
                  {metricas.pedidosPendientes > 0 && (
                    <span className="admin__badge admin__badge--urgente">
                      {metricas.pedidosPendientes}
                    </span>
                  )}
                </h2>
                <Link to="/admin/pedidos" className="admin__ver-todos">
                  Ver todos los pedidos
                </Link>
              </div>

              {pedidosPendientes.length === 0 ? (
                <p className="admin__vacio">No hay pagos pendientes de confirmar.</p>
              ) : (
                <div className="admin__lista">
                  {pedidosPendientes.map(pedido => (
                    <div key={pedido.id} className="admin__item">
                      <div className="admin__item-info">
                        <code className="admin__item-ref">
                          #{pedido.id.slice(0, 6).toUpperCase()}
                        </code>
                        <span className="admin__item-nombre">{pedido.buyer_name}</span>
                        <span className="admin__item-fecha">
                          {formatearFecha(pedido.creado_en)}
                        </span>
                      </div>
                      <div className="admin__item-acciones">
                        <span className="admin__item-total">
                          {formatearPrecio(pedido.total)}
                        </span>
                        <button
                          className="admin__btn-confirmar"
                          onClick={() => confirmarPago(pedido.id)}
                          type="button"
                        >
                          Confirmar pago
                        </button>
                        <Link
                          to={`/admin/pedidos/${pedido.id}`}
                          className="admin__btn-ver"
                        >
                          Ver
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ---- Columna derecha ---- */}
          <div className="admin__columna">

            {/* Tiendas pendientes de verificacion */}
            <div className="admin__bloque">
              <div className="admin__bloque-header">
                <h2 className="admin__bloque-titulo">
                  Verificaciones pendientes
                  {metricas.tiendasPendientes > 0 && (
                    <span className="admin__badge admin__badge--normal">
                      {metricas.tiendasPendientes}
                    </span>
                  )}
                </h2>
                <Link to="/admin/tiendas" className="admin__ver-todos">
                  Ver todas las tiendas
                </Link>
              </div>

              {tiendasPendientes.length === 0 ? (
                <p className="admin__vacio">No hay tiendas pendientes de verificar.</p>
              ) : (
                <div className="admin__lista">
                  {tiendasPendientes.map(tienda => (
                    <div key={tienda.id} className="admin__item">
                      <div className="admin__item-info">
                        {/* Avatar con inicial */}
                        <div className="admin__item-avatar">
                          {tienda.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="admin__item-nombre">{tienda.nombre}</span>
                          {tienda.ciudad && (
                            <span className="admin__item-ciudad">{tienda.ciudad}</span>
                          )}
                        </div>
                      </div>
                      <div className="admin__item-acciones">
                        <button
                          className="admin__btn-verificar"
                          onClick={() => verificarTienda(tienda.id)}
                          type="button"
                        >
                          Verificar
                        </button>
                        <a
                          href={`/tienda/${tienda.slug}`}
                          className="admin__btn-ver"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver tienda
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accesos rapidos */}
            <div className="admin__bloque">
              <h2 className="admin__bloque-titulo">Accesos rapidos</h2>
              <div className="admin__accesos">
                <Link to="/admin/pedidos"       className="admin__acceso">Todos los pedidos</Link>
                <Link to="/admin/tiendas"       className="admin__acceso">Todas las tiendas</Link>
                <Link to="/admin/disputas"      className="admin__acceso">Disputas</Link>
                <Link to="/admin/usuarios"      className="admin__acceso">Usuarios</Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}