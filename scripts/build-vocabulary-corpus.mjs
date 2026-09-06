import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const spanishPath = process.argv[2] || '/private/tmp/spa-eng/spa-eng/spa.txt';
const russianPath = process.argv[3] || '/private/tmp/rus-eng/rus.txt';
const sourcePath = path.join(root, 'app/vocabulary.ts');
const outputPath = path.join(root, 'app/vocabulary-corpus.ts');

const normalize = (value) =>
  value.normalize('NFC').toLocaleLowerCase('es').trim();
const cleanTarget = (value) =>
  normalize(value.split(' / ')[0])
    .replace(/[¿?¡!.…]+$/g, '')
    .trim();
const words = (value) => value.trim().split(/\s+/).filter(Boolean).length;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const containsTarget = (sentence, target) => {
  const pattern = escapeRegex(target).replace(/\\ /g, '\\s+');
  return new RegExp(`(^|[^\\p{L}])${pattern}([^\\p{L}]|$)`, 'iu').test(
    normalize(sentence),
  );
};

const source = fs.readFileSync(sourcePath, 'utf8');
const rawNames = [
  'introWords',
  'familyWords',
  'routineWords',
  'homeWords',
  'foodWords',
  'cityWords',
  'shoppingWords',
  'travelPlusWords',
  'workWords',
  'healthWords',
  'leisureWords',
  'weatherWords',
];
const targets = new Map();
for (const name of rawNames) {
  const match = source.match(
    new RegExp('const ' + name + ' = `([\\s\\S]*?)`;'),
  );
  if (!match) continue;
  for (const pair of match[1].trim().split(';')) {
    const divider = pair.indexOf('=');
    const original = pair.slice(0, divider).trim();
    const target = cleanTarget(original);
    if (target)
      targets.set(normalize(original), {
        target,
        ru: pair.slice(divider + 1).trim(),
        topic: name,
      });
  }
}

const russianByEnglish = new Map();
for (const line of fs.readFileSync(russianPath, 'utf8').split('\n')) {
  const [english, russian] = line.split('\t');
  if (!english || !russian || words(russian) > 18) continue;
  const current = russianByEnglish.get(english) || [];
  if (current.length < 3 && !current.includes(russian)) current.push(russian);
  russianByEnglish.set(english, current);
}

