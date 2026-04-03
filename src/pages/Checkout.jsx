// ============================================================
// src/pages/Checkout.jsx — Pagina de checkout
// ============================================================
// Ruta: /tienda/:slug/checkout (privada — requiere login)
//
// Flujo:
// 1. Comprador llena sus datos de entrega
// 2. Se crea el pedido en Supabase con estado "pendiente_pago"
// 3. Se muestra la pantalla de confirmacion con instrucciones
//    de pago manual (transferencia a Nequi/Daviplata)
// 4. El vendedor confirma el pago manualmente desde su panel
// ============================================================

import { useState, useEffect }         from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth }                      from '@/context/AuthContext'
import { useCart }                      from '@/context/CartContext'
import { supabase }                     from '@/lib/supabase'
import '@/styles/Checkout.css'

// ---- Funcion auxiliar: formatear precio ----
const formatearPrecio = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style:                 'currency',
    currency:              'COP',
    minimumFractionDigits: 0,
  }).format(valor)
}

// ---- Datos de pago de FenixAI ----
// En produccion esto vendria de variables de entorno o de la BD
const DATOS_PAGO = {
  nequi:     '310-000-0000', // Reemplazar con el numero real
  daviplata: '310-000-0000', // Reemplazar con el numero real
  titular:   'FenixAI Marketplace',
}

