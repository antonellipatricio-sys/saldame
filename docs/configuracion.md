# Herramienta: Configuración

Ajustes persistentes y preferencias generales de la aplicación.

## Referencia al Código
- **Archivo principal:** [`src/pages/SettingsPage.tsx`](../../src/pages/SettingsPage.tsx)
- **Store**: [`src/store/useAppStore.ts`](../../src/store/useAppStore.ts)

## Descripción

Página que centraliza los ajustes de la aplicación. Los cambios se persisten en el Store y en `localStorage`.

---

## Secciones de Configuración

### 1. Integraciones

#### 🤖 Gemini API
```
Estado: ✅ Conectado / ⚠️ Sin configurar
API Key: [•••••••••• / Mostrar]
[Guardar Key]
```
**Persistencia**: `useAppStore.geminiKey` → `localStorage`

Requerida para clasificación automática vía IA. Sin esta key, el clasificador funciona solo con reglas locales.

#### 🔥 Firebase
```
Proyecto: saldame
Email: user@email.com
Última sincronización: Hace 2 minutos
[Desconectar Cuenta]
```
**Persistencia**: Automático (Firebase Auth)

---

### 2. Privacidad y Acceso

#### 🔒 PIN de Acceso
```
PIN: [••••]
[Cambiar PIN]  → Abre diálogo: PIN actual / nuevo / confirmar
```
**Persistencia**: Encriptado en `localStorage`

---

### 3. Datos

#### 📤 Exportar
```
Formato: [x] JSON  [ ] CSV
Período: [Todos los tiempos ▼]
[Descargar]
```

#### 📥 Importar
```
[Seleccionar archivo JSON]
→ Preview → [Confirmar Importación]
```

#### 🗑️ Eliminar Datos
```
[Eliminar Datos] → ⚠️ Irreversible — solo borra datos locales, no Firestore
```

---

### 4. Acerca de

```
Cuack Cuentas Claras
Versión: 1.x.x
[Ver Changelog]  [Reportar Bug]
```

---

## Roadmap
- [ ] Moneda por defecto configurable (ARS/USD)
- [ ] Categoría predeterminada al agregar gasto
- [ ] Sincronización entre dispositivos
- [ ] Reset a valores por defecto
