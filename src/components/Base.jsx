// ============================================================
// src/components/Base.jsx — Componente base de la aplicación
// ============================================================
// Este archivo contiene los tres elementos estructurales
// que comparten TODAS las páginas:
//
//   Header  → barra de navegación superior (sticky)
//   Layout  → contenedor que une Header + contenido + Footer
//   Footer  → pie de página global
//
// Cómo funciona:
//   App.jsx registra <Layout /> como ruta raíz.
//   React Router renderiza cada página dentro del <Outlet />.
//   Header y Footer nunca se desmontan al navegar.
//
// Estructura visual:
//   ┌────────────────────────────┐
//   │         HEADER             │  ← sticky, siempre visible
//   ├────────────────────────────┤
//   │                            │
//   │    CONTENIDO DE LA PÁGINA  │  ← <Outlet /> cambia según la URL
//   │                            │
//   ├────────────────────────────┤
//   │         FOOTER             │  ← siempre visible
//   └────────────────────────────┘
//
// Exports:
//   default → Layout (usado en App.jsx como elemento raíz de rutas)
// ============================================================

import { useState } from 'react'                              // Controla el menú móvil
import { Link, NavLink, Outlet, ScrollRestoration, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'                // Estado global de auth
import './Base.css'                                            // Estilos del archivo base


// ============================================================
// HEADER — Barra de navegación superior
// ============================================================
// Componente interno — solo se usa dentro de este archivo.
// No se exporta; se instancia directamente en Layout.
// ============================================================

function Header() {

  // Controla si el menú móvil (hamburguesa) está desplegado o cerrado
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Datos del usuario y función de cierre de sesión desde el contexto global
  const { isAuth, signOut } = useAuth()

  // Para redirigir al inicio tras cerrar sesión
  const navigate = useNavigate()

  // Alternar entre abrir y cerrar el menú móvil
  const toggleMenu = () => setMenuAbierto(prev => !prev)

  // Cerrar el menú móvil al hacer clic en cualquier link
  const cerrarMenu = () => setMenuAbierto(false)

  // Cerrar sesión y redirigir al inicio
  const handleSignOut = async () => {
    await signOut()
    cerrarMenu()
    navigate('/')
  }

  return (
    // <header> semántico — mejora accesibilidad y SEO
    <header className="header">
      <div className="header__inner container">

        {/* ---- Logo ---- */}
        <Link to="/" className="header__logo" onClick={cerrarMenu}>
          <span className="header__logo-icon" aria-hidden="true"></span>
          <span className="header__logo-text">FenixAI</span>
        </Link>

        {/* ---- Navegación principal (desktop) ---- */}
        {/* Oculta en móvil con CSS — visible desde 768px */}
        <nav className="header__nav" aria-label="Navegación principal">
          {/* NavLink agrega clase 'active' automáticamente en la ruta actual */}
          <NavLink
            to="/tiendas"
            className={({ isActive }) =>
              isActive ? 'header__nav-link header__nav-link--active' : 'header__nav-link'
            }
          >
            Explorar
          </NavLink>
          <NavLink
            to="/como-funciona"
            className={({ isActive }) =>
              isActive ? 'header__nav-link header__nav-link--active' : 'header__nav-link'
            }
          >
            Cómo funciona
          </NavLink>
        </nav>

        {/* ---- Acciones de usuario (desktop) ---- */}
        <div className="header__actions">
          {isAuth ? (
            // Usuario autenticado: acceso al panel y cierre de sesión
            <>
              <Link to="/panel" className="header__link-panel">Mi tienda</Link>
              <button className="header__btn-salir" onClick={handleSignOut} type="button">
                Salir
              </button>
            </>
          ) : (
            // Usuario no autenticado: login y CTA de registro
            <>
              <Link to="/login" className="header__link-login">Iniciar sesión</Link>
              <Link to="/registro" className="btn-primary header__btn-cta">
                Abre tu tienda
              </Link>
            </>
          )}
        </div>

        {/* ---- Botón hamburguesa (solo móvil) ---- */}
        <button
          className={`header__hamburger ${menuAbierto ? 'header__hamburger--abierto' : ''}`}
          onClick={toggleMenu}
          type="button"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
        >
          {/* Tres líneas que se animan hacia una X cuando el menú está abierto */}
          <span className="header__hamburger-linea" />
          <span className="header__hamburger-linea" />
          <span className="header__hamburger-linea" />
        </button>
      </div>

      {/* ---- Menú desplegable móvil ---- */}
      {/* Visible solo en pantallas pequeñas — se anima con max-height */}
      <nav
        className={`header__menu-movil ${menuAbierto ? 'header__menu-movil--abierto' : ''}`}
        aria-label="Menú móvil"
        aria-hidden={!menuAbierto}
      >
        <NavLink to="/tiendas" className="header__menu-movil-link" onClick={cerrarMenu}>
          Explorar tiendas
        </NavLink>
        <NavLink to="/como-funciona" className="header__menu-movil-link" onClick={cerrarMenu}>
          Cómo funciona
        </NavLink>

        {/* Separador entre navegación y acciones de usuario */}
        <div className="header__menu-movil-separador" role="separator" />

        {isAuth ? (
          <>
            <Link to="/panel" className="header__menu-movil-link" onClick={cerrarMenu}>
              Mi tienda
            </Link>
            <button
              className="header__menu-movil-link header__menu-movil-salir"
              onClick={handleSignOut}
              type="button"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="header__menu-movil-link" onClick={cerrarMenu}>
              Iniciar sesión
            </Link>
            <Link to="/registro" className="header__menu-movil-cta" onClick={cerrarMenu}>
              Abre tu tienda gratis
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}


// ============================================================
// FOOTER — Pie de página global
// ============================================================
// Componente interno — solo se usa dentro de este archivo.
// ============================================================

function Footer() {

  // Año dinámico para el copyright — se actualiza automáticamente cada año
  const anioActual = new Date().getFullYear()

  return (
    // <footer> semántico
    <footer className="footer">
      <div className="container">

        {/* ---- Grid principal: marca + columnas de links ---- */}
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
              <Link to="/crear-tienda" className="footer__link">Abre tu tienda</Link>
              <Link to="/como-funciona" className="footer__link">Cómo funciona</Link>
              <Link to="/planes" className="footer__link">Planes y precios</Link>
              <Link to="/verificacion" className="footer__link">Verificación de cuenta</Link>
            </nav>
          </div>

          {/* Columna 3: Para compradores */}
          <div className="footer__columna">
            <h3 className="footer__titulo-columna">Para compradores</h3>
            <nav aria-label="Links para compradores">
              <Link to="/tiendas" className="footer__link">Explorar tiendas</Link>
              <Link to="/garantia" className="footer__link">Garantía de compra</Link>
              <Link to="/pagos-seguros" className="footer__link">Pagos seguros</Link>
              <Link to="/ayuda" className="footer__link">Centro de ayuda</Link>
            </nav>
          </div>

          {/* Columna 4: Legal */}
          <div className="footer__columna">
            <h3 className="footer__titulo-columna">Legal</h3>
            <nav aria-label="Links legales">
              <Link to="/terminos" className="footer__link">Términos de servicio</Link>
              <Link to="/privacidad" className="footer__link">Política de privacidad</Link>
              <Link to="/cookies" className="footer__link">Política de cookies</Link>
              <Link to="/contacto" className="footer__link">Contacto</Link>
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


// ============================================================
// LAYOUT — Contenedor raíz de todas las páginas
// ============================================================
// Exportación principal — este es el componente que App.jsx
// usa como elemento raíz de las rutas.
// ============================================================

export default function Layout() {
  return (
    // Contenedor flex vertical — garantiza que el footer quede siempre abajo
    <div className="layout">

      {/* Header: sticky, siempre visible en la parte superior */}
      <Header />

      {/* Área principal: se expande para ocupar el espacio disponible */}
      {/* <main> es el tag semántico para el contenido principal de la página */}
      <main className="layout__main" id="contenido-principal">

        {/* OUTLET: React Router renderiza aquí la página de la URL actual
            Ejemplo: si la URL es /crear-tienda → renderiza <CrearTienda />
            El Header y el Footer NO se recargan al cambiar de página */}
        <Outlet />

      </main>

      {/* Footer: siempre al final de la página */}
      <Footer />

      {/* Regresa al inicio del scroll al navegar entre páginas */}
      <ScrollRestoration />

    </div>
  )
}
