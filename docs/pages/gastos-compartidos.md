# Módulo: Gastos Compartidos (Colaborativo en Tiempo Real)

**Rutas del archivo base**: 
- `src/pages/SharedExpensesDashboard.tsx`
- `src/pages/SharedExpensesPage.tsx`

La herramienta **Gastos Compartidos** permite dividir gastos grupales, manteniendo un registro de múltiples juntadas separadas, e invitar participantes con solo compartir un link. Todo sincronizado en vivo mediante Firebase, equivalente a Splitwise y sin pedir inicio de sesión (Authentication=off).

## Flujo por Evento

1. **Dashboard (`/gastos`)**:
   - Actúa como tu sala de control. Un módulo que lista y almacena localmente en memoria (`localStorage`) todos los eventos que visitaste antes.
   - Si creas un nuevo evento (ej "Juntada Fin de de Año"), se hace una petición para crear un registro en Firebase.
   
2. **La Sala Compartida (`/gastos/[id_random]`)**:
   - Cada URL representa un documento único en la base de datos remota (`Firestore`).
   - Todos los usuarios que abran este link están viendo los mismos datos a través de una conexión persistente bidireccional (`onSnapshot`).
   - Al entrar por primera vez gracias a un enlace que te pasaron, la app guarda este registro en el teléfono para que, si ingresas mañana, puedas regresar a la sala sin depender de recuperar el link perdido.

## Características Principales

1. **Sincronización Transparente**: 
   - Agregar usuario, eliminar gasto, seleccionar pagador... cada acción ejecuta una macro-escritura en Firebase Fusion (`merge: true`), la cual impacta microsegundos después en las pantallas de todos los participantes conectados.

2. **Cálculo de Deudas Cruzadas (Avaro)**:
   - Toma el balance final positivo/negativo de absolutamente todos y genera "Transferencias ideales", un mapa dictaminando exclusivamente "Quién le paga qué, a quién", con la menor cantidad de pasos posibles.

## Seguridad y Privacidad en Gastos
Esta ruta coexiste junto en la aplicación `saldame-app`, la cual se protege unánimemente detrás de un `PIN`. Las rutas de "Gastos Compatidos" en `/gastos` son la **única excepción pública/compartible** y se encuentran expuestas al mundo permitiendo el acceso en modo *Sandboxed*, donde quienes naveguen ese enlace jamás podrán visitar ni leer la interfaz general bloqueada con el PIN, asegurando estricto aislamiento de finanzas personales vs eventos mutuos.

*(Atención Técnica: Se requieren configurar reglas abiertas `read/write: true` en la colección `sharedGroups` en Firestore)*
