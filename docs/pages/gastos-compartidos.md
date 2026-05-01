# Módulo: Gastos Compartidos (Colaborativo en Tiempo Real)

**Archivos base**:
- `src/pages/SharedExpensesDashboard.tsx`
- `src/pages/SharedExpensesPage.tsx`
- `src/lib/pdfGenerator.ts`

La herramienta **Gastos Compartidos** permite dividir gastos grupales, manteniendo un registro de múltiples juntadas separadas, e invitar participantes con solo compartir un link. Todo sincronizado en vivo mediante Firebase, equivalente a Splitwise y sin pedir inicio de sesión (Authentication=off).

## Flujo por Evento

1. **Dashboard (`/gastos`)**:
   - Actúa como sala de control. Lista y almacena localmente en `localStorage` todos los eventos visitados.
   - Al crear un nuevo evento (ej. "Juntada Fin de Año"), se crea un documento en Firestore y se redirige al usuario a la URL del evento.

2. **La Sala Compartida (`/gastos/[id_random]`)**:
   - Cada URL representa un documento único en Firestore.
   - Todos los usuarios que abran el link ven los mismos datos vía `onSnapshot` (conexión persistente bidireccional).
   - Al entrar por primera vez, la app guarda el evento en `localStorage` para acceso futuro sin necesidad del link.

## Características Principales

1. **Sincronización en Tiempo Real**: Cada acción (agregar participante, eliminar gasto, registrar pago) ejecuta una escritura en Firestore con `merge: true`, impactando en todos los dispositivos conectados al instante.

2. **Cálculo de Deudas Cruzadas (Greedy)**: Toma los balances netos de todos los participantes y genera el número mínimo de transferencias para saldar todas las cuentas. Ver sección [Algoritmo de Liquidación](#algoritmo-de-liquidación-gettransfers).

3. **Combinaciones Alternativas de Pago**: Un botón **"Otra combinación"** permite generar combinaciones distintas pero igualmente válidas de transferencias, útil cuando alguien prefiere pagarle a una persona diferente a la sugerida. Usa un `shuffleSeed` incremental para reordenar deudores/acreedores de forma determinística. Muestra un indicador "Opción 1", "Opción 2"...

4. **Resumen por Persona**: Tarjeta que muestra por cada participante: cuánto pagó, cuánto le corresponde según los gastos en que participó, y su balance final (acreedor/deudor). También indica el total del evento y la parte orientativa por persona (`grandTotal / N`).

5. **Registro de Pagos**: Permite marcar transferencias sugeridas como pagadas ("Marcar como pagado"), registrando opcionalmente el medio de pago (Transferencia, Efectivo, MP). Los pagos quedan guardados en Firestore y ajustan los balances en tiempo real.

6. **Exportación y Compartido**:
   - **Descarga PDF**: Genera un documento con tablas de liquidación, resumen por persona, detalle de gastos y pagos realizados.
   - **Resumen para WhatsApp**: Copia al portapapeles un mensaje estructurado con emojis y formato Markdown (*bold*), incluyendo resumen por persona, liquidación, detalle de gastos y pagos.

## Algoritmo de Liquidación (`getTransfers`)

Función en `SharedExpensesPage.tsx` que convierte los balances netos en una lista mínima de transferencias.

### Pasos
1. **Calcular balances** (`getBalances`): suma lo que cada participante pagó y resta su cuota proporcional en cada gasto. Los pagos registrados también ajustan los balances.
2. **Separar deudores y acreedores**: positivo = acreedor, negativo = deudor.
3. **Ordenar deudores ascendente** (menor deuda primero) y acreedores descendente (mayor crédito primero).
4. **Shuffle opcional** (`shuffleSeed > 0`): reordena deudores y acreedores con un LCG determinístico para producir combinaciones alternativas válidas.
5. **Pass 1 — coincidencias exactas**: si un deudor y un acreedor tienen el mismo monto (diferencia < $0.01), se emparejan directamente.
6. **Pass 2 — greedy**: recorre deudores y acreedores en paralelo, asignando el mínimo entre la deuda restante y el crédito disponible hasta agotar ambas listas.

### Por qué deudores en orden ascendente
Ordenar los deudores de **menor a mayor** distribuye mejor el "costo" de pagar a múltiples acreedores. Los deudores pequeños actúan de "relleno" al inicio de los acreedores grandes, evitando que el último deudor quede fragmentado entre los restos de varios acreedores.

| Orden deudores | Máx. pagos por persona | Total transferencias |
|---|---|---|
| Descendente (antes) | 3 (una persona paga a 3 acreedores) | 11 |
| **Ascendente (actual)** | **2** | **11** |

El total de transferencias siempre es el mínimo teórico (`nPersonas con saldo ≠ 0 − 1`).

### Función `seededShuffle`
Implementación de Fisher-Yates con LCG (Linear Congruential Generator) para shuffle determinístico:
```
s = seed + 1
loop: s = (s * 1664525 + 1013904223) & 0xffffffff
j = abs(s) % (i + 1)
```
El mismo seed siempre produce el mismo orden, garantizando reproducibilidad.

## Diseño UI

Aplica el Design System de la app (`brand-primary`, `brand-success`, `brand-alert`, `slate-*`):

- **Formulario de gasto**: Etiquetas en `font-bold`, inputs `rounded-xl`, campo "Pagado por" resaltado con borde `brand-primary`.
- **Burbujas de participantes**: `px-4 py-2`, micro-interacción `scale-105`, punto indicador de estado.
- **Lista de gastos**: Payer en píldora `brand-primary`, montos en `font-black`.
- **Tarjetas de transferencia**: Fondo `green-50/50`, borde `green-100`, botón "Marcar como pagado" en `brand-success`.
- **Botón "Otra combinación"**: Texto `brand-primary`, hover `brand-primary/10`, ícono de refresh SVG inline. Indicador "Opción X" al lado.
- **Banner Principal**: `public/banner-gastos.png`, `aspect-[21/9]` mobile / `aspect-[16/5]` desktop, `object-cover` con `sm:object-[center_30%]`.
- **Botón "Crear y Compartir"**: `bg-brand-success` con `font-semibold`.
- **Lista de Juntadas**: Cards blancas con hover `bg-brand-primary/5`, nombre en `text-brand-primary`, ícono de flecha en `bg-brand-primary/10`.
- **Papelera de historial**: Color `brand-alert` al hacer hover.

## Seguridad y Privacidad

Esta ruta coexiste con la app `saldame-app`, protegida por un `PIN`. Las rutas `/gastos` son la **única excepción pública/compartible**, accesibles en modo *Sandboxed*: quienes naveguen ese enlace no pueden acceder a la interfaz general bloqueada por PIN.

*(Atención Técnica: Se requieren reglas abiertas `read/write: true` en la colección `sharedGroups` en Firestore)*

