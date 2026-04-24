# Módulo: Estadísticas

## Referencia al Código
- **Archivo principal:** [`src/pages/StatsPage.tsx`](../../src/pages/StatsPage.tsx)

## Descripción
Pantalla que se encarga de resumir los gastos visualmente.

## Funcionamiento
- Hace query y agregación de todos los gastos desde el `Store`.
- Muestra representaciones gráficas interactivas (ej. Gráficos circulares o de barras comparativas), discriminando consumos según categorías, divisas u origen del gasto.
- Provee filtros globales de tiempo (mes, trimestre, anual).
