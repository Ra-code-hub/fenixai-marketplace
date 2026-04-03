// ============================================================
// src/pages/TiendaPublica.jsx — Pagina publica de la tienda
// ============================================================
// Ruta: /tienda/:slug (publica)
// ============================================================

import { useState, useEffect }  from 'react'
import { useParams, Link }      from 'react-router-dom'
import { supabase }             from '@/lib/supabase'
import { useCart }              from '@/context/CartContext'
import '@/styles/TiendaPublica.css'

const formatearPrecio = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(valor)
}

export default function TiendaPublica() {

  const { slug } = useParams()

  const [tienda, setTienda]       = useState(null)
  const [productos, setProductos] = useState([])
  const [calificacion, setCalificacion] = useState({ promedio: 0, total: 0 })
  const [cargando, setCargando]         = useState(true)
  const [noEncontrada, setNoEncontrada] = useState(false)

  useEffect(() => { if (slug) cargarTienda() }, [slug])

  const cargarTienda = async () => {
    setCargando(true)
    setNoEncontrada(false)
    try {
      const { data: tiendaData, error: tiendaError } = await supabase
        .from('stores').select('*').eq('slug', slug).eq('activo', true).single()

      if (tiendaError || !tiendaData) { setNoEncontrada(true); setCargando(false); return }

      setTienda(tiendaData)

      const { data: productosData } = await supabase
        .from('products').select('id, nombre, descripcion, precio, imagenes, categoria, stock')
        .eq('store_id', tiendaData.id).eq('activo', true).gt('stock', 0)
        .order('creado_en', { ascending: false })

      setProductos(productosData || [])

      const { data: resenasData } = await supabase
        .from('reviews').select('calificacion').eq('store_id', tiendaData.id)

      if (resenasData?.length > 0) {
        const suma = resenasData.reduce((acc, r) => acc + r.calificacion, 0)
        setCalificacion({ promedio: (suma / resenasData.length).toFixed(1), total: resenasData.length })
      }
    } catch (err) {
      console.error('Error cargando tienda:', err)
      setNoEncontrada(true)
    } finally {
      setCargando(false)
    }
  }

  if (cargando) {
    return (
      <div className="tienda-publica">
        <div className="container">
          <div className="tienda-publica__cargando">
            <div className="tienda-publica__skeleton-perfil">
              <div className="tienda-publica__skeleton tienda-publica__skeleton--avatar" />
              <div className="tienda-publica__skeleton-texto">
                <div className="tienda-publica__skeleton tienda-publica__skeleton--titulo" />
                <div className="tienda-publica__skeleton tienda-publica__skeleton--subtitulo" />
              </div>
            </div>
            <div className="tienda-publica__skeleton-grid">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="tienda-publica__skeleton tienda-publica__skeleton--producto" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (noEncontrada) {
    return (
      <div className="tienda-publica">
        <div className="container">
          <div className="tienda-publica__no-encontrada">
            <h1 className="tienda-publica__no-encontrada-titulo">Tienda no encontrada</h1>
            <p className="tienda-publica__no-encontrada-desc">
              Esta tienda no existe o fue desactivada. Verifica que el link este correcto.
            </p>
            <Link to="/" className="btn-primary">Ir al inicio</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tienda-publica">

      {/* ---- Cabecera ---- */}
      <div className="tienda-publica__cabecera">
        <div className="container">
          <div className="tienda-publica__perfil">

            <div className="tienda-publica__avatar">
              {tienda.logo_url ? (
                <img src={tienda.logo_url} alt={`Logo de ${tienda.nombre}`} className="tienda-publica__logo" />
              ) : (
                <span className="tienda-publica__avatar-inicial">
                  {tienda.nombre.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="tienda-publica__info">
              <h1 className="tienda-publica__nombre">{tienda.nombre}</h1>
              <div className="tienda-publica__meta">
                {tienda.ciudad && <span className="tienda-publica__ciudad">{tienda.ciudad}</span>}
                {tienda.ciudad && calificacion.total > 0 && (
                  <span className="tienda-publica__separador" aria-hidden="true">·</span>
                )}
                {calificacion.total > 0 && (
                  <span className="tienda-publica__calificacion">
                    {calificacion.promedio} ({calificacion.total} resenas)
                  </span>
                )}
                {tienda.verificado && (
                  <>
                    <span className="tienda-publica__separador" aria-hidden="true">·</span>
                    <span className="tienda-publica__verificada">Tienda verificada</span>
                  </>
                )}
              </div>
              {tienda.descripcion && (
                <p className="tienda-publica__descripcion">{tienda.descripcion}</p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ---- Contenido ---- */}
      <div className="tienda-publica__contenido">
        <div className="container">

          <div className="tienda-publica__seccion-header">
            <h2 className="tienda-publica__seccion-titulo">
              Productos
              {productos.length > 0 && (
                <span className="tienda-publica__total-productos">
                  {productos.length} disponibles
                </span>
              )}
            </h2>
          </div>

          {productos.length === 0 ? (
            <div className="tienda-publica__vacio">
              <p className="tienda-publica__vacio-titulo">
                Esta tienda aun no tiene productos publicados.
              </p>
              <p className="tienda-publica__vacio-desc">Vuelve pronto para ver las novedades.</p>
            </div>
          ) : (
            <div className="tienda-publica__grid">
              {productos.map((producto) => (
                <ProductoCard key={producto.id} producto={producto} slugTienda={slug} />
              ))}
            </div>
          )}

        </div>
      </div>

    </div>
  )
}

// ============================================================
// Componente interno: card de producto con boton de carrito
// ============================================================
function ProductoCard({ producto, slugTienda }) {

  const imagenPrincipal = producto.imagenes?.[0] || null

  // Hook del carrito
  const { agregarItem, forzarAgregarItem, cantidadEnCarrito, carrito } = useCart()

  // Estado local para el modal de cambio de tienda
  const [mostrarModal, setMostrarModal] = useState(false)
  const [confirmado, setConfirmado]     = useState(false)

  const cantidadActual = cantidadEnCarrito(producto.id)

  // Manejar clic en "Agregar al carrito"
  const handleAgregar = () => {
    const resultado = agregarItem(producto, slugTienda, '') // nombreTienda se puede obtener del contexto

    if (resultado?.diferenteTienda) {
      // Mostrar modal de confirmacion
      setMostrarModal(true)
      return
    }

    // Mostrar feedback visual breve
    setConfirmado(true)
    setTimeout(() => setConfirmado(false), 1500)
  }

  // Confirmar cambio de tienda
  const handleConfirmarCambio = () => {
    forzarAgregarItem(producto, slugTienda, '')
    setMostrarModal(false)
    setConfirmado(true)
    setTimeout(() => setConfirmado(false), 1500)
  }

  return (
    <>
      <div className="tienda-publica__producto-card">

        {/* Imagen */}
        <Link to={`/producto/${producto.id}`} className="tienda-publica__producto-imagen-link">
          <div className="tienda-publica__producto-imagen">
            {imagenPrincipal ? (
              <img
                src={imagenPrincipal}
                alt={producto.nombre}
                className="tienda-publica__producto-img"
                loading="lazy"
              />
            ) : (
              <div className="tienda-publica__producto-sin-imagen">Sin imagen</div>
            )}
            {producto.stock <= 3 && producto.stock > 0 && (
              <span className="tienda-publica__producto-stock-bajo">
                Ultimas {producto.stock} unidades
              </span>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="tienda-publica__producto-info">
          <Link to={`/producto/${producto.id}`}>
            <h3 className="tienda-publica__producto-nombre">{producto.nombre}</h3>
          </Link>
          {producto.descripcion && (
            <p className="tienda-publica__producto-descripcion">{producto.descripcion}</p>
          )}
          <span className="tienda-publica__producto-precio">
            {formatearPrecio(producto.precio)}
          </span>
        </div>

        {/* Boton de agregar al carrito */}
        <div className="tienda-publica__producto-accion">
          {cantidadActual > 0 ? (
            // Si ya esta en el carrito mostrar la cantidad y link al carrito
            <div className="tienda-publica__producto-en-carrito">
              <span>{cantidadActual} en el carrito</span>
              <Link
                to={`/tienda/${slugTienda}/carrito`}
                className="tienda-publica__btn-ver-carrito"
              >
                Ver carrito
              </Link>
            </div>
          ) : (
            <button
              className={`tienda-publica__btn-agregar ${confirmado ? 'tienda-publica__btn-agregar--ok' : ''}`}
              onClick={handleAgregar}
              type="button"
            >
              {confirmado ? 'Agregado' : 'Agregar al carrito'}
            </button>
          )}
        </div>

      </div>

      {/* Modal de confirmacion de cambio de tienda */}
      {mostrarModal && (
        <div className="tienda-publica__modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="tienda-publica__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tienda-publica__modal-titulo">Cambiar de tienda</h3>
            <p className="tienda-publica__modal-texto">
              Tu carrito tiene productos de otra tienda.
              Si agregas este producto se vaciara el carrito anterior.
            </p>
            <div className="tienda-publica__modal-acciones">
              <button
                className="btn-primary"
                onClick={handleConfirmarCambio}
                type="button"
              >
                Si, cambiar tienda
              </button>
              <button
                className="btn-secondary"
                onClick={() => setMostrarModal(false)}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}