export default function Checkout() {

  const { slug }   = useParams()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  // Estado del carrito
  const { carrito, totalPrecio, vaciarCarrito } = useCart()

  // ---- Estado del formulario ----
  const [nombre, setNombre]       = useState('')
  const [email, setEmail]         = useState('')
  const [telefono, setTelefono]   = useState('')
  const [direccion, setDireccion] = useState('')
  const [ciudad, setCiudad]       = useState('')
  const [notas, setNotas]         = useState('') // Notas adicionales para el vendedor

  // ---- Estado de la UI ----
  const [procesando, setProcesando]   = useState(false)
  const [error, setError]             = useState('')
  const [pedidoCreado, setPedidoCreado] = useState(null) // Datos del pedido creado

  // ---- Pre-llenar email del usuario autenticado ----
  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user])

  // ---- Verificar que hay items en el carrito ----
  useEffect(() => {
    if (!carrito.items.length || carrito.slug !== slug) {
      navigate(`/tienda/${slug}`)
    }
  }, [carrito, slug])

  // ---- Crear el pedido en Supabase ----
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setProcesando(true)

    try {
      // Obtener el ID de la tienda por slug
      const { data: tiendaData, error: tiendaError } = await supabase
        .from('stores')
        .select('id, nombre')
        .eq('slug', slug)
        .single()

      if (tiendaError || !tiendaData) {
        throw new Error('No se encontro la tienda')
      }

      // ---- Crear un pedido por cada producto en el carrito ----
      // El modelo actual crea pedidos individuales por producto
      // En el futuro se puede agrupar en una orden madre
      const pedidosCreados = []

      for (const item of carrito.items) {
        // Calcular comision segun el plan de la tienda
        const { data: storeData } = await supabase
          .from('stores')
          .select('plan')
          .eq('id', tiendaData.id)
          .single()

        // Porcentaje de comision segun el plan
        const comisionPorcentaje =
          storeData?.plan === 'pro'     ? 4.0  :
          storeData?.plan === 'agencia' ? 2.5  : 8.0

        const totalItem        = item.precio * item.cantidad
        const comisionMonto    = Math.round(totalItem * comisionPorcentaje / 100)

        // INSERT del pedido en Supabase
        const { data: pedido, error: pedidoError } = await supabase
          .from('orders')
          .insert([{
            store_id:            tiendaData.id,
            product_id:          item.id,
            buyer_email:         email.trim(),
            buyer_name:          nombre.trim(),
            buyer_phone:         telefono.trim() || null,
            cantidad:            item.cantidad,
            precio_unitario:     item.precio,
            total:               totalItem,
            comision_porcentaje: comisionPorcentaje,
            comision_monto:      comisionMonto,
            estado:              'pendiente_pago',  // Estado inicial
            direccion_entrega:   direccion.trim() || null,
            ciudad_entrega:      ciudad.trim() || null,
            notas_vendedor:      notas.trim() || null,
          }])
          .select()
          .single()

        if (pedidoError) throw pedidoError

        pedidosCreados.push(pedido)
      }

      // ---- Pedidos creados exitosamente ----
      // Vaciar el carrito y mostrar confirmacion
      vaciarCarrito()
      setPedidoCreado({
        pedidos:      pedidosCreados,
        nombreTienda: tiendaData.nombre,
        total:        totalPrecio,
        // Tomar los primeros 6 caracteres del primer pedido como referencia
        referencia:   pedidosCreados[0].id.slice(0, 6).toUpperCase(),
      })

    } catch (err) {
      console.error('Error creando pedido:', err)
      setError('Ocurrio un error al procesar tu pedido. Intenta de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  // ---- Pantalla de confirmacion post-pago ----
  if (pedidoCreado) {
    return (
      <div className="checkout">
        <div className="container">
          <div className="checkout__confirmacion">

            {/* Icono de exito */}
            <div className="checkout__confirmacion-icono">
              <span aria-hidden="true">&#10003;</span>
            </div>

            {/* Mensaje principal */}
            <h1 className="checkout__confirmacion-titulo">
              Pedido registrado
            </h1>
            <p className="checkout__confirmacion-subtitulo">
              Tu pedido #{pedidoCreado.referencia} en{' '}
              <strong>{pedidoCreado.nombreTienda}</strong> esta listo.
              Ahora debes completar el pago para que el vendedor prepare tu envio.
            </p>

            {/* Instrucciones de pago */}
            <div className="checkout__instrucciones">
              <h2 className="checkout__instrucciones-titulo">
                Como completar tu pago
              </h2>

              {/* Paso 1 */}
              <div className="checkout__paso">
                <span className="checkout__paso-numero">1</span>
                <div className="checkout__paso-contenido">
                  <strong>Transfiere el monto exacto</strong>
                  <p>
                    Envia exactamente{' '}
                    <strong className="checkout__monto">
                      {formatearPrecio(pedidoCreado.total)}
                    </strong>{' '}
                    a uno de estos metodos:
                  </p>
                </div>
              </div>

              {/* Metodos de pago */}
              <div className="checkout__metodos">

                <div className="checkout__metodo">
                  <span className="checkout__metodo-nombre">Nequi</span>
                  <span className="checkout__metodo-numero">
                    {DATOS_PAGO.nequi}
                  </span>
                  <span className="checkout__metodo-titular">
                    {DATOS_PAGO.titular}
                  </span>
                </div>

                <div className="checkout__metodo">
                  <span className="checkout__metodo-nombre">Daviplata</span>
                  <span className="checkout__metodo-numero">
                    {DATOS_PAGO.daviplata}
                  </span>
                  <span className="checkout__metodo-titular">
                    {DATOS_PAGO.titular}
                  </span>
                </div>

              </div>

              {/* Paso 2 */}
              <div className="checkout__paso">
                <span className="checkout__paso-numero">2</span>
                <div className="checkout__paso-contenido">
                  <strong>Escribe tu numero de pedido en el mensaje</strong>
                  <p>
                    En el campo de mensaje o referencia de la transferencia
                    escribe exactamente:
                  </p>
                  {/* Referencia destacada */}
                  <div className="checkout__referencia">
                    <span className="checkout__referencia-label">
                      Tu referencia de pago:
                    </span>
                    <code className="checkout__referencia-codigo">
                      {pedidoCreado.referencia}
                    </code>
                    {/* Boton copiar */}
                    <button
                      className="checkout__btn-copiar"
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(pedidoCreado.referencia)
                        alert('Referencia copiada')
                      }}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="checkout__paso">
                <span className="checkout__paso-numero">3</span>
                <div className="checkout__paso-contenido">
                  <strong>Espera la confirmacion</strong>
                  <p>
                    Una vez verifiquemos tu pago te notificaremos por email
                    a <strong>{email}</strong> y el vendedor comenzara a
                    preparar tu pedido. Tienes 24 horas para completar el pago.
                  </p>
                </div>
              </div>

            </div>

            {/* Nota de proteccion */}
            <div className="checkout__nota-proteccion">
              <strong>Tu compra esta protegida.</strong> El pago queda
              retenido hasta que confirmes que recibiste el pedido en
              buen estado. Tienes 5 dias para reportar cualquier problema.
            </div>

            {/* Acciones */}
            <div className="checkout__confirmacion-acciones">
              <Link to="/" className="btn-primary">
                Volver al inicio
              </Link>
              <Link to={`/tienda/${slug}`} className="btn-secondary">
                Seguir comprando
              </Link>
            </div>

          </div>
        </div>
      </div>
    )
  }

  // ---- Formulario de checkout ---- 
  return (
    <div className="checkout">
      <div className="container">

        {/* Navegacion de regreso */}
        <Link to={`/tienda/${slug}/carrito`} className="checkout__volver">
          Volver al carrito
        </Link>

        {/* Encabezado */}
        <h1 className="checkout__titulo">Completa tu pedido</h1>

        {/* Layout: formulario + resumen */}
        <div className="checkout__layout">

          {/* ---- Formulario de datos ---- */}
          <form className="checkout__form" onSubmit={handleSubmit} noValidate>

            <h2 className="checkout__form-titulo">Tus datos</h2>

            {/* Nombre */}
            <div className="checkout__campo">
              <label htmlFor="nombre" className="checkout__label">
                Nombre completo <span className="checkout__requerido">*</span>
              </label>
              <input
                id="nombre"
                type="text"
                className="checkout__input"
                placeholder="Como aparece en tu cedula"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={procesando}
              />
            </div>

            {/* Email */}
            <div className="checkout__campo">
              <label htmlFor="email" className="checkout__label">
                Correo electronico <span className="checkout__requerido">*</span>
              </label>
              <input
                id="email"
                type="email"
                className="checkout__input"
                placeholder="Para enviarte la confirmacion"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={procesando}
              />
            </div>

            {/* Telefono */}
            <div className="checkout__campo">
              <label htmlFor="telefono" className="checkout__label">
                Telefono / WhatsApp
                <span className="checkout__opcional"> (opcional)</span>
              </label>
              <input
                id="telefono"
                type="tel"
                className="checkout__input"
                placeholder="Para coordinar la entrega"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                disabled={procesando}
              />
            </div>

            <h2 className="checkout__form-titulo checkout__form-titulo--separado">
              Datos de entrega
            </h2>

            {/* Direccion */}
            <div className="checkout__campo">
              <label htmlFor="direccion" className="checkout__label">
                Direccion de entrega
                <span className="checkout__opcional"> (opcional)</span>
              </label>
              <input
                id="direccion"
                type="text"
                className="checkout__input"
                placeholder="Calle, barrio, apartamento..."
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                disabled={procesando}
              />
            </div>

            {/* Ciudad */}
            <div className="checkout__campo">
              <label htmlFor="ciudad" className="checkout__label">
                Ciudad
                <span className="checkout__opcional"> (opcional)</span>
              </label>
              <input
                id="ciudad"
                type="text"
                className="checkout__input"
                placeholder="Bogota, Medellin, Cali..."
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                disabled={procesando}
              />
            </div>

            {/* Notas adicionales */}
            <div className="checkout__campo">
              <label htmlFor="notas" className="checkout__label">
                Notas para el vendedor
                <span className="checkout__opcional"> (opcional)</span>
              </label>
              <textarea
                id="notas"
                className="checkout__textarea"
                placeholder="Instrucciones especiales, talla, color, horario de entrega..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                disabled={procesando}
              />
            </div>

            {/* Error general */}
            {error && (
              <div className="checkout__error" role="alert">
                <span aria-hidden="true">&#9888;</span>
                {error}
              </div>
            )}

            {/* Boton de confirmar pedido */}
            <button
              type="submit"
              className="btn-primary checkout__btn-confirmar"
              disabled={procesando || !nombre.trim() || !email.trim()}
            >
              {procesando ? 'Procesando...' : 'Confirmar pedido'}
            </button>

            <p className="checkout__nota-legal">
              Al confirmar aceptas los{' '}
              <Link to="/terminos" className="checkout__link">
                Terminos de servicio
              </Link>{' '}
              de FenixAI Marketplace.
            </p>

          </form>

          {/* ---- Resumen del pedido ---- */}
          <aside className="checkout__resumen">
            <h2 className="checkout__resumen-titulo">Tu pedido</h2>

            {/* Lista de items */}
            <div className="checkout__resumen-items">
              {carrito.items.map((item) => (
                <div key={item.id} className="checkout__resumen-item">
                  <div className="checkout__resumen-item-info">
                    <span className="checkout__resumen-item-nombre">
                      {item.nombre}
                    </span>
                    <span className="checkout__resumen-item-cantidad">
                      x{item.cantidad}
                    </span>
                  </div>
                  <span className="checkout__resumen-item-precio">
                    {formatearPrecio(item.precio * item.cantidad)}
                  </span>
                </div>
              ))}
            </div>

            {/* Separador */}
            <div className="checkout__resumen-separador" />

            {/* Total */}
            <div className="checkout__resumen-total">
              <span>Total</span>
              <span className="checkout__resumen-total-valor">
                {formatearPrecio(totalPrecio)}
              </span>
            </div>

            {/* Nota de pago manual */}
            <div className="checkout__resumen-nota">
              Despues de confirmar te damos las instrucciones
              para pagar por Nequi o Daviplata.
            </div>

          </aside>

        </div>
      </div>
    </div>
  )
}