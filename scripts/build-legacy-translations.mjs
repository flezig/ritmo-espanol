import fs from 'node:fs';

const input = JSON.parse(
  fs.readFileSync('/private/tmp/legacy-needing.json', 'utf8'),
);
const result = {};
let cursor = 0;

const translate = async ({ es, example }) => {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'es',
    tl: 'ru',
    dt: 't',
    q: example,
  });
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?${params}`,
  );
  if (!response.ok) throw new Error(`Translation failed: ${response.status}`);
  const data = await response.json();
  result[es] = data[0].map((part) => part[0]).join('');
};

await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (cursor < input.length) {
      const item = input[cursor++];
      await translate(item);
    }
  }),
);

fs.writeFileSync(
  'app/legacy-translations.ts',
  `// Russian translations for the hand-written real-life examples in the legacy topic packs.\nexport const legacyExampleTranslations: Record<string, string> = ${JSON.stringify(result, null, 2)};\n`,
  'utf8',
);
console.log(`Translated ${Object.keys(result).length} legacy examples.`);
