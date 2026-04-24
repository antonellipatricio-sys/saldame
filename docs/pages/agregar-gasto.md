# Módulo: Agregar Gasto

## Referencia al Código
- **Archivo principal:** [`src/pages/AddExpensePage.tsx`](../../src/pages/AddExpensePage.tsx)

## Descripción
Esta página provee un formulario interactivo para la carga manual de un gasto individual.

## Funcionamiento
- **Formulario:** Contiene campos estándar obligatorios como "Monto", "Fecha", "Moneda", "Categoría", "Tipo de pago" y "Descripción" del gasto.
- **Validaciones:** Se realizan controles para asegurar que los gastos tengan información coherente (por ej., no pueden haber montos vacíos).
- **Acción (Submit):** Al presionar "Guardar", la acción se despacha hacia el State de la aplicación y la información se consolida, redireccionando por lo general al listado de gastos.
