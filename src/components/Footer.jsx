// ============================================================
// src/components/Footer.jsx — Pie de página global
// ============================================================
// Aparece en TODAS las páginas a través del Layout.
// ============================================================

import { Link }       from 'react-router-dom' // Navegación interna
import '@/styles/Footer.css'                    // CSS en carpeta styles/

export default function Footer() {

  // Año actual para el copyright — se calcula dinámicamente
  const anioActual = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">

        {/* ---- Grid: logo + columnas de links ---- */}
        <div className="footer__grid">

          {/* Columna 1: Marca */}
          <div className="footer__marca">
            <Link to="/" className="footer__logo">
              <span aria-hidden="true">🔥</span>
              <span className="footer__logo-texto">FenixAI</span>
            </Link>
            <p className="footer__descripcion">
              Marketplace colombiano para vendedores independientes.
              Vende con pagos seguros. Compra con confianza.
            </p>
            <span className="footer__pais">🇨🇴 Hecho en Colombia</span>
          </div>

          {/* Columna 2: Para vendedores */}
          <div className="footer__columna">
            <h3 className="footer__titulo-columna">Para vendedores</h3>
            <nav aria-label="Links para vendedores">
              <Link to="/crear-tienda"  className="footer__link">Abre tu tienda</Link>
              <Link to="/como-funciona" className="footer__link">Cómo funciona</Link>
              <Link to="/planes"        className="footer__link">Planes y precios</Link>
              <Link to="/verificacion"  className="footer__link">Verificación de cuenta</Link>
            </nav>
          </div>

          {/* Columna 3: Para compradores */}
          <div className="footer__columna">
            <h3 className="footer__titulo-columna">Para compradores</h3>
            <nav aria-label="Links para compradores">
              <Link to="/tiendas"       className="footer__link">Explorar tiendas</Link>
              <Link to="/garantia"      className="footer__link">Garantía de compra</Link>
              <Link to="/pagos-seguros" className="footer__link">Pagos seguros</Link>
              <Link to="/ayuda"         className="footer__link">Centro de ayuda</Link>
            </nav>
          </div>

          {/* Columna 4: Legal */}
          <div className="footer__columna">
            <h3 className="footer__titulo-columna">Legal</h3>
            <nav aria-label="Links legales">
              <Link to="/terminos"    className="footer__link">Términos de servicio</Link>
              <Link to="/privacidad"  className="footer__link">Política de privacidad</Link>
              <Link to="/cookies"     className="footer__link">Política de cookies</Link>
              <Link to="/contacto"    className="footer__link">Contacto</Link>
            </nav>
          </div>

        </div>

        {/* ---- Separador ---- */}
        <div className="footer__separador" role="separator" />

        {/* ---- Fila inferior: copyright + métodos de pago ---- */}
        <div className="footer__inferior">
          <p className="footer__copyright">
            © {anioActual} FenixAI Marketplace. Todos los derechos reservados.
          </p>
          <div className="footer__pagos">
            <span className="footer__pagos-label">Pagamos con:</span>
            <span className="footer__pago-badge">Nequi</span>
            <span className="footer__pago-badge">Daviplata</span>
            <span className="footer__pago-badge">PSE</span>
            <span className="footer__pago-badge">Tarjetas</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
