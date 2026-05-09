# Sector: Configuración Financiera

> **Gestión de categorías, etiquetas y responsables que estructuran los gastos**

---

## Módulos de Configuración

| Módulo | Archivo fuente | Propósito |
|--------|---------------|-----------|
| [Categorías](./categorias.md) | `src/pages/CategoriesPage.tsx` | CRUD de categorías; incluye 13 por defecto protegidas |
| [Etiquetas](./etiquetas.md) | `src/pages/TagsPage.tsx` | CRUD de etiquetas (metadatos secundarios multi-asignables) |
| [Responsables](./responsables.md) | `src/pages/ResponsablesPage.tsx` | Gestión de miembros del hogar asignables a cada gasto |

---

## Modelos de Datos

### Category
```typescript
{
  id: string    // UUID generado
  name: string  // "Comida y Restaurantes"
  icon: string  // Emoji: 🍔
  color: string // Hex: #FF6B6B
}
```

### Tag
```typescript
{
  id: string    // UUID generado
  name: string  // "Gastos Fijos"
  color: string // Tailwind class: "bg-blue-100 text-blue-700"
}
```

---

## Categorías vs Etiquetas

| | Categoría | Etiqueta |
|---|-----------|---------|
| Cardinalidad por gasto | 1 (obligatoria) | 0 a N (opcional) |
| Uso principal | Clasificación y agrupación | Contexto adicional |
| Ejemplos | Supermercado, Transporte | Gastos Fijos, Cuotas, Viaje |
| Eliminable | No si tiene gastos asociados o es predefinida | No si tiene gastos asociados |

---

## Categorías por Defecto (13)

Definidas en `src/lib/categories.ts`. No se pueden eliminar.

| # | Nombre | Emoji | Color |
|---|--------|-------|-------|
| 1 | Comida y Restaurantes | 🍔 | #FF6B6B |
| 2 | Transporte | 🚗 | #4ECDC4 |
| 3 | Supermercado | 🛒 | #45B7D1 |
| 4 | Salud | 💊 | #96CEB4 |
| 5 | Entretenimiento | 🎬 | #FFEAA7 |
| 6 | Ropa | 👕 | #DFE6E9 |
| 7 | Hogar y Servicios | 🏠 | #74B9FF |
| 8 | Viajes | ✈️ | #A29BFE |
| 9 | Trabajo | 💼 | #FD79A8 |
| 10 | Educación | 🎓 | #55EFC4 |
| 11 | Mascotas | 🐾 | #FDCB6E |
| 12 | Tecnología | 📱 | #6C5CE7 |
| 13 | Otros | ❓ | #B2BEC3 |

## Roadmap Futuro
- [ ] Categorías jerárquicas (subcategorías)
- [ ] Presupuesto por categoría con alertas
- [ ] Importación de categorías desde templates
