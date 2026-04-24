/**
 * Clasificador local de gastos por palabras clave.
 * Sin API, sin límites, sin costo. Instantáneo.
 */

const KEYWORDS: Record<string, string[]> = {
  'Comida y Restaurantes': [
    'mcdonalds', 'mcdonald', 'burger king', 'burgerking', 'wendys', 'subway',
    'pizzeria', 'pizza', 'sushi', 'empanadas', 'lomiteria', 'lomito',
    'restaurante', 'restaurant', 'resto', 'restoran', 'buffet', 'parrilla',
    'rappi', 'pedidosya', 'pedidos ya', 'glovo', 'delivery',
    'cafe', 'cafeteria', 'starbucks', 'havanna', 'freddo', 'heladeria',
    'medialunas', 'facturas', 'panaderia', 'confiteria', 'kiosco', 'kiosko',
    'taco bell', 'tacobell', 'mostaza', 'pronto', 'kentucky', 'kfc',
    'bar ', 'barcito', 'cerveceria', 'tenedor libre', 'rotiseria',
    'minutas', 'sandwicheria', 'sanguche', 'sandwich', 'wok', 'spiedo',
    'luccio', 'applebee', 'fridays', 'tgi', 'chetos', 'comida',
    'desayuno', 'almuerzo', 'cena', 'merienda', 'vianda',
  ],

  'Supermercado': [
    'carrefour', 'jumbo', 'coto', 'disco', 'vea', 'dia ', 'dia,',
    'walmart', 'walmart', 'makro', 'costco', 'lidl', 'aldi',
    'supermercado', 'super ', 'hipermercado', 'mayorista',
    'verduleria', 'verdura', 'fruteria', 'fruta', 'almacen',
    'carniceria', 'carne', 'pescaderia', 'fiambreria', 'lacteos',
    'mercado libre comestibles', 'chango mas', 'changomas',
    'la anonima', 'anonima', 'toledo', 'cordiez', 'becerra',
    'supechina', 'bbf', 'big', 'unimarc',
  ],

  'Transporte': [
    'uber', 'cabify', 'taxi', 'remis', 'remise', 'transfer',
    'nafta', 'gasoil', 'combustible', 'shell', 'ypf', 'axion', 'puma',
    'estacion de servicio', 'estacion serv', 'petrobras',
    'colectivo', 'subte', 'sube', 'tren', 'ferrocarril', 'metrobus',
    'peaje', 'autopista', 'au ', 'telepeaje', 'aupass',
    'estacionamiento', 'parking', 'cochera',
    'aeropuerto', 'aerolineas', 'aerolíneas', 'latam', 'flybondi',
    'jetsmart', 'andes', 'lanzadera', 'bicicleta', 'patineta',
    'gomeria', 'gomería', 'mecanico', 'mecánico', 'taller',
    'seguro auto', 'vtv', 'patente', 'lubricentro',
  ],

  'Salud': [
    'farmacia', 'farma', 'drogueria', 'droguería', 'farmacity',
    'medico', 'médico', 'doctor', 'consulta medica', 'clinica', 'clínica',
    'hospital', 'sanatorio', 'guardia', 'emergencias',
    'obra social', 'prepaga', 'osde', 'swiss medical', 'medifé',
    'medife', 'galeno', 'sancor salud', 'ioma', 'pami',
    'dentista', 'odontologia', 'odontología', 'oculista', 'optica', 'óptica',
    'psicologo', 'psicólogo', 'psiquiatra', 'terapia', 'psicología',
    'kinesiologo', 'kinesiólogo', 'fisioterapia', 'fonoaudiologo',
    'analisis', 'análisis', 'laboratorio', 'radiografia', 'ecografia',
    'medicamento', 'remedio', 'vitamina', 'suplemento', 'pastillas',
    'vacuna', 'inyeccion', 'inyección',
  ],

  'Entretenimiento': [
    'netflix', 'disney', 'hbo', 'amazon prime', 'spotify', 'apple tv',
    'star plus', 'paramount', 'youtube premium', 'twitch',
    'cine', 'cinema', 'hoyts', 'cinemark', 'village', 'showcase',
    'teatro', 'recital', 'show', 'evento', 'entrada', 'ticket',
    'steam', 'playstation', 'xbox', 'nintendo', 'epic games',
    'juego', 'videojuego', 'gaming', 'arcade',
    'libro', 'libreria', 'revista', 'periodico', 'diario', 'kindle',
    'polideportivo', 'cancha', 'partido', 'estadio',
    'bowling', 'laser', 'karting', 'escape room',
  ],

  'Hogar y Servicios': [
    'edesur', 'edenor', 'edelap', 'luz ', 'electricidad', 'energia',
    'metrogas', 'gas ', 'gasnor', 'gasdel', 'litoral gas',
    'aysa', 'agua ', 'osm ', 'servicio cloacal', 'cloacas',
    'alquiler', 'expensas', 'inmobiliaria', 'consortio',
    'internet', 'fibertel', 'claro hogar', 'telecom', 'arnet',
    'telefono fijo', 'cablevision', 'directv', 'flow',
    'limpieza', 'empleada', 'mucama', 'plomero', 'plomería',
    'electricista', 'gasista', 'pintor', 'albañil', 'cerrajero',
    'ferreteria', 'ferretería', 'materiales', 'sodimac', 'easy',
    'mueble', 'ikea', 'decoracion', 'decoración', 'cortinas',
    'colchon', 'colchón', 'electrodomestico', 'electrodoméstico',
    'lavanderia', 'lavandería', 'tintoreria', 'tintorería',
    'municipalidad', 'impuesto', 'abl ', 'patente', 'tasa',
  ],

  'Ropa': [
    'zara', 'h&m', 'hym', 'forever 21', 'forever21',
    'adidas', 'nike', 'puma ', 'reebok', 'fila',
    'rapsodia', 'awada', 'bowen', 'wanama', 'cuesta blanca',
    'mimo', 'cheeky', 'yagmour', 'kosiuko', 'estancias',
    'zapatilla', 'zapato', 'calzado', 'bota', 'sandalia', 'ropa',
    'remera', 'pantalon', 'jean', 'vestido', 'camisa', 'chomba',
    'campera', 'buzo', 'ropa interior', 'medias', 'calzoncillo',
    'cartera', 'bolso', 'mochila ', 'cinturon',
    'indumentaria', 'boutique', 'outlet', 'liquidacion',
    'peluqueria', 'peluquería', 'barberia', 'barbería', 'corte pelo',
    'depilacion', 'depilación', 'manicura', 'pedicura', 'estetica',
  ],

  'Viajes': [
    'hotel', 'hostel', 'airbnb', 'booking', 'despegar',
    'aerolineas', 'aerolíneas', 'latam', 'flybondi', 'jetsmart',
    'pasaje', 'vuelo', 'excursion', 'excursión', 'tour',
    'agencia de viajes', 'agencia viajes', 'turismo',
    'валюта', 'cambio de moneda', 'casa de cambio',
    'seguro viaje', 'seguro de viaje', 'asistencia viajero',
    'visa', 'pasaporte', 'tramite viaje',
    'restaurante extranjero', 'comida extranjera',
  ],

  'Trabajo': [
    'monotributo', 'afip', 'arca', 'impuesto ingreso',
    'ingresos brutos', 'iibb', 'ganancias', 'bienes personales',
    'contador', 'estudio contable', 'escribano', 'abogado',
    'coworking', 'oficina', 'espacio trabajo',
    'material oficina', 'papeleria', 'papelería',
    'computadora', 'notebook', 'laptop', 'monitor', 'teclado',
    'software', 'licencia', 'suscripcion', 'plan negocio',
    'mercadopago neg', 'cobro', 'factura',
    'capacitacion', 'capacitación', 'curso', 'formacion',
    'linkedin', 'plataforma educativa', 'udemy', 'coursera',
  ],

  'Educación': [
    'universidad', 'facultad', 'colegio ', 'escuela', 'jardin',
    'cuota colegio', 'cuota escolar', 'matricula', 'matrícula',
    'guarderia', 'guardería', 'jardin maternal',
    'libro escolar', 'utiles', 'útiles', 'carpeta', 'cuaderno',
    'curso ', 'taller', 'academia', 'instituto', 'seminario',
    'udemy', 'coursera', 'platzi', 'digitalmenta',
    'inglés', 'ingles', 'idioma', 'clases particulares',
  ],

  'Mascotas': [
    'veterinaria', 'veterinario', 'vet ', 'mascota',
    'balanceado', 'comida perro', 'comida gato', 'alimento perro',
    'pedigree', 'royal canin', 'hills', 'pro plan',
    'collar', 'correa', 'arnes', 'arnés', 'juguete mascota',
    'peluqueria canina', 'grooming', 'baño perro',
    'vaca vac', 'pulgas', 'antipulgas', 'antiparasitario',
  ],

  'Tecnología': [
    'mercado libre tec', 'garbarino', 'fravega', 'musimundo', 'compumundo',
    'apple', 'samsung', 'motorola', 'huawei', 'xiaomi', 'lg',
    'celular', 'telefono ', 'tablet', 'ipad', 'iphone',
    'auricular', 'auriculares', 'headset', 'parlante',
    'cable', 'cargador', 'bateria externa', 'powerbank',
    'router', 'modem', 'red', 'switch',
    'impresora', 'cartucho', 'toner', 'escaner',
    'plan de datos', 'personal', 'claro', 'movistar', 'tuenti',
  ],

  'Otros': [],
};

