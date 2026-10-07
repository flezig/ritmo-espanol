export type GrammarMode = 'subjuntivo' | 'past' | 'future' | 'conditionals';
export type GrammarExercise = {
  id: string;
  rule: string;
  instruction: string;
  prompt: string;
  answer: string;
  options: string[];
  explanation: string;
};
const cervantes = {
  title: 'Instituto Cervantes · Plan Curricular B1–B2 · Gramática',
  url: 'https://cvc.cervantes.es/ensenanza/biblioteca_ele/plan_curricular/niveles/02_gramatica_inventario_b1-b2.htm',
};
const rae = {
  title: 'RAE–ASALE · Conjugación española',
  url: 'https://www.rae.es/buen-uso-español/conjugación-española',
};
export const grammarModes: {
  id: GrammarMode;
  title: string;
  icon: string;
  level: string;
  theory: string[];
  sources: { title: string; url: string }[];
}[] = [
  {
    id: 'subjuntivo',
    title: 'Subjuntivo',
    icon: '✨',
    level: 'B1–B2',
    theory: [
      'Subjuntivo выражает желание, оценку, необходимость, сомнение или действие, которое ещё не утверждается как факт: Quiero que vengas; No creo que tenga tiempo. Утверждение Creo que tiene tiempo обычно требует indicativo.',
      'Presente: основа формы yo настоящего времени + противоположные окончания: hablar → hable, comer → coma. Нерегулярные: sea, vaya, tenga, haga. После cuando для будущего: Cuando llegue, te llamaré.',
      'Pretérito perfecto: haya, hayas, haya, hayamos, hayáis, hayan + participio. Передаёт предшествующее завершённое действие относительно настоящего или будущего: Me alegra que hayas venido.',
      'Imperfecto: основа ellos indefinido без -ron + -ra/-se. Обе серии нормативны: tuviera/tuviese. После желания в прошлом: Quería que vinieras. В упражнениях на эту форму используется серия -ra.',
      'Pluscuamperfecto: hubiera/hubiese + participio. Действие предшествует прошлой точке отсчёта: Me alegró que hubieras venido. Для DELE тренируйте выбор наклонения, согласование времён и связки para que, antes de que, aunque. При одном субъекте часто нужен инфинитив: Quiero viajar.',
    ],
    sources: [
      cervantes,
      {
        title: 'RAE–ASALE · ¿Indicativo o subjuntivo?',
        url: 'https://www.rae.es/libro-estilo-lengua-española/el-modo-indicativo-o-subjuntivo',
      },
      rae,
    ],
  },
  {
    id: 'past',
    title: 'Прошедшие времена',
    icon: '🕰️',
    level: 'A2–B2',
    theory: [
      'Indefinido рассказывает о завершённых событиях в закрытом периоде: Ayer compré un libro. У -ar окончания -é, -aste, -ó, -amos, -asteis, -aron; у -er/-ir: -í, -iste, -ió, -imos, -isteis, -ieron. Есть нерегулярные основы: tuve, hice, pude.',
      'Imperfecto описывает фон, привычку и действие в процессе: De niño leía mucho. Окончания -aba для -ar и -ía для -er/-ir. Основные исключения: era, iba, veía. Сочетайте фон и событие: Estudiaba cuando llamó Ana.',
      'Pretérito perfecto compuesto: he/has/ha/hemos/habéis/han + participio. Часто связывает прошлое с настоящим: Hoy he trabajado mucho. Выбор perfecto/indefinido зависит и от региона; маркер hoy сам по себе не задаёт единственную норму. В заданиях форма указывается явно.',
      'Pluscuamperfecto: había/habías/había/habíamos/habíais/habían + participio. Это прошлое до другого прошлого: Cuando llegué, ya habían salido.',
      'Для DELE учитесь строить связный рассказ: фон → событие → результат и предыстория. Причастие с haber не согласуется с субъектом. Нерегулярные причастия: hecho, dicho, escrito, abierto, visto, vuelto.',
    ],
    sources: [cervantes, rae],
  },
  {
    id: 'future',
    title: 'Будущие времена',
    icon: '🔮',
    level: 'A2–B2',
    theory: [
      'Futuro simple: infinitivo + -é, -ás, -á, -emos, -éis, -án. Нерегулярные основы: tendr-, podr-, har-, dir-, vendr-, saldr-. Пример: Mañana trabajaré desde casa.',
      'Ir a + infinitivo выражает намерение, план или прогноз на основании текущей ситуации: Voy a estudiar; Mira esas nubes: va a llover. Настоящее время тоже может обозначать запланированное будущее: Mañana salgo.',
      'Futuro compuesto: habré/habrás/habrá/habremos/habréis/habrán + participio. Действие завершится до будущей точки: Para el viernes habré terminado.',
      'Будущее выражает и предположение: Serán las diez (наверное, десять); Habrá salido (наверное, уже вышел). Это не обязательно событие после момента речи.',
      'После cuando, en cuanto, hasta que при отсылке к ещё не наступившему событию обычно нужен subjuntivo: Cuando tenga tiempo, te llamaré. Для DELE различайте план, обещание, прогноз, вероятность и завершённость. В тренировке явно указана требуемая форма, потому что несколько способов выражения будущего могут подходить к одной ситуации.',
    ],
    sources: [cervantes, rae],
  },
  {
    id: 'conditionals',
    title: 'Три типа условий',
    icon: '🧩',
    level: 'B1–B2',
    theory: [
      'Тип 1 · Реальное или открытое условие: si + presente de indicativo → presente / futuro / imperativo. Si tengo tiempo, iré. В заданиях на тип 1 тренируем следствие в futuro simple. После условного si будущее время не используется.',
      'Тип 2 · Гипотеза в настоящем или будущем: si + imperfecto de subjuntivo → condicional simple. Si tuviera tiempo, iría. Формы tuviera и tuviese равно нормативны; здесь тренируем серию -ra.',
      'Тип 3 · Нереализованное условие в прошлом: si + pluscuamperfecto de subjuntivo → condicional compuesto. Si hubiera tenido tiempo, habría ido. Hubiese также нормативно; в тренировке используем hubiera.',
      'RAE допускает pluscuamperfecto de subjuntivo и в следствии третьего типа: Si lo hubiera sabido, hubiera venido. Чтобы ответ был однозначным, упражнения явно просят condicional compuesto.',
      'Эти три типа — учебная схема, а не полный список конструкций. Бывают смешанные условия: Si hubiera estudiado medicina, ahora sería médico. Для DELE проверяйте, относится ли условие и его следствие к настоящему, будущему или прошлому; не переносите английскую схему механически.',
    ],
    sources: [
      cervantes,
      {
        title: 'FundéuRAE · Subjuntivo en condicionales',
        url: 'https://www.fundeu.es/consulta/subjuntivo-en-condicionales-569/',
      },
      rae,
    ],
  },
];

