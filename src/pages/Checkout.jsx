// ============================================================
// src/pages/Checkout.jsx — Pagina de checkout con QR de pago
// ============================================================
// Ruta: /tienda/:slug/checkout (privada — requiere login)
//
// Flujo:
// 1. Comprador llena sus datos de entrega
// 2. Se crea el pedido en Supabase con estado "pendiente_pago"
// 3. Se muestra QR dinamico con el monto y referencia del pedido
// 4. Comprador escanea el QR y transfiere a Nequi de FenixAI
// 5. FenixAI verifica el pago manualmente y confirma el pedido
// ============================================================

import { useState, useEffect }         from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { QRCodeSVG }                   from 'qrcode.react' // Generador de QR
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

// ---- Numero de Nequi desde variable de entorno ----
// Nunca aparece visible en pantalla — solo va codificado en el QR
const NEQUI_NUMERO = import.meta.env.VITE_NEQUI_NUMERO || 'Configura VITE_NEQUI_NUMERO en .env'

// ---- Generar el texto que va dentro del QR ----
// Este texto es lo que ve el comprador al escanear con la camara
const generarTextoQR = (monto, referencia) => {
  return [
    'FENIXAI MARKETPLACE',
    `Monto: ${formatearPrecio(monto)}`,
    `Referencia: ${referencia}`,
    `Transferir a Nequi: ${NEQUI_NUMERO}`,
    'Escribe la referencia en el mensaje',
  ].join('\n')
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
  const [notas, setNotas]         = useState('')

  // ---- Estado de la UI ----
  const [procesando, setProcesando]     = useState(false)
  const [error, setError]               = useState('')
  const [pedidoCreado, setPedidoCreado] = useState(null) // Datos del pedido creado
  const [referenciaCopida, setReferenciaCopida] = useState(false) // Feedback de copia

  // ---- Pre-llenar email del usuario ----
  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user])

  // ---- Verificar que hay items en el carrito ----
  useEffect(() => {
    if (!carrito.items.length || carrito.slug !== slug) {
      navigate(`/tienda/${slug}`)
    }
  }, [carrito, slug])

  // ---- Copiar referencia al portapapeles ----
  const copiarReferencia = (referencia) => {
    navigator.clipboard.writeText(referencia)
    setReferenciaCopida(true)
    setTimeout(() => setReferenciaCopida(false), 2000) // Reset despues de 2s
  }

  // ---- Crear el pedido en Supabase ----
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setProcesando(true)

    try {
      // Obtener la tienda por slug
      const { data: tiendaData, error: tiendaError } = await supabase
        .from('stores')
        .select('id, nombre, plan')
        .eq('slug', slug)
        .single()

      if (tiendaError || !tiendaData) throw new Error('No se encontro la tienda')

      // Calcular comision segun el plan de la tienda
      const comisionPorcentaje =
        tiendaData.plan === 'pro'     ? 4.0  :
        tiendaData.plan === 'agencia' ? 2.5  : 8.0

      // Crear un pedido por cada producto del carrito
      const pedidosCreados = []

      for (const item of carrito.items) {
        const totalItem     = item.precio * item.cantidad
        const comisionMonto = Math.round(totalItem * comisionPorcentaje / 100)

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
            estado:              'pendiente_pago',
            direccion_entrega:   direccion.trim() || null,
            ciudad_entrega:      ciudad.trim() || null,
            notas_vendedor:      notas.trim() || null,
          }])
          .select()
          .single()

        if (pedidoError) throw pedidoError
        pedidosCreados.push(pedido)
      }

      // Pedidos creados — vaciar carrito y mostrar QR
      vaciarCarrito()
      setPedidoCreado({
        pedidos:      pedidosCreados,
        nombreTienda: tiendaData.nombre,
        total:        totalPrecio,
        // Referencia: primeros 6 caracteres del ID en mayusculas
        referencia:   pedidosCreados[0].id.slice(0, 6).toUpperCase(),
      })

    } catch (err) {
      console.error('Error creando pedido:', err)
      setError('Ocurrio un error al procesar tu pedido. Intenta de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  // ============================================================
  // PANTALLA DE CONFIRMACION CON QR
  // ============================================================
  if (pedidoCreado) {

    // Texto que va dentro del QR — contiene numero de Nequi codificado
    const textoQR = generarTextoQR(pedidoCreado.total, pedidoCreado.referencia)

    return (
      <div className="checkout">
        <div className="container">
          <div className="checkout__confirmacion">

            {/* Icono de exito */}
            <div className="checkout__confirmacion-icono">
              <span aria-hidden="true">&#10003;</span>
            </div>

            {/* Titulo y descripcion */}
            <h1 className="checkout__confirmacion-titulo">
              Pedido registrado
            </h1>
            <p className="checkout__confirmacion-subtitulo">
              Tu pedido en <strong>{pedidoCreado.nombreTienda}</strong> esta
              listo. Completa el pago para que el vendedor lo prepare.
            </p>

            {/* ---- Bloque de pago con QR ---- */}
            <div className="checkout__pago">

              {/* Encabezado del bloque */}
              <div className="checkout__pago-header">
                <h2 className="checkout__pago-titulo">Completa tu pago</h2>
                {/* Tiempo limite para pagar */}
                <span className="checkout__pago-limite">
                  Tienes 24 horas para pagar
                </span>
              </div>

              {/* Monto y referencia destacados */}
              <div className="checkout__pago-resumen">

                {/* Monto total */}
                <div className="checkout__pago-monto">
                  <span className="checkout__pago-monto-label">
                    Total a transferir
                  </span>
                  <span className="checkout__pago-monto-valor">
                    {formatearPrecio(pedidoCreado.total)}
                  </span>
                </div>

                {/* Referencia del pedido */}
                <div className="checkout__pago-referencia">
                  <span className="checkout__pago-referencia-label">
                    Referencia del pedido
                  </span>
                  <div className="checkout__pago-referencia-fila">
                    {/* Codigo de referencia en formato monospace */}
                    <code className="checkout__pago-referencia-codigo">
                      {pedidoCreado.referencia}
                    </code>
                    {/* Boton de copiar */}
                    <button
                      className={`checkout__btn-copiar ${referenciaCopida ? 'checkout__btn-copiar--ok' : ''}`}
                      type="button"
                      onClick={() => copiarReferencia(pedidoCreado.referencia)}
                    >
                      {referenciaCopida ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>

              </div>

              {/* ---- QR dinamico ---- */}
              <div className="checkout__qr-contenedor">

                <p className="checkout__qr-instruccion">
                  Escanea con la camara de tu celular
                </p>

                {/* El QR se genera con qrcode.react */}
                {/* El numero de Nequi va codificado adentro — no visible en pantalla */}
                <div className="checkout__qr">
                  <QRCodeSVG
                    value={textoQR}          // Texto a codificar
                    size={200}               // Tamano en pixeles
                    level="M"               // Nivel de correccion de errores (M = medio)
                    includeMargin={true}     // Margen blanco alrededor del QR
                  />
                </div>

                {/* Instruccion de la referencia */}
                <p className="checkout__qr-nota">
                  Al transferir escribe <strong>{pedidoCreado.referencia}</strong> en
                  el mensaje para identificar tu pago.
                </p>

              </div>

              {/* ---- Instrucciones paso a paso ---- */}
              <div className="checkout__pasos">

                <div className="checkout__paso">
                  <span className="checkout__paso-numero">1</span>
                  <p className="checkout__paso-texto">
                    Abre tu app de Nequi o Daviplata
                  </p>
                </div>

                <div className="checkout__paso">
                  <span className="checkout__paso-numero">2</span>
                  <p className="checkout__paso-texto">
                    Transfiere exactamente{' '}
                    <strong>{formatearPrecio(pedidoCreado.total)}</strong>
                  </p>
                </div>

                <div className="checkout__paso">
                  <span className="checkout__paso-numero">3</span>
                  <p className="checkout__paso-texto">
                    Escribe <strong>{pedidoCreado.referencia}</strong> en
                    el campo de mensaje o referencia
                  </p>
                </div>

                <div className="checkout__paso">
                  <span className="checkout__paso-numero">4</span>
                  <p className="checkout__paso-texto">
                    Nosotros verificamos tu pago y te notificamos
                    a <strong>{email}</strong>
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

  // ============================================================
  // FORMULARIO DE CHECKOUT
  // ============================================================
  return (
    <div className="checkout">
      <div className="container">

        <Link to={`/tienda/${slug}/carrito`} className="checkout__volver">
          Volver al carrito
        </Link>

        <h1 className="checkout__titulo">Completa tu pedido</h1>

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

            {/* Notas */}
            <div className="checkout__campo">
              <label htmlFor="notas" className="checkout__label">
                Notas para el vendedor
                <span className="checkout__opcional"> (opcional)</span>
              </label>
              <textarea
                id="notas"
                className="checkout__textarea"
                placeholder="Instrucciones especiales, talla, color, horario..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                disabled={procesando}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="checkout__error" role="alert">
                <span aria-hidden="true">&#9888;</span>
                {error}
              </div>
            )}

            {/* Boton confirmar */}
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

          {/* ---- Resumen lateral ---- */}
          <aside className="checkout__resumen">
            <h2 className="checkout__resumen-titulo">Tu pedido</h2>

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

            <div className="checkout__resumen-separador" />

            <div className="checkout__resumen-total">
              <span>Total</span>
              <span className="checkout__resumen-total-valor">
                {formatearPrecio(totalPrecio)}
              </span>
            </div>

            <div className="checkout__resumen-nota">
              Despues de confirmar te mostramos el QR para
              pagar por Nequi.
            </div>

          </aside>

        </div>
      </div>
    </div>
  )
}