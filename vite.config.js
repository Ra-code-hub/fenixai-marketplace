// ============================================================
// vite.config.js — Configuración de Vite para el proyecto
// FenixAI Marketplace Colombia
// ============================================================

import { defineConfig } from 'vite'   // Función principal de configuración de Vite
import react from '@vitejs/plugin-react' // Plugin oficial de React para Vite (JSX + Fast Refresh)
import path from 'path'                 // Módulo de Node para resolver rutas absolutas

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react() // Activa soporte JSX y hot module replacement para React
  ],

  resolve: {
    alias: {
      // Alias '@' apunta a la carpeta src/ para imports más limpios
      // Ejemplo: import algo from '@/lib/supabase' en vez de '../../lib/supabase'
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3000, // Puerto de desarrollo local
  },
})
