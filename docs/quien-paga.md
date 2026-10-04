# Módulo: ¿De quién es? — gastos de tarjeta por persona

Responde dos preguntas: **¿de quién es cada gasto?** y **¿cuánto me debe cada uno?**
Caso típico: una cuota viene en la tarjeta de Patricio pero la paga Mariana.

## Referencia al Código
- **Lógica:** [`src/lib/quienPaga.ts`](../src/lib/quienPaga.ts) — `reparto`, `modoDe`, `asignar`, `canonicalName`, reglas
- **Selector:** [`src/components/QuienPaga.tsx`](../src/components/QuienPaga.tsx)
- **Quién te debe:** [`src/components/DebtDashboard.tsx`](../src/components/DebtDashboard.tsx) (arriba de Estado de Cuenta, `AccountPage`)
- **Cobros:** [`src/store/useCobrosStore.ts`](../src/store/useCobrosStore.ts) — colección `cobros`
- **Reglas:** [`src/store/useReglasStore.ts`](../src/store/useReglasStore.ts) — colección `reglasPago`; [`src/hooks/useAplicarRegla.ts`](../src/hooks/useAplicarRegla.ts)
- **Resumen:** [`src/lib/resumen.ts`](../src/lib/resumen.ts)
- **PDF Santander:** [`src/lib/santanderPdfParser.ts`](../src/lib/santanderPdfParser.ts)

## Modelo

Sin campos nuevos para el reparto; se reusan los del gasto:

| Campo | Significado |
|---|---|
| `responsable` | Dueño del gasto. Vacío = el dueño de la app ("Yo", responsable `resp-patricio`). |
| `sharedWith` | Partes que pagan otras personas; el dueño se queda con el resto. |
| `cardholder` / `cardLast4` | Solo informativo: en qué tarjeta vino. **No decide quién paga.** |
| `resumen` | `'yyyy-MM'` del vencimiento del resumen en que se cobra (ver abajo). |

`reparto(gasto)` devuelve cuánto le toca a cada persona y es lo único que usan las pantallas.
Todo lo que no es del dueño es plata que le deben.

Los nombres se normalizan por alias del responsable (`canonicalName`): "MARIANA L ANTONELLI"
del resumen cuenta como **Maru**, "Patricio Antonelli" como **Patricio**. Los responsables
creados automáticamente con el nombre completo (sin alias) se resuelven hacia el que tiene alias.

## Selector "¿De quién es?"

```
[Yo] [Maru] [Bren] [Mica] [½] [⋯]
```

| Opción | Se guarda |
|---|---|
| **Yo** | `responsable = 'Patricio'`, sin `sharedWith` |
| **Persona** | `responsable = persona`, sin `sharedWith` |
| **½** (elegir persona) | `responsable = 'Patricio'`, `sharedWith = [{ persona, total / 2 }]` |
| **⋯** | reparto libre: quién se queda con el resto + montos por persona |

Aparece en: Estado de Cuenta (detalle de cualquier tarjeta), Mis Gastos (fila y modal de
edición), Agregar Gasto y la revisión de importación (Excel y PDF).

Para borrar campos al editar, `updateExpense` trata los valores `undefined` como
`deleteField()` en Firestore.

## Reglas "Siempre"

Al elegir una persona o ½, si el selector conoce la descripción pregunta
**«¿Siempre que venga `merpago*fravega` → Maru?»** (el texto se puede editar).

- **Sí**: guarda la regla en `reglasPago` (`patron`, `tipo` = `todo` | `mitad`, `persona`) y la aplica
  a los gastos ya cargados que coinciden y siguen en "Yo" (no pisa lo asignado a mano).
  En la revisión de importación, la aplica a las otras filas.
- **Al importar**: cada fila que coincide llega asignada ("N asignadas por reglas").
- **Volver a "Yo"** en un gasto con regla ofrece borrarla.
- Se listan y borran al final de **Responsables**.

Coincidencia (`claveDescripcion` / `reglaPara`): minúsculas y sin marcas de cuota
(`C.04/06`, `3 de 12`, `cuota 02/03`); aplica si el patrón está contenido. Gana el patrón más largo.

## Quién te debe

Una línea por persona (sin el dueño):

```
Maru te debe $132.500 · 8 gastos      [Ver] [WhatsApp] [✓ Cobrado]
```

- **Pendiente** = suma de sus partes en los gastos del período − cobros.
- **Ver**: detalle de gastos (con "su parte de $X" si es compartido) y pagos registrados (con deshacer).
- **WhatsApp**: abre `wa.me` con el detalle, total, ya pagado y falta.
- **Cobrado**: guarda un doc en `cobros` (`persona`, `periodo`, `ars`, `usd`, `fecha`) por el pendiente.
- Con filtro de resumen, solo cuentan gastos y cobros de ese mes; en "Todos los meses", todos.

## Resumen (mes en que se paga)

Las cuotas traen la **fecha de la compra original** (ej. "23/01/26 Merpago*erexit 8 de 9" en el
resumen que vence en septiembre). Por eso cada gasto importado guarda `resumen` = mes de
vencimiento, y Estado de Cuenta y Quién te debe filtran por ese mes (`mesResumen`).

- **PDF Santander**: se toma del encabezado (vencimiento actual).
- **Excel / otros PDF**: por defecto el mes siguiente al último consumo.
- Editable en la revisión de importación ("Resumen de [mes]") y en Mis Gastos → Editar.
- Gastos sin `resumen` (cargados antes) usan el mes de la fecha.
- Inicio y Estadísticas siguen agrupando por fecha de compra.

## Importar PDF de Santander

Detectado automáticamente en Agregar Gasto (`isSantanderPdf`). Lee:

- Cierre y vencimiento (la línea con las 6 fechas del período).
- "Movimientos de <Nombre>" + "Visa crédito terminada en XXXX" → filas hasta "Subtotal de".
  Formato: `[DD/MM/YY] Descripción [N de M] Comprobante $ 1.234,56 | U$S 1,99`.
  Sin fecha = misma fecha que la anterior.
- "Impuestos, intereses y percepciones" → en la tarjeta del titular (la primera).
- Ignora "Pago anterior y devoluciones".

⚠️ En estos PDF el orden crudo del texto **no** coincide con las filas (los montos se dibujan en
otra secuencia). Funciona porque `extractTextFromPDF` agrupa por coordenada Y de pdf.js.
Verificado contra los subtotales del resumen del 04/09/2026.

## Seguridad

`firestore.rules` exige `request.auth.token.email == 'antonellipatricio@gmail.com'` para todo
salvo `sharedGroups`. `cobros` y `reglasPago` quedan cubiertas por esa regla.
