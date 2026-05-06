# Módulo: Mis Gastos (Historia Completa)

Listado tabular completo de todos los gastos con filtros avanzados y búsqueda.

## Referencia al Código
- **Archivo principal:** [`src/pages/ExpensesListPage.tsx`](../../../src/pages/ExpensesListPage.tsx)

## Descripción
Vista enfocada en listar e interactuar con el historial completo de gastos registrados en el sistema. Permite búsqueda, filtrado y auditoría completa.

## Funcionamiento

### Tabla Principal
Columnas visibles:
| Fecha | Descripción | Monto | Moneda | Categoría | Etiquetas | Acciones |
|-------|-------------|-------|--------|-----------|-----------|----------|
| 05/05 | CARREFOUR | 2.500 | ARS | Supermercado | [Fijos] | [✏ Edit] [🗑 Del] |
| 04/05 | NETFLIX | 299 | ARS | Entretenimiento | [Suscripciones] | [✏ Edit] [🗑 Del] |

### Filtros Disponibles
- **Búsqueda**: Input para filtrar por descripción (LIKE)
- **Mes**: Dropdown con mes/año
- **Categoría**: Multi-select de categorías
- **Moneda**: Checkbox ARS, USD, Ambas
- **Etiquetas**: Multi-select de etiquetas
- **Rango de Fechas** (opcional): Date picker desde/hasta

### Búsqueda y Filtros
```typescript
const filtered = expenses.filter(e => {
  const eDate = new Date(e.date);
  
  // Búsqueda textual
  if (searchTerm && !e.description.toLowerCase().includes(searchTerm.toLowerCase())) {
    return false;
  }
  
  // Filtro de mes
  if (selectedMonth !== null) {
    if (eDate.getMonth() !== selectedMonth) return false;
  }
  
  // Filtro de categoría (multi)
  if (selectedCategories.length > 0 && !selectedCategories.includes(e.category)) {
    return false;
  }
  
  // Filtro de moneda
  if (selectedCurrencies.length > 0 && !selectedCurrencies.includes(e.currency)) {
    return false;
  }
  
  // Filtro de etiquetas (AND: debe tener todas)
  if (selectedTags.length > 0) {
    const hasTags = selectedTags.every(tag => e.tags?.includes(tag));
    if (!hasTags) return false;
  }
  
  return true;
});
```

## Acciones por Fila

### Editar
- Click en botón o doble-click en fila
- Se abre modal/drawer con formulario pre-llenado
- Permite cambiar cualquier campo
- Guardar dispara `updateExpense()`

### Eliminar
- Click en papelera
- Confirmación "¿Eliminar gasto de $X?"
- Dispara `deleteExpense()`
- Fila desaparece del listado

### Ver Detalles
- Click en fila
- Abre panel lateral con todos los datos
- Muestra timestamps (createdAt, updatedAt)
- Historial de cambios (si aplica)

## Paginación

Configuración:
- Tamaño de página: 25 gastos por página
- Total de páginas calculado
- Botones: Anterior, Números de página, Siguiente

```typescript
const page = Math.floor(filteredExpenses.length / PAGE_SIZE);
const paginatedExpenses = filteredExpenses.slice(
  (currentPage - 1) * PAGE_SIZE,
  currentPage * PAGE_SIZE
);
```

## Performance
- Memoización de filtros (`useMemo`)
- Virtualización si hay >1000 gastos
- Lazy loading de imágenes (si aplica)

## Estadísticas en Vivo

Mientras se filtra, muestra:
- Total de gastos mostrados: "Mostrando 15 de 342"
- Total ARS filtrados
- Total USD filtrados
- Promedio por transacción

```typescript
const stats = {
  count: filtered.length,
  totalARS: filtered.filter(e => e.currency === "ARS").reduce((s, e) => s + e.amount, 0),
  totalUSD: filtered.filter(e => e.currency === "USD").reduce((s, e) => s + e.amount, 0),
  average: filtered.reduce((s, e) => s + e.amount, 0) / filtered.length,
};
```

## Exportación
- Botón "Exportar como CSV"
- Botón "Exportar como Excel"
- Botón "Exportar como PDF"

Incorpora solo gastos filtrados.

## Ventajas
- ✅ Control granular de gastos
- ✅ Edición rápida inline
- ✅ Búsqueda poderosa
- ✅ Exportación completa
- ✅ Auditoría de cambios

## Limitaciones
- ❌ Tabla puede ser lenta con >5000 registros
- ❌ Sin edición batch
- ❌ Sin undo de eliminaciones

## Roadmap
- [ ] Edición multi-selección
- [ ] Duplicación de registro
- [ ] Historial de cambios (audit log)
- [ ] Sincronización cross-device
- [ ] Shortcuts de teclado (Delete, Ctrl+E para editar)
