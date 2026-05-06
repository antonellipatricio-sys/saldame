# Herramienta: Calculadora

Herramienta de cálculo rápido para operaciones matemáticas sin abandonar la app.

## Referencia al Código
- **Archivo principal:** [`src/pages/CalculatorPage.tsx`](../../src/pages/CalculatorPage.tsx)
- **Componentes base**:
  - [`src/components/calculator/CalculatorHeader.tsx`](../../src/components/calculator/CalculatorHeader.tsx)
  - [`src/components/calculator/CalculatorTable.tsx`](../../src/components/calculator/CalculatorTable.tsx)
- **Store**: [`src/store/useAppStore.ts`](../../src/store/useAppStore.ts)

## Descripción

Página de entrada de la herramienta que realiza cálculos rápidos mediante componentes dedicados. Utilidad independiente al tracker de gastos, proveyendo lógicas orientadas a estimaciones numéricas.

## Funcionamiento

### Interfaz Principal

La calculadora tiene dos modos:

#### Modo 1: Calculadora Científica
```
┌──────────────────────────┐
│       250 + 150          │  Display
├──────────────────────────┤
│  7   8   9   /           │
│  4   5   6   *           │
│  1   2   3   -           │
│  0   .   =   +           │
│      AC      ±           │
└──────────────────────────┘
```

#### Modo 2: Tabla de Detalle
Para presupuestos, compras, etc.:

```
Concepto                 Cantidad  Precio Unit  Total
───────────────────────────────────────────────────────
🥦 Lechuga                 2         $50       $100
🍅 Tomate                  3         $30        $90
🧅 Cebolla                 1         $20        $20
                                          TOTAL: $210
```

### Operaciones Básicas
- ➕ Suma: 250 + 150 = 400
- ➖ Resta: 250 - 150 = 100
- ✖️ Multiplicación: 25 × 6 = 150
- ➗ División: 150 ÷ 3 = 50
- 🟠 Potencia: 2^10 = 1024
- ✓ Raíz cuadrada

### Funciones Avanzadas
- `%` Porcentaje
- `1/x` Recíproco
- `±` Cambiar signo
- `AC` Borrar todo
- `DEL` Borrar último dígito

## Presupuesto & Tabla de Gastos

Modo tabla para estimar gastos de compras:

1. **Agregar ítems**:
   - Campo: Concepto (ej: "Lechuga")
   - Campo: Cantidad (ej: 2)
   - Campo: Precio Unitario (ej: $50)
   - Botón: Agregar

2. **Cálculos**:
   - Total por ítem = Cantidad × Precio
   - Total general = Suma de todos

3. **Persistencia**:
   - Guardado en `localStorage` (useAppStore)
   - Recupera datos al volver

4. **Exportación**:
   - Botón "Guardar como gasto"
   - Pasa monto total a "Agregar Gasto"
   - Opcional: importar detalle

## Integración con Gastos

### Guardar como Gasto
```
Usuario calcula compra en tabla:
  Total: $250

Click: "Guardar como gasto"
  └─ Navega a AddExpensePage
  └─ Pre-llena: amount=250, currency=ARS
  └─ Usuario completa: descripción, categoría, fecha
  └─ Guarda como gasto final
```

### Histórico de Cálculos
Muestra últimas 5 calculaciones:
```
┌─────────────────────────────┐
│ Historial de Cálculos       │
├─────────────────────────────┤
│ Compra Mercado: $250 (Hoy)  │
│ Almuerzo: $125 (Ayer)       │
│ ...                         │
└─────────────────────────────┘
```

Pueden reutilizarse (click → cargar)

## Ventajas
- ✅ Acceso rápido sin salir de la app
- ✅ Tabla útil para presupuestos
- ✅ Integración con gastos
- ✅ Historial persistente
- ✅ Modo offline

## Limitaciones
- ❌ No es reemplazo de apps científicas complejas
- ❌ Precisión limitada a float JS
- ❌ Sin gráficos de datos

## Roadmap
- [ ] Conversión de monedas (con API Dólar)
- [ ] Fórmulas complejas (algebra)
- [ ] Visualización de gráficos
- [ ] Integración de ratios financieros
- [ ] Compartir resultados (screenshot)
