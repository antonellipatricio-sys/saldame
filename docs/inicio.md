# Módulo: Dashboard (Inicio)

Pantalla de resumen ejecutivo con indicadores clave y últimos movimientos.

## Referencia al Código
- **Archivo principal:** [`src/pages/DashboardPage.tsx`](../../../src/pages/DashboardPage.tsx)

## Descripción
El Dashboard es la pantalla inicial cuando el usuario abre la app. Proporciona una vista rápida de:
- Gastos totales del mes (ARS y USD)
- Últimos movimientos registrados
- Comparativa vs mes anterior
- Desglose rápido por categoría

## Componentes y Flujos

### 1. Kardex / Tarjetas de Resumen
Muestra:
- **Total ARS**: Suma de todos los gastos en pesos del mes
- **Total USD**: Suma de todos los gastos en dólares del mes
- **Cambio vs mes anterior**: "↑ +15%" o "↓ -8%"
- **Número de transacciones**: "32 movimientos"

### 2. Gráficos e Indicadores
- Mini-gráfico de barras: Gastos diarios (últimos 7 días)
- Pie chart miniatura: Distribución por categoría
- Card del gasto promedio diario

### 3. Últimos Movimientos
Tabla acotada (5-10 últimos) mostrando:
| Fecha | Descripción | Monto | Categoría | Acción |
|-------|-------------|-------|-----------|--------|
| Hoy | CARREFOUR | -$2.500 | Supermercado | [Ver] |
| Ayer | UBER | -$150 | Transporte | [Ver] |

### 4. Acceso Rápido a Funciones
Botones destacados:
- ➕ Agregar Gasto
- 📊 Ver Estadísticas
- 📝 Mis Gastos
- 📥 Importar PDF

## Funcionalidad

```typescript
export function DashboardPage() {
  const { expenses } = useExpenseStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Calcular totales del mes
  const currentMonthExpenses = expenses.filter(e => {
    const eDate = new Date(e.date);
    return eDate.getMonth() === selectedMonth.getMonth() &&
           eDate.getFullYear() === selectedMonth.getFullYear();
  });

  const totalARS = currentMonthExpenses
    .filter(e => e.currency === "ARS")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalUSD = currentMonthExpenses
    .filter(e => e.currency === "USD")
    .reduce((sum, e) => sum + e.amount, 0);

  // Últimos 10 movimientos
  const lastExpenses = expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  // Distribución por categoría
  const byCategory = {};
  currentMonthExpenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  return (
    <div>
      <Cards totalARS={totalARS} totalUSD={totalUSD} />
      <Charts data={byCategory} last7Days={lastExpenses} />
      <LastExpensesTable expenses={lastExpenses} />
      <QuickActions />
    </div>
  );
}
```

## Diseño UI

- **Cards**: Fondo `brand-primary`, texto blanco, sombra suave
- **Charts**: Fondo `white`, bordes `slate-100`
- **Tabla**: Stripes alternas `slate-50`
- **Botones**: Primary `brand-primary`, Secondary `slate-200`
- **Typography**: Títulos bold, valores en `font-black`

## Ventajas
- ✅ Vista holística sin navegar
- ✅ Indicadores de tendencia
- ✅ Acceso rápido a funciones principales
- ✅ Responsive (mobile-first)

## Límites
- ❌ No permite edición directa
- ❌ Solo mes actual (navegación manual)
- ❌ Gráficos simplificados

## Roadmap
- [ ] Comparativa interactiva (arrastrar período)
- [ ] Alertas si se excede presupuesto
- [ ] Categoría destacada del mes
- [ ] Predicción de gastos (tendencia)
