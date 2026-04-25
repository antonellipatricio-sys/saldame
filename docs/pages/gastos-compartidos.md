# Módulo: Gastos Compartidos (Colaborativo en Tiempo Real)

**Rutas del archivo base**: 
- `src/pages/SharedExpensesDashboard.tsx`
- `src/pages/SharedExpensesPage.tsx`

La herramienta **Gastos Compartidos** permite dividir gastos grupales, manteniendo un registro de múltiples juntadas separadas, e invitar participantes con solo compartir un link. Todo sincronizado en vivo mediante Firebase, equivalente a Splitwise y sin pedir inicio de sesión (Authentication=off).

## Flujo por Evento

1. **Dashboard (`/gastos`)**:
   - Actúa como tu sala de control. Lista y almacena localmente en memoria (`localStorage`) todos los eventos visitados.
   - Si creas un nuevo evento (ej "Juntada Fin de Año"), se crea un registro en Firebase Firestore y se redirige al usuario a la URL del evento.
   
2. **La Sala Compartida (`/gastos/[id_random]`)**:
   - Cada URL representa un documento único en Firestore.
   - Todos los usuarios que abran el link ven los mismos datos vía `onSnapshot` (conexión persistente bidireccional).
   - Al entrar por primera vez, la app guarda el evento en `localStorage` para acceso futuro sin necesidad del link.

## Características Principales

1. **Sincronización Transparente**: Cada acción (agregar usuario, eliminar gasto, seleccionar pagador) ejecuta una escritura en Firestore con `merge: true`, impactando en tiempo real en todos los dispositivos conectados.

2. **Cálculo de Deudas Cruzadas (Greedy)**: Toma el balance positivo/negativo de todos los participantes y genera el mínimo número de transferencias necesarias para saldar todas las cuentas.
3. **Registro de Pagos**: Permite marcar deudas sugeridas como "Pagadas", registrando opcionalmente el medio de pago (Transferencia, Efectivo, MP). Estos pagos impactan en los saldos en tiempo real.
4. **Exportación y Compartido**:
   - **Descarga PDF**: Genera un documento con tablas organizadas de liquidación, gastos y pagos históricos.
   - **Resumen para WhatsApp**: Copia al portapapeles un mensaje estructurado con emojis y formato Markdown de WhatsApp (*bold*).

## Diseño UI — Tema Pato Contador

Rediseño completo aplicando el Design System de la app:

- **Diseño de Alta Legibilidad:**
  - **Formulario Mejorado:** Etiquetas en `font-bold` con mayor contraste (`slate-700`) y inputs con bordes `rounded-xl`.
  - **Campo "Pagado por":** Resaltado visual con borde de 2px `brand-primary` y fondo suave, facilitando su identificación como campo clave.
  - **Burbujas de Participantes:** Tamaño aumentado (`px-4 py-2`), con micro-interacción de escala (`scale-105`) y punto indicador de estado.
  - **Lista de Gastos:** Payer resaltado en píldora `brand-primary` y montos en `font-black` para escaneo rápido.
- **Botón "Registrar Gasto":** Estilo "Premium" con tamaño `text-lg`, `font-bold` y sombra.
- **Banner Principal:** Cabecera visual responsiva (`public/banner-gastos.png`) con el Pato Contador.
  - **Adaptabilidad móvil:** Usa `aspect-[21/9]` en celulares y `aspect-[16/5]` en desktop para evitar recortes indeseados.
  - **Encuadre:** Utiliza `object-cover` con posicionamiento optimizado (`sm:object-[center_30%]`) para asegurar que el contenido visual clave siempre sea visible.
- **Botón "Crear y Compartir":** `bg-brand-success` (verde `#2D9354`) con `font-semibold`.
- **Lista de Juntadas:** Cards blancas con hover `bg-brand-primary/5`, nombre de juntada en `text-brand-primary`, ícono de flecha en `bg-brand-primary/10`.
- **Papelera de historial:** Color `brand-alert` (`#E5709B`) al hacer hover.

## Seguridad y Privacidad en Gastos
Esta ruta coexiste con la app `saldame-app`, protegida por un `PIN`. Las rutas `/gastos` son la **única excepción pública/compartible**, accesibles en modo *Sandboxed*: quienes naveguen ese enlace no podrán acceder a la interfaz general bloqueada por PIN.

*(Atención Técnica: Se requieren configurar reglas abiertas `read/write: true` en la colección `sharedGroups` en Firestore)*

