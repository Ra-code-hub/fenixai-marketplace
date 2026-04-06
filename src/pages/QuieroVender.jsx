// ============================================================
// src/pages/QuieroVender.jsx — Pagina para convertirse en vendedor
// ============================================================
// Ruta: /quiero-vender (publica pero requiere sesion)
//
// Se muestra cuando un comprador intenta acceder a una ruta
// de vendedor (/crear-tienda, /panel, etc.) sin tener el rol.
// Le explica los beneficios y le permite cambiar su rol.
// ============================================================

import { useState }      from 'react'
import { useNavigate }   from 'react-router-dom'
import { useAuth }       from '@/context/AuthContext'
import '@/styles/QuieroVender.css'

export default function QuieroVender() {

  const { isAuth, convertirseEnVendedor } = useAuth()
  const navigate = useNavigate()

  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState('')

  const handleConvertirse = async () => {
    // Si no esta autenticado, redirigir al registro
    if (!isAuth) {
      navigate('/registro')
      return
    }

    setCargando(true)
    setError('')

    const { error } = await convertirseEnVendedor()

    if (error) {
      setError('Ocurrio un error. Intenta de nuevo.')
      setCargando(false)
      return
    }

    // Redirigir a crear tienda
    navigate('/crear-tienda')
  }

  return (
    <div className="quiero-vender">
      <div className="container">
        <div className="quiero-vender__contenido">

          {/* Encabezado */}
          <div className="quiero-vender__encabezado">
            <h1 className="quiero-vender__titulo">
              Abre tu tienda en FenixAI
            </h1>
            <p className="quiero-vender__subtitulo">
              Vende de forma segura con pagos protegidos, sin mensualidad
              hasta que realices tu primera venta.
            </p>
          </div>

          {/* Beneficios */}
          <div className="quiero-vender__beneficios">

            <div className="quiero-vender__beneficio">
              <div className="quiero-vender__beneficio-icono">01</div>
              <div>
                <h3 className="quiero-vender__beneficio-titulo">
                  Tienda lista en 10 minutos
                </h3>
                <p className="quiero-vender__beneficio-desc">
                  Crea tu tienda, sube tus productos y comparte
                  el link en Instagram y WhatsApp.
                </p>
              </div>
            </div>

            <div className="quiero-vender__beneficio">
              <div className="quiero-vender__beneficio-icono">02</div>
              <div>
                <h3 className="quiero-vender__beneficio-titulo">
                  Pagos seguros para ti y tu comprador
                </h3>
                <p className="quiero-vender__beneficio-desc">
                  El dinero queda protegido hasta que el comprador
                  confirme que recibio su pedido.
                </p>
              </div>
            </div>

            <div className="quiero-vender__beneficio">
              <div className="quiero-vender__beneficio-icono">03</div>
              <div>
                <h3 className="quiero-vender__beneficio-titulo">
                  IA que mejora tus publicaciones
                </h3>
                <p className="quiero-vender__beneficio-desc">
                  Escribe el nombre del producto y nuestra IA
                  genera una descripcion que vende mas.
                </p>
              </div>
            </div>

            <div className="quiero-vender__beneficio">
              <div className="quiero-vender__beneficio-icono">04</div>
              <div>
                <h3 className="quiero-vender__beneficio-titulo">
                  Sin costo hasta que vendas
                </h3>
                <p className="quiero-vender__beneficio-desc">
                  Plan Gratis sin mensualidad. Solo pagamos el
                  8% de comision sobre cada venta completada.
                </p>
              </div>
            </div>

          </div>

          {/* Error */}
          {error && (
            <div className="quiero-vender__error" role="alert">
              {error}
            </div>
          )}

          {/* CTA */}
          <div className="quiero-vender__acciones">
            <button
              className="btn-primary quiero-vender__btn-principal"
              onClick={handleConvertirse}
              disabled={cargando}
              type="button"
            >
              {cargando
                ? 'Activando tu cuenta de vendedor...'
                : isAuth
                ? 'Activar mi cuenta de vendedor'
                : 'Registrarme para vender'}
            </button>

            <p className="quiero-vender__nota">
              Al activar tu cuenta como vendedor aceptas los{' '}
              <a href="/terminos" className="quiero-vender__link">
                Terminos de servicio
              </a>{' '}
              de FenixAI Marketplace.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}