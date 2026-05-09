# Herramientas Complementarias

> **Utilidades adicionales independientes del tracker de gastos**

---

## Módulos de Herramientas

### 1️⃣ Calculadora
- [Referencia completa](./calculadora.md)
- **Archivo**: [`src/pages/CalculatorPage.tsx`](../../src/pages/CalculatorPage.tsx)
- **Propósito**: Herramienta de cálculo rápido sin perder contexto
- **Usuario**: Cualquiera, anónimo

### 2️⃣ Variación de Dólar
- Archivo: [Por implementar]
- **Propósito**: Track dólar blue/oficial para re-costeo
- **Datos**: API externa (dólar.com.ar, etc.)

### 3️⃣ Configuración
- [Referencia](./configuracion.md)
- **Archivo**: [`src/pages/SettingsPage.tsx`](../../src/pages/SettingsPage.tsx)
- **Propósito**: Ajustes generales y preferencias de usuario
- **Almacenamiento**: localStorage

---

## Arquitectura

```
HERRAMIENTAS
├── Calculadora (Standalone)
├── Dólar (API externa)
└── Settings (Preferences)
```

Estas son **independientes** del tracker de gastos core, pero accesibles desde la navegación principal.

---

## Acceso

Todas desde menú lateral/bottom nav:
- Desktop: Sidebar expandible
- Mobile: Bottom navigation tabs

```
┌─────────────────────────────────────┐
│ 🏠 Inicio                           │
│ ➕ Agregar Gasto                    │
│ 📝 Mis Gastos                       │
│ 📊 Estadísticas                     │
│ ⚙️ Herramientas ◀─── Submenu        │
│    ├─ 🧮 Calculadora               │
│    ├─ 💱 Variación Dólar           │
│    └─ ⚙️ Configuración              │
└─────────────────────────────────────┘
```

---

## Características Comunes

### Diseño
- Responden al mismo design system (`brand-primary`, etc.)
- Diseño mobile-first
- Accesibles sin navegación compleja

### Rendimiento
- No afectan estado global de gastos
- Carga independiente
- No bloquean UI

### Persistencia
- Calculadora: `localStorage` (calculations)
- Dólar: API cache (5-10 min)
- Settings: `localStorage`

---

## Roadmap General
- [ ] Presupuesto anual
- [ ] Alertas personalizadas
- [ ] Backup automático
- [ ] Import/Export multi-format
- [ ] Modo offline completo
- [ ] Sincronización iCloud/Google Drive

---

**Última actualización**: Mayo 2026  
**Scope**: Utilidades complementarias (no core)
