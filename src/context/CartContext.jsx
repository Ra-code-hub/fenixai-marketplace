// ============================================================
// src/context/CartContext.jsx — Contexto global del carrito
// ============================================================
// Maneja el estado del carrito de compras en toda la app.
// El carrito esta atado a una tienda (slug) para evitar mezclar
// productos de tiendas distintas.
//
// Persistencia: localStorage — sobrevive recargas del navegador
// Uso: import { useCart } from '@/context/CartContext'
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react'

// Clave usada para guardar el carrito en localStorage
const STORAGE_KEY = 'fenixai_carrito'

// Crear el contexto vacio
const CartContext = createContext(null)

// ---- Provider ---- //
export function CartProvider({ children }) {

  // Estado del carrito:
  // {
  //   slug: 'ropa-rag',         → tienda a la que pertenece
  //   nombreTienda: 'Ropa Rag', → nombre para mostrar
  //   items: [                  → productos agregados
  //     {
  //       id: 'uuid',
  //       nombre: 'Blusa',
  //       precio: 85000,
  //       imagen: 'url',
  //       cantidad: 2,
  //       stock: 5
  //     }
  //   ]
  // }
  const [carrito, setCarrito] = useState(() => {
    // Inicializar desde localStorage al montar
    // Si no hay nada guardado, el carrito empieza vacio
    try {
      const guardado = localStorage.getItem(STORAGE_KEY)
      return guardado ? JSON.parse(guardado) : { slug: null, nombreTienda: '', items: [] }
    } catch {
      // Si hay error leyendo localStorage, empezar vacio
      return { slug: null, nombreTienda: '', items: [] }
    }
  })

  // Guardar en localStorage cada vez que el carrito cambia
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito))
    } catch {
      // Ignorar errores de localStorage (modo privado, etc.)
    }
  }, [carrito])

  // ---- Total de items en el carrito (suma de cantidades) ----
  // Usado para el badge del header
  const totalItems = carrito.items.reduce(
    (suma, item) => suma + item.cantidad, 0
  )

  // ---- Total en pesos del carrito ----
  const totalPrecio = carrito.items.reduce(
    (suma, item) => suma + (item.precio * item.cantidad), 0
  )

  // ---- Agregar producto al carrito ----
  const agregarItem = (producto, slugTienda, nombreTienda) => {

    // Verificar si el producto es de una tienda diferente
    if (carrito.slug && carrito.slug !== slugTienda && carrito.items.length > 0) {
      // Retornar un indicador para que el componente maneje la confirmacion
      return { diferenteTienda: true, slugActual: carrito.slug, nombreActual: carrito.nombreTienda }
    }

    setCarrito(prev => {
      // Buscar si el producto ya esta en el carrito
      const itemExistente = prev.items.find(i => i.id === producto.id)

      if (itemExistente) {
        // Si ya existe, incrementar la cantidad (sin superar el stock)
        return {
          ...prev,
          slug: slugTienda,
          nombreTienda,
          items: prev.items.map(i =>
            i.id === producto.id
              ? { ...i, cantidad: Math.min(i.cantidad + 1, producto.stock) }
              : i
          )
        }
      }

      // Si no existe, agregar el producto con cantidad 1
      return {
        slug: slugTienda,
        nombreTienda,
        items: [
          ...prev.items,
          {
            id:       producto.id,
            nombre:   producto.nombre,
            precio:   producto.precio,
            imagen:   producto.imagenes?.[0] || null, // Primera imagen
            cantidad: 1,
            stock:    producto.stock,
          }
        ]
      }
    })

    return { exito: true }
  }

  // ---- Forzar agregar vaciando el carrito anterior ----
  // Se llama cuando el usuario confirma cambiar de tienda
  const forzarAgregarItem = (producto, slugTienda, nombreTienda) => {
    setCarrito({
      slug: slugTienda,
      nombreTienda,
      items: [{
        id:       producto.id,
        nombre:   producto.nombre,
        precio:   producto.precio,
        imagen:   producto.imagenes?.[0] || null,
        cantidad: 1,
        stock:    producto.stock,
      }]
    })
  }

  // ---- Cambiar cantidad de un item ----
  const cambiarCantidad = (idProducto, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      // Si la cantidad llega a 0, eliminar el item
      eliminarItem(idProducto)
      return
    }

    setCarrito(prev => ({
      ...prev,
      items: prev.items.map(i =>
        i.id === idProducto
          ? { ...i, cantidad: Math.min(nuevaCantidad, i.stock) }
          : i
      )
    }))
  }

  // ---- Eliminar un item del carrito ----
  const eliminarItem = (idProducto) => {
    setCarrito(prev => {
      const nuevosItems = prev.items.filter(i => i.id !== idProducto)

      // Si el carrito queda vacio, limpiar tambien el slug
      if (nuevosItems.length === 0) {
        return { slug: null, nombreTienda: '', items: [] }
      }

      return { ...prev, items: nuevosItems }
    })
  }

  // ---- Vaciar el carrito completamente ----
  const vaciarCarrito = () => {
    setCarrito({ slug: null, nombreTienda: '', items: [] })
  }

  // ---- Verificar si un producto ya esta en el carrito ----
  const estaEnCarrito = (idProducto) => {
    return carrito.items.some(i => i.id === idProducto)
  }

  // ---- Obtener la cantidad de un producto en el carrito ----
  const cantidadEnCarrito = (idProducto) => {
    const item = carrito.items.find(i => i.id === idProducto)
    return item ? item.cantidad : 0
  }

  // Valor que se comparte con toda la app
  const value = {
    carrito,          // Estado completo del carrito
    totalItems,       // Numero total de items (para el badge)
    totalPrecio,      // Precio total en COP
    agregarItem,      // Agregar producto
    forzarAgregarItem,// Agregar vaciando el carrito anterior
    cambiarCantidad,  // Cambiar cantidad de un item
    eliminarItem,     // Eliminar un item
    vaciarCarrito,    // Vaciar todo el carrito
    estaEnCarrito,    // Verificar si un producto esta en el carrito
    cantidadEnCarrito,// Cantidad de un producto especifico
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

// ---- Hook personalizado ----
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart() debe usarse dentro de <CartProvider>')
  }
  return context
}