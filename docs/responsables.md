# Módulo: Responsables

Gestión de las personas que pueden tener gastos asignados en la aplicación.

## Referencia al Código
- **Página:** [`src/pages/ResponsablesPage.tsx`](../../../src/pages/ResponsablesPage.tsx)
- **Store:** [`src/store/useExpenseStore.ts`](../../../src/store/useExpenseStore.ts) — acciones `fetchResponsables`, `addResponsable`, `updateResponsable`, `deleteResponsable`
- **Tipo:** [`src/types/index.ts`](../../../src/types/index.ts) — interfaz `Responsable`
- **Selector:** [`src/components/ResponsableSelect.tsx`](../../../src/components/ResponsableSelect.tsx)

## Descripción

Permite crear, editar y eliminar personas responsables de gastos. Cada responsable tiene:
- **Nombre** — identificador en el campo `responsable` del gasto
- **Emoji** — avatar visual

## Modelo de Datos

```typescript
interface Responsable {
  id: string;     // Ej: 'resp-patricio'
  name: string;   // Ej: 'Patricio'
  emoji: string;  // Ej: '🧔'
}
```

Persistencia: colección `responsables` en Firestore.

## Valores por Defecto

Si Firestore no tiene responsables guardados, el store inicia con:

| ID | Nombre | Emoji |
|---|---|---|
| `resp-patricio` | Patricio | 🧔 |
| `resp-maru` | Maru | 👩 |
| `resp-bren` | Bren | 👧 |
| `resp-mica` | Mica | 💁 |

## Funcionalidades de la Página

- ✅ Crear responsable (nombre + emoji)
- ✅ Editar nombre y emoji
- ✅ Eliminar (con aviso si tiene gastos asociados)
- ✅ Contador de gastos por responsable

## Auto-asignación desde Cardholder

Al importar gastos (Excel Santander / PDF Mercado Pago), el nombre del titular de la tarjeta se mapea automáticamente al responsable correspondiente:

| Cardholder contiene | Responsable asignado |
|---|---|
| `patricio` | `Patricio` |
| `mariana` / `maru` | `Maru` |
| `brenda` / `bren` | `Bren` |
| `micaela` / `mica` | `Mica` |

Ver detalles en [`santander-excel.md`](./santander-excel.md) y [`subir-pdf.md`](./subir-pdf.md).

## ¿De quién es? (selector de un toque)

Cada gasto responde una sola pregunta: **¿de quién es?** Componente
[`src/components/QuienPaga.tsx`](../../../src/components/QuienPaga.tsx), lógica en
[`src/lib/quienPaga.ts`](../../../src/lib/quienPaga.ts).

```
[Yo] [Maru] [Bren] [½] [⋯]
```

- **Yo**: `responsable = 'Patricio'`, sin `sharedWith`. Un gasto sin responsable también es del dueño.
- **Persona**: `responsable = persona`, sin `sharedWith` (ej. una cuota en tu tarjeta que paga Mariana).
- **½**: `responsable = 'Patricio'`, `sharedWith = [{ persona, amount: total / 2 }]`.
- **⋯**: reparto libre (responsable + montos por persona).

Aparece en Estado de Cuenta (todas las tarjetas), Mis Gastos (fila y modal de edición),
Agregar Gasto y la revisión de importación (Excel Santander y PDF).

`reparto(gasto)` devuelve cuánto le toca a cada persona y es lo que usan todas las
pantallas. El titular de la tarjeta (`cardholder`) es solo informativo. Los nombres se
normalizan por alias: "MARIANA ANTONELLI" del resumen se cuenta como **Maru**.

## Quién te debe

[`DebtDashboard`](../../../src/components/DebtDashboard.tsx), arriba de Estado de Cuenta:
un número por persona = sus partes en los gastos del período − lo que ya pagó.

- **Ver**: detalle de gastos y pagos.
- **WhatsApp**: abre WhatsApp con el detalle y el total.
- **Cobrado**: registra un pago en la colección `cobros` (`persona`, `periodo` = mes del
  filtro o `'todos'`, `ars`, `usd`, `fecha`). Se puede deshacer desde **Ver**.
  Con filtro de mes solo se descuentan los cobros de ese mes; sin filtro, todos.

## Reglas "Siempre"

Al elegir una persona o ½ en un gasto, el selector pregunta
**«¿Siempre que venga `merpago*fravega` → Maru?»** (el texto se puede editar).

- **Sí** guarda la regla en la colección `reglasPago` (`patron`, `tipo` = `todo` | `mitad`,
  `persona`) y la aplica a los gastos ya cargados que coinciden y siguen en "Yo"
  (no pisa lo asignado a mano). En la revisión de importación, la aplica a las otras filas.
- **Al importar** (Excel Santander o PDF), cada fila que coincide con una regla llega ya asignada.
- **Volver a "Yo"** en un gasto con regla ofrece borrarla.
- Las reglas se ven y se borran al final de la página **Responsables**.

Coincidencia (`claveDescripcion` / `reglaPara` en `lib/quienPaga.ts`): la descripción se pasa a
minúsculas sin marcas de cuota (`C.04/06`, `3 de 12`, `cuota 02/03`); la regla aplica si su patrón
está contenido en esa clave. Si varias aplican, gana el patrón más largo.
