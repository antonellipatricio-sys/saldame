# Sector: Configuración Financiera

> **Gestión de estructuras y parámetros que categorizan los gastos**

---

## Módulos de Configuración

Este sector manage toda la **metadata** que estructura los gastos: categorías, etiquetas y sus relaciones.

### 1️⃣ Categorías
- [Referencia completa](./categorias.md)
- **Archivo**: [`src/pages/CategoriesPage.tsx`](../../../src/pages/CategoriesPage.tsx)
- **Propósito**: CRUD de categorías (crear, leer, actualizar, eliminar)
- **Almacenamiento**: Firestore (persistente en cloud)

### 2️⃣ Etiquetas
- [Referencia completa](./etiquetas.md)
- **Archivo**: [`src/pages/TagsPage.tsx`](../../../src/pages/TagsPage.tsx)
- **Propósito**: CRUD de etiquetas (metadatos secundarios)
- **Almacenamiento**: Firestore (persistente en cloud)

---

## Modelo de Datos

### Category
```typescript
{
  id: string          // UUID generado
  name: string        // "Comida y Restaurantes"
  icon: string        // Emoji: 🍔
  color: string       // Hex: #FF6B6B
}
```

### Tag
```typescript
{
  id: string          // UUID generado
  name: string        // "Gastos Fijos"
  color: string       // Tailwind class: "bg-blue-100 text-blue-700"
}
```

---

## Relaciones

```
Expense
  │
  ├── category (1:N) → Categories (muchos gastos a una categoría)
  │
  └── tags (N:N) → Tags (un gasto puede tener varias etiquetas)

Ejemplo:
  Gasto: { id: "e1", description: "CARREFOUR", category: "Supermercado", tags: ["Fijos", "Semanal"] }
  
  Espande a:
  Category: { id: "Supermercado", name: "Supermercado", icon: "🛒", color: "#45B7D1" }
  Tags: [
    { id: "Fijos", name: "Gastos Fijos", color: "bg-blue-100 text-blue-700" },
    { id: "Semanal", name: "Semanal", color: "bg-green-100 text-green-700" }
  ]
```

---

## Flujo de Sincronización

### Categorías
```
Categoría creada en CategoriesPage
           │
           ▼
  addCategory() dispatch
           │
           ▼
  setDoc(db, "categories/{id}", data)
           │
           ▼
  Firestore persistió
           │
           ▼
  onSnapshot escucha
           │
           ▼
  useExpenseStore se actualiza
           │
           ▼
  Todos los componentes suscritos se re-renderizen
           │
           ▼
  En AddExpensePage:
  - Dropdown de categorías se actualiza automáticamente
  - El usuario ve la nueva categoría disponible
```

### Etiquetas
Mismo flujo que categorías.

---

## Categorías por Defecto

App inicia con 13 categorías predefinidas (ver `src/lib/categories.ts`):

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

Usuario puede:
- ✅ Crear más categorías
- ✅ Editar color/emoji/nombre de existentes
- ❌ No puede eliminar las 13 por defecto (protegidas)

---

## Etiquetas Predeterminadas

App inicia con una etiqueta:
- **"Gastos Fijos"** (`bg-blue-100 text-blue-700`)

Usuario puede:
- ✅ Agregar más etiquetas
- ✅ Editar existentes
- ✅ Eliminar cualquiera

---

## Validaciones

### En Categoría
- ✅ Nombre no vacío (1-50 caracteres)
- ✅ Emoji es single character (validar codepoint)
- ✅ Color es hex válido (#RRGGBB)
- ⚠️ Nombre único (no duplicados)

### En Etiqueta
- ✅ Nombre no vacío (1-50 caracteres)
- ✅ Color es Tailwind class válido ("bg-X-YNN text-X-ZNN")
- ⚠️ Nombre único (no duplicados)

---

## Restricciones

### Categorías
- ❌ No se puede eliminar categoría si:
  - Tiene gastos asociados aún
  - Es una de las 13 predefinidas
  
**Solución**: Primero reasignar gastos a otra categoría, luego eliminar.

### Etiquetas
- ❌ No se puede eliminar etiqueta si:
  - Tiene gastos asociados
  
**Solución**: Primero remover de todos los gastos, luego eliminar.

---

## Uso en Clasificación

Tanto el `classifier.ts` local como `gemini.ts` remoto utilizan categorías/etiquetas:

### Local Classifier
```typescript
const classifyLocal = (concept: string): Category | null => {
  const categories = store.categories; // Lee del store
  
  for (const category of categories) {
    if (RULES[category.name]?.keywords?.some(kw => concept.includes(kw))) {
      return category;
    }
  }
  
  return null; // No encontró categoría
};
```

### Gemini Classifier
```typescript
const prompt = `
Clasifica este gasto en una de estas categorías:
${store.categories.map(c => `- ${c.name} (${c.icon})`).join("\n")}

Concepto: "NETFLIX"
Responde con el nombre exacto de la categoría o "Otros".
`;
```

---

## Roadmap Futuro
- [ ] Categorías jerárquicas (subcategorías)
- [ ] Presupuesto por categoría
- [ ] Límites de gasto alertas
- [ ] Auto-categorización mejorada
- [ ] Importación de categorías desde templates
- [ ] Exportación de estructura (backup)

---

**Última actualización**: Mayo 2026  
**Persistencia**: Firestore Cloud  
**State Management**: Zustand + persist middleware