/** Normaliza texto para comparación */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Versión sin espacios para detectar variantes como "mc donalds" → "mcdonalds" */
function collapse(text: string): string {
  return normalize(text).replace(/\s/g, '');
}

export interface ClassificationResult {
  category: string;
  confidence: 'high' | 'medium' | 'low';
  matchedKeyword?: string;
}

/** Clasifica un gasto por palabras clave locales */
export function classifyLocal(description: string): ClassificationResult {
  const normalized = normalize(description);
  const collapsed = collapse(description);

  // 1. Buscar match exacto de la categoría aprendida
  const learned = getLearned();
  for (const [desc, cat] of Object.entries(learned)) {
    if (normalize(desc) === normalized) {
      return { category: cat, confidence: 'high', matchedKeyword: desc };
    }
  }

  // 2. Buscar por palabras clave (normal + sin espacios)
  let bestCategory = 'Otros';
  let bestScore = 0;
  let bestKeyword = '';

  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    if (category === 'Otros') continue;
    for (const kw of keywords) {
      const normalizedKw = normalize(kw);
      const collapsedKw = collapse(kw);
      const matches = normalized.includes(normalizedKw) || collapsed.includes(collapsedKw);
      if (matches) {
        const score = kw.length;
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
          bestKeyword = kw;
        }
      }
    }
  }

  const confidence = bestScore > 6 ? 'high' : bestScore > 3 ? 'medium' : 'low';
  return { category: bestCategory, confidence, matchedKeyword: bestKeyword || undefined };
}

