// ============================================================
// src/pages/NotFound.jsx — Página 404
// ============================================================
// Se muestra cuando la URL no existe en la aplicación.
// Hereda Layout (Header + Footer) automáticamente.
// ============================================================

import { Link }          from 'react-router-dom'
import '@/styles/NotFound.css' // CSS en carpeta styles/

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="container">
        <span className="not-found__numero" aria-hidden="true">404</span>
        <h1 className="not-found__titulo">Página no encontrada</h1>
        <p className="not-found__descripcion">
          Esta página no existe o fue movida. Puede ser que el link
          esté roto o que hayas escrito mal la dirección.
        </p>
        <Link to="/" className="btn-primary not-found__btn">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
