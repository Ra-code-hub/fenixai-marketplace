# 🔥 FenixAI Marketplace

Marketplace colombiano para vendedores independientes.

## Stack
- **Frontend:** React 18 + Vite
- **Base de datos y Auth:** Supabase
- **IA:** Groq API (llama-3.3-70b-versatile)
- **Pagos:** Wompi
- **Deploy:** Vercel
- **Emails:** Resend

---

## Configuración inicial

### 1. Clonar / abrir en StackBlitz
Abre el proyecto en [StackBlitz](https://stackblitz.com) usando el repositorio de GitHub.

### 2. Variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env.local

# Editar .env.local con tus valores reales:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_GROQ_API_KEY
# - VITE_WOMPI_PUBLIC_KEY
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Correr en desarrollo
```bash
npm run dev
# Abre http://localhost:3000
```

---

## Estructura de carpetas

```
src/
├── assets/          → imágenes y recursos estáticos
├── components/
│   ├── Header/      → Header.jsx + Header.css
│   ├── Footer/      → Footer.jsx + Footer.css
│   └── Layout/      → Layout.jsx + Layout.css
├── context/
│   └── AuthContext.jsx  → estado global de autenticación
├── hooks/           → hooks personalizados (próximamente)
├── lib/
│   └── supabase.js  → cliente de Supabase
├── pages/
│   ├── Home/        → Home.jsx + Home.css
│   └── NotFound/    → NotFound.jsx + NotFound.css
├── styles/
│   └── global.css   → variables de diseño y reset
├── App.jsx          → rutas de la aplicación
└── main.jsx         → punto de entrada de React
```

---

## Cómo agregar una nueva página

1. Crear carpeta en `src/pages/NombrePagina/`
2. Crear `NombrePagina.jsx` con el contenido (solo el contenido, sin Header/Footer)
3. Crear `NombrePagina.css` con estilos usando prefijo `nombre-pagina__`
4. Importar y registrar la ruta en `src/App.jsx`

---

## Deploy en Vercel

1. Conectar el repositorio de GitHub en [vercel.com](https://vercel.com)
2. Agregar las variables de entorno en **Settings → Environment Variables**
3. Framework: **Vite** (se detecta automáticamente)
4. Build command: `npm run build`
5. Output directory: `dist`

---

## Paleta de colores

| Token | Valor | Uso |
|---|---|---|
| `--color-fondo` | `#F5F0E8` | Fondo crema de la app |
| `--color-negro` | `#1A1A1A` | Header, texto fuerte |
| `--color-naranja` | `#FF4D1C` | CTAs, botones primarios, marca |
| `--color-blanco` | `#FFFFFF` | Cards, áreas de contenido |
| `--color-gris-texto` | `#6B6560` | Texto secundario |

## Tipografías

- **Syne** — headings y títulos (carácter, modernidad)
- **DM Sans** — cuerpo de texto (legible, amigable)
