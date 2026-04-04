// ============================================================
// src/pages/PanelPedidos.jsx — Lista de pedidos del vendedor
// ============================================================
// Ruta: /panel/pedidos (privada)
//
// Muestra todos los pedidos de la tienda del vendedor con
// filtros por estado y busqueda por nombre del comprador.
// Cada pedido tiene link al detalle donde se puede cambiar estado.
// ============================================================

import { useState, useEffect }  from 'react'
import { Link, useNavigate }    from 'react-router-dom'
import { useAuth }              from '@/context/AuthContext'
import { supabase }             from '@/lib/supabase'
import '@/styles/PanelPedidos.css'

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
  todos:          { label: 'Todos',           clase: '' },
  pendiente_pago: { label: 'Pago pendiente',  clase: 'estado--pendiente' },
  pagado:         { label: 'Pagado',          clase: 'estado--pagado' },
  en_preparacion: { label: 'En preparacion',  clase: 'estado--preparacion' },
  enviado:        { label: 'Enviado',         clase: 'estado--enviado' },
  entregado:      { label: 'Entregado',       clase: 'estado--entregado' },
  completado:     { label: 'Completado',      clase: 'estado--completado' },
  disputa:        { label: 'En disputa',      clase: 'estado--disputa' },
  cancelado:      { label: 'Cancelado',       clase: 'estado--cancelado' },
}

