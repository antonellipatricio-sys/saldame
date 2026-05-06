# Módulo: Etiquetas

CRUD de etiquetas para clasificación secundaria de gastos.

## Referencia al Código
- **Archivo principal:** [`src/pages/TagsPage.tsx`](../../../src/pages/TagsPage.tsx)
- **Store**: [`src/store/useExpenseStore.ts`](../../../src/store/useExpenseStore.ts)

## Descripción
Interfaz para la gestión de "Etiquetas" (Tags). Funciona como un atributo descriptivo complementario a las Categorías, permitiendo añadir metadatos o agrupaciones secundarias a los gastos ("tags" tipo labels).

## Modelo Conceptual

```
Categoría (Primaria, 1 por gasto)
  └── Comida y Restaurantes
  
Etiquetas (Secundarias, Múltiples por gasto)
  ├── Gastos Fijos
  ├── Semanal
  ├── Compartido
  └── Urgente
```

## Funcionamiento

### Vista Principal
- Listado de todas las etiquetas existentes
- Cada fila: [Color badge] Nombre
- Botones: Editar, Eliminar

### Operaciones CRUD

#### ➕ Crear Etiqueta
```
1. Usuario click "Nueva Etiqueta"
2. Form pide:
   - Nombre: [input] (ej: "Compres online")
   - Color: [Tailwind selector] (ej: bg-purple-100 text-purple-700)
3. Click "Crear"
4. addTag() dispatch
5. Firestore save
6. Tag disponible en TagSelector
```

#### ✏️ Editar Etiqueta
```
1. Usuario click "Editar" en fila
2. Form pre-llenado
3. Cambia nombre o color
4. Click "Guardar"
5. updateTag(id, updates) dispatch
6. Sincronización en tiempo real
```

#### 🗑 Eliminar Etiqueta
```
1. Usuario click papelera
2. Si tiene gastos: muestra "Esta etiqueta está en N gastos"
3. Confirma: "¿Eliminar?"
4. deleteTag(id) dispatch
5. Tagtags desaparece
6. Gastos mantienen su categoría (no se pierde nada)
```

### Campos

| Campo | Tipo | Obligatorio | Restricción |
|-------|------|-------------|-------------|
| Nombre | String | Sí | 1-50 chars, único |
| Color | Tailwind | Sí | Valid Tailwind class |

### Color Picker (Tailwind)

Opciones predefinidas:
```
🔵 bg-blue-100 text-blue-700    (Azul)
🟢 bg-green-100 text-green-700   (Verde)
🔴 bg-red-100 text-red-700       (Rojo)
🟡 bg-yellow-100 text-yellow-700 (Amarillo)
🟣 bg-purple-100 text-purple-700 (Púrpura)
🟠 bg-orange-100 text-orange-700 (Naranja)
⚫ bg-gray-100 text-gray-700     (Gris)
🟤 bg-amber-100 text-amber-700   (Ámbar)
```

User puede escribir manualmente Tailwind class personalizado.

## Validaciones

```typescript
const validateTag = (tag: Tag): string | null => {
  // Nombre
  if (!tag.name || tag.name.trim().length === 0) {
    return "El nombre no puede estar vacío";
  }
  if (tag.name.length > 50) {
    return "El nombre no puede exceder 50 caracteres";
  }
  if (isDuplicate(tag.name)) {
    return "Esa etiqueta ya existe";
  }
  
  // Color
  const validTailwindClasses = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    // ... etc
  ];
  
  if (!validTailwindClasses.includes(tag.color)) {
    return "Color de Tailwind no válido";
  }
  
  return null; // Valid
};
```

## Diferencia: Categorías vs Etiquetas

| Aspecto | Categoría | Etiqueta |
|--------|-----------|----------|
| Cantidad/Gasto | 1 (exactamente) | 0-N (múltiples opcionales) |
| Obligatoria | Sí | No |
| Uso | Agrupación primaria | Metadatos secundarios |
| Ejemplo | Supermercado | Gastos Fijos, Semanal |
| Para Gráficos | Sí (pie chart) | Sí (filtro y tags chart) |
| Para Reportes | Sí (grupo principal) | Sí (drill-down) |

## Integración con TagSelector

Componente [`src/components/tags/TagSelector.tsx`](../../../src/components/tags/TagSelector.tsx) permite:
```
[Gastos Fijos] [Semanal] [Compras] [+]
                                    └── Click abre dropdown para agregar más
```

Disponible en:
- AddExpensePage (al crear gasto)
- ExpensesListPage (al editar fila)

## Integración con Store

```typescript
const { tags, addTag, updateTag, deleteTag } = useExpenseStore();

// Agregar
await addTag({
  id: crypto.randomUUID(),
  name: "Compras Online",
  color: "bg-cyan-100 text-cyan-700"
});

// Actualizar
await updateTag(tagId, {
  name: "Compras Electrónicas",
  color: "bg-blue-100 text-blue-700"
});

// Eliminar
await deleteTag(tagId);
```

## Casos de Uso

### Caso 1: Marcar "Gastos Fijos"
```
Usuario: Quiero saber qué gastos son recurrentes
Solución:
  1. Crea etiqueta "Gastos Fijos"
  2. La asigna a: Netflix, Internet, Alquiler, etc.
  3. Luego filtra por esta etiqueta en "Mis Gastos"
Resultado: Ve todos los gastos fijos de un vistazo
```

### Caso 2: Etiqueta "Reembolsable"
```
Usuario: Algunos gastos debería cobrárselos a amigos
Solución:
  1. Crea etiqueta "Reembolsable"
  2. Al agregar gasto con amigas, marca "Reembolsable"
  3. Puede exportar/filtrar después: "¿Cuánto me deben?"
```

### Caso 3: Etiqueta "Viaje a Mar del Plata"
```
Usuario: Fue a viaje y quiere tracear gastos asociados
Solución:
  1. Crea etiqueta "Viaje MDP 2026"
  2. Etiqueta cada gasto del viaje
  3. En Stats, filtra por esta etiqueta
  4. Resultado: Total gastado en viaje
```

### Caso 4: Filtrado en Mis Gastos
```
Escenario: Filtrar "Gastos Fijos" + "Moneda: ARS" + "Mes: Mayo"
Resultado:
  - Netflix $299
  - Internet $450
  - Total: $749
```

## Etiqueta Predeterminada

App inicia con:
- **"Gastos Fijos"** (bg-blue-100 text-blue-700)

Puede ser editada o eliminada por usuario.

## Ventajas
- ✅ Flexibilidad sin límites
- ✅ Múltiples etiquetas por gasto
- ✅ Filtrado granular
- ✅ Organización secundaria

## Limitaciones
- ❌ Sin jerarquía (no hay sub-tags)
- ❌ Sin contadores visibles (cuántos gastos por tag)
- ❌ Sin presupuesto por tag

## Roadmap
- [ ] Contador de gastos por etiqueta en vista principal
- [ ] Presupuesto por etiqueta
- [ ] Etiquetas automáticas por regex rules
- [ ] Historial de cambios
- [ ] Importar/Exportar etiquetas (backup)
- [ ] Etiquetas sugeridas basadas en gastos previos