type Verb = {
  inf: string;
  complement: string;
  participle: string;
  present: string[];
  subj: string[];
  preterite: string[];
  imperfect: string[];
  futureStem: string;
  subjPast: string[];
};
const split = (s: string) => s.split('|');
const regular = (
  inf: string,
  complement: string,
  participle?: string,
): Verb => {
  const ar = inf.endsWith('ar'),
    ir = inf.endsWith('ir'),
    root = inf.slice(0, -2);
  const forms = (suffixes: string) => split(suffixes).map((s) => root + s);
  const preterite = forms(
    ar ? 'é|aste|ó|amos|asteis|aron' : 'í|iste|ió|imos|isteis|ieron',
  );
  const base = preterite[5].slice(0, -3);
  return {
    inf,
    complement,
    participle: participle || root + (ar ? 'ado' : 'ido'),
    present: forms(
      ar
        ? 'o|as|a|amos|áis|an'
        : ir
          ? 'o|es|e|imos|ís|en'
          : 'o|es|e|emos|éis|en',
    ),
    subj: forms(ar ? 'e|es|e|emos|éis|en' : 'a|as|a|amos|áis|an'),
    preterite,
    imperfect: forms(
      ar ? 'aba|abas|aba|ábamos|abais|aban' : 'ía|ías|ía|íamos|íais|ían',
    ),
    futureStem: inf,
    subjPast: ['ra', 'ras', 'ra', 'ramos', 'rais', 'ran'].map(
      (s, i) => (i === 3 ? base.slice(0, -1) + (ar ? 'á' : 'é') : base) + s,
    ),
  };
};
const verbs: Verb[] = [
  regular('hablar', 'con la profesora'),
  regular('trabajar', 'en el proyecto'),
  regular('estudiar', 'español'),
  regular('viajar', 'a Madrid'),
  regular('comprar', 'los billetes'),
  regular('comer', 'en casa'),
  regular('vivir', 'cerca del centro'),
  regular('escribir', 'el informe', 'escrito'),
  {
    inf: 'tener',
    complement: 'tiempo libre',
    participle: 'tenido',
    present: split('tengo|tienes|tiene|tenemos|tenéis|tienen'),
    subj: split('tenga|tengas|tenga|tengamos|tengáis|tengan'),
    preterite: split('tuve|tuviste|tuvo|tuvimos|tuvisteis|tuvieron'),
    imperfect: split('tenía|tenías|tenía|teníamos|teníais|tenían'),
    futureStem: 'tendr',
    subjPast: split('tuviera|tuvieras|tuviera|tuviéramos|tuvierais|tuvieran'),
  },
  {
    inf: 'hacer',
    complement: 'los ejercicios',
    participle: 'hecho',
    present: split('hago|haces|hace|hacemos|hacéis|hacen'),
    subj: split('haga|hagas|haga|hagamos|hagáis|hagan'),
    preterite: split('hice|hiciste|hizo|hicimos|hicisteis|hicieron'),
    imperfect: split('hacía|hacías|hacía|hacíamos|hacíais|hacían'),
    futureStem: 'har',
    subjPast: split('hiciera|hicieras|hiciera|hiciéramos|hicierais|hicieran'),
  },
  {
    inf: 'poder',
    complement: 'participar en la reunión',
    participle: 'podido',
    present: split('puedo|puedes|puede|podemos|podéis|pueden'),
    subj: split('pueda|puedas|pueda|podamos|podáis|puedan'),
    preterite: split('pude|pudiste|pudo|pudimos|pudisteis|pudieron'),
    imperfect: split('podía|podías|podía|podíamos|podíais|podían'),
    futureStem: 'podr',
    subjPast: split('pudiera|pudieras|pudiera|pudiéramos|pudierais|pudieran'),
  },
  {
    inf: 'venir',
    complement: 'a la clase',
    participle: 'venido',
    present: split('vengo|vienes|viene|venimos|venís|vienen'),
    subj: split('venga|vengas|venga|vengamos|vengáis|vengan'),
    preterite: split('vine|viniste|vino|vinimos|vinisteis|vinieron'),
    imperfect: split('venía|venías|venía|veníamos|veníais|venían'),
    futureStem: 'vendr',
    subjPast: split('viniera|vinieras|viniera|viniéramos|vinierais|vinieran'),
  },
];
const persons = ['yo', 'tú', 'ella', 'nosotros', 'vosotros', 'ellos'];
const he = split('he|has|ha|hemos|habéis|han'),
  habia = split('había|habías|había|habíamos|habíais|habían'),
  haya = split('haya|hayas|haya|hayamos|hayáis|hayan'),
  hubiera = split('hubiera|hubieras|hubiera|hubiéramos|hubierais|hubieran'),
  habre = split('habré|habrás|habrá|habremos|habréis|habrán'),
  habria = split('habría|habrías|habría|habríamos|habríais|habrían'),
  voy = split('voy|vas|va|vamos|vais|van');
