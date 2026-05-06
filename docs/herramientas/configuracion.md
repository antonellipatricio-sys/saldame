# Herramienta: Configuración

Ajustes persistentes y preferencias generales del usuario.

## Referencia al Código
- **Archivo principal:** [`src/pages/SettingsPage.tsx`](../../src/pages/SettingsPage.tsx)
- **Store**: [`src/store/useAppStore.ts`](../../src/store/useAppStore.ts)

## Descripción

La vista que engloba ajustes persistentes para el usuario o sistema. Sus cambios se reflejan directamente en el Store, alterando parámetros de configuración, flujos por defecto y visualización en tiempo real.

## Secciones de Configuración

### 1. Preferencias de Visualización

#### 🌙 Tema
- [ ] Claro (light mode)
- [x] Oscuro (dark mode)
- [ ] Sistema (auto detect)

**Persistencia**: `localStorage.theme`

#### 📐 Fuente
- [ ] Pequeña (12px)
- [x] Normal (14px)
- [ ] Grande (16px)

**Persistencia**: `localStorage.fontSize`

#### 🎨 Color Primario
```
[■ Brand Primary (azul actual)]
[Color Picker]
```

**Persistencia**: `localStorage.brandColor`

---

### 2. Comportamiento de la Aplicación

#### 💾 Auto-guardado
- [x] Habilitado (guardar cambios cada 30 segundos)
- [ ] Deshabilitado (guardar solo con botón)

**Persistencia**: `useAppStore.autoSave`

#### 📋 Categoría Predeterminada
```
Cuando agregar gasto, seleccionar por defecto:
[Otros ▼ Dropdown]
```

**Persistencia**: `useAppStore.defaultCategory`

#### 💱 Moneda por Defecto
- [x] ARS
- [ ] USD
- [ ] Otra

**Persistencia**: `useAppStore.defaultCurrency`

#### 📅 Período de Análisis
- [ ] Este mes
- [x] Últimos 30 días
- [ ] Trimestre
- [ ] Año

**Persistencia**: `useAppStore.analysisPeriod`

---

### 3. Privacidad y Datos

#### 🔒 PIN de Acceso
```
PIN Actual: [••••]
Botón: [Cambiar PIN]
  └─ Abre diálogo:
    PIN Antiguo: [____]
    PIN Nuevo: [____]
    Confirmar: [____]
    [Guardar]
```

**Persistencia**: Encrypted en `localStorage`

#### 🗄️ Backup & Restore
```
Última copia: 15/05/2026 14:30

[Descargar Backup]  → JSON file
[Restaurar Backup]  → Importar JSON
[Eliminar Datos]    → ⚠️ Irreversible
```

**Persistencia**: File system

#### 📊 Analytics
- [ ] Enviar datos anónimos
- [x] No compartir datos

---

### 4. Integraciones Externas

#### 🔗 Gemini API
```
Estado: ✅ Conectado
API Key: [•••••••••••/Ocultar/Mostrar]
Tokens usados mes: 45.000 / 1M

[Regenerar Key]
[Desconectar]
```

**Persistencia**: `useAppStore.geminiKey`

#### 🔗 Firebase
```
Proyecto: saldame
Email: user@email.com
Última sincronización: Hace 2 minutos

[Desconectar Cuenta]
[Ver Datos en Firebase]
```

**Persistencia**: Automático (Firebase Auth)

---

### 5. Control de Datos

#### 📤 Exportar
```
Formato:
  [x] JSON
  [ ] CSV
  [ ] Excel
  [ ] PDF

Período: [Todos los tiempos ▼]
Incluir: [x] Gastos [x] Categorías [x] Etiquetas

[Descargar]
```

#### 📥 Importar
```
Seleccionar archivo
[JSON, CSV, Excel admitidos]

[Cargar Archivo]
  └─ Preview de datos
  └─ [Confirmar Importación]
```

#### 🗑️ Limpiar Cache
```
Caché local: 2.5 MB
Última limpieza: 01/05/2026

[Limpiar Ahora]
  └─ Confirma: "¿Limpiar datos locales?"
  └─ Mantiene datos en Firestore
```

---

### 6. Acerca de & Soporte

#### ℹ️ Versión
```
Saldame v1.0.2
Build: 2026-05-05
Última actualización: 10 días atrás
```

#### 📧 Soporte
```
[Reportar Bug]
  └─ Abre mailto precompilado

[Ver Changelog]
  └─ Link a documentación

[Contactar Dev]
  └─ Email / WhatsApp
```

---

## Validaciones

### PIN
- ✅ Mínimo 4 dígitos
- ✅ Máximo 8 caracteres
- ✅ Confirmación debe coincidir

### API Keys
- ✅ No puede estar vacía si está habilitada
- ✅ Validar format (aunque sea mínimamente)

### Archivos de Importación
- ✅ Extensión permitida (.json, .csv, .xlsx)
- ✅ Tamaño máximo 50MB
- ✅ Estructura validada

---

## Comportamiento de Guardado

```typescript
// En SettingsPage.tsx
const handleSettingChange = (key: string, value: any) => {
  // 1. Actualiza UI instantáneamente
  setLocalSettings({ ...localSettings, [key]: value });
  
  // 2. Si autoSave está habilitado:
  if (useAppStore.autoSave) {
    debounce(() => {
      // 3. Persiste en localStorage
      localStorage.setItem('settings', JSON.stringify(localSettings));
      // 4. Sincroniza store global
      useAppStore.updateSettings(localSettings);
    }, 1000);
  }
};

// 5. Botón "Guardar" (si autoSave deshabilitado)
const handleSave = () => {
  localStorage.setItem('settings', JSON.stringify(localSettings));
  useAppStore.updateSettings(localSettings);
  setSuccessMessage("Configuración guardada");
};
```

---

## Ventajas
- ✅ Centralizado
- ✅ Persistencia automática
- ✅ Control granular
- ✅ Backup/Restore

## Limitaciones
- ❌ Sin sincronización cross-device
- ❌ Sin historial de cambios
- ❌ Sin perfiles de usuario

## Roadmap
- [ ] Sincronización entre dispositivos
- [ ] Perfiles (ej: Personal, Trabajo)
- [ ] Historial de cambios
- [ ] Reset a valores por defecto
- [ ] Importar presets de amigos
- [ ] Dos factores (2FA)
