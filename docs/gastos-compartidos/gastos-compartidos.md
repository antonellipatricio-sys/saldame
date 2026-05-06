# Módulo: Gastos Compartidos

Sistema colaborativo para dividir gastos en grupo, sincronizado en tiempo real vía Firebase.

## Referencia al Código
- **Archivos principales**:
  - [`src/pages/SharedExpensesDashboard.tsx`](../../src/pages/SharedExpensesDashboard.tsx)
  - [`src/pages/SharedExpensesPage.tsx`](../../src/pages/SharedExpensesPage.tsx)
- **Exportación**: [`src/lib/pdfGenerator.ts`](../../src/lib/pdfGenerator.ts)

## Descripción

La herramienta **Gastos Compartidos** permite dividir gastos grupales —como cenas conjuntas, viajes, o juntadas—, manteniendo un registro de múltiples eventos separados. Invita participantes compartiendo solo un link, sin requerir login. Todo sincronizado en vivo mediante Firebase.

**Equivalente a**: Splitwise, pero sin autenticación.

---

## Flujo General

### 1. Dashboard (`/gastos`)
```
Pantalla de bienvenida → Lista de eventos visitados (localStorage)
│
├─ Botón "Crear Nuevo Evento"
│     └─ Form: Nombre + Lista de participantes
│        └─ Click "Crear"
│           └─ Firestore genera doc
│              └─ Redirige a /gastos/[id_random]
│
└─ Historial de eventos
   └─ Click en evento
      └─ Redirige a /gastos/[id]
```

### 2. Sala del Evento (`/gastos/abc123xyz`)
```
URL del evento = Documento único en Firestore

Personas conectadas ven en tiempo real:
  ├─ Participantes de la juntada
  ├─ Lista de gastos registrados
  ├─ Balance de cada persona
  ├─ Transferencias sugeridas
  └─ Pagos realizados ✅
```

---

## Componentes Principales

### Dashboard de Eventos

**Path**: `/gastos`

Muestra:
- 📋 Tabla de eventos visitados
- Información: Nombre, Fecha, Total, Balance personal
- Acciones: Abrir, Eliminar del historial

```
┌──────────────────────────────────────────────────────┐
│ Mis Juntadas                                         │
├──────────────────────────────────────────────────────┤
│ Evento             │ Fecha  │ Total    │ Mi Balance  │
├──────────────────────────────────────────────────────┤
│ Fin de Año 2025    │ 31/12  │ $12.500  │ -$1.200     │
│ Cena de Amigos     │ 15/05  │ $8.000   │ +$500       │
│ Trip a Mar del Plata│ 10/05  │ $25.000  │ -$3.500     │
└──────────────────────────────────────────────────────┘
```

Botón: ➕ **Crear Nueva Juntada**

### Sala de Evento

**Path**: `/gastos/[id]`

Muestra:
- 👥 **Participantes**: Bubbles con nombre + balance
- 💸 **Registro de Gastos**: Tabla de quién pagó qué
- 🔄 **Transferencias Sugeridas**: Quién paga a quién
- ✅ **Pagos Realizados**: Registro de transferencias completadas

#### Participantes
```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Javier  │  │  Ana    │  │ Pedro   │
│ -$1.667 │  │ +$500   │  │ -$800   │
└─────────┘  └─────────┘  └─────────┘
```

Color:
- 🔴 Negativo (debe dinero)
- 🟢 Positivo (le deben dinero)

---

## Registro de Gastos

### Formulario
```
¿Quién pagó?     [Dropdown: Javier ▼]
¿Cuánto?         [$5.000 ___]
¿Concepto?       [Comida _____]
¿Participaron?   [☑ Javier] [☐ Ana] [☑ Pedro]
                                  [Guardar]
```

Resultado:
```
Javier pagó $5.000 en comida
Participantes: Javier, Pedro (2 personas)
Cuota cada uno: $2.500

Javier: pagó $5.000, debería pagar $2.500 → debe recibir $2.500 ✅
Pedro:  debería pagar $2.500 → debe $2.500
```

---

## Algoritmo de Liquidación (getTransfers)

### Pasos

1. **Calcular balances netos**
   ```
   Para cada participante:
     balance = total_pagado - total_debe_pagar
   ```

2. **Separar deudores y acreedores**
   ```
   Acreedores (balance > 0): [Javier: +$2.500]
   Deudores (balance < 0):   [Ana: -$1.667, Pedro: -$1.667]
   ```

3. **Ordenar**
   ```
   Deudores ascendente (menor deuda primero)
   Acreedores descendente (mayor crédito primero)
   ```

4. **Pass 1: Coincidencias exactas**
   ```
   Si debedor = acreedor (diferencia < $0.01), emparejar directo
   ```

