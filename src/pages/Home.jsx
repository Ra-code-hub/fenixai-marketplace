// ============================================================
// src/pages/Home.jsx — Página de inicio (landing)
// ============================================================
// Se renderiza en la ruta "/" dentro del Layout.
// No importa Header ni Footer — los hereda del Layout.
// ============================================================

import '@/styles/Home.css' // CSS en carpeta styles/

export default function Home() {
  return (
    <div className="home">

      {/* ---- Hero ---- */}
      <section className="home__hero">
        <div className="container">

          <span className="home__hero-badge">
            🇨🇴 El marketplace de los emprendedores colombianos
          </span>

          <h1 className="home__hero-titulo">
            Vende más.<br />
            <span className="home__hero-titulo-acento">Sin miedo al fraude.</span>
          </h1>

          <p className="home__hero-subtitulo">
            Abre tu tienda en 10 minutos. Recibe pagos seguros desde
            Nequi, Daviplata y tarjetas. Tu IA mejora tus publicaciones
            automáticamente — sin pagar nada hasta que vendas.
          </p>

          <div className="home__hero-acciones">
            <a href="/crear-tienda" className="btn-primary home__hero-btn-principal">
              Abre tu tienda gratis
            </a>
            <a href="/tiendas" className="btn-secondary home__hero-btn-secundario">
              Explorar tiendas
            </a>
          </div>

          <p className="home__hero-social">
            ✓ Sin tarjeta de crédito &nbsp;·&nbsp;
            ✓ Sin RUT obligatorio &nbsp;·&nbsp;
            ✓ Sin mensualidad hasta que vendas
          </p>

        </div>
      </section>

      {/* ---- Cómo funciona ---- */}
      <section className="home__como-funciona">
        <div className="container">

          <h2 className="home__seccion-titulo">¿Cómo funciona?</h2>

          <div className="home__pasos">

            <div className="home__paso">
              <span className="home__paso-numero">01</span>
              <h3 className="home__paso-titulo">Crea tu tienda</h3>
              <p className="home__paso-descripcion">
                Registra tu tienda en menos de 10 minutos. Sube tus productos
                con fotos y nuestra IA los mejora automáticamente.
              </p>
            </div>

            <div className="home__paso">
              <span className="home__paso-numero">02</span>
              <h3 className="home__paso-titulo">Comparte tu tienda</h3>
              <p className="home__paso-descripcion">
                Obtienes un enlace único. Compártelo en Instagram, WhatsApp
                y TikTok. Tus seguidores llegan directo a tu tienda.
              </p>
            </div>

            <div className="home__paso">
              <span className="home__paso-numero">03</span>
              <h3 className="home__paso-titulo">Recibe pagos seguros</h3>
              <p className="home__paso-descripcion">
                Los pagos quedan retenidos hasta que el comprador confirme
                la recepción. Sin fraudes. Sin sustos.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ---- Para compradores ---- */}
      <section className="home__compradores">
        <div className="container">
          <div className="home__compradores-inner">

            <div className="home__compradores-texto">
              <h2 className="home__seccion-titulo">Compra con confianza real</h2>
              <p className="home__compradores-descripcion">
                Sabemos que te han fallado antes. Por eso cada vendedor
                pasa por verificación de identidad, y tu pago solo se
                libera cuando tú confirmas que llegó bien.
              </p>
              <ul className="home__compradores-lista">
                <li>✓ Garantía de devolución de 5 días</li>
                <li>✓ Vendedores verificados con cédula</li>
                <li>✓ Disputas resueltas por nosotros</li>
                <li>✓ Nequi, Daviplata, PSE y tarjetas</li>
              </ul>
            </div>

            <div className="home__compradores-visual" aria-hidden="true">
              <div className="home__compradores-card">
                <span className="home__compradores-escudo">🛡️</span>
                <p>Tu pago está protegido</p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
