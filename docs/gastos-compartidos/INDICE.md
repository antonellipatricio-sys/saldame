# Sector: Gastos Compartidos

> **Sistema colaborativo para dividir gastos en grupo**

---

## Módulo Único

### 👥 Gastos Compartidos
- [Referencia completa](./gastos-compartidos.md)
- **Archivos**: 
  - [`src/pages/SharedExpensesDashboard.tsx`](../../src/pages/SharedExpensesDashboard.tsx)
  - [`src/pages/SharedExpensesPage.tsx`](../../src/pages/SharedExpensesPage.tsx)
  - [`src/lib/pdfGenerator.ts`](../../src/lib/pdfGenerator.ts)
- **Propósito**: División de gastos colaborativa en tiempo real
- **Almacenamiento**: Firestore (colección: `sharedGroups`)

---

## Concepto

Sistema **sin login** que permite:
```
Usuario A crea evento "Juntada Fin de Año"
        │
        ├─→ Genera URL: https://saldame.web.app/gastos/abc123xyz
        │
        ├─→ Comparte con amigos
        │
        └─→ Todos abren mismo evento
            │
            ├── Registran qué pagaron
            ├── Indican en qué participaron
            ├── Sistema calcula quién debe qué
            └── Ejecutan transferencias
```

---

## Características Principales

### 1. Dashboard de Eventos
Pantalla central (`/gastos`) que:
- Lista todos los eventos visitados
- Almacena localmente en `localStorage`
- Botón para crear nuevo evento
- Historial accesible sin links

### 2. Sala Colaborativa
Cada URL (`/gastos/[id]`) es:
- Un documento único en Firestore
- Visible en tiempo real para todos los conectados
- Sincronización bidireccional (escribir y leer simultáneamente)

### 3. Registro de Gastos
En la sala, permite registrar:
```
"Javier pagó $5.000 en comida y Javier, Ana, Pedro participaron"
```

Sistema automáticamente calcula:
```
Javier: pagó $5.000, debe recibir $(5.000/3) = $1.667 de cada uno
Ana: debe $1.667
Pedro: debe $1.667
```

### 4. Cálculo de Deudas Cruzadas
Usa algoritmo greedy para minimizar transferencias:

```
Antes:
  Javier: +$3.333 (acreedor)
  Ana: -$1.667
  Pedro: -$1.667

Después (transferencias mínimas):
  Ana → Javier: $1.667
  Pedro → Javier: $1.667

Total: 2 transferencias (vs 3 si fuera directo)
```

### 5. Combinaciones Alternativas
Botón "Otra combinación" genera variantes válidas:
```
Opción 1: Ana → Javier, Pedro → Javier
Opción 2: Ana → Javier, Pedro → Javier (alternancia reordenada)
Opción 3: ...
```

Útil si alguien prefiere pagar a otra persona.

### 6. Exportación
- 📄 **PDF**: Tablas de liquidación, resumen, detalle de gastos
- 📱 **WhatsApp**: Texto formateado con emojis, copiable al portapapeles

---

## Seguridad

**IMPORTANTE**: Esta ruta es la **única excepción pública** en la app (protegida por PIN).

- `/gastos` y `/gastos/*` son públicas (acceso sin autenticación)
- Resto de la app (`/dashboard`, `/add-expense`, etc.) requieren PIN

Reglas Firestore (deben ser así):
```json
{
  "rules": {
    "sharedGroups": {
      "{document=**}": {
        "allow read, write": true  // 🟢 Abirto
      }
    }
  }
}
```

---

## Roadmap
- [ ] Autenticación opcional (para eventos privados)
- [ ] Integración de pagos (Mercado Pago directo)
- [ ] Tracking de pagos realizados
- [ ] Notificaciones en tiempo real
- [ ] Soporte para múltiples monedas
- [ ] Descarga de CSV con historial

---

**Última actualización**: Mayo 2026  
**Tecnología**: Firestore + React + pdflib  
**Acceso**: Público (sin PIN requerido)