5. **Pass 2: Greedy**
   ```
   Para cada deudor:
     Mientras tenga saldo:
       amount = min(deuda_restante, crédito_disponible_acreedor)
       Crear transferencia: deudor → acreedor (amount)
       Actualizar balances
   ```

### Por Qué Ascendente Deudores

Deudores pequeños actúan de "relleno":
```
Opción ANTES (descendente):
  Deudor1 ($10k) paga a Acreedor1, Acreedor2, Acreedor3 (3 pagos)

Opción ACTUAL (ascendente):
  Deudor1 ($2k) → Acreedor1  (1 pago)
  Deudor2 ($5k) → Acreedor1, Acreedor2  (2 pagos)
  Deudor3 ($5k) → Acreedor2, Acreedor3  (2 pagos)
  Total: 5 pagos (vs 7 antes)
```

### Ejemplo Real

```
Balances iniciales:
  Javier: +$5.000 (pagó mucho, le deben $)
  Ana: -$1.500
  Pedro: -$3.500

Deudores ordenados: [Ana: $1.500, Pedro: $3.500]
Acreedores ordenados: [Javier: $5.000]

Liquidación:
  1. Ana → Javier: $1.500
  2. Pedro → Javier: $3.500

Resultado: 2 transferencias (mínimo teórico)
```

### Función `seededShuffle`

Para alternativas de pagos, usa LCG determinístico:
```typescript
const seededShuffle = (array, seed) => {
  let s = seed + 1;
  for (let i = array.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
```

Mismo seed → Mismo orden (reproducible)

---

## Combinaciones Alternativas

Botón: **"Otra combinación"**

Incrementa `shuffleSeed` y re-genera liquidación:
```
Opción 1: Ana → Javier, Pedro → Javier
Opción 2: Ana → Pedro, Pedro → Javier (reordenado)
Opción 3: ... (siguiente)
```

Todas válidas y correctas, pero diferente orden de pagos.

---

## Registro y Confirmación de Pagos

Cuando participantes pagan:
```
Transferencia sugerida: Ana → Javier ($1.500)

[✓ Marcar como Pagado]
  └─ Abre modal con opciones:
    - Forma: [Transferencia] [Efectivo] [MP]
    - Nota: _______________
    - [Confirmar pago]
```

Firestore guarda: `{ from: "Ana", to: "Javier", amount: $1.500, status: "paid", method: "transfer" }`

UI actualiza balances en tiempo real.

---

## Exportación

### PDF
```
Juntada: Fin de Año 2025
Fecha: 31/12/2025
Participantes: Javier, Ana, Pedro

GASTOS
─────────────────────────────────────
Javier pagó $5.000 en COMIDA
Ana pagó $3.000 en BEBIDAS
Pedro pagó $4.500 en POSTRES
Total: $12.500

LIQUIDACIÓN
─────────────────────────────────────
Ana debe a Javier: $500
Pedro debe a Javier: $1.000

PAGOS REALIZADOS
─────────────────────────────────────
✅ Ana → Javier: $500 (Transferencia)
✅ Pedro → Javier: $1.000 (Efectivo)
```

### WhatsApp
```
📌 *Fin de Año 2025*
Total: $12.500
Mis gastos: $5.000
Mi balance: +$1.500 (ME DEBEN 💰)

🧮 *Liquidación:*
• Ana → yo: $500
• Pedro → yo: $1.000

✅ *Todos pagados!*
```

Copiar portapapeles → Pegar en WhatsApp

---

## Seguridad

**IMPORTANTE**: Esta es la única ruta pública de la app sin PIN requiero.

**Acceso**:
- URLs `/gastos/*` son públicas
- Cualquiera con el link puede unirse
- Solo lectura si no participante (opcional)
- Firestore rules: `read, write: true`

**Recomendación**: Usar URLs largas/aleatorias (`[id]`) para obscurantismo.

---

## Ventajas
- ✅ No requiere login
- ✅ Tiempo real (live updates)
- ✅ Algoritmo óptimo (Min transferencias)
- ✅ Múltiples opciones de pago
- ✅ Exportable (PDF, WhatsApp)
- ✅ Historial persistente

## Limitaciones
- ❌ Sin autenticación (confidencialidad limitada)
- ❌ Sin pagos integrados (solo cálculos)
- ❌ Sin notificaciones (pushes)
- ❌ Sin resolución de disputas

## Roadmap
- [ ] Integración Mercado Pago (pagar directo)
- [ ] Soporte múltiples monedas
- [ ] Notificaciones push
- [ ] Validación de pagos (foto de comprobante)
- [ ] Eventos recurrentes
- [ ] Importar desde CSV/Excel
- [ ] Analytics (quién pide más dinero, tendencias)
