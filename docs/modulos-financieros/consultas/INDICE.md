# Sector: Consultas y Análisis

> **Visualización, búsqueda y análisis de gastos registrados**

---

## Módulos de Consultas

Este sector es responsable de toda la **visualización y análisis** de datos. Ofrece múltiples formas de interrogar los datos:

### 1️⃣ Dashboard / Inicio
- [Referencia completa](./inicio.md)
- **Archivo**: [`src/pages/DashboardPage.tsx`](../../../src/pages/DashboardPage.tsx)
- **Propósito**: Resumen ejecutivo del mes actual
- **Visualiza**: Totales por moneda, últimos gastos, gráficos rápidos

### 2️⃣ Mis Gastos (Historial Completo)
- [Referencia completa](./mis-gastos.md)
- **Archivo**: [`src/pages/ExpensesListPage.tsx`](../../../src/pages/ExpensesListPage.tsx)
- **Propósito**: Listado tabular con filtros avanzados
- **Permite**: Búsqueda, filtros por categoría/mes/moneda, edición inline

### 3️⃣ Estadísticas
- [Referencia completa](./estadisticas.md)
- **Archivo**: [`src/pages/StatsPage.tsx`](../../../src/pages/StatsPage.tsx)
- **Propósito**: Análisis gráfico y agregaciones
- **Muestra**: Top categorías, Top etiquetas, gráficos interactivos

### 4️⃣ Consultas en IA (Lenguaje Natural)
- [Referencia completa](./estado-de-cuenta.md)
- **Archivo**: [`src/pages/QueryPage.tsx`](../../../src/pages/QueryPage.tsx)
- **Propósito**: Preguntas en español/inglés con respuestas inteligentes
- **Ejemplo**: "¿Cuánto gasté en comida el mes pasado?"

---

## Arquitectura de Consultas

```
┌──────────────────────────────────────────────────────┐
│         FORMAS DE CONSULTA                           │
├────────┬──────────────┬───────────────┬─────────────┤
│ VISUAL │ TABULAR      │ GRÁFICO       │ NATURAL     │
│(Dashboard) │ (Lista)      │ (Stats)       │ (IA)        │
└────────┴──────────────┴───────────────┴─────────────┘
      │         │             │             │
      └─────────┴─────────────┴─────────────┘
                │
                ▼
    ┌────────────────────────┐
    │  Store (useExpenseStore)│
    │  .expenses[]           │
    └────────────────────────┘
                │
                ▼
    ┌────────────────────────┐
    │  Firebase Firestore    │
    │  collection: expenses/ │
    └────────────────────────┘
```

---

## Flujo de Datos en Lectura

1. **Carga Inicial**: Aplicación inicia → `useEffect` → `fetchExpenses()`
2. **Real-time Listener**: Establece `onSnapshot` en Firestore
3. **Sincronización**: Cualquier cambio en DB → automáticamente actualizan todos los componentes suscritos
4. **Re-renderizado**: React detecta cambio en store → UI se actualiza

```
Componente x
      │
      ├── useExpenseStore()
      │   └── Zustand store
      │       └── onSnapshot listener (Firestore)
      │
    ▼ (cada 500ms, si hay cambios)
    
Firestore Cloud
    expensesListener()
    └── onSnapshot({
        expenses: [...updated]
    })
```

---

## Patrones de Filtrado Comunes

### Filtro: Mes Actual
```typescript
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

const filtered = expenses.filter(e => {
  const eDate = new Date(e.date);
  return eDate.getMonth() === currentMonth && 
         eDate.getFullYear() === currentYear;
});
```

### Filtro: Por Categoría
```typescript
const byCategory = expenses.filter(e => e.category === selectedCategoryId);
```

### Filtro: Rango de Fechas
```typescript
const byRange = expenses.filter(e => e.date >= startDate && e.date <= endDate);
```

