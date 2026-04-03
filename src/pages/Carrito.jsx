// ============================================================
// src/pages/Carrito.jsx — Pagina del carrito de compras
// ============================================================
// Ruta: /tienda/:slug/carrito (publica)
// Muestra el resumen de productos antes de ir al checkout.
// ============================================================

import { useState }                    from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCart }                      from '@/context/CartContext'
import { useAuth }                      from '@/context/AuthContext'
import '@/styles/Carrito.css'

// ---- Funcion auxiliar: formatear precio ----
const formatearPrecio = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style:                 'currency',
    currency:              'COP',
    minimumFractionDigits: 0,
  }).format(valor)
}

export default function Carrito() {

  const { slug } = useParams() // Slug de la tienda actual

  // Estado del carrito
  const {
    carrito,
    totalItems,
    totalPrecio,
    cambiarCantidad,
    eliminarItem,
    vaciarCarrito,
  } = useCart()

  // Estado de autenticacion
  const { isAuth } = useAuth()
  const navigate   = useNavigate()

  // Estado local para confirmacion de vaciado
  const [confirmandoVaciar, setConfirmandoVaciar] = useState(false)

  // ---- Verificar que el carrito pertenece a esta tienda ----
  // Si el usuario llego a /tienda/otra-tienda/carrito pero su carrito
  // es de una tienda diferente, mostrar mensaje apropiado
  const carritoEsDeEstaTienda = carrito.slug === slug

  // ---- Manejar ir al checkout ----
  const handleCheckout = () => {
    if (!isAuth) {
      // Si no esta autenticado, redirigir al login
      // con una nota de que debe iniciar sesion para comprar
      navigate('/login', {
        state: {
          mensaje: 'Debes iniciar sesion para completar tu compra.',
          redirigirA: `/tienda/${slug}/carrito`
        }
      })
      return
    }

    // Si esta autenticado, ir al checkout
    navigate(`/tienda/${slug}/checkout`)
  }

  // ---- Carrito vacio ----
  if (!carritoEsDeEstaTienda || carrito.items.length === 0) {
    return (
      <div className="carrito">
        <div className="container">

          {/* Navegacion de regreso */}
          <Link to={`/tienda/${slug}`} className="carrito__volver">
            Volver a la tienda
          </Link>

          {/* Estado vacio */}
          <div className="carrito__vacio">
            <div className="carrito__vacio-icono">0</div>
            <h1 className="carrito__vacio-titulo">Tu carrito esta vacio</h1>
            <p className="carrito__vacio-desc">
              Agrega productos desde la tienda para comenzar tu pedido.
            </p>
            <Link to={`/tienda/${slug}`} className="btn-primary">
              Ver productos
            </Link>
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="carrito">
      <div className="container">

        {/* ---- Navegacion de regreso ---- */}
        <Link to={`/tienda/${slug}`} className="carrito__volver">
          Volver a la tienda
        </Link>

        {/* ---- Titulo ---- */}
        <div className="carrito__encabezado">
          <h1 className="carrito__titulo">
            Tu carrito
            <span className="carrito__contador">
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </span>
          </h1>
          <p className="carrito__tienda">
            Tienda: <strong>{carrito.nombreTienda}</strong>
          </p>
        </div>

        {/* ---- Layout: items + resumen ---- */}
        <div className="carrito__layout">

          {/* ---- Lista de items ---- */}
          <div className="carrito__items">

            {carrito.items.map((item) => (
              <div key={item.id} className="carrito__item">

                {/* Imagen del producto */}
                <div className="carrito__item-imagen">
                  {item.imagen ? (
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="carrito__item-img"
                    />
                  ) : (
                    <div className="carrito__item-sin-imagen">
                      Sin imagen
                    </div>
                  )}
                </div>

                {/* Informacion del producto */}
                <div className="carrito__item-info">
                  <h3 className="carrito__item-nombre">{item.nombre}</h3>
                  <span className="carrito__item-precio-unit">
                    {formatearPrecio(item.precio)} por unidad
                  </span>
                </div>

                {/* Controles de cantidad */}
                <div className="carrito__item-cantidad">
                  {/* Boton de disminuir */}
                  <button
                    className="carrito__cantidad-btn"
                    onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                    type="button"
                    aria-label="Disminuir cantidad"
                  >
                    -
                  </button>

                  {/* Cantidad actual */}
                  <span className="carrito__cantidad-valor">
                    {item.cantidad}
                  </span>

                  {/* Boton de aumentar */}
                  <button
                    className="carrito__cantidad-btn"
                    onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                    disabled={item.cantidad >= item.stock} // No superar el stock
                    type="button"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                {/* Precio total del item */}
                <span className="carrito__item-precio-total">
                  {formatearPrecio(item.precio * item.cantidad)}
                </span>

                {/* Boton de eliminar */}
                <button
                  className="carrito__item-eliminar"
                  onClick={() => eliminarItem(item.id)}
                  type="button"
                  aria-label={`Eliminar ${item.nombre}`}
                >
                  Eliminar
                </button>

              </div>
            ))}

            {/* ---- Boton vaciar carrito ---- */}
            <div className="carrito__acciones-lista">
              {confirmandoVaciar ? (
                // Confirmacion antes de vaciar
                <div className="carrito__confirmar-vaciar">
                  <span>¿Seguro que quieres vaciar el carrito?</span>
                  <div className="carrito__confirmar-botones">
                    <button
                      className="carrito__btn-confirmar-si"
                      onClick={() => {
                        vaciarCarrito()
                        setConfirmandoVaciar(false)
                      }}
                      type="button"
                    >
                      Si, vaciar
                    </button>
                    <button
                      className="carrito__btn-confirmar-no"
                      onClick={() => setConfirmandoVaciar(false)}
                      type="button"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="carrito__btn-vaciar"
                  onClick={() => setConfirmandoVaciar(true)}
                  type="button"
                >
                  Vaciar carrito
                </button>
              )}
            </div>

          </div>

          {/* ---- Resumen del pedido ---- */}
          <aside className="carrito__resumen">
            <h2 className="carrito__resumen-titulo">Resumen del pedido</h2>

            {/* Desglose de precios */}
            <div className="carrito__resumen-desglose">

              {/* Total de items */}
              <div className="carrito__resumen-fila">
                <span>Subtotal ({totalItems} productos)</span>
                <span>{formatearPrecio(totalPrecio)}</span>
              </div>

              {/* Envio — por definir con el vendedor */}
              <div className="carrito__resumen-fila">
                <span>Envio</span>
                <span className="carrito__resumen-envio">A coordinar</span>
              </div>

              {/* Separador */}
              <div className="carrito__resumen-separador" />

              {/* Total final */}
              <div className="carrito__resumen-fila carrito__resumen-fila--total">
                <span>Total</span>
                <span>{formatearPrecio(totalPrecio)}</span>
              </div>
            </div>

            {/* Nota sobre el escrow */}
            <p className="carrito__resumen-nota">
              Tu pago queda protegido hasta que confirmes
              que recibiste el pedido en buen estado.
            </p>

            {/* Boton de ir al checkout */}
            <button
              className="btn-primary carrito__btn-checkout"
              onClick={handleCheckout}
              type="button"
            >
              {isAuth ? 'Continuar al pago' : 'Iniciar sesion para pagar'}
            </button>

            {/* Link de seguir comprando */}
            <Link
              to={`/tienda/${slug}`}
              className="carrito__link-seguir"
            >
              Seguir viendo productos
            </Link>

          </aside>
        </div>

      </div>
    </div>
  )
}