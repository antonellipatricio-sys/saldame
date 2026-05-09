# Módulo: Categorías

CRUD de categorías personalizadas con ícono y color.

## Referencia al Código
- **Archivo principal:** [`src/pages/CategoriesPage.tsx`](../../../src/pages/CategoriesPage.tsx)
- **Store**: [`src/store/useExpenseStore.ts`](../../../src/store/useExpenseStore.ts)
- **Librería**: Firestore

## Descripción
Interfaz para la gestión de categorías en las que se clasifican gastos e ingresos. Las categorías son el principal método de agrupación de gastos.

## Funcionamiento

### Vista Principal
- Listado de todas las categorías (predefinidas + cust)
- Cada fila muestra: [Emoji] Nombre (Color visual)
- Botones: Editar, Eliminar

### Operaciones CRUD

#### ➕ Crear Categoría
```
1. Usuario click "Nueva Categoría"
2. Form vacío aparece:
   - Nombre: [input text]
   - Emoji: [emoji picker o directa]
   - Color: [color picker]
3. User completa y presiona "Crear"
4. Validaciones ocurren
5. addCategory(newCat) dispatch
6. Firestore save
7. Lista se actualiza (onSnapshot)
```

#### ✏️ Editar Categoría
```
1. Usuario click "Editar" en fila
2. Form pre-llenado aparecer
3. Cambia nombre/emoji/color
4. Click "Guardar"
5. updateCategory(id, updates) dispatch
6. Firestore update
7. Todos los gastos con esa categoría se re-renderizen
```

#### 🗑 Eliminar Categoría
```
1. Usuario click papelera
2. Diálogo confirma: "¿Eliminar 'X'?"
   - Si tiene gastos: muestra "Esta categoría tiene N gastos"
   - Sugerencia: "Reasigna-los antes de eliminar"
3. Si acepta: deleteCategory(id) dispatch
4. Firestore delete
5. Categoría desaparece del listado
6. Gastos huérfanos se reasignan a "Otros"
```

### Campos del Formulario

| Campo | Tipo | Obligatorio | Restricción |
|-------|------|-------------|-------------|
| Nombre | String | Sí | 1-50 chars, único |
| Emoji | Char | Sí | Single emoji (1-2 codepoint) |
| Color | Hex | Sí | #RRGGBB válido |

### Picker de Emoji
Permite seleccionar de lista predefinida o escribir custom:
```
Sugerencias: 🍔 🚗 🛒 💊 🎬 👕 🏠 ✈️ 💼 🎓 🐾 📱 ❓ ...
O escribir: ☕ 🏋️ 🔧 etc.
```

### Picker de Color
```
Predefinidos: ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ (10 colores sugeridos)
O personalizado: [# Color Picker HTML5 input]
```

## Validaciones

```typescript
const validateCategory = (cat: Category): string | null => {
  // Nombre
  if (!cat.name || cat.name.trim().length === 0) {
    return "El nombre no puede estar vacío";
  }
  if (cat.name.length > 50) {
    return "El nombre no puede exceder 50 caracteres";
  }
  if (isDuplicate(cat.name)) {
    return "Esa categoría ya existe";
  }

  // Emoji
  const emojiRegex = /(\u00d7|\u{1F300}-\u{1F9FF})/u;
  if (!emojiRegex.test(cat.icon)) {
    return "Debes seleccionar un emoji válido";
  }

  // Color
  if (!/^#[0-9A-F]{6}$/i.test(cat.color)) {
    return "El color debe ser en formato hex válido";
  }

  return null; // Válido
};
```

## Categorías Protegidas (Por Defecto)

Las 13 categorías predefinidas NO pueden ser eliminadas:
```
"Comida y Restaurantes", "Transporte", "Supermercado", ...
```

Si usuario intenta eliminar:
```
⚠️ "Esta categoría predefinida no puede eliminarse, pero puedes cambiar su color o emoji."
```

Pero SÍ pueden ser editadas (cambiar emoji, color, nombre).

## Integración con Store

```typescript
const { categories, addCategory, updateCategory, deleteCategory } = useExpenseStore();

// Agregar
await addCategory({
  id: crypto.randomUUID(),
  name: "Mi Categoría",
  icon: "⚡",
  color: "#FF00FF"
});

// Actualizar
await updateCategory(categoryId, {
  name: "Mi Categoría Editada",
  color: "#00FF00"
});

// Eliminar
await deleteCategory(categoryId);
```

## Implicaciones en Cascada

### Si se Edita Categoría
- ✅ Nombre: Gastos se actualizan automáticamente (desde query)
- ✅ Emoji: UI se renderiza con nuevo emoji
- ✅ Color: Gráficos usan nuevo color

### Si se Elimina Categoría
- ❌ Gastos no se pueden perder
- Opción 1: Reasignar a "Otros"
- Opción 2: Reasignar a categoría elegida por usuario
- Opción 3: Prevenir eliminación si hay gastos

**Implementación**: Mostrar modal con opción de reasignar antes de eliminar.

## Casos de Uso

### Caso 1: Crear Categoría Personal
```
Usuario: "Quiero agrupar gastos de mis hobbies"
Acción:
  1. Abre Categorías
  2. "Nueva Categoría"
  3. Nombre: "Hobbies"
  4. Emoji: 🎮
  5. Color: #FF6B9D
  6. Crear
Resultado: Disponible en dropdown de AddExpensePage
```

### Caso 2: Cambiar Color de Categoría
```
Usuario: "Me molesta el rojo de Comida, prefiero naranja"
Acción:
  1. Abre Categorías
  2. Busca "Comida y Restaurantes"
  3. Click Editar
  4. Cambia color a #FF9500
  5. Guardar
Resultado: Todos los gráficos se actualizan con nuevo color
```

### Caso 3: Merging de Categorías
```
Usuario: Quiere unificar "Comida" y "Restaurantes"
Problema: Actualmente son categorías separadas
Solución:
  1. Edita categoria "Comida": cambia nombre a "Comida y Restaurantes"
  2. Reasigna todos los gastos de "Restaurantes" a "Comida"
  3. Elimina "Restaurantes"
Resultado: Una sola categoría unificada
```

## Ventajas
- ✅ Estructura flexible
- ✅ Personalizable (emoji + color)
- ✅ Sincronización en tiempo real
- ✅ Validaciones robustas

## Limitaciones
- ❌ No permite subcategorías
- ❌ No hay categorías compartidas entre usuarios (si hay multi-user futuro)
- ❌ No hay audit log de cambios

## Roadmap
- [ ] Subcategorías (jerarquía 2 niveles)
- [ ] Categorías compartidas (templates públicos)
- [ ] Reglas auto-categorización por categoría
- [ ] Presupuesto por categoría con alertas
- [ ] Historial de cambios (audit log)
- [ ] Importar/Exportar categorías (backup)