export const grammarExercises: Record<GrammarMode, GrammarExercise[]> = {
  subjuntivo: [],
  past: [],
  future: [],
  conditionals: [],
};
for (const v of verbs)
  for (let p = 0; p < 6; p++) {
    const subject = persons[p],
      compound = (aux: string[]) => `${aux[p]} ${v.participle}`;
    const future = v.futureStem + split('é|ás|á|emos|éis|án')[p],
      conditional = v.futureStem + split('ía|ías|ía|íamos|íais|ían')[p];
    const add = (
      mode: GrammarMode,
      rule: string,
      prompt: string,
      answer: string,
      distractors: string[],
      explanation: string,
      instruction = `Вставьте ${v.inf} в форме ${rule}.`,
    ) => {
      grammarExercises[mode].push({
        id: `${mode}:${rule}:${v.inf}:${p}`,
        rule,
        instruction,
        prompt,
        answer,
        options: [...new Set([answer, ...distractors])].slice(0, 4),
        explanation: `${explanation} ${v.inf} → ${answer} (${subject}).`,
      });
    };
    add(
      'subjuntivo',
      'presente de subjuntivo',
      `Es importante que ${subject} ___ ${v.complement} mañana.`,
      v.subj[p],
      [v.present[p], v.subjPast[p], future],
      'Оценка es importante que требует subjuntivo; действие ещё предстоит.',
    );
    add(
      'subjuntivo',
      'perfecto de subjuntivo',
      `Me alegra que ${subject} ya ___ ${v.complement}.`,
      compound(haya),
      [compound(he), compound(hubiera), v.subj[p]],
      'Радость о завершённом действии: presente de haber в subjuntivo + participio.',
    );
    add(
      'subjuntivo',
      'imperfecto de subjuntivo (-ra)',
      `Era importante que ${subject} ___ ${v.complement} al día siguiente.`,
      v.subjPast[p],
      [v.subj[p], v.imperfect[p], conditional],
      'Оценка в прошлом и действие после неё: imperfecto de subjuntivo.',
    );
    add(
      'subjuntivo',
      'pluscuamperfecto de subjuntivo',
      `Me alegró que ${subject} ya ___ ${v.complement} antes de la reunión.`,
      compound(hubiera),
      [compound(habia), compound(haya), compound(habria)],
      'Завершённое действие до прошлой оценки: hubiera + participio.',
    );
    add(
      'subjuntivo',
      'presente de indicativo',
      `Creo que ${subject} ___ ${v.complement} habitualmente.`,
      v.present[p],
      [v.subj[p], v.subjPast[p], future],
      'Утвердительное creo que сообщает мнение как утверждение и обычно требует indicativo.',
    );
    add(
      'past',
      'indefinido',
      `Ayer ${subject} ___ ${v.complement}.`,
      v.preterite[p],
      [v.imperfect[p], compound(he), compound(habia)],
      'Завершённое событие в закрытом прошлом периоде.',
    );
    add(
      'past',
      'imperfecto',
      `En aquella época, ${subject} ___ ${v.complement} con frecuencia.`,
      v.imperfect[p],
      [v.preterite[p], compound(he), v.present[p]],
      'Повторяющаяся привычка в прошлом описывается imperfecto.',
    );
    add(
      'past',
      'perfecto compuesto',
      `Hoy ${subject} ya ___ ${v.complement}.`,
      compound(he),
      [compound(habia), v.preterite[p], compound(haya)],
      'Связь прошлого с текущим периодом: presente de haber + participio. Здесь явно тренируем perfecto compuesto.',
    );
    add(
      'past',
      'pluscuamperfecto',
      `Antes de aquel día, ${subject} ya ___ ${v.complement}.`,
      compound(habia),
      [compound(he), compound(hubiera), v.imperfect[p]],
      'Действие завершилось до другой прошлой точки: imperfecto de haber + participio.',
    );
    add(
      'future',
      'futuro simple',
      `Mañana ${subject} ___ ${v.complement}.`,
      future,
      [conditional, v.present[p], v.subj[p]],
      'Futuro simple: основа будущего + окончание лица.',
    );
    add(
      'future',
      'ir a + infinitivo',
      `Este fin de semana ${subject} ___ ${v.complement}.`,
      `${voy[p]} a ${v.inf}`,
      [future, conditional, `${v.present[p]} a ${v.inf}`],
      'План: presente de ir + a + infinitivo.',
    );
    add(
      'future',
      'futuro compuesto',
      `Para entonces, ${subject} ya ___ ${v.complement}.`,
      compound(habre),
      [compound(habria), compound(he), compound(haya)],
      'Завершённость до будущей точки: futuro de haber + participio.',
    );
    add(
      'conditionals',
      'Тип 1 · условие',
      `Si ${subject} ___ ${v.complement}, la situación mejorará.`,
      v.present[p],
      [v.subj[p], future, conditional],
      'После условного si для открытого условия нужен presente de indicativo.',
      `Вставьте ${v.inf} в условие в presente de indicativo.`,
    );
    add(
      'conditionals',
      'Тип 2 · условие',
      `Si ${subject} ___ ${v.complement}, la situación mejoraría.`,
      v.subjPast[p],
      [v.imperfect[p], conditional, v.subj[p]],
      'Гипотетическое условие: si + imperfecto de subjuntivo.',
      `Вставьте ${v.inf} в условие в imperfecto de subjuntivo, серия -ra.`,
    );
    add(
      'conditionals',
      'Тип 3 · условие',
      `Si ${subject} ___ ${v.complement}, la situación habría mejorado.`,
      compound(hubiera),
      [compound(habia), compound(habria), compound(haya)],
      'Нереализованное прошлое условие: si + pluscuamperfecto de subjuntivo.',
      `Вставьте ${v.inf} в условие в pluscuamperfecto de subjuntivo, серия hubiera.`,
    );
    add(
      'conditionals',
      'Тип 1',
      `Si las condiciones son favorables, ${subject} ___ ${v.complement}.`,
      future,
      [conditional, compound(habria), v.subj[p]],
      'Открытое условие: si + presente; следствие здесь в futuro simple.',
      `Реальное условие. Вставьте ${v.inf} в следствие в futuro simple.`,
    );
    add(
      'conditionals',
      'Тип 2',
      `Si las condiciones fueran favorables, ${subject} ___ ${v.complement}.`,
      conditional,
      [future, compound(habria), v.subjPast[p]],
      'Гипотеза сейчас или в будущем: si + imperfecto de subjuntivo → condicional simple.',
      `Вставьте ${v.inf} в следствие в condicional simple.`,
    );
    add(
      'conditionals',
      'Тип 3',
      `Si las condiciones hubieran sido favorables, ${subject} ___ ${v.complement}.`,
      compound(habria),
      [conditional, compound(habre), compound(habia)],
      'Несбывшееся условие в прошлом: si + pluscuamperfecto de subjuntivo → condicional compuesto.',
      `Вставьте ${v.inf} в следствие в condicional compuesto.`,
    );
  }

/** Mix rule families in every round and exhaust the bank before repeating. */
export function createGrammarRound(
  mode: GrammarMode,
  seen: string[] = [],
  size = 10,
  random = Math.random,
): GrammarExercise[] {
  const bank = grammarExercises[mode],
    used = new Set(seen);
  const shuffle = <T>(items: T[]) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const available = bank.filter((q) => !used.has(q.id));
  const groups = new Map<string, GrammarExercise[]>();
  for (const q of shuffle(available))
    groups.set(q.rule, [...(groups.get(q.rule) || []), q]);
  const result: GrammarExercise[] = [];
  while (result.length < size && [...groups.values()].some((g) => g.length))
    for (const rule of shuffle([...groups.keys()])) {
      if (result.length === size) break;
      const q = groups.get(rule)!.pop();
      if (q) result.push(q);
    }
  if (result.length < size)
    result.push(
      ...shuffle(bank.filter((q) => !result.some((r) => r.id === q.id))).slice(
        0,
        size - result.length,
      ),
    );
  return result.map((q) => ({ ...q, options: shuffle(q.options) }));
}