### Filtro: Combinado
```typescript
const filtered = expenses.filter(e => {
  const eDate = new Date(e.date);
  return (
    e.category === selectedCategory &&
    (selectedMonth === null || eDate.getMonth() === selectedMonth) &&
    (searchTerm === "" || e.description.includes(searchTerm)) &&
    (selectedCurrency === "ALL" || e.currency === selectedCurrency)
  );
});
```

---

## Agregaciones (Grouping)

### Total por Categoría
```typescript
const byCategory: Record<string, number> = {};
expenses.forEach(e => {
  byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
});

// Resultado: { "Comida": 5000, "Transporte": 1200, ... }
```

### Total por Moneda
```typescript
const totals = {
  ARS: expenses
    .filter(e => e.currency === "ARS")
    .reduce((sum, e) => sum + e.amount, 0),
  USD: expenses
    .filter(e => e.currency === "USD")
    .reduce((sum, e) => sum + e.amount, 0),
};
```

### Gráfico Pie: Por Categoría
```typescript
const data = Object.entries(byCategory).map(([name, value]) => ({
  name,
  value: Math.round(value * 100) / 100,
}));

// Para Recharts:
<PieChart>
  <Pie dataKey="value" data={data} />
</PieChart>
```

---

## Componentes de Visualización

### Dashboard
- Card de totales (ARS/USD)
- Mini-chart de últimos 7 días
- Tabla de últimos 5 gastos
- Resumen por categoría (Top 3)

### Lista (Tabular)
- Tabla con columns: Fecha | Descripción | Monto | Categoría | Etiquetas | Acciones
- Search box
- Filters: Mes, Categoría, Moneda
- Paginación (25 por página)
- Botones: Editar, Eliminar, Exportar CSV

### Estadísticas
- Pie chart: Gastos por categoría
- Bar chart: Evolución mensual
- Cards: Top 3 categorías, Top 3 etiquetas
- Selector de período (Mes, Trimestre, Año)

### Consultas IA
- Textarea de input
- Botón "Pregunta"
- Área de resultado (markdown rich)
- Historial de consultas anteriores

---

## Performance y Optimización

### Problema: Lista con 1000+ gastos
**Solución**:
- Paginación (25 por página)
- Virtualización (solo renderizar visible)
- Memoización (`useMemo`, `useCallback`)

```typescript
const memoizedExpenses = useMemo(() => {
  return expenses
    .filter(e => matchesFilters(e))
    .sort((a, b) => b.date - a.date)
    .slice(pageIndex * 25, (pageIndex + 1) * 25);
}, [expenses, filters, pageIndex]);
```

### Problema: Re-renders innecesarios
**Solución**:
- Zustand selectores
- React.memo para sub-componentes

```typescript
const expenses = useExpenseStore(state => state.expenses);
// Solo se re-renderiza si `expenses` cambió, no si cambia otra parte del store
```

---

## Exportación de Datos

### CSV
```typescript
const exportCSV = (expenses: Expense[]) => {
  const csv = [
    ["Fecha", "Descripción", "Monto", "Moneda", "Categoría"].join(","),
    ...expenses.map(e => 
      [e.date, e.description, e.amount, e.currency, e.category].join(",")
    )
  ].join("\n");
  
  const blob = new Blob([csv], { type: "text/csv" });
  downloadBlob(blob, "gastos.csv");
};
```

### Excel
Ver: [`src/lib/exportExcel.ts`](../../../src/lib/exportExcel.ts)

### PDF
Ver: [`src/lib/pdfGenerator.ts`](../../../src/lib/pdfGenerator.ts)

---

## Roadmap Futuro
- [ ] Presupuesto y alertas cuando se excedan
- [ ] Proyección de gastos (predicción)
- [ ] Comparación año-año
- [ ] Reportes personalizados (builder visual)
- [ ] Alertas en tiempo real ("Excediste presupuesto de X")
- [ ] Dashboard público compartible (read-only)

---

**Última actualización**: Mayo 2026  
**Tecnología**: Firestore + Zustand + React + Recharts
