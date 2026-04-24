# Módulo: Gastos Compartidos

**Ruta del archivo base**: `src/pages/SharedExpensesPage.tsx`

La herramienta **Gastos Compartidos** permite dividir gastos grupales, manteniendo un registro de participantes y optimizando el cálculo de deudas cruzadas. Es equivalente a la lógica de calculadoras de división de gastos convencionales (como Splitwise).

## Características Principales

1. **Gestión de Participantes**: 
   - Se pueden agregar y eliminar participantes.
   - Estos se persisten automáticamente en el `localStorage` (`saldame_shared_participants`).

2. **Registro de Gastos Individuales**:
   - Para cada gasto, se especifica quién lo pagó y el monto.
   - Por defecto, el sistema asume que el gasto **se divide entre todos**. El usuario puede "destildar" personas específicas en un gasto si, por ejemplo, no consumieron.

3. **Simplificación de Deudas**:
   - En vez de listar "Santi le debe $200 a Gasti por el asado" y "Santi le debe $100 a Leo por la bebida", el algoritmo toma el balance total de gastos y pagos de todos.
   - Emplea un algoritmo "Greedy" (Avaro) de minimización de transacciones:
     - Ordena a "quienes deben" (debts) por mayor a menor.
     - Ordena a "quienes reciben" (creditors) de mayor a menor.
     - Cruza y salda ambos balances iterativamente, generando la cantidad más reducida de pagos ("Quién le paga a quién").

4. **Reinicio por Gasto Nuevo**:
   - Al guardar un gasto, el formulario vuelve a marcar a *todos* los participantes para dividir el siguiente, impiniendo que errores de exclusión afecten gastos futuros accidentalmente.

## Persistencia
- **Participantes**: Almacenados en `localStorage` con la key `saldame_shared_participants`.
- **Registro Temporal de Gastos**: Almacenados en `localStorage` con la key `saldame_shared_expenses`.

> Nota: Este módulo funciona íntegramente del lado cliente (frontend) y no guarda los registros en Firebase, dado que busca ser una herramienta pasajera y de utilidad rápida.

## Seguridad y Compartición

1. **Ruta Compartible (Pública)**: El módulo de gastos compartidos está alojado en una ruta específica (actualmente configurada en `App.tsx` bajo la variable `PUBLIC_ROUTE` como `/gastos`). Cualquier persona con el link puede ingresar y usar esta herramienta y **solo** esta herramienta.
2. **App Protegida (Privada)**: Si alguien intenta ir al inicio de la aplicación o a cualquier otra vista general, el sistema intercepta la visita y solicita un PIN de acceso (configurado en `App.tsx` en `APP_PIN`), bloqueando el menú completo y resguardando los gastos personales del usuario principal.