export default function PanelPedidos() {

  const { user }  = useAuth()
  const navigate  = useNavigate()

  // ---- Estado de los datos ----
  const [pedidos, setPedidos]         = useState([])  // Todos los pedidos
  const [tiendaId, setTiendaId]       = useState(null)
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState('')

  // ---- Estado de filtros ----
  const [filtroEstado, setFiltroEstado]   = useState('todos') // Filtro por estado
  const [busqueda, setBusqueda]           = useState('')      // Busqueda por nombre

  // ---- Cargar datos al montar ----
  useEffect(() => {
    if (user) cargarPedidos()
  }, [user])

  const cargarPedidos = async () => {
    setCargando(true)
    setError('')

    try {
      // Obtener la tienda del usuario
      const { data: tienda, error: tiendaError } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .eq('activo', true)
        .single()

      if (tiendaError || !tienda) {
        navigate('/crear-tienda')
        return
      }

      setTiendaId(tienda.id)

      // Obtener todos los pedidos de la tienda
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('orders')
        .select(`
          id,
          buyer_name,
          buyer_email,
          buyer_phone,
          cantidad,
          total,
          estado,
          creado_en,
          ciudad_entrega,
          product_id
        `)
        .eq('store_id', tienda.id)
        .order('creado_en', { ascending: false }) // Mas recientes primero

      if (pedidosError) throw pedidosError

      setPedidos(pedidosData || [])

    } catch (err) {
      console.error('Error cargando pedidos:', err)
      setError('Error cargando los pedidos. Intenta recargar la pagina.')
    } finally {
      setCargando(false)
    }
  }

  // ---- Filtrar pedidos segun estado y busqueda ----
  const pedidosFiltrados = pedidos.filter(pedido => {
    // Filtro por estado
    const pasaEstado = filtroEstado === 'todos' || pedido.estado === filtroEstado

    // Filtro por busqueda — nombre del comprador o referencia
    const terminoBusqueda = busqueda.toLowerCase()
    const pasaBusqueda = !busqueda ||
      pedido.buyer_name.toLowerCase().includes(terminoBusqueda) ||
      pedido.id.slice(0, 6).toLowerCase().includes(terminoBusqueda) ||
      pedido.buyer_email.toLowerCase().includes(terminoBusqueda)

    return pasaEstado && pasaBusqueda
  })

  // ---- Contar pedidos por estado para los badges ----
  const contarPorEstado = (estado) => {
    if (estado === 'todos') return pedidos.length
    return pedidos.filter(p => p.estado === estado).length
  }

  // ---- Estado de carga ----
  if (cargando) {
    return (
      <div className="panel-pedidos">
        <div className="container">
          <div className="panel-pedidos__cargando">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="panel-pedidos__skeleton" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="panel-pedidos">
      <div className="container">

        {/* ---- Encabezado ---- */}
        <div className="panel-pedidos__encabezado">
          <div>
            <Link to="/panel" className="panel-pedidos__volver">
              Volver al panel
            </Link>
            <h1 className="panel-pedidos__titulo">Pedidos</h1>
            <p className="panel-pedidos__subtitulo">
              {pedidos.length} pedidos en total
            </p>
          </div>
        </div>

        {/* ---- Error ---- */}
        {error && (
          <div className="panel-pedidos__error">
            <span>⚠</span> {error}
          </div>
        )}

        {/* ---- Filtros de estado ---- */}
        <div className="panel-pedidos__filtros">
          {/* Mostrar solo los estados que tienen pedidos + "Todos" */}
          {Object.entries(ESTADOS).map(([key, config]) => {
            const cantidad = contarPorEstado(key)
            // Ocultar estados sin pedidos (excepto "todos")
            if (key !== 'todos' && cantidad === 0) return null

            return (
              <button
                key={key}
                className={`panel-pedidos__filtro-btn ${
                  filtroEstado === key ? 'panel-pedidos__filtro-btn--activo' : ''
                }`}
                onClick={() => setFiltroEstado(key)}
                type="button"
              >
                {config.label}
                {/* Badge con el numero de pedidos */}
                <span className="panel-pedidos__filtro-count">{cantidad}</span>
              </button>
            )
          })}
        </div>

        {/* ---- Barra de busqueda ---- */}
        <div className="panel-pedidos__busqueda">
          <input
            type="search"
            className="panel-pedidos__input-busqueda"
            placeholder="Buscar por nombre, email o referencia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* ---- Lista de pedidos ---- */}
        {pedidosFiltrados.length === 0 ? (
          // Estado vacio
          <div className="panel-pedidos__vacio">
            <p className="panel-pedidos__vacio-titulo">
              {busqueda || filtroEstado !== 'todos'
                ? 'No hay pedidos con ese filtro'
                : 'Aun no tienes pedidos'}
            </p>
            <p className="panel-pedidos__vacio-desc">
              {busqueda || filtroEstado !== 'todos'
                ? 'Intenta con otro filtro o busqueda'
                : 'Cuando alguien compre en tu tienda, los pedidos apareceran aqui'}
            </p>
            {(busqueda || filtroEstado !== 'todos') && (
              <button
                className="btn-secondary panel-pedidos__btn-limpiar"
                onClick={() => { setBusqueda(''); setFiltroEstado('todos') }}
                type="button"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          // Tabla de pedidos
          <div className="panel-pedidos__tabla">

            {/* Cabecera — solo desktop */}
            <div className="panel-pedidos__cabecera">
              <span>Referencia</span>
              <span>Comprador</span>
              <span>Total</span>
              <span>Estado</span>
              <span>Fecha</span>
              <span></span>
            </div>

            {/* Filas */}
            {pedidosFiltrados.map((pedido) => {
              const estadoConfig = ESTADOS[pedido.estado] || { label: pedido.estado, clase: '' }
              const referencia   = pedido.id.slice(0, 6).toUpperCase()

              return (
                <div key={pedido.id} className="panel-pedidos__fila">

                  {/* Referencia */}
                  <div className="panel-pedidos__celda">
                    <span className="panel-pedidos__label-movil">Ref:</span>
                    <code className="panel-pedidos__referencia">{referencia}</code>
                  </div>

                  {/* Comprador */}
                  <div className="panel-pedidos__celda panel-pedidos__celda--comprador">
                    <span className="panel-pedidos__comprador-nombre">
                      {pedido.buyer_name}
                    </span>
                    <span className="panel-pedidos__comprador-email">
                      {pedido.buyer_email}
                    </span>
                    {pedido.ciudad_entrega && (
                      <span className="panel-pedidos__comprador-ciudad">
                        {pedido.ciudad_entrega}
                      </span>
                    )}
                  </div>

                  {/* Total */}
                  <div className="panel-pedidos__celda">
                    <span className="panel-pedidos__label-movil">Total:</span>
                    <span className="panel-pedidos__total">
                      {formatearPrecio(pedido.total)}
                    </span>
                  </div>

                  {/* Estado */}
                  <div className="panel-pedidos__celda">
                    <span className={`panel-pedidos__estado ${estadoConfig.clase}`}>
                      {estadoConfig.label}
                    </span>
                  </div>

                  {/* Fecha */}
                  <div className="panel-pedidos__celda">
                    <span className="panel-pedidos__label-movil">Fecha:</span>
                    <span className="panel-pedidos__fecha">
                      {formatearFecha(pedido.creado_en)}
                    </span>
                  </div>

                  {/* Accion */}
                  <div className="panel-pedidos__celda">
                    <Link
                      to={`/panel/pedidos/${pedido.id}`}
                      className="panel-pedidos__btn-ver"
                    >
                      Ver detalle
                    </Link>
                  </div>

                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}