/** Guarda aprendizaje: descripción → categoría */
export function learnCategory(description: string, category: string): void {
  const learned = getLearned();
  learned[normalize(description)] = category;
  try {
    localStorage.setItem('expense-learned-categories', JSON.stringify(learned));
  } catch (_) { /* ignore */ }
}

/** Obtiene el mapa de aprendizaje de categorías */
export function getLearned(): Record<string, string> {
  try {
    const raw = localStorage.getItem('expense-learned-categories');
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

// ── Aprendizaje de Etiquetas ─────────────────────────────────────────────────

const LEARNED_TAGS_KEY = 'expense-learned-tags';

/** Guarda aprendizaje: descripción → etiquetas */
export function learnTags(description: string, tags: string[]): void {
  if (!tags || tags.length === 0) return;
  const learned = getLearnedTags();
  learned[normalize(description)] = tags;
  try {
    localStorage.setItem(LEARNED_TAGS_KEY, JSON.stringify(learned));
  } catch (_) { /* ignore */ }
}

/** Obtiene el mapa de aprendizaje de etiquetas */
export function getLearnedTags(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(LEARNED_TAGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

/** Clasifica etiquetas basándose en el aprendizaje previo del usuario */
export function classifyTags(description: string): string[] {
  const normalized = normalize(description);
  const learned = getLearnedTags();

  // 1. Match exacto
  if (learned[normalized]) return learned[normalized];

  // 2. Match parcial: si la descripción contiene alguna desc aprendida (o viceversa)
  for (const [desc, tags] of Object.entries(learned)) {
    if (normalized.includes(desc) || desc.includes(normalized)) {
      return tags;
    }
  }

  return [];
}