const candidates = new Map();
const targetsByToken = new Map();
for (const entry of targets) {
  const token = entry[1].target.match(/[\p{L}]+/u)?.[0];
  if (!token) continue;
  const list = targetsByToken.get(token) || [];
  list.push(entry);
  targetsByToken.set(token, list);
}
for (const line of fs.readFileSync(spanishPath, 'utf8').split('\n')) {
  const [english, spanish] = line.split('\t');
  const russian = russianByEnglish.get(english);
  if (!spanish || !russian?.length) continue;
  const count = words(spanish);
  if (
    count < 3 ||
    count > 16 ||
    /https?:|www\.|@|[_{}<>]/i.test(spanish) ||
    /\b(Tom|Mary)\b/.test(spanish)
  )
    continue;
  const possibleTargets = new Map();
  for (const token of new Set(normalize(spanish).match(/[\p{L}]+/gu) || []))
    for (const entry of targetsByToken.get(token) || [])
      possibleTargets.set(entry[0], entry[1]);
  for (const [key, details] of possibleTargets) {
    const { target, ru, topic } = details;
    if (!containsTarget(spanish, target)) continue;
    const list = candidates.get(key) || [];
    const normalizedSentence = normalize(spanish);
    const glosses = normalize(ru)
      .split(' / ')
      .flatMap((gloss) => gloss.match(/[а-яё]+/gu) || [])
      .filter((gloss) => gloss.length > 2);
    const glossMatch = (translation) =>
      glosses.some((gloss) => {
        const stem = gloss.slice(0, Math.min(5, Math.max(3, gloss.length - 2)));
        return normalize(translation).includes(stem);
      });
    const translated =
      russian.find((translation) => glossMatch(translation)) || russian[0];
    const topicWords = {
      familyWords:
        /\b(familia|padre|madre|herman|hij|abuelo|primo|marido|esposa|persona|hombre|mujer|niñ|amigo|pareja|pelo|ojos?)\b/i,
      homeWords:
        /\b(casa|piso|apartamento|habitación|salón|cocina|baño|mueble|mesa|puerta|ventana|jardín)\b/i,
      foodWords:
        /\b(comer|comida|beber|bebida|desayuno|almuerzo|cena|pan|arroz|carne|pescado|restaurante|plato|ensalada|cocina)\b/i,
      cityWords:
        /\b(ciudad|calle|plaza|estación|autobús|metro|taxi|tráfico|centro|museo|barrio)\b/i,
      shoppingWords:
        /\b(comprar|tienda|ropa|talla|precio|pagar|euros?|camisa|vestido|zapatos?|mercado)\b/i,
      travelPlusWords:
        /\b(viaje|viajar|vuelo|hotel|reserva|aeropuerto|tren|turista|maleta|equipaje|playa)\b/i,
      workWords:
        /\b(trabajo|empleo|empresa|oficina|reunión|proyecto|clase|curso|examen|estudi|profesor)\b/i,
      healthWords:
        /\b(salud|médico|hospital|clínica|dolor|duele|enfermo|paciente|medic|herida|fiebre|cuerpo)\b/i,
      leisureWords:
        /\b(hobby|tiempo libre|deporte|fútbol|tenis|música|guitarra|cine|película|juego|amigos?)\b/i,
      weatherWords:
        /\b(tiempo|clima|sol|lluv|nieve|viento|temperatura|verano|invierno|cielo|mar|bosque|naturaleza)\b/i,
    }[topic];
    const wrongSense = {
      foodWords: /\b(dientes?|aire|clima|tiempo)\b/i,
      shoppingWords: /\b(bolsa|acciones|repuntó|economía)\b/i,
      healthWords: /\b(francés|inglés|idioma|empresa|imagen)\b/i,
      familyWords: /\b(salario|precio|temperatura|edificio)\b/i,
      homeWords: /\b(pisar|suelo pélvico)\b/i,
      travelPlusWords: /\b(hospital|empresa)\b/i,
    }[topic];
    const score =
      Math.abs(count - 5) * 1.25 +
      (count < 4 ? 3 : 0) +
      (/[;:]/.test(spanish) ? 1 : 0) +
      (spanish.includes('«') || spanish.includes('"') ? 1 : 0) +
      (normalizedSentence === target ? 8 : 0) +
      (/\b(muerte|morir|matar|pobre|rico|guerra|odio|arma|bala|disparo|cadáver)\b/i.test(
        normalizedSentence.replace(target, ''),
      )
        ? 6
        : 0) -
      (/^(mi|tu|el|la|los|las|hoy|mañana|quiero|necesito|tengo|hay|me gusta|¿dónde|¿qué|¿cómo|este|esta)\b/i.test(
        normalizedSentence,
      )
        ? 1
        : 0) +
      (glossMatch(translated) ? -4 : 3) +
      (topicWords?.test(normalizedSentence) ? -2 : 0) +
      (wrongSense?.test(normalizedSentence) ? 7 : 0);
    list.push({ example: spanish, exampleRu: translated, score });
    candidates.set(key, list);
  }
}

const selected = {};
for (const [key, list] of candidates) {
  const unique = [
    ...new Map(list.map((item) => [normalize(item.example), item])).values(),
  ]
    .sort((a, b) => a.score - b.score || a.example.length - b.example.length)
    .slice(0, 2);
  if (unique.length < 2) continue;
  selected[key] = {
    example: unique[0].example,
    exampleRu: unique[0].exampleRu,
    extraExample: unique[1].example,
    extraExampleRu: unique[1].exampleRu,
  };
}

const header = `// Generated from the CC BY 2.0 Tatoeba sentence pairs distributed by ManyThings.\n// Each Spanish sentence is aligned to its Russian translation through the same English source sentence.\nexport type CorpusExample = {\n  example: string;\n  exampleRu: string;\n  extraExample: string;\n  extraExampleRu: string;\n};\n\nexport const corpusExamples: Record<string, CorpusExample> = `;
fs.writeFileSync(
  outputPath,
  `${header}${JSON.stringify(selected, null, 2)};\n`,
  'utf8',
);
console.log(
  `Created ${Object.keys(selected).length} entries from ${targets.size} vocabulary targets.`,
);
console.log(
  `Without two corpus examples: ${[...targets.keys()]
    .filter((key) => !selected[key])
    .join(', ')}`,
);
