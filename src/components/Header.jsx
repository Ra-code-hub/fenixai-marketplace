// ============================================================
// src/components/Header.jsx — Barra de navegación principal
// ============================================================
// Aparece en TODAS las páginas a través del Layout.
// Contiene: logo, navegación principal y acciones de usuario.
// Responsive: menú hamburguesa en móvil, barra completa en desktop.
// ============================================================

import { useState }                        from 'react'              // Hook para el menú móvil
import { Link, NavLink, useNavigate }      from 'react-router-dom'   // Navegación de React Router
import { useAuth }                         from '@/context/AuthContext' // Estado de autenticación
import '@/styles/Header.css'                                           // CSS en carpeta styles/

export default function Header() {

  // Estado que controla si el menú móvil está abierto o cerrado
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Datos del usuario autenticado y función de cierre de sesión
  const { isAuth, signOut } = useAuth()

  // Navegación programática — para redirigir tras cerrar sesión
  const navigate = useNavigate()

  // Alternar el menú móvil
  const toggleMenu = () => setMenuAbierto(prev => !prev)

  // Cerrar el menú al hacer clic en un link
  const cerrarMenu = () => setMenuAbierto(false)

  // Manejar cierre de sesión
  const handleSignOut = async () => {
    await signOut()  // Llamar a Supabase Auth
    cerrarMenu()     // Cerrar menú móvil si estaba abierto
    navigate('/')    // Redirigir al inicio
  }

  return (
    <header className="header">
      <div className="header__inner container">

        {/* ---- Logo ---- */}
        <Link to="/" className="header__logo" onClick={cerrarMenu}>
          <span className="header__logo-icon" aria-hidden="true"></span>
          <span className="header__logo-text">FenixAI</span>
        </Link>

        {/* ---- Navegación desktop ---- */}
        <nav className="header__nav" aria-label="Navegación principal">
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
            <>
              <Link to="/panel" className="header__link-panel">Mi tienda</Link>
              <button className="header__btn-salir" onClick={handleSignOut} type="button">
                Salir
              </button>
            </>
          ) : (
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
          <span className="header__hamburger-linea" />
          <span className="header__hamburger-linea" />
          <span className="header__hamburger-linea" />
        </button>

      </div>

      {/* ---- Menú móvil desplegable ---- */}
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
