# Módulo: Estadísticas

Análisis visual con gráficos interactivos y agregaciones de gastos.

## Referencia al Código
- **Archivo principal:** [`src/pages/StatsPage.tsx`](../../../src/pages/StatsPage.tsx)
- **Librería de gráficos**: Recharts

## Descripción
Pantalla dedicada a resumir los gastos visualmente mediante gráficos interactivos, discriminando por:
- Categorías
- Etiquetas
- Períodos (mes, trimestre, año)
- Monedas

## Funcionamiento

### Tipos de Gráficos

#### 1. Pie Chart: Distribución por Categoría
```
            🥧
      ┌──────────┐
      │   TOP 5  │
      │ Categorías
      └──────────┘

Supermercado:    45%
Comida:          25%
Transporte:      15%
Entretenimiento: 10%
Otros:            5%
```

Interactividad:
- Hover muestra porcentaje y monto exacto
- Click en sector filtra lista abajo
- Colores corresponden a colores de categoría

#### 2. Bar Chart: Gastos Diarios (Últimos 7 días)
```
$
│
3000├  ┌─┐
2000├  │ │ ┌─┐
1000├  │ │ │ │ ┌─┐  ┌─┐
   0└──┴─┴─┴─┴─┴─┴──┴─┴──► Días
     L  M  X  J  V  S  D
```

#### 3. Line Chart: Tendencia Mensual (Últimos 12 meses)
```
│
3500├        ╱╲
3000├   ╱╲  ╱  ╲
2500├  ╱  ╲╱    ╲
2000├─╱──────────╲─
│                 ╲
 Mes  |--12 meses--|
```

#### 4. Cards: Top 3 Categorías
```
┌─────────────────────────┐
│  🍔 Supermercado        │
│  $15.000 ARS (45%)      │
︳  ↑ 12% vs mes anterior  │
└─────────────────────────┘
```

### Selector de Período
Radio buttons o tabs:
- **Este Mes**: Mes actual
- **Últimos 3 Meses**: Trimestre
- **Este Año**: Año calendario
- **Personalizado**: Date picker (desde/hasta)

### Agregaciones Básicas

```typescript
// Por categoría, mes actual
const byCategory = {};
expenses
  .filter(e => isCurrentMonth(e.date))
  .forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

// Resultado:
{
  "Supermercado": 15000,
  "Comida": 8000,
  "Transporte": 5000,
  "Entretenimiento": 3500,
  "Otros": 1500
}
```

## Filtros Disponibles

- **Período**: Mes / Trimestre / Año / Custom
- **Categoría**: Multi-select (si está vacío, mostrar todas)
- **Moneda**: ARS, USD, Ambas
- **Etiquetas**: Multi-select

```typescript
const filteredExpenses = expenses.filter(e => {
  // Período
  if (!isInPeriod(e.date, selectedPeriod)) return false;
  
  // Categoría (multi)
  if (selectedCategories.length > 0 && !selectedCategories.includes(e.category)) {
    return false;
  }
  
  // Moneda
  if (selectedCurrency !== "ALL" && e.currency !== selectedCurrency) {
    return false;
  }
  
  // Etiquetas
  if (selectedTags.length > 0) {
    const hasTags = selectedTags.every(t => e.tags?.includes(t));
    if (!hasTags) return false;
  }
  
  return true;
});
```

## Estadísticas Calculadas

### Total Período
```
Total ARS: $23.500
Total USD: $250
```

### Promedio Diario
```
Promedio/día: $756 ARS
```

### Gasto Máximo
```
Mayor gasto: $2.500 (CARREFOUR - 05/05)
```

### Categoría Top
```
#1 Supermercado: 45% del total
```

### Etiqueta Top
```
#1 Gastos Fijos: 60% del total
```

## Comparativa vs Período Anterior

```
Este mes:     $23.500 ARS
Mes anterior: $20.500 ARS
Variación:    ↑ +14.6%
```

## Exportación

Todos los gráficos pueden:
- 📊 Descargar como PNG
- 📑 Exportar datos subyacentes como CSV
- 📎 Copiar al portapapeles

## Diseño UI

### Colors
- Categorías: Usan colores definidos en master data
- Fondos: `white` con border `slate-100`
- Títulos: `text-brand-primary`, bold
- Valores: `font-black`, tamaño variado selon visibilidad

### Layout
- Desktop: 2-3 columnas
- Tablet: 1-2 columnas
- Mobile: 1 columna, scroll vertical

### Responsividad
```
Desktop:                 Tablet:           Mobile:
┌─────┬─────────┐       ┌──────────┐      ┌──────┐
│ Pie │ Bars    │       │   Pie    │      │ Pie  │
├─────┼─────────┤  →    ├──────────┤  →   ├──────┤
│ Top │ Line    │       │   Bars   │      │Bars  │
│Cat  │         │       ├──────────┤      ├──────┤
└─────┴─────────┘       │ Top Cat  │      │Line  │
                        └──────────┘      ├──────┤
                                          │Top   │
                                          └──────┘
```

## Ventajas
- ✅ Visualización clara de tendencias
- ✅ Múltiples perspectivas de datos
- ✅ Filtros potentes
- ✅ Exportable en múltiples formatos
- ✅ Comparativa histórica

## Limitaciones
- ❌ Gráficos pueden ser lentos con >10k registros
- ❌ Sin análisis predictivo
- ❌ Comparativa limitada a período anterior

## Roadmap
- [ ] Presupuesto visual (expected vs real)
- [ ] Proyección de gasto (tendencia lineal)
- [ ] Radar chart (categorías vs presupuesto)
- [ ] Scatter plot (fecha vs monto para anomalías)
- [ ] Heatmap mensual (qué días gastas más)
- [ ] Año-a-año (comparativa anual)
- [ ] Share chart en redes sociales

## Ejemplo: Mayo 2026

**Período**: Este mes
**Filtros**: Ninguno (todas las categorías)

**Resultado**:
- Pie Chart: Supermercado 45% ($15k), Comida 25% ($8k), Transporte 15% ($5k), Entretenimiento 8% ($2.5k), Otros 7% ($2k)
- Bar Chart (últimos 7 días): L:$2800, M:$3200, X:$2100, J:$3500, V:$2200, S:$1500, D:$1800
- Total: $35k ARS
- Promedio/día: $1.125
- Mayor gasto: $2.500 (Supermercado)
- vs Abril: ↑ +8%
