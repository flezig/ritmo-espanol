export type LessonExercise = {
  kind: string;
  mode: 'choice' | 'type' | 'order' | 'truefalse';
  prompt: string;
  options?: string[];
  answer: string;
  hint: string;
  explanation: string;
};

export type TheoryBlock = {
  title: string;
  paragraphs: string[];
  examples: [string, string][];
  note?: string;
};

const choice = (
  kind: string,
  prompt: string,
  options: string[],
  answer: string,
  hint: string,
  explanation: string,
): LessonExercise => ({
  kind,
  mode: 'choice',
  prompt,
  options,
  answer,
  hint,
  explanation,
});
const typed = (
  kind: string,
  prompt: string,
  answer: string,
  hint: string,
  explanation: string,
): LessonExercise => ({
  kind,
  mode: 'type',
  prompt,
  answer,
  hint,
  explanation,
});
const order = (
  prompt: string,
  _options: string[],
  answer: string,
  explanation: string,
): LessonExercise => ({
  kind: 'Порядок слов',
  mode: 'order',
  prompt,
  options: answer.split(/\s+/),
  answer,
  hint: 'Нажимайте на слова по очереди. Нажатие на слово в собранной фразе вернёт его назад.',
  explanation,
});
const truth = (
  prompt: string,
  answer: 'Верно' | 'Неверно',
  explanation: string,
): LessonExercise => ({
  kind: 'Верно или неверно',
  mode: 'truefalse',
  prompt,
  options: ['Верно', 'Неверно'],
  answer,
  hint: 'Проверьте форму глагола, артикль и согласование.',
  explanation,
});

const diversifyExercises = (
  items: LessonExercise[],
  convertChoicesToInput = true,
) => {
  let choiceNumber = 0;
  const varied = items.map((item) => {
    if (item.mode !== 'choice' || !convertChoicesToInput) return item;
    // A fill-in sentence is not a free-input task unless the prompt itself
    // supplies the missing lemma/meaning or asks for a mechanical conversion.
    // Otherwise many perfectly natural words could fit the same blank.
    const hasExplicitClue =
      item.prompt.includes('→') || /\([^)]{2,}\)/.test(item.prompt);
    if (!hasExplicitClue) return item;
    const convertToInput = choiceNumber++ % 2 === 0;
    return convertToInput
      ? {
          ...item,
          mode: 'type' as const,
          options: undefined,
          kind: `${item.kind} · ввод`,
          prompt: `Впишите правильный ответ без вариантов: ${item.prompt}`,
        }
      : item;
  });
  const buckets = (['choice', 'type', 'order', 'truefalse'] as const).map(
    (mode) => varied.filter((item) => item.mode === mode),
  );
  const result: LessonExercise[] = [];
  while (result.length < varied.length) {
    for (const bucket of buckets) {
      const next = bucket.shift();
      if (next) result.push(next);
    }
  }
  return result;
};

const lesson1: LessonExercise[] = [
  ...[
    ['Yo ___ Ana.', ['soy', 'eres', 'es'], 'soy'],
    ['Tú ___ de Chile.', ['eres', 'soy', 'somos'], 'eres'],
    ['Él ___ médico.', ['es', 'son', 'eres'], 'es'],
    ['Ella ___ profesora.', ['es', 'soy', 'somos'], 'es'],
    ['Nosotros ___ estudiantes.', ['somos', 'sois', 'son'], 'somos'],
    ['Vosotros ___ de Madrid.', ['sois', 'somos', 'son'], 'sois'],
    ['Ellos ___ argentinos.', ['son', 'es', 'somos'], 'son'],
    ['Usted ___ el señor Ruiz.', ['es', 'eres', 'soy'], 'es'],
    ['Mi gato ___ tranquilo.', ['es', 'son', 'eres'], 'es'],
    ['Luna y Sol ___ mis gatos.', ['son', 'somos', 'es'], 'son'],
  ].map(([p, o, a]) =>
    choice(
      'Ser',
      p as string,
      o as string[],
      a as string,
      'Вспомните: soy, eres, es, somos, sois, son.',
      'Форма ser должна согласовываться с подлежащим.',
    ),
  ),
  ...[
    ['___ gato duerme en la silla.', ['El', 'La', 'Una'], 'El'],
    ['___ gata se llama Luna.', ['La', 'El', 'Un'], 'La'],
    ['Soy ___ estudiante nuevo.', ['un', 'una', 'la'], 'un'],
    ['Ana es ___ profesora.', ['una', 'un', 'el'], 'una'],
    ['___ problema es pequeño.', ['El', 'La', 'Una'], 'El'],
    ['___ mano está fría.', ['La', 'El', 'Un'], 'La'],
    ['Busco ___ trabajo.', ['un', 'el', 'la'], 'un'],
    ['___ casa de Pablo es grande.', ['La', 'El', 'Un'], 'La'],
    ['Tengo ___ amigo en Perú.', ['un', 'una', 'la'], 'un'],
    ['___ ciudad es bonita.', ['La', 'El', 'Un'], 'La'],
  ].map(([p, o, a]) =>
    choice(
      'Артикли',
      p as string,
      o as string[],
      a as string,
      'Запоминайте существительное вместе с артиклем.',
      'Артикль показывает род и определённость существительного.',
    ),
  ),
  ...[
    ['María es ___.', ['española', 'español', 'españoles'], 'española'],
    ['Carlos es ___.', ['alto', 'alta', 'altas'], 'alto'],
    ['La doctora es ___.', ['amable', 'amables', 'amablo'], 'amable'],
    ['El gato es ___.', ['negro', 'negra', 'negras'], 'negro'],
    ['La gata es ___.', ['blanca', 'blanco', 'blancos'], 'blanca'],
    [
      'Los amigos son ___.',
      ['simpáticos', 'simpática', 'simpático'],
      'simpáticos',
    ],
    [
      'Ana y Marta son ___.',
      ['mexicanas', 'mexicanos', 'mexicana'],
      'mexicanas',
    ],
    ['Pedro y Ana son ___.', ['altos', 'altas', 'alto'], 'altos'],
    ['La casa es ___.', ['pequeña', 'pequeño', 'pequeños'], 'pequeña'],
    [
      'El café es ___.',
      ['colombiano', 'colombiana', 'colombianos'],
      'colombiano',
    ],
  ].map(([p, o, a]) =>
    choice(
      'Согласование',
      p as string,
      o as string[],
      a as string,
      'Смотрите на род и число существительного.',
      'Прилагательное согласуется с существительным по роду и числу.',
    ),
  ),
  order(
    'Соберите: зовут / Меня / Тимур',
    ['Me llamo Timur.', 'Llamo me Timur.', 'Timur me llama.'],
    'Me llamo Timur.',
    'В испанском используется возвратная конструкция me llamo.',
  ),
  order(
    'Соберите: из / Я / России',
    ['Soy de Rusia.', 'De Rusia soy de.', 'Yo Rusia es.'],
    'Soy de Rusia.',
    'Происхождение выражается ser + de.',
  ),
  order(
    'Соберите: программист / Она',
    ['Ella es programadora.', 'Es ella programador.', 'Ella programadora soy.'],
    'Ella es programadora.',
    'Базовый порядок: подлежащее + ser + характеристика.',
  ),
  order(
    'Соберите: кот / мой / спокойный',
    [
      'Mi gato es tranquilo.',
      'Gato mi tranquilo es.',
      'Mi gato tranquilo soy.',
    ],
    'Mi gato es tranquilo.',
    'Притяжательное слово ставится перед существительным.',
  ),
  order(
    'Соберите вопрос: ты / откуда?',
    ['¿De dónde eres?', '¿Dónde de eres?', '¿Eres dónde de?'],
    '¿De dónde eres?',
    'Вопросительное сочетание de dónde ставится в начале.',
  ),
  truth(
    '«Yo es estudiante» — правильное предложение.',
    'Неверно',
    'С yo нужна форма soy: Yo soy estudiante.',
  ),
  truth(
    '«Ella es médica» — правильное согласование.',
    'Верно',
    'Существительное профессии принимает женскую форму médica.',
  ),
  truth(
    'Слово problema употребляется с артиклем la.',
    'Неверно',
    'Правильно: el problema.',
  ),
  truth(
    'Личное местоимение в испанском часто можно опустить.',
    'Верно',
    'Окончание глагола обычно уже показывает лицо.',
  ),
  truth(
    '«Somos amigos» означает «Мы друзья».',
    'Верно',
    'Somos — форма ser для nosotros.',
  ),
  typed(
    'Перевод',
    'Напишите по-испански: «Меня зовут Ольга».',
    'Me llamo Olga.',
    'Начните с Me llamo…',
    'Me llamo буквально означает «я называюсь».',
  ),
  typed(
    'Перевод',
    'Напишите: «Я из России».',
    'Soy de Rusia.',
    'Используйте ser + de.',
    'Для yo используется soy.',
  ),
  typed(
    'Перевод',
    'Напишите: «Он врач».',
    'Él es médico.',
    'él + es',
    'У él есть графическое ударение.',
  ),
  typed(
    'Перевод',
    'Напишите: «Она русская».',
    'Ella es rusa.',
    'Прилагательное должно быть женского рода.',
    'ruso → rusa.',
  ),
  typed(
    'Кошачья фраза',
    'Напишите: «Мой кот белый».',
    'Mi gato es blanco.',
    'mi gato + ser + blanco',
    'С gato согласуется форма blanco.',
  ),
  choice(
    'Знакомство',
    'Как естественно спросить имя?',
    ['¿Cómo te llamas?', '¿Qué eres nombre?', '¿Dónde llamas?'],
    '¿Cómo te llamas?',
    'Используйте возвратный глагол llamarse.',
    '¿Cómo te llamas? — стандартный вопрос при знакомстве.',
  ),
  choice(
    'Страна',
    'Выберите правильную пару страна → национальность.',
    ['España → español/a', 'España → españolo/a', 'España → españense'],
    'España → español/a',
    'Форма национальности часто отличается от названия страны.',
    'Национальности пишутся со строчной буквы.',
  ),
  choice(
    'Профессия',
    'Как сказать «Мы дизайнеры»?',
    ['Somos diseñadores.', 'Estamos diseñadores.', 'Son diseñador.'],
    'Somos diseñadores.',
    'Профессия выражается через ser.',
    'С nosotros используется somos; множественное число — diseñadores.',
  ),
  truth(
    'Национальности в испанском пишутся с заглавной буквы.',
    'Неверно',
    'Названия национальностей и языков пишутся со строчной буквы: ruso, española.',
  ),
  order(
    'Соберите: новая / я / студентка',
    [
      'Soy una estudiante nueva.',
      'Soy un estudiante nuevo.',
      'Nueva soy una estudiante.',
    ],
    'Soy una estudiante nueva.',
    'Если есть характеристика, с профессией или ролью возможен артикль una.',
  ),
];

const lesson2: LessonExercise[] = [
  ...[
    ['Yo ___ una hermana.', ['tengo', 'tienes', 'tiene'], 'tengo'],
    ['Tú ___ dos gatos.', ['tienes', 'tengo', 'tienen'], 'tienes'],
    ['Mi madre ___ ojos verdes.', ['tiene', 'tienes', 'tenemos'], 'tiene'],
    [
      'Nosotros ___ una familia grande.',
      ['tenemos', 'tienen', 'tenéis'],
      'tenemos',
    ],
    ['Vosotros ___ un perro.', ['tenéis', 'tenemos', 'tienen'], 'tenéis'],
    ['Ellos ___ tres hijos.', ['tienen', 'tiene', 'tengo'], 'tienen'],
    ['Usted ___ el pelo corto.', ['tiene', 'tienes', 'tengo'], 'tiene'],
    ['Luna ___ cuatro años.', ['tiene', 'es', 'está'], 'tiene'],
    ['Mis gatos ___ hambre.', ['tienen', 'son', 'están'], 'tienen'],
    ['¿Cuántos años ___ tú?', ['tienes', 'eres', 'estás'], 'tienes'],
  ].map(([p, o, a]) =>
    choice(
      'Tener',
      p as string,
      o as string[],
      a as string,
      'tengo, tienes, tiene, tenemos, tenéis, tienen',
      'Tener выражает обладание, возраст и ряд состояний.',
    ),
  ),
  ...[
    ['___ madre se llama Elena.', ['Mi', 'Mis', 'Mía'], 'Mi'],
    ['¿Cómo se llama ___ hermano?', ['tu', 'tus', 'tuyo'], 'tu'],
    ['Ana vive con ___ familia.', ['su', 'sus', 'suyas'], 'su'],
    ['Estos son ___ padres.', ['mis', 'mi', 'míos'], 'mis'],
    ['¿Dónde están ___ gatos?', ['tus', 'tu', 'tuyo'], 'tus'],
    ['Carlos visita a ___ abuelos.', ['sus', 'su', 'suyo'], 'sus'],
    ['___ hermana y yo vivimos juntas.', ['Mi', 'Mis', 'Mía'], 'Mi'],
    ['Pedro juega con ___ hijo.', ['su', 'sus', 'suyos'], 'su'],
    [
      'Tenemos dos gatos. ___ gatos son naranjas.',
      ['Nuestros', 'Nuestro', 'Nuestra'],
      'Nuestros',
    ],
    [
      'Ana y tú tenéis una casa. Es ___ casa.',
      ['vuestra', 'vuestro', 'vuestras'],
      'vuestra',
    ],
  ].map(([p, o, a]) =>
    choice(
      'Притяжательные',
      p as string,
      o as string[],
      a as string,
      'mi/tu/su согласуются с предметом, а не с владельцем.',
      'Краткое притяжательное ставится перед существительным.',
    ),
  ),
  ...[
    ['Mi hermana es ___.', ['alta', 'alto', 'altas'], 'alta'],
    ['Mis hermanos son ___.', ['altos', 'alto', 'altas'], 'altos'],
    ['La abuela tiene el pelo ___.', ['blanco', 'blanca', 'blancos'], 'blanco'],
    [
      'Las niñas son ___.',
      ['simpáticas', 'simpático', 'simpáticos'],
      'simpáticas',
    ],
    ['Mi padre es muy ___.', ['paciente', 'pacientes', 'pacienta'], 'paciente'],
    ['Los gatos son ___.', ['curiosos', 'curiosa', 'curioso'], 'curiosos'],
    [
      'Luna es una gata ___.',
      ['tranquila', 'tranquilo', 'tranquilos'],
      'tranquila',
    ],
    ['Pedro tiene los ojos ___.', ['azules', 'azul', 'azulas'], 'azules'],
    ['Ana y Luis son ___.', ['amables', 'amable', 'amablos'], 'amables'],
    ['Las casas son ___.', ['modernas', 'moderna', 'modernos'], 'modernas'],
  ].map(([p, o, a]) =>
    choice(
      'Согласование',
      p as string,
      o as string[],
      a as string,
      'Определите род и число главного существительного.',
      'Прилагательное меняет число и, если возможно, род.',
    ),
  ),
  ...[
    [
      'el hermano → …',
      ['los hermanos', 'los hermano', 'el hermanos'],
      'los hermanos',
    ],
    [
      'la mujer → …',
      ['las mujeres', 'los mujeres', 'las mujer'],
      'las mujeres',
    ],
    [
      'el joven → …',
      ['los jóvenes', 'los jovenes', 'las jóvenes'],
      'los jóvenes',
    ],
    ['la luz → …', ['las luces', 'las luzes', 'los luces'], 'las luces'],
    [
      'el carácter → …',
      ['los caracteres', 'los carácteres', 'las caracteres'],
      'los caracteres',
    ],
    [
      'un gato negro → …',
      ['unos gatos negros', 'unos gato negro', 'unas gatos negras'],
      'unos gatos negros',
    ],
    [
      'la hija pequeña → …',
      ['las hijas pequeñas', 'los hijos pequeños', 'las hija pequeña'],
      'las hijas pequeñas',
    ],
    [
      'mi abuelo → …',
      ['mis abuelos', 'mi abuelos', 'mises abuelos'],
      'mis abuelos',
    ],
    [
      'su hermana → …',
      ['sus hermanas', 'su hermanas', 'suyas hermanas'],
      'sus hermanas',
    ],
    [
      'una persona amable → …',
      ['unas personas amables', 'unos personas amable', 'unas persona amables'],
      'unas personas amables',
    ],
  ].map(([p, o, a]) =>
    choice(
      'Множественное число',
      p as string,
      o as string[],
      a as string,
      'Гласная + s; согласная + es. Не забудьте изменить артикль и прилагательное.',
      'Во множественном числе меняется вся именная группа.',
    ),
  ),
  typed(
    'Семья',
    'Напишите: «У меня есть брат».',
    'Tengo un hermano.',
    'tener + un hermano',
    'Для yo форма tener — tengo.',
  ),
  typed(
    'Возраст',
    'Напишите: «Моей кошке три года».',
    'Mi gata tiene tres años.',
    'В испанском возраст «имеют».',
    'Возраст выражается tener + количество + años.',
  ),
  typed(
    'Описание',
    'Напишите: «Мои родители добрые».',
    'Mis padres son amables.',
    'mis + padres + son',
    'amable во множественном числе → amables.',
  ),
  truth(
    '«Su madre» может означать «его мама», «её мама» или «Ваша мама».',
    'Верно',
    'su зависит от контекста и может иметь нескольких владельцев.',
  ),
  truth(
    '«Mi gatos» — правильная форма множественного числа.',
    'Неверно',
    'Правильно: mis gatos.',
  ),
  truth(
    'С возрастом используется ser: Soy veinte años.',
    'Неверно',
    'Правильно: Tengo veinte años.',
  ),
  truth(
    'Прилагательное amable имеет одну форму для мужского и женского рода.',
    'Верно',
    'Меняется только число: amable → amables.',
  ),
  order(
    'Соберите: сестра / моя / весёлая',
    [
      'Mi hermana es divertida.',
      'Mi es hermana divertido.',
      'Hermana mi divertida son.',
    ],
    'Mi hermana es divertida.',
    'Все элементы должны согласоваться с hermana.',
  ),
  order(
    'Соберите: у / голубые / него / глаза',
    ['Él tiene los ojos azules.', 'Él es ojos azul.', 'Tiene él azul ojos.'],
    'Él tiene los ojos azules.',
    'Внешность часто описывают tener + часть тела.',
  ),
  order(
    'Соберите: коты / наши / любопытные',
    [
      'Nuestros gatos son curiosos.',
      'Nuestro gatos es curioso.',
      'Gatos nuestros curiosa son.',
    ],
    'Nuestros gatos son curiosos.',
    'Nuestros и curiosos согласуются с gatos.',
  ),
];

const lesson3: LessonExercise[] = [
  ...[
    [
      'Yo ___ a las siete. (levantarse)',
      ['me levanto', 'te levantas', 'se levanta'],
      'me levanto',
    ],
    [
      'Tú ___ a las ocho. (desayunar)',
      ['desayunas', 'desayuno', 'desayuna'],
      'desayunas',
    ],
    [
      'Ella ___ desde casa. (trabajar)',
      ['trabaja', 'trabajo', 'trabajan'],
      'trabaja',
    ],
    [
      'Nosotros ___ español. (estudiar)',
      ['estudiamos', 'estudian', 'estudiáis'],
      'estudiamos',
    ],
    [
      'Vosotros ___ música. (escuchar)',
      ['escucháis', 'escuchamos', 'escuchan'],
      'escucháis',
    ],
    ['Ellos ___ a las diez. (cenar)', ['cenan', 'cena', 'cenamos'], 'cenan'],
    ['Yo ___ café. (beber)', ['bebo', 'bebes', 'bebe'], 'bebo'],
    ['Tú ___ a las dos. (comer)', ['comes', 'como', 'come'], 'comes'],
    [
      'Mi gato ___ en el sofá. (dormir)',
      ['duerme', 'dormes', 'duermo'],
      'duerme',
    ],
    [
      'Nosotros ___ en Madrid. (vivir)',
      ['vivimos', 'viven', 'vivís'],
      'vivimos',
    ],
    ['Ella ___ un libro. (leer)', ['lee', 'lees', 'leo'], 'lee'],
    [
      'Yo ___ un correo. (escribir)',
      ['escribo', 'escribe', 'escribes'],
      'escribo',
    ],
    ['Los niños ___ la puerta. (abrir)', ['abren', 'abre', 'abrimos'], 'abren'],
    ['Pedro ___ a casa. (volver)', ['vuelve', 'volvo', 'vuelves'], 'vuelve'],
    ['Yo ___ al trabajo. (ir)', ['voy', 'vas', 'va'], 'voy'],
  ].map(([p, o, a]) =>
    choice(
      'Presente',
      p as string,
      o as string[],
      a as string,
      'Найдите подлежащее и выберите нужное окончание.',
      'Глагол в presente согласуется с лицом и числом.',
    ),
  ),
  ...[
    [
      'Как сказать «Я не завтракаю дома»?',
      ['No desayuno en casa.', 'Desayuno no en casa.', 'No desayunar en casa.'],
      'No desayuno en casa.',
    ],
    [
      'Она не работает по субботам.',
      [
        'Ella no trabaja los sábados.',
        'Ella trabaja no los sábados.',
        'Ella no trabajar sábados.',
      ],
      'Ella no trabaja los sábados.',
    ],
    [
      'Мы не пьём кофе вечером.',
      [
        'No bebemos café por la tarde.',
        'Bebemos no café tarde.',
        'No beben café nosotros.',
      ],
      'No bebemos café por la tarde.',
    ],
    [
      'Кот не спит ночью.',
      [
        'El gato no duerme de noche.',
        'El gato duerme no noche.',
        'No dormir el gato noche.',
      ],
      'El gato no duerme de noche.',
    ],
    [
      'Они не живут здесь.',
      ['No viven aquí.', 'Viven no aquí.', 'No vivimos aquí.'],
      'No viven aquí.',
    ],
  ].map(([p, o, a]) =>
    choice(
      'Отрицание',
      p as string,
      o as string[],
      a as string,
      'Поставьте no перед спрягаемым глаголом.',
      'В простом отрицании достаточно no + глагол.',
    ),
  ),
  truth(
    'В предложении «No trabajo hoy» отрицание стоит правильно.',
    'Верно',
    'No стоит непосредственно перед trabajo.',
  ),
  truth(
    'Правильно говорить «Yo no estudiar».',
    'Неверно',
    'Нужна личная форма: Yo no estudio.',
  ),
  truth(
    'Двойное отрицание допустимо: No veo nada.',
    'Верно',
    'В испанском отрицательные слова могут сочетаться с no.',
  ),
  typed(
    'Отрицание',
    'Напишите: «Мы сегодня не работаем».',
    'Hoy no trabajamos.',
    'hoy + no + trabajar',
    'Также возможно: No trabajamos hoy.',
  ),
  typed(
    'Кошачья фраза',
    'Напишите: «Мои коты не спят».',
    'Mis gatos no duermen.',
    'no ставится перед duermen',
    'dormir меняет o → ue, кроме nosotros/vosotros.',
  ),
  ...[
    ['___ te llamas?', ['Cómo', 'Dónde', 'Cuándo'], 'Cómo'],
    ['¿___ vives? — En Moscú.', ['Dónde', 'Quién', 'Qué'], 'Dónde'],
    ['¿___ desayunas? — A las ocho.', ['Cuándo', 'Quién', 'Cuál'], 'Cuándo'],
    ['¿___ es ella? — Mi hermana.', ['Quién', 'Dónde', 'Cómo'], 'Quién'],
    ['¿___ haces por la mañana?', ['Qué', 'Quién', 'Cuánto'], 'Qué'],
    ['¿___ años tienes?', ['Cuántos', 'Cómo', 'Dónde'], 'Cuántos'],
    [
      '¿___ estudias español? — Porque me gusta.',
      ['Por qué', 'Para qué', 'Cuándo'],
      'Por qué',
    ],
    ['¿___ libro prefieres?', ['Qué', 'Quién', 'Dónde'], 'Qué'],
    ['¿___ cuesta el café?', ['Cuánto', 'Cuándo', 'Cómo'], 'Cuánto'],
    ['¿___ gatos tienes?', ['Cuántos', 'Cuándo', 'Dónde'], 'Cuántos'],
  ].map(([p, o, a]) =>
    choice(
      'Вопросительные слова',
      p as string,
      o as string[],
      a as string,
      'Смотрите, какую информацию ждут в ответе.',
      'Вопросительные слова пишутся с графическим ударением.',
    ),
  ),
  ...[
    [
      '¿A qué hora te levantas? — ___',
      ['A las siete.', 'En siete.', 'Por siete horas.'],
      'A las siete.',
    ],
    [
      'Как спросить «Во сколько ты работаешь?»',
      ['¿A qué hora trabajas?', '¿Qué hora eres?', '¿Cuánto trabajas hora?'],
      '¿A qué hora trabajas?',
    ],
    ['1:00', ['Es la una.', 'Son la una.', 'Son las uno.'], 'Es la una.'],
    [
      '2:15',
      ['Son las dos y cuarto.', 'Es dos y quince.', 'Son dos menos cuarto.'],
      'Son las dos y cuarto.',
    ],
    [
      '7:30',
      [
        'Son las siete y media.',
        'Es la siete media.',
        'Son las ocho menos media.',
      ],
      'Son las siete y media.',
    ],
    [
      '8:45',
      [
        'Son las nueve menos cuarto.',
        'Son las ocho y cuarto.',
        'Es nueve menos quince.',
      ],
      'Son las nueve menos cuarto.',
    ],
    [
      '12:00',
      ['Son las doce en punto.', 'Es la doce punto.', 'Son doce y media.'],
      'Son las doce en punto.',
    ],
    [
      'Полдень',
      ['Es mediodía.', 'Es medianoche.', 'Son las tardes.'],
      'Es mediodía.',
    ],
    [
      'Полночь',
      ['Es medianoche.', 'Es mediodía.', 'Son las noche.'],
      'Es medianoche.',
    ],
    [
      'Урок начинается в девять.',
      [
        'La clase empieza a las nueve.',
        'La clase está en nueve.',
        'La clase empieza por nueve.',
      ],
      'La clase empieza a las nueve.',
    ],
  ].map(([p, o, a]) =>
    choice(
      'Время',
      p as string,
      o as string[],
      a as string,
      'Для времени используйте a la una / a las dos.',
      'В вопросе о времени используется ¿A qué hora…?',
    ),
  ),
  typed(
    'Распорядок',
    'Напишите: «Я встаю в семь».',
    'Me levanto a las siete.',
    'me levanto + a las siete',
    'Возвратное местоимение me ставится перед глаголом.',
  ),
  typed(
    'Распорядок',
    'Напишите: «После работы я читаю».',
    'Después del trabajo leo.',
    'después del trabajo + leer',
    'leer для yo → leo.',
  ),
  typed(
    'Кошачья фраза',
    'Напишите: «Кот ест в шесть».',
    'El gato come a las seis.',
    'el gato + comer + время',
    'Для él используется come.',
  ),
  order(
    'Соберите: обычно / вечером / учусь / я',
    [
      'Normalmente estudio por la tarde.',
      'Estudio normalmente la por tarde.',
      'Normalmente estudias por tarde.',
    ],
    'Normalmente estudio por la tarde.',
    'Наречие можно поставить в начале, затем личная форма глагола.',
  ),
  order(
    'Соберите вопрос: делаешь / что / утром?',
    [
      '¿Qué haces por la mañana?',
      '¿Haces qué la por mañana?',
      '¿Qué hacer tú mañana?',
    ],
    '¿Qué haces por la mañana?',
    'Qué ставится в начало вопроса и несёт ударение.',
  ),
];

const lesson4: LessonExercise[] = [
  ...[
    ['En mi piso ___ dos dormitorios.', ['hay', 'están', 'es'], 'hay'],
    ['La mesa ___ al lado de la ventana.', ['está', 'hay', 'es'], 'está'],
    ['¿Dónde ___ las llaves?', ['están', 'hay', 'son'], 'están'],
    ['___ una lámpara encima de la mesa.', ['Hay', 'Está', 'Es'], 'Hay'],
    [
      'El gato está ___ la cama.',
      ['debajo de', 'entre de', 'en de'],
      'debajo de',
    ],
    [
      'El sofá está ___ la televisión.',
      ['delante de', 'debajo a', 'entre de'],
      'delante de',
    ],
    [
      'La cocina está ___ el salón y el baño.',
      ['entre', 'detrás a', 'encima'],
      'entre',
    ],
    [
      'La silla está ___ del escritorio.',
      ['al lado', 'entre de', 'delante a'],
      'al lado',
    ],
    ['___ armario es nuevo. (рядом со мной)', ['Este', 'Esta', 'Ese'], 'Este'],
    [
      '___ ventana está abierta. (рядом со мной)',
      ['Esta', 'Este', 'Esa'],
      'Esta',
    ],
    ['___ sofá de allí es cómodo.', ['Ese', 'Este', 'Esa'], 'Ese'],
    ['___ lámpara de allí es bonita.', ['Esa', 'Ese', 'Esta'], 'Esa'],
    ['En el baño no ___ ventana.', ['hay', 'está', 'es'], 'hay'],
    ['Madrid ___ en España.', ['está', 'hay', 'es'], 'está'],
    ['La casa ___ grande y luminosa.', ['es', 'está', 'hay'], 'es'],
    ['El libro está ___ de la mesa.', ['encima', 'entre', 'detrás'], 'encima'],
    [
      'La alfombra está ___ del sofá.',
      ['delante', 'al lado en', 'entre de'],
      'delante',
    ],
    ['Hay ___ espejo en el dormitorio.', ['un', 'una', 'la'], 'un'],
    ['___ habitación es pequeña.', ['La', 'El', 'Un'], 'La'],
    ['Necesito ___ silla para el escritorio.', ['una', 'un', 'el'], 'una'],
  ].map(([p, o, a]) =>
    choice(
      'Дом и местоположение',
      p as string,
      o as string[],
      a as string,
      'Hay сообщает о наличии; estar — о местонахождении конкретного предмета.',
      'Выберите конструкцию по смыслу и согласуйте её с существительным.',
    ),
  ),
  typed(
    'Hay',
    'Напишите: «В гостиной есть диван».',
    'En el salón hay un sofá.',
    'en el salón + hay + un sofá',
    'После hay вводим новый предмет с un.',
  ),
  typed(
    'Estar',
    'Напишите: «Диван находится рядом с окном».',
    'El sofá está al lado de la ventana.',
    'estar + al lado de',
    'Конкретный диван находится в определённом месте.',
  ),
  typed(
    'Местоположение',
    'Напишите: «Кот находится под столом».',
    'El gato está debajo de la mesa.',
    'debajo de + артикль',
    'Для положения конкретного кота используется estar.',
  ),
  typed(
    'Местоположение',
    'Напишите: «Книги находятся на полке».',
    'Los libros están en la estantería.',
    'множественное число → están',
    'Estar согласуется с los libros.',
  ),
  typed(
    'Описание',
    'Напишите: «Моя квартира светлая».',
    'Mi piso es luminoso.',
    'ser + характеристика',
    'Постоянное описание жилья выражается через ser.',
  ),
  typed(
    'Отрицание',
    'Напишите: «В кухне нет окна».',
    'No hay una ventana en la cocina.',
    'no + hay',
    'Hay — безличная форма и не меняется по числам.',
  ),
  typed(
    'Указательные',
    'Напишите: «Этот стол новый».',
    'Esta mesa es nueva.',
    'esta + существительное женского рода',
    'Mesa и nueva имеют женский род.',
  ),
  typed(
    'Указательные',
    'Напишите: «Тот шкаф большой».',
    'Ese armario es grande.',
    'ese + armario',
    'Armario мужского рода, поэтому ese.',
  ),
  typed(
    'Вопрос',
    'Напишите: «Где находится ванная?»',
    '¿Dónde está el baño?',
    '¿Dónde está…?',
    'Конкретное помещение ищут с estar.',
  ),
  typed(
    'Описание квартиры',
    'Напишите: «В моей квартире три комнаты».',
    'En mi piso hay tres habitaciones.',
    'en mi piso + hay',
    'Количество предметов сообщается через hay.',
  ),
  typed(
    'Местоположение',
    'Напишите: «Лампа находится между кроватью и шкафом».',
    'La lámpara está entre la cama y el armario.',
    'entre X y Y',
    'После entre перечисляются две границы.',
  ),
  typed(
    'Кошачий дом',
    'Напишите: «Рядом с диваном есть кошачья лежанка».',
    'Hay una cama para el gato al lado del sofá.',
    'hay + предмет + al lado de',
    'de + el образует del.',
  ),
  typed(
    'Артикль',
    'Напишите: «В спальне есть зеркало».',
    'Hay un espejo en el dormitorio.',
    'un espejo',
    'Espejo мужского рода.',
  ),
  typed(
    'Комнаты',
    'Напишите: «Кухня находится за гостиной».',
    'La cocina está detrás del salón.',
    'detrás de + el',
    'de + el сокращается до del.',
  ),
  typed(
    'Предметы',
    'Напишите: «Эти стулья удобные».',
    'Estas sillas son cómodas.',
    'estas + sillas + cómodas',
    'Все три слова согласуются в женском множественном числе.',
  ),
  order(
    'Соберите: стол / у окна / находится',
    ['La mesa está junto a la ventana.'],
    'La mesa está junto a la ventana.',
    'Для местонахождения конкретного предмета используется estar.',
  ),
  order(
    'Соберите: в доме / есть / сад',
    ['Hay un jardín en la casa.'],
    'Hay un jardín en la casa.',
    'Hay обычно ставится перед вводимым предметом.',
  ),
  order(
    'Соберите: ключи / на столе',
    ['Las llaves están encima de la mesa.'],
    'Las llaves están encima de la mesa.',
    'С множественным подлежащим нужна форма están.',
  ),
  order(
    'Соберите: кресло / между / диваном и окном',
    ['El sillón está entre el sofá y la ventana.'],
    'El sillón está entre el sofá y la ventana.',
    'Entre соединяет две точки через y.',
  ),
  order(
    'Соберите вопрос: сколько / комнат / есть?',
    ['¿Cuántas habitaciones hay?'],
    '¿Cuántas habitaciones hay?',
    'Hay не изменяется после вопросительного количества.',
  ),
  order(
    'Соберите: эта / квартира / современная',
    ['Este piso es moderno.'],
    'Este piso es moderno.',
    'Este и moderno согласуются с piso.',
  ),
  order(
    'Соберите: лампа / над / столом',
    ['La lámpara está encima de la mesa.'],
    'La lámpara está encima de la mesa.',
    'Encima de обозначает положение сверху.',
  ),
  order(
    'Соберите: кот / за / дверью',
    ['El gato está detrás de la puerta.'],
    'El gato está detrás de la puerta.',
    'Detrás de обозначает положение позади.',
  ),
  order(
    'Соберите: здесь / нет / лифта',
    ['Aquí no hay ascensor.'],
    'Aquí no hay ascensor.',
    'Отрицание no ставится перед hay.',
  ),
  order(
    'Соберите: та / кровать / удобная',
    ['Esa cama es cómoda.'],
    'Esa cama es cómoda.',
    'Esa и cómoda согласуются с cama.',
  ),
  truth(
    'Hay изменяется на han, если предметов несколько.',
    'Неверно',
    'Hay — безличная форма и не меняется: hay una mesa, hay dos mesas.',
  ),
  truth(
    'Для положения конкретного предмета используется estar.',
    'Верно',
    'La mesa está en la cocina.',
  ),
  truth(
    '«La lámpara está debajo de la mesa» означает, что лампа под столом.',
    'Верно',
    'Debajo de — под чем-либо.',
  ),
  truth(
    'Перед женским словом mesa нужно este.',
    'Неверно',
    'Правильно: esta mesa.',
  ),
  truth(
    '«Hay el sofá» — обычный способ впервые представить диван.',
    'Неверно',
    'При первом упоминании естественно: Hay un sofá.',
  ),
];

const lesson5: LessonExercise[] = [
  ...[
    ['Me ___ el café.', ['gusta', 'gustan', 'gusto'], 'gusta'],
    ['Me ___ las manzanas.', ['gustan', 'gusta', 'gusto'], 'gustan'],
    ['A Ana le ___ el pescado.', ['gusta', 'gustan', 'quiero'], 'gusta'],
    [
      'Nos ___ los restaurantes pequeños.',
      ['gustan', 'gusta', 'gustamos'],
      'gustan',
    ],
    ['Yo ___ una ensalada.', ['quiero', 'quiere', 'quieres'], 'quiero'],
    ['Tú ___ té.', ['prefieres', 'prefiero', 'preferes'], 'prefieres'],
    ['Ella ___ agua con la comida.', ['bebe', 'bebo', 'bebes'], 'bebe'],
    ['Nosotros ___ a las dos.', ['comemos', 'comen', 'coméis'], 'comemos'],
    ['¿Qué ___ tomar?', ['quieres', 'quiere yo', 'gustas'], 'quieres'],
    ['Para mí, ___ café con leche.', ['un', 'una', 'unos'], 'un'],
    ['Hay ___ arroz en la cocina.', ['mucho', 'muchos', 'muchas'], 'mucho'],
    ['Compro ___ manzanas.', ['muchas', 'mucho', 'mucha'], 'muchas'],
    ['Queda ___ agua.', ['poca', 'poco', 'pocos'], 'poca'],
    [
      'Tenemos ___ pan para todos.',
      ['bastante', 'bastantes', 'bastanta'],
      'bastante',
    ],
    ['Me gusta ___ música del café.', ['la', 'una', 'el'], 'la'],
    ['No me gusta ___ pescado.', ['el', 'un', 'la'], 'el'],
    ['¿Cuánto ___ este bocadillo?', ['cuesta', 'cuestan', 'costar'], 'cuesta'],
    ['¿Cuánto ___ las tapas?', ['cuestan', 'cuesta', 'costan'], 'cuestan'],
    [
      'Yo ___ la carne, pero Ana prefiere pescado.',
      ['prefiero', 'prefiere', 'prefero'],
      'prefiero',
    ],
    ['Mis gatos ___ agua, no leche.', ['beben', 'bebe', 'bebemos'], 'beben'],
  ].map(([p, o, a]) =>
    choice(
      'Еда и предпочтения',
      p as string,
      o as string[],
      a as string,
      'С gustar согласуйте глагол с тем, что нравится.',
      'Проверьте лицо глагола, число существительного и количество.',
    ),
  ),
  typed(
    'Gustar',
    'Напишите: «Мне нравится кофе».',
    'Me gusta el café.',
    'me gusta + единственное число',
    'Café — единственное число, поэтому gusta.',
  ),
  typed(
    'Gustar',
    'Напишите: «Мне нравятся овощи».',
    'Me gustan las verduras.',
    'me gustan + множественное число',
    'Verduras — множественное число, поэтому gustan.',
  ),
  typed(
    'Предпочтение',
    'Напишите: «Я предпочитаю чай».',
    'Prefiero el té.',
    'preferir → prefiero',
    'В yo происходит чередование e → ie.',
  ),
  typed(
    'Заказ',
    'Напишите: «Я хочу заказать суп».',
    'Quiero pedir una sopa.',
    'querer + infinitivo',
    'После личной формы quiero идёт инфинитив pedir.',
  ),
  typed(
    'Кафе',
    'Напишите: «Счёт, пожалуйста».',
    'La cuenta, por favor.',
    'устойчивая фраза',
    'Это естественная короткая просьба официанту.',
  ),
  typed(
    'Напитки',
    'Напишите: «Мы пьём воду».',
    'Bebemos agua.',
    'beber → bebemos',
    'Неисчисляемое agua в общем значении употребляется без артикля.',
  ),
  typed(
    'Еда',
    'Напишите: «Они едят рис».',
    'Comen arroz.',
    'comer → comen',
    'Arroz здесь означает неопределённое количество.',
  ),
  typed(
    'Количество',
    'Напишите: «У меня мало времени на завтрак».',
    'Tengo poco tiempo para desayunar.',
    'poco + существительное',
    'Poco согласуется с tiempo в мужском единственном числе.',
  ),
  typed(
    'Количество',
    'Напишите: «Мы покупаем много фруктов».',
    'Compramos mucha fruta.',
    'mucha + fruta',
    'Fruta — женское неисчисляемое собирательное слово.',
  ),
  typed(
    'Цена',
    'Напишите: «Сколько стоит кофе?»',
    '¿Cuánto cuesta el café?',
    'cuánto cuesta',
    'С одним предметом используется cuesta.',
  ),
  typed(
    'Мини-диалог',
    'Ответьте в кафе: «Для меня салат и вода».',
    'Para mí, una ensalada y agua.',
    'Para mí…',
    'Так можно кратко назвать свой заказ.',
  ),
  typed(
    'Вкус',
    'Напишите: «Суп очень вкусный».',
    'La sopa está muy rica.',
    'estar + rico',
    'О вкусе готового блюда часто говорят estar rico.',
  ),
  typed(
    'Отрицание',
    'Напишите: «Я не люблю молоко».',
    'No me gusta la leche.',
    'no + me gusta',
    'Отрицание ставится перед косвенным местоимением.',
  ),
  typed(
    'Кошачья тема',
    'Напишите: «Кот предпочитает рыбу».',
    'El gato prefiere el pescado.',
    'preferir → prefiere',
    'В форме él происходит e → ie.',
  ),
  typed(
    'Выбор',
    'Напишите: «Ты хочешь кофе или чай?»',
    '¿Quieres café o té?',
    '¿Quieres…?',
    'Напитки в общем значении можно назвать без артикля.',
  ),
  order(
    'Соберите: мне / нравится / шоколад',
    ['Me gusta el chocolate.'],
    'Me gusta el chocolate.',
    'С gustar предмет является грамматическим подлежащим.',
  ),
  order(
    'Соберите: нам / нравятся / тапас',
    ['Nos gustan las tapas.'],
    'Nos gustan las tapas.',
    'Tapas во множественном числе требует gustan.',
  ),
  order(
    'Соберите заказ: я / хочу / кофе',
    ['Quiero un café, por favor.'],
    'Quiero un café, por favor.',
    'Un café означает одну чашку или порцию кофе.',
  ),
  order(
    'Соберите: Ана / предпочитает / воду',
    ['Ana prefiere el agua.'],
    'Ana prefiere el agua.',
    'Preferir имеет чередование e → ie.',
  ),
  order(
    'Соберите вопрос: что / будете / пить?',
    ['¿Qué quiere beber?'],
    '¿Qué quiere beber?',
    'Вежливое usted использует форму quiere.',
  ),
  order(
    'Соберите: хлеба / достаточно',
    ['Hay bastante pan.'],
    'Hay bastante pan.',
    'Bastante не меняется перед неисчисляемым pan.',
  ),
  order(
    'Соберите: мало / овощей',
    ['Hay pocas verduras.'],
    'Hay pocas verduras.',
    'Poco согласуется с verduras: pocas.',
  ),
  order(
    'Соберите: мы / едим / дома',
    ['Comemos en casa.'],
    'Comemos en casa.',
    'Comer для nosotros → comemos.',
  ),
  order(
    'Соберите: она / пьёт / чай',
    ['Ella toma té.'],
    'Ella toma té.',
    'Tomar часто означает пить напиток.',
  ),
  order(
    'Соберите: сколько / стоят / яблоки?',
    ['¿Cuánto cuestan las manzanas?'],
    '¿Cuánto cuestan las manzanas?',
    'Множественное число требует cuestan.',
  ),
  truth(
    'С одним предметом после me используется gusta.',
    'Верно',
    'Me gusta el café.',
  ),
  truth(
    '«Me gustan el café» — правильное согласование.',
    'Неверно',
    'El café — единственное число: Me gusta el café.',
  ),
  truth(
    'Mucho согласуется с исчисляемым существительным: muchas manzanas.',
    'Верно',
    'Определитель меняет род и число.',
  ),
  truth(
    'После quiero второй глагол ставится в личной форме.',
    'Неверно',
    'Правильно querer + infinitivo: Quiero comer.',
  ),
  truth(
    '«Para mí…» можно использовать, чтобы назвать свой заказ.',
    'Верно',
    'Например: Para mí, una sopa.',
  ),
];

export const courseLessons = [
  {
    id: 'intro',
    number: '01',
    title: 'Знакомство и о себе',
    subtitle: 'Имя, страна, профессия и первое описание себя',
    reward: 'Мягкая лежанка и миска',
    icon: '👋',
    theory: [
      {
        title: 'Личные местоимения',
        paragraphs: [
          'yo — я; tú — ты; él/ella — он/она; usted — Вы; nosotros/nosotras — мы; vosotros/vosotras — вы; ellos/ellas — они; ustedes — вы.',
          'В испанском местоимение часто опускают: Soy Ana звучит естественнее, чем постоянное Yo soy Ana. Оставляйте местоимение для контраста или акцента.',
        ],
        examples: [
          ['Soy de Rusia.', 'Я из России.'],
          ['Ella es médica.', 'Она врач.'],
          ['Nosotros somos amigos.', 'Мы друзья.'],
        ],
        note: 'Не путайте él «он» и el «определённый артикль»: ударение меняет значение.',
      },
      {
        title: 'Глагол ser',
        paragraphs: [
          'Ser описывает личность, профессию, происхождение, постоянную характеристику, материал, дату и время. Формы нужно выучить: soy, eres, es, somos, sois, son.',
          'Для профессии после ser неопределённый артикль обычно не нужен: Soy médico. Артикль появляется, если есть характеристика: Es una médica excelente.',
        ],
        examples: [
          ['Me llamo Leo y soy diseñador.', 'Меня зовут Лео, я дизайнер.'],
          ['Somos de Colombia.', 'Мы из Колумбии.'],
          ['El gato es tranquilo.', 'Кот спокойный.'],
        ],
      },
      {
        title: 'Род и согласование',
        paragraphs: [
          'Существительные часто оканчиваются на -o в мужском роде и на -a в женском, но есть исключения: el problema, el día, la mano. Род учите вместе с артиклем.',
          'Прилагательное согласуется с существительным: ruso/rusa/rusos/rusas. Прилагательные на -e часто не меняются по роду: amable, interesante.',
        ],
        examples: [
          ['un chico alto', 'высокий парень'],
          ['una chica alta', 'высокая девушка'],
          ['dos gatos curiosos', 'два любопытных кота'],
        ],
      },
      {
        title: 'Артикли и порядок слов',
        paragraphs: [
          'El/la называют конкретный или известный предмет; un/una вводят один новый предмет. Во множественном числе: los/las и unos/unas.',
          'Нейтральный порядок: подлежащее + глагол + дополнение. Прилагательное чаще стоит после существительного. Вопрос можно построить интонацией или вопросительным словом.',
        ],
        examples: [
          [
            'Tengo un gato. El gato se llama Sol.',
            'У меня есть кот. Кота зовут Соль.',
          ],
          [
            'Ana es una profesora excelente.',
            'Ана — прекрасный преподаватель.',
          ],
          ['¿De dónde eres?', 'Откуда ты?'],
        ],
      },
      {
        title: 'Знакомство: llamarse и представление',
        paragraphs: [
          'Для имени чаще используют llamarse: me llamo, te llamas, se llama, nos llamamos, os llamáis, se llaman. Это возвратный глагол, поэтому маленькое местоимение перед формой обязательно.',
          'Также можно сказать Mi nombre es… или Soy…, но ¿Cómo te llamas? — самый обычный вопрос. В вежливой речи: ¿Cómo se llama usted?',
        ],
        examples: [
          ['Me llamo Timur.', 'Меня зовут Тимур.'],
          ['¿Cómo se llama usted?', 'Как Вас зовут?'],
          ['Mucho gusto.', 'Очень приятно.'],
        ],
        note: 'Нельзя говорить Me llama Timur: это означало бы «он/она зовёт меня Тимур».',
      },
      {
        title: 'Ser, estar и hay: не смешивать',
        paragraphs: [
          'Ser отвечает на вопрос «что это / кто это / какой по сути»: Soy ingeniero. Estar — состояние и местонахождение: Estoy cansado; Madrid está en España. Hay сообщает о наличии: Hay un café aquí.',
          'Для мероприятий возможна особая конструкция ser: La fiesta es en mi casa. Для людей и предметов местонахождение выражается estar.',
        ],
        examples: [
          [
            'Soy ruso, pero estoy en México.',
            'Я русский, но сейчас в Мексике.',
          ],
          ['Hay dos gatos en casa.', 'В доме есть два кота.'],
          ['La reunión es a las seis.', 'Встреча в шесть.'],
        ],
        note: 'Не используйте ser для временного состояния: «я устал» — Estoy cansado.',
      },
      {
        title: 'Профессии, национальности и языки',
        paragraphs: [
          'После ser профессия обычно идёт без артикля: Soy médico. Если профессия уточняется прилагательным или выделяется как один представитель группы, возможен un/una: Es una médica excelente.',
          'Национальности и языки пишутся со строчной буквы: ruso, española, inglés. Национальность согласуется по роду и числу; название языка обычно мужского рода: el español.',
        ],
        examples: [
          ['Somos diseñadores.', 'Мы дизайнеры.'],
          [
            'Ella es una profesora muy paciente.',
            'Она очень терпеливая преподавательница.',
          ],
          ['Hablo ruso y español.', 'Я говорю по-русски и по-испански.'],
        ],
      },
      {
        title: 'Род: основные модели и исключения',
        paragraphs: [
          'Часто -o — мужской род, -a — женский; -ción, -sión, -dad, -tad, -tud обычно женские: la nación, la ciudad. Слова на -ma греческого происхождения часто мужские: el problema, el sistema, el idioma.',
          'Важные исключения: el día, el mapa, el planeta, la mano, la foto (fotografía), la moto (motocicleta). Слова на -ista могут обозначать любой род: el/la turista. Род всегда лучше учить вместе с артиклем.',
        ],
        examples: [
          ['el problema difícil', 'трудная проблема'],
          ['la mano derecha', 'правая рука'],
          ['una turista española', 'испанская туристка'],
        ],
        note: 'El agua использует el только в единственном числе перед ударным a-, но остаётся женского рода: el agua fría, las aguas frías.',
      },
      {
        title: 'Артикль: когда его нет',
        paragraphs: [
          'Артикль обычно не ставится перед именем, после ser с профессией без уточнения, после tener перед неисчисляемым или абстрактным существительным и при перечислении языков после hablar: Ana, soy médico, tengo hambre, hablo español.',
          'Определённый артикль нужен при обобщении: Me gusta la música; Los gatos son curiosos. С частями тела и одеждой часто используется el/la вместо притяжательного: Me lavo las manos.',
        ],
        examples: [
          ['Soy estudiante.', 'Я студент.'],
          ['Me gusta el café.', 'Мне нравится кофе.'],
          ['Me duele la cabeza.', 'У меня болит голова.'],
        ],
      },
      {
        title: 'Позиция прилагательного',
        paragraphs: [
          'Нейтральное описательное прилагательное чаще стоит после существительного: una casa grande. Перед существительным оно может выражать субъективную оценку или менять оттенок значения.',
          'Некоторые пары меняют смысл: un amigo viejo — пожилой друг; un viejo amigo — давний друг. un hombre grande — крупный мужчина; un gran hombre — великий человек.',
        ],
        examples: [
          ['una ciudad bonita', 'красивый город'],
          ['mi viejo amigo', 'мой давний друг'],
          ['una gran profesora', 'выдающийся преподаватель'],
        ],
        note: 'Grande сокращается до gran перед существительным любого рода в единственном числе.',
      },
      {
        title: 'Вопросы, отрицание и вежливость',
        paragraphs: [
          'Да/нет-вопрос часто отличается только интонацией и знаками: ¿Eres estudiante? Вопросительное слово ставится в начало: ¿De dónde eres? ¿Qué profesión tienes?',
          'No ставится перед глаголом: No soy de España. Для вежливого обращения используйте usted и форму 3-го лица: ¿Es usted la señora López?',
        ],
        examples: [
          ['¿Eres Ana? — Sí, soy yo.', 'Ты Ана? — Да, это я.'],
          ['No somos de aquí.', 'Мы не отсюда.'],
          ['¿De dónde es usted?', 'Откуда Вы?'],
        ],
      },
      {
        title: 'Полная система артиклей',
        paragraphs: [
          'Определённые артикли: el — мужской единственного числа, la — женский единственного, los — мужской или смешанный множественного, las — женский множественного. Неопределённые: un, una, unos, unas.',
          'Артикль согласуется с существительным, а не с человеком, которому предмет принадлежит: la casa de Pedro, el coche de Ana. Если между ними стоит прилагательное, согласование всё равно определяется существительным: una gran ciudad.',
        ],
        examples: [
          ['el libro / los libros', 'книга / книги'],
          ['la mesa / las mesas', 'стол / столы'],
          ['un gato / unas gatas', 'один кот / несколько кошек'],
        ],
        note: 'Артикль нельзя выбирать только по последней букве. Сначала определите род самого слова.',
      },
      {
        title: 'Определённый артикль: предмет известен',
        paragraphs: [
          'El/la/los/las употребляются, когда собеседник понимает, о каком объекте речь: он уже упоминался, единственный в ситуации или уточнён дополнением.',
          'После первого упоминания неопределённый артикль обычно сменяется определённым: Veo un gato. El gato está en la ventana. Уточнение делает объект конкретным: la profesora de español.',
        ],
        examples: [
          ['Cierra la puerta.', 'Закрой дверь (понятно, какую).'],
          ['El libro de Ana es interesante.', 'Книга Аны интересная.'],
          [
            'Hay un café. El café está abierto.',
            'Есть кафе. Это кафе открыто.',
          ],
        ],
      },
      {
        title: 'Определённый артикль: обобщения',
        paragraphs: [
          'Когда речь идёт о всём классе предметов, явлении или понятии вообще, испанский часто использует определённый артикль там, где в русском его нет: Los gatos son curiosos.',
          'С глаголами gustar, encantar, interesar, odiar и preferir название явления обычно идёт с артиклем: Me gusta la música; Prefiero el té. Во множественном числе артикль обозначает класс целиком.',
        ],
        examples: [
          ['El español es una lengua romance.', 'Испанский — романский язык.'],
          ['Me encanta el verano.', 'Я обожаю лето.'],
          ['Los niños necesitan dormir.', 'Детям нужно спать.'],
        ],
      },
      {
        title: 'Неопределённый артикль: новое и неконкретное',
        paragraphs: [
          'Un/una вводят новый предмет, называют один экземпляр из класса или показывают, что точный объект не важен: Busco un hotel.',
          'Unos/unas часто означают «несколько», «какие-то» или приблизительное количество: unos amigos, unas dos horas. Это не всегда прямой перевод русского «одни».',
        ],
        examples: [
          ['Tengo una pregunta.', 'У меня есть вопрос.'],
          ['Necesitamos un taxi.', 'Нам нужно такси.'],
          ['Vinieron unos amigos.', 'Пришли несколько друзей.'],
        ],
        note: 'После hay при исчисляемом существительном в единственном числе обычно нужен un/una: Hay una farmacia aquí.',
      },
      {
        title: 'Нулевой артикль: когда ничего не ставим',
        paragraphs: [
          'Артикль обычно отсутствует перед именами людей, большинством городов и стран, профессией после ser без описания, языком после hablar/estudiar/aprender и неисчисляемым существительным в неопределённом количестве.',
          'После tener часто нет артикля в устойчивых состояниях и при общем обладании: tener hambre, tener miedo, tener coche. Но конкретный предмет требует артикля или другого определителя: Tengo el coche de Ana.',
        ],
        examples: [
          ['Ana vive en Madrid.', 'Ана живёт в Мадриде.'],
          ['Soy arquitecto.', 'Я архитектор.'],
          ['Bebo café y estudio español.', 'Я пью кофе и учу испанский.'],
        ],
        note: 'Сравните: Estudio español — учу испанский; El español de Chile — испанский язык Чили, конкретная разновидность.',
      },
      {
        title: 'El с женскими словами на ударное a-',
        paragraphs: [
          'Женские существительные, начинающиеся с ударного a- или ha-, в единственном числе получают el или un непосредственно перед словом: el agua, el águila, el hacha, un aula. Это сделано ради произношения.',
          'Род остаётся женским: прилагательное имеет женскую форму. Во множественном числе возвращаются las/unas. Если между артиклем и существительным стоит другое слово, используется la: la fría agua.',
        ],
        examples: [
          ['el agua fría', 'холодная вода'],
          ['un águila blanca', 'белый орёл (слово женского рода)'],
          ['las aulas grandes', 'большие аудитории'],
        ],
        note: 'Если a- безударное, правило не действует: la amiga, la arena, la avenida.',
      },
      {
        title: 'Слияния al и del',
        paragraphs: [
          'Предлог a + артикль el обязательно сливаются в al; de + el — в del: voy al museo, vengo del banco. С la, los и las слияния нет: a la oficina, de los amigos.',
          'Слияния не происходит, если El входит в официальное имя собственное: viajamos a El Salvador; una noticia de El País. Перед местоимением él тоже нет слияния: hablo de él.',
        ],
        examples: [
          ['Vamos al centro.', 'Мы идём в центр.'],
          ['Salgo del trabajo.', 'Я ухожу с работы.'],
          ['Hablo de él.', 'Я говорю о нём.'],
        ],
      },
      {
        title: 'Артикль с днями недели, датами и временем',
        paragraphs: [
          'Определённый артикль употребляется с днями недели: el lunes — в этот/ближайший понедельник; los lunes — по понедельникам. После ser при назывании дня возможна конструкция Hoy es lunes без артикля.',
          'При дате: Es el cinco de mayo. При времени: Es la una; Son las dos. Чтобы сказать время действия, нужен предлог a: a la una, a las dos.',
        ],
        examples: [
          ['El lunes trabajo.', 'В понедельник я работаю.'],
          ['Los domingos descanso.', 'По воскресеньям я отдыхаю.'],
          ['La clase es a las ocho.', 'Занятие в восемь.'],
        ],
        note: 'После cada артикля нет: cada lunes — каждый понедельник.',
      },
      {
        title: 'Части тела, одежда и личные вещи',
        paragraphs: [
          'С частями тела и одеждой испанский часто использует определённый артикль вместо притяжательного, если владелец понятен из местоимения или глагола: Me lavo las manos; Se pone el abrigo.',
          'Притяжательное появляется, когда нужно противопоставить владельцев или устранить неоднозначность: No es mi chaqueta, es la tuya.',
        ],
        examples: [
          ['Me cepillo los dientes.', 'Я чищу зубы.'],
          ['Le duele la cabeza.', 'У него/неё болит голова.'],
          ['El gato levanta la pata.', 'Кот поднимает лапу.'],
        ],
      },
      {
        title: 'Страны, города, реки и горы',
        paragraphs: [
          'Большинство стран и городов употребляются без артикля: vivo en España, viajo a Bogotá. Некоторые названия традиционно имеют артикль или допускают его: el Perú, el Brasil, la India, los Estados Unidos. Употребление зависит от региона и стиля.',
          'Реки, моря, океаны, горные цепи и некоторые районы обычно требуют артикля: el Amazonas, el Mediterráneo, los Andes, la Patagonia. Если артикль часть названия, он пишется с заглавной буквы только по официальной норме конкретного имени.',
        ],
        examples: [
          ['Vivo en Argentina.', 'Я живу в Аргентине.'],
          ['Viajo a los Estados Unidos.', 'Я еду в Соединённые Штаты.'],
          ['Los Andes son enormes.', 'Анды огромны.'],
        ],
        note: 'С географическими названиями полезно проверять словарную форму: нормы иногда различаются по странам.',
      },
      {
        title: 'Имена, фамилии и титулы',
        paragraphs: [
          'Перед обычным именем человека артикль в нейтральной литературной речи не ставится: Ana es médica. Перед титулом или обращением при упоминании третьего лица артикль обычно есть: el señor López, la doctora Ruiz. При прямом обращении артикль исчезает: Buenos días, señor López.',
          'Артикль с именем человека возможен разговорно в некоторых регионах или при обозначении произведения/семьи, но начинающему лучше не использовать его без контекста.',
        ],
        examples: [
          ['La señora García es profesora.', 'Госпожа Гарсия — преподаватель.'],
          ['Buenos días, doctora Ruiz.', 'Доброе утро, доктор Руис.'],
          ['Los García viven aquí.', 'Семья Гарсия живёт здесь.'],
        ],
      },
      {
        title: 'Род по окончаниям: полезные закономерности',
        paragraphs: [
          'Обычно мужские: слова на -o, -or, -aje, -ma греческого происхождения: el libro, el profesor, el viaje, el idioma. Обычно женские: -a, -ción/-sión, -dad/-tad, -tud, -umbre: la casa, la canción, la ciudad, la juventud, la costumbre.',
          'Эти модели помогают угадывать, но не заменяют запоминание. Заимствования и сокращения получают род по употреблению или полному слову: la foto ← fotografía, la moto ← motocicleta.',
        ],
        examples: [
          ['el mensaje importante', 'важное сообщение'],
          ['la televisión española', 'испанское телевидение'],
          ['la libertad personal', 'личная свобода'],
        ],
        note: 'Слова на -e и согласную могут быть любого рода: el coche, la noche, el árbol, la flor.',
      },
      {
        title: 'Слова общего рода и названия профессий',
        paragraphs: [
          'Некоторые названия людей имеют одну форму, а род показывает артикль: el/la estudiante, el/la artista, el/la periodista, el/la joven. Прилагательное при этом согласуется с человеком: la artista famosa.',
          'Другие профессии имеют пары: médico/médica, profesor/profesora, actor/actriz. Современная норма предпочитает женскую форму, если она существует и речь идёт о женщине.',
        ],
        examples: [
          ['el estudiante ruso', 'русский студент'],
          ['la estudiante rusa', 'русская студентка'],
          ['una actriz famosa', 'известная актриса'],
        ],
      },
      {
        title: 'Слова, значение которых меняется с родом',
        paragraphs: [
          'У некоторых одинаково выглядящих слов артикль меняет значение: el capital — капитал, la capital — столица; el cura — священник, la cura — лечение; el cometa — комета, la cometa — воздушный змей.',
          'Другие важные пары: el orden — порядок, la orden — приказ; el frente — фронт/передняя часть, la frente — лоб; el pendiente — серьга/нерешённый вопрос, la pendiente — склон.',
        ],
        examples: [
          ['Madrid es la capital.', 'Мадрид — столица.'],
          ['Necesitamos el capital.', 'Нам нужен капитал.'],
          ['La orden es clara.', 'Приказ ясен.'],
        ],
        note: 'Такие пары нужно учить как отдельные словарные единицы вместе с артиклем.',
      },
      {
        title: 'Неизменяемые и необычные существительные',
        paragraphs: [
          'Некоторые существительные имеют форму множественного числа, но называют парный предмет: las gafas, los pantalones. Другие обычно употребляются только в единственном числе как неисчисляемые: la gente, el dinero, la información.',
          'Gente грамматически единственного числа: La gente es amable, не son. Слова el/la mar допускают два рода в зависимости от региона и стиля; для начинающего нейтрально el mar.',
        ],
        examples: [
          ['La gente es simpática.', 'Люди приветливые.'],
          ['Necesito información.', 'Мне нужна информация.'],
          ['¿Dónde están las gafas?', 'Где очки?'],
        ],
      },
      {
        title: 'Uno, un и числа',
        paragraphs: [
          'Числительное uno сокращается до un перед существительным мужского рода: un libro, veintiún libros. Перед женским существительным используется una: una casa, veintiuna casas. Самостоятельно остаётся uno: Tengo uno.',
          'Unos/unas могут быть неопределённым артиклем или приблизительным числом: unos veinte minutos — около двадцати минут. Перед тысячей артикль обычно не нужен: mil personas.',
        ],
        examples: [
          ['Tengo un gato.', 'У меня один кот.'],
          ['Somos veintiuna personas.', 'Нас двадцать один человек.'],
          ['Espera unos minutos.', 'Подожди несколько минут.'],
        ],
      },
      {
        title: 'Нейтральное lo',
        paragraphs: [
          'Lo — не артикль мужского рода и не ставится перед обычным существительным. Оно образует абстрактное понятие из прилагательного, наречия или конструкции с que: lo importante, lo mejor, lo de ayer, lo que dices.',
          'Форма lo неизменяема. Сравните: el bueno — хороший мужчина/конкретный хороший предмет; lo bueno — хорошая сторона или всё хорошее.',
        ],
        examples: [
          [
            'Lo importante es practicar.',
            'Важно практиковаться / важное — практика.',
          ],
          ['No entiendo lo que dices.', 'Я не понимаю то, что ты говоришь.'],
          ['Lo mejor es descansar.', 'Лучше всего отдохнуть.'],
        ],
        note: 'Нельзя говорить lo libro или lo gato. Перед существительным нужны el/un и другие обычные определители.',
      },
      {
        title: 'Артикль и другие определители',
        paragraphs: [
          'Обычно перед существительным выбирают один основной определитель: артикль, притяжательное или указательное слово. Поэтому: mi gato, este libro, dos casas — без el/un перед ними.',
          'Нельзя сочетать *el mi gato или *un este libro. Но артикль может входить в другую конструкцию: uno de los gatos, el libro de mi hermano, todos los días.',
        ],
        examples: [
          ['Mi casa es pequeña.', 'Мой дом маленький.'],
          ['Este gato es de Ana.', 'Этот кот Аны.'],
          ['Todos los días estudio.', 'Я занимаюсь каждый день.'],
        ],
      },
      {
        title: 'Частые ошибки: финальная проверка',
        paragraphs: [
          'Проверяйте четыре вещи: известен ли предмет, исчисляем ли он, какого он рода и числа, нет ли перед ним другого определителя. Затем проверьте согласование прилагательного.',
          'Не переносите русский нулевой артикль автоматически: «я люблю кошек» — Me gustan los gatos. Не добавляйте артикль автоматически перед профессией: Soy programador. Не путайте el и él, tu и tú.',
        ],
        examples: [
          ['Es una ciudad grande.', 'Это большой город.'],
          ['La ciudad es grande.', 'Этот/известный город большой.'],
          ['Soy guía turístico.', 'Я туристический гид.'],
        ],
        note: 'Лучший способ учить род — карточкой целиком: не casa, а la casa; не problema, а el problema.',
      },
    ] as TheoryBlock[],
    // Agreement and country/nationality prompts need their supplied choices:
    // without them the sentence does not determine one particular adjective.
    exercises: diversifyExercises(lesson1, false),
  },
  {
    id: 'family',
    number: '02',
    title: 'Семья и люди',
    subtitle: 'Семья, внешность и характер',
    reward: 'Когтеточка, полка и игрушки',
    icon: '👨‍👩‍👧',
    theory: [
      {
        title: 'Tener: иметь и описывать',
        paragraphs: [
          'Tener — неправильный глагол: tengo, tienes, tiene, tenemos, tenéis, tienen. Он выражает обладание, возраст и устойчивые состояния.',
          'Внешность часто описывают через tener: tiene los ojos verdes, tiene el pelo corto. Характер обычно описывают через ser: es amable.',
        ],
        examples: [
          ['Tengo dos hermanas.', 'У меня две сестры.'],
          ['Mi abuelo tiene setenta años.', 'Моему дедушке семьдесят лет.'],
          ['Los gatos tienen hambre.', 'Коты голодны.'],
        ],
        note: 'Возраст по-испански «имеют»: Tengo veinte años, не Soy veinte años.',
      },
      {
        title: 'Mi, tu, su',
        paragraphs: [
          'Краткие притяжательные ставятся перед существительным: mi/mis, tu/tus, su/sus, nuestro/a/os/as, vuestro/a/os/as.',
          'Они согласуются не с владельцем, а с тем, чем владеют: su hermano, sus hermanas. Su может означать «его», «её», «Ваш» или «их» — значение даёт контекст.',
        ],
        examples: [
          ['Mi madre y mis hermanos', 'моя мама и мои братья'],
          ['¿Cómo se llama tu gata?', 'Как зовут твою кошку?'],
          ['Nuestros gatos son naranjas.', 'Наши коты рыжие.'],
        ],
      },
      {
        title: 'Прилагательные',
        paragraphs: [
          'Прилагательные на -o имеют четыре формы: alto, alta, altos, altas. На -e обычно меняют только число: amable/amables.',
          'Если группа смешанная, традиционно используется мужское множественное число: Ana y Pedro son altos. Характер: amable, divertido, serio, paciente, tímido. Внешность: alto, bajo, joven, moreno.',
        ],
        examples: [
          ['una persona amable', 'добрый человек'],
          ['dos chicas divertidas', 'две весёлые девушки'],
          ['un gato pequeño y curioso', 'маленький любопытный кот'],
        ],
      },
      {
        title: 'Множественное число',
        paragraphs: [
          'После гласной добавляйте -s: gato → gatos. После согласной — -es: mujer → mujeres. z меняется на c: luz → luces.',
          'Ударение иногда меняется или исчезает: joven → jóvenes. Артикль, существительное и прилагательное должны быть в одном числе.',
        ],
        examples: [
          [
            'la hija pequeña → las hijas pequeñas',
            'маленькая дочь → маленькие дочери',
          ],
          ['mi amigo → mis amigos', 'мой друг → мои друзья'],
          [
            'el joven amable → los jóvenes amables',
            'добрый юноша → добрые юноши',
          ],
        ],
      },
      {
        title: 'Семья: ключевая лексика',
        paragraphs: [
          'padre/madre — отец/мать; padres может означать «родители». hermano/hermana — брат/сестра; hijo/hija — сын/дочь; abuelo/abuela — дедушка/бабушка; nieto/nieta — внук/внучка.',
          'tío/tía — дядя/тётя; primo/prima — двоюродный брат/сестра; sobrino/sobrina — племянник/племянница; marido/esposo и mujer/esposa — муж и жена. Pareja — партнёр или пара.',
        ],
        examples: [
          ['Mis padres viven en Kazán.', 'Мои родители живут в Казани.'],
          [
            'Tengo dos primos y una prima.',
            'У меня два двоюродных брата и сестра.',
          ],
          ['Esta es mi pareja.', 'Это мой партнёр / моя партнёрша.'],
        ],
        note: 'Слово padres без уточнения включает обоих родителей; madres означает только матерей.',
      },
      {
        title: 'Tener: все частые выражения',
        paragraphs: [
          'Кроме обладания и возраста tener используется в устойчивых сочетаниях: tener hambre, sed, sueño, frío, calor, miedo, prisa, razón, suerte. На русский они часто переводятся прилагательным или безличной конструкцией.',
          'Согласуется только tener, существительное остаётся неизменным: Tengo hambre; Ellos tienen hambre. Для состояния «мне жарко» не используйте estar caliente: это может иметь другое значение.',
        ],
        examples: [
          ['Tenemos sueño.', 'Мы хотим спать.'],
          ['¿Tienes frío?', 'Тебе холодно?'],
          ['Mi gata tiene miedo.', 'Моя кошка боится.'],
        ],
      },
      {
        title: 'Tener que и hay que',
        paragraphs: [
          'Tener que + инфинитив выражает личную необходимость: Tengo que llamar a mi madre. Hay que + инфинитив — общее правило или безличную необходимость: Hay que descansar.',
          'После que всегда идёт инфинитив, а не личная форма. Отрицание ставится перед tener или hay: No tengo que trabajar; No hay que correr.',
        ],
        examples: [
          ['Tenemos que ayudar a la abuela.', 'Нам нужно помочь бабушке.'],
          ['Hay que cuidar a los gatos.', 'Нужно заботиться о котах.'],
          [
            'No tienes que venir hoy.',
            'Тебе не обязательно приходить сегодня.',
          ],
        ],
      },
      {
        title: 'Чьи вещи: su и уточнение владельца',
        paragraphs: [
          'Su/sus может означать «его», «её», «Ваш/Ваша», «их». Если контекст неясен, используйте конструкцию de + человек: el hermano de Ana, la casa de ellos.',
          'После существительного возможны полные формы mío, tuyo, suyo: un amigo mío. Они согласуются с предметом: una amiga mía, unos amigos míos.',
        ],
        examples: [
          ['Su gato es blanco.', 'Его/её/Ваш/их кот белый.'],
          ['El gato de ella es blanco.', 'Её кот белый.'],
          ['Es una amiga mía.', 'Она одна из моих подруг.'],
        ],
        note: 'Не говорите un mi amigo. Правильно mi amigo или un amigo mío.',
      },
      {
        title: 'Внешность: ser, tener и llevar',
        paragraphs: [
          'Ser описывает рост и общую характеристику: es alto, es joven. Tener — части тела и их признаки: tiene los ojos azules, tiene el pelo largo. Llevar — одежду, аксессуары и текущий внешний образ: lleva gafas, lleva barba.',
          'Для волос и глаз прилагательное согласуется с pelo/ojos, а не с человеком: Ana tiene el pelo corto; Pedro tiene los ojos verdes.',
        ],
        examples: [
          ['Mi padre es alto.', 'Мой отец высокий.'],
          ['Tiene el pelo rizado.', 'У него/неё кудрявые волосы.'],
          ['Hoy lleva una camisa azul.', 'Сегодня он/она в синей рубашке.'],
        ],
      },
      {
        title: 'Характер и временное поведение',
        paragraphs: [
          'Ser + прилагательное описывает устойчивую черту: Es tranquilo. Estar + прилагательное — состояние сейчас: Está nervioso. Иногда выбор меняет смысл: es aburrido — скучный человек; está aburrido — ему скучно.',
          'Другие важные пары: ser listo — быть умным; estar listo — быть готовым. ser malo — быть плохим; estar malo — болеть или быть испорченным.',
        ],
        examples: [
          ['Mi hermana es alegre.', 'Моя сестра жизнерадостная.'],
          ['Hoy está triste.', 'Сегодня ей грустно.'],
          ['El gato está listo para jugar.', 'Кот готов играть.'],
        ],
      },
      {
        title: 'Множественное число: особые случаи',
        paragraphs: [
          'Слова на безударные -s или -x часто не меняются: el lunes → los lunes. Иностранные слова обычно получают -s или -es по употреблению. Сложные формы и сокращения лучше проверять в словаре.',
          'При добавлении -es может меняться письменное ударение для сохранения произношения: joven → jóvenes, canción → canciones. Слова на z меняют z на c: feliz → felices.',
        ],
        examples: [
          [
            'un joven feliz → dos jóvenes felices',
            'один счастливый юноша → двое',
          ],
          ['el lunes → los lunes', 'понедельник → понедельники'],
          ['la luz azul → las luces azules', 'синий свет → синие огни'],
        ],
      },
      {
        title: 'Muy, mucho, poco и bastante',
        paragraphs: [
          'Muy ставится перед прилагательным или наречием и не меняется: muy amable, muy bien. Mucho может быть наречием после глагола и не меняться: trabaja mucho; либо определителем и согласовываться: muchos amigos, mucha paciencia.',
          'Poco и bastante работают сходно: poco tiempo, pocas personas; bastante tiempo, bastantes personas. Для усиления существительного нельзя использовать muy: не muy amigos, а muchos amigos.',
        ],
        examples: [
          ['Mi abuela es muy paciente.', 'Моя бабушка очень терпеливая.'],
          ['Tenemos muchos amigos.', 'У нас много друзей.'],
          ['Los gatos duermen mucho.', 'Коты много спят.'],
        ],
      },
    ] as TheoryBlock[],
    exercises: diversifyExercises(lesson2),
  },
  {
    id: 'day',
    number: '03',
    title: 'Мой день',
    subtitle: 'Распорядок, действия и время',
    reward: 'Огоньки и два котика в готовом доме',
    icon: '⏰',
    theory: [
      {
        title: 'Presente правильных глаголов',
        paragraphs: [
          'Уберите -ar, -er или -ir и добавьте окончание. -AR: o, as, a, amos, áis, an. -ER: o, es, e, emos, éis, en. -IR: o, es, e, imos, ís, en.',
          'Некоторые частые глаголы меняют основу: dormir → duermo, volver → vuelvo. Ir полностью особый: voy, vas, va, vamos, vais, van.',
        ],
        examples: [
          ['Trabajo de nueve a seis.', 'Я работаю с девяти до шести.'],
          ['Comemos a las dos.', 'Мы едим в два.'],
          ['Mi gato duerme mucho.', 'Мой кот много спит.'],
        ],
      },
      {
        title: 'Возвратные действия и отрицание',
        paragraphs: [
          'В распорядке часто нужны возвратные глаголы: levantarse, ducharse, acostarse. Местоимения me/te/se/nos/os/se ставятся перед личной формой: me levanto.',
          'Для отрицания поставьте no прямо перед глаголом или возвратным местоимением: no trabajo, no me levanto. Двойное отрицание нормально: No veo nada.',
        ],
        examples: [
          ['Me levanto a las siete.', 'Я встаю в семь.'],
          ['No desayunamos en casa.', 'Мы не завтракаем дома.'],
          ['Luna no se despierta temprano.', 'Луна не просыпается рано.'],
        ],
      },
      {
        title: 'Вопросительные слова',
        paragraphs: [
          'Qué — что/какой; quién — кто; dónde — где; cuándo — когда; cómo — как; cuánto — сколько; por qué — почему. В прямом вопросе они пишутся с ударением.',
          'Вопросительные знаки ставятся с двух сторон: ¿…? После вопросительного слова идёт обычная личная форма глагола: ¿Dónde trabajas?',
        ],
        examples: [
          ['¿Qué haces por la mañana?', 'Что ты делаешь утром?'],
          ['¿Dónde comes?', 'Где ты ешь?'],
          ['¿Por qué estudias español?', 'Почему ты учишь испанский?'],
        ],
      },
      {
        title: 'Время и a qué hora',
        paragraphs: [
          'Чтобы спросить время вообще: ¿Qué hora es? Чтобы узнать время действия: ¿A qué hora…? Ответ: a la una, a las dos.',
          '1:00 — Es la una. Для остальных часов — Son las…. y cuarto — четверть после; y media — половина; menos cuarto — без четверти.',
        ],
        examples: [
          ['¿A qué hora te levantas?', 'Во сколько ты встаёшь?'],
          ['A las ocho y media.', 'В половине девятого.'],
          ['La clase empieza a las nueve.', 'Урок начинается в девять.'],
        ],
      },
      {
        title: 'Чередование гласных в основе',
        paragraphs: [
          'У части глаголов под ударением меняется гласная основы: e→ie (pensar → pienso), o→ue (dormir → duermo), e→i (pedir → pido), u→ue (jugar → juego).',
          'В nosotros и vosotros ударение падает на окончание, поэтому чередования обычно нет: pensamos, dormimos, pedimos, jugamos. Окончания при этом остаются обычными.',
        ],
        examples: [
          ['Me despierto a las siete.', 'Я просыпаюсь в семь.'],
          ['Volvemos a casa.', 'Мы возвращаемся домой.'],
          ['Los gatos duermen de día.', 'Коты спят днём.'],
        ],
        note: 'Изменяется только последняя подходящая гласная основы: preferir → prefiero, но preferimos.',
      },
      {
        title: 'Особые формы yo',
        paragraphs: [
          'Частые формы yo нужно учить отдельно: hacer → hago, poner → pongo, salir → salgo, traer → traigo, conocer → conozco, saber → sé, ver → veo, dar → doy.',
          'Некоторые глаголы сочетают особую форму yo и чередование в других лицах: tener → tengo, tienes; venir → vengo, vienes; decir → digo, dices.',
        ],
        examples: [
          ['Hago ejercicio por la mañana.', 'Я занимаюсь утром.'],
          ['Salgo de casa a las ocho.', 'Я выхожу из дома в восемь.'],
          ['Pongo comida para el gato.', 'Я кладу еду коту.'],
        ],
      },
      {
        title: 'Возвратные глаголы подробно',
        paragraphs: [
          'Инфинитив на -se показывает, что действие направлено на самого человека: levantar → поднимать, levantarse → вставать. Формы местоимений: me, te, se, nos, os, se.',
          'Перед личной формой местоимение пишется отдельно: me ducho. С инфинитивом его можно присоединить: Voy a ducharme, или поставить перед первым глаголом: Me voy a duchar. Оба варианта правильны.',
        ],
        examples: [
          ['Nos acostamos tarde.', 'Мы ложимся поздно.'],
          ['Voy a vestirme.', 'Я собираюсь одеться.'],
          ['No me levanto temprano.', 'Я не встаю рано.'],
        ],
        note: 'У возвратного глагола всё равно нужно обычное личное окончание: te levantas, не te levantar.',
      },
      {
        title: 'Наречия частоты и последовательность дня',
        paragraphs: [
          'Siempre — всегда; casi siempre — почти всегда; normalmente — обычно; a menudo — часто; a veces — иногда; casi nunca — почти никогда; nunca — никогда. Они могут стоять перед глаголом или после него в зависимости от акцента.',
          'Для последовательности используйте primero, después/luego, entonces, al final. После antes de и después de перед глаголом идёт инфинитив: antes de trabajar, después de comer.',
        ],
        examples: [
          ['Normalmente desayuno en casa.', 'Обычно я завтракаю дома.'],
          ['Después de trabajar, descanso.', 'После работы я отдыхаю.'],
          ['Mi gato nunca duerme aquí.', 'Мой кот здесь никогда не спит.'],
        ],
      },
      {
        title: 'Части дня и предлоги времени',
        paragraphs: [
          'por la mañana, por la tarde, por la noche описывают часть дня вообще. Для точного времени используйте a: a las ocho. Для дня недели регулярного действия — определённый артикль: los lunes; для конкретного дня — el lunes.',
          'de… a… задаёт промежуток: Trabajo de nueve a cinco. desde… hasta… подчёркивает начальную и конечную точки. En используется с месяцами и годами: en mayo, en 2026.',
        ],
        examples: [
          ['Estudio por la tarde.', 'Я учусь днём/вечером.'],
          [
            'Trabajo de lunes a viernes.',
            'Я работаю с понедельника по пятницу.',
          ],
          ['El lunes ceno con Ana.', 'В этот понедельник ужинаю с Аной.'],
        ],
      },
      {
        title: 'Время: разговорные варианты',
        paragraphs: [
          'После половины часа в Испании часто считают до следующего часа: 8:45 — las nueve menos cuarto. В Латинской Америке также обычно услышать las ocho y cuarenta y cinco. Оба варианта понятны.',
          'Для приблизительности: sobre las ocho — около восьми. en punto — ровно. del mediodía/de la tarde/de la noche уточняют часть суток, если это важно.',
        ],
        examples: [
          ['Son las diez en punto.', 'Ровно десять.'],
          ['Llego sobre las seis.', 'Я прихожу около шести.'],
          ['La cita es a las ocho de la noche.', 'Встреча в восемь вечера.'],
        ],
      },
      {
        title: 'Построение вопросов без инверсии',
        paragraphs: [
          'В испанском не нужен вспомогательный глагол вроде английского do. Вопрос можно сделать интонацией: ¿Trabajas aquí? Если есть вопросительное слово, оно обычно стоит первым: ¿Dónde trabajas?',
          'Подлежащее может идти после глагола, особенно если это новая информация: ¿Dónde trabaja Ana? Вопросительное слово сохраняет ударение даже в косвенном вопросе: No sé dónde trabaja.',
        ],
        examples: [
          ['¿Comes en casa?', 'Ты ешь дома?'],
          ['¿Cuándo llegan tus padres?', 'Когда приезжают твои родители?'],
          ['Dime a qué hora sales.', 'Скажи, во сколько ты выходишь.'],
        ],
      },
      {
        title: 'Ir a + infinitivo и планы',
        paragraphs: [
          'Для ближайших планов используйте ir a + инфинитив: voy a trabajar, vamos a cenar. Спрягается только ir; второй глагол остаётся инфинитивом.',
          'Отрицание ставится перед ir: No voy a salir. Вопросительное слово — перед всей конструкцией: ¿Qué vas a hacer? Если после a идёт el + существительное, получается al: voy al trabajo; перед инфинитивом слияния нет.',
        ],
        examples: [
          ['Voy a estudiar esta noche.', 'Я буду заниматься сегодня вечером.'],
          ['¿A qué hora vas a volver?', 'Во сколько ты вернёшься?'],
          ['Los gatos van a dormir.', 'Коты собираются спать.'],
        ],
      },
      {
        title: 'Глаголы с личным a',
        paragraphs: [
          'Когда прямое дополнение — конкретный человек или домашнее животное, перед ним часто ставится a: Veo a mi madre; llamo al médico; busco a mi gato. Перед неодушевлённым предметом a не ставится: Busco las llaves.',
          'С tener личное a обычно не употребляется: Tengo dos hermanos. После hay также нет личного a: Hay un médico aquí.',
        ],
        examples: [
          [
            'Visito a mis abuelos los domingos.',
            'Я навещаю бабушку и дедушку по воскресеньям.',
          ],
          ['Busco a Luna.', 'Я ищу Луну (кошку).'],
          ['Busco mi teléfono.', 'Я ищу телефон.'],
        ],
        note: 'Это a не переводится как «к»; оно лишь отмечает одушевлённое прямое дополнение.',
      },
    ] as TheoryBlock[],
    exercises: diversifyExercises(lesson3),
  },
  {
    id: 'home',
    number: '04',
    title: 'Дом и квартира',
    subtitle: 'Комнаты, мебель и местоположение предметов',
    reward: 'Кошачье окно и мягкий плед',
    icon: '🏠',
    theory: [
      {
        title: 'Hay: сообщаем, что что-то существует',
        paragraphs: [
          'Hay — неизменяемая форма глагола haber со значением «есть, имеется, находятся». Она одинаково употребляется с одним и несколькими предметами: Hay una mesa; Hay dos sillas.',
          'Hay вводит новую информацию, поэтому после него часто стоят un/una/unos/unas, число или существительное без артикля. Определённый артикль сразу после hay обычно не употребляется.',
        ],
        examples: [
          ['Hay un sofá en el salón.', 'В гостиной есть диван.'],
          ['Hay tres ventanas.', 'Есть три окна.'],
          ['No hay ascensor.', 'Лифта нет.'],
        ],
        note: 'Не изменяйте hay по числу: формы hayn или han в этом значении не существует.',
      },
      {
        title: 'Estar: где находится известный предмет',
        paragraphs: [
          'Estar используется, когда предмет уже определён и нужно сообщить его местонахождение: La mesa está en la cocina. С множественным числом — están.',
          'Сравните: Hay una mesa en la cocina — в кухне есть какой-то стол. La mesa está en la cocina — известный нам стол находится в кухне.',
        ],
        examples: [
          ['¿Dónde está el baño?', 'Где находится ванная?'],
          ['Las llaves están en la mesa.', 'Ключи лежат на столе.'],
          [
            'Mi gato está debajo de la cama.',
            'Мой кот находится под кроватью.',
          ],
        ],
      },
      {
        title: 'Ser, estar и hay',
        paragraphs: [
          'Ser описывает постоянное качество жилья: El piso es grande. Estar показывает положение или временное состояние: La ventana está abierta. Hay сообщает о наличии: Hay una ventana.',
          'Чтобы выбрать глагол, задайте вопрос: «какой?» → ser; «где/в каком состоянии?» → estar; «что здесь есть?» → hay.',
        ],
        examples: [
          ['La casa es luminosa.', 'Дом светлый.'],
          ['La puerta está cerrada.', 'Дверь закрыта.'],
          ['Hay mucha luz.', 'Здесь много света.'],
        ],
      },
      {
        title: 'Предлоги места',
        paragraphs: [
          'en — в/на; encima de — на, сверху; debajo de — под; delante de — перед; detrás de — за; al lado de — рядом с; entre — между.',
          'После составных предлогов сохраняется de. Если затем идёт el, образуется del: al lado del sofá, detrás del armario. С la слияния нет: delante de la puerta.',
        ],
        examples: [
          ['La lámpara está encima de la mesa.', 'Лампа стоит на столе.'],
          ['El gato está detrás del sofá.', 'Кот находится за диваном.'],
          [
            'La cama está entre dos ventanas.',
            'Кровать стоит между двумя окнами.',
          ],
        ],
      },
      {
        title: 'Este/esta и ese/esa',
        paragraphs: [
          'Este/esta указывают на предмет рядом с говорящим: este sofá, esta silla. Ese/esa — на предмет дальше или рядом с собеседником: ese armario, esa puerta.',
          'Указательные согласуются по роду и числу: estos/estas, esos/esas. Перед существительным они заменяют артикль: esta mesa, а не la esta mesa.',
        ],
        examples: [
          ['Esta habitación es pequeña.', 'Эта комната маленькая.'],
          ['Ese balcón tiene mucha luz.', 'На том балконе много света.'],
          ['Estas llaves son mías.', 'Эти ключи мои.'],
        ],
      },
      {
        title: 'Артикль и род предметов дома',
        paragraphs: [
          'Учите предмет вместе с артиклем: el salón, el dormitorio, el armario, el espejo; la cocina, la habitación, la mesa, la pared.',
          'Первое упоминание обычно использует un/una, повторное — el/la: Hay una lámpara. La lámpara está junto a la cama.',
        ],
        examples: [
          [
            'Hay un espejo. El espejo es grande.',
            'Есть зеркало. Это зеркало большое.',
          ],
          ['Necesito una silla.', 'Мне нужен стул.'],
          ['La pared es blanca.', 'Стена белая.'],
        ],
      },
      {
        title: 'Как описать квартиру связным текстом',
        paragraphs: [
          'Начните с общей характеристики через ser, затем перечислите помещения через hay и закончите местоположением важных предметов через estar.',
          'Полезный план: Vivo en…; Mi piso es…; Hay…; La cocina está…; En mi habitación tengo… Так описание звучит связно, а не как список слов.',
        ],
        examples: [
          [
            'Vivo en un piso pequeño y luminoso.',
            'Я живу в небольшой светлой квартире.',
          ],
          [
            'Hay dos dormitorios y un salón.',
            'В квартире две спальни и гостиная.',
          ],
          [
            'Mi escritorio está al lado de la ventana.',
            'Мой письменный стол стоит рядом с окном.',
          ],
        ],
      },
    ] as TheoryBlock[],
    exercises: diversifyExercises(lesson4),
  },
  {
    id: 'food',
    number: '05',
    title: 'Еда и напитки',
    subtitle: 'Вкусы, продукты и простой заказ в кафе',
    reward: 'Кошачья кухня и праздничная миска',
    icon: '🍽️',
    theory: [
      {
        title: 'Gustar: предмет нравится человеку',
        paragraphs: [
          'В конструкции gustar грамматическое подлежащее — то, что нравится. Поэтому с одним предметом или инфинитивом используется gusta, а с несколькими — gustan.',
          'Кому нравится, показывают местоимения me, te, le, nos, os, les. Для уточнения добавляют a + человек: A Ana le gusta el té.',
        ],
        examples: [
          ['Me gusta el café.', 'Мне нравится кофе.'],
          ['Me gustan las frutas.', 'Мне нравятся фрукты.'],
          ['A mis gatos les gusta dormir.', 'Моим котам нравится спать.'],
        ],
        note: 'Не говорите Yo gusto el café в значении «мне нравится кофе».',
      },
      {
        title: 'Querer и preferir',
        paragraphs: [
          'Querer выражает желание: quiero, quieres, quiere, queremos, queréis, quieren. После него можно поставить существительное или инфинитив: Quiero un café; Quiero comer.',
          'Preferir означает «предпочитать» и меняет e на ie во всех формах, кроме nosotros/vosotros: prefiero, prefieres, prefiere, preferimos, preferís, prefieren.',
        ],
        examples: [
          ['Quiero una sopa, por favor.', 'Я хочу суп, пожалуйста.'],
          ['Prefiero el té sin azúcar.', 'Я предпочитаю чай без сахара.'],
          ['¿Qué quieres beber?', 'Что ты хочешь выпить?'],
        ],
      },
      {
        title: 'Comer, beber и tomar',
        paragraphs: [
          'Comer — есть; beber — пить. Tomar шире: пить напиток, принимать пищу или заказывать/употреблять что-либо в конкретной ситуации. В Испании tomar часто звучит естественно в кафе.',
          'Все три глагола в presente: como/comes, bebo/bebes, tomo/tomas. Спрягайте первый глагол, а после querer оставляйте инфинитив.',
        ],
        examples: [
          ['Comemos a las dos.', 'Мы обедаем в два.'],
          ['Bebo mucha agua.', 'Я пью много воды.'],
          ['¿Tomamos un café?', 'Выпьем кофе?'],
        ],
      },
      {
        title: 'Исчисляемые и неисчисляемые продукты',
        paragraphs: [
          'Исчисляемые предметы можно считать: una manzana, dos huevos, tres botellas. Неисчисляемые называют вещество или массу: agua, arroz, pan, azúcar.',
          'Неисчисляемое слово в неопределённом количестве часто идёт без артикля: Bebo agua; Compro pan. Порция делает его исчисляемым: un café, dos cervezas.',
        ],
        examples: [
          ['Necesito arroz y leche.', 'Мне нужны рис и молоко.'],
          ['Quiero dos manzanas.', 'Я хочу два яблока.'],
          ['Tomamos tres cafés.', 'Мы выпиваем три чашки кофе.'],
        ],
      },
      {
        title: 'Mucho, poco и bastante',
        paragraphs: [
          'Перед существительным mucho и poco согласуются: mucho arroz, mucha agua, muchos tomates, pocas manzanas. Bastante имеет одну форму в единственном и форму bastantes во множественном.',
          'После глагола mucho и poco работают как наречия и не меняются: Como poco; Trabajamos mucho. Muy используется перед прилагательным: muy rico, но не muy arroz.',
        ],
        examples: [
          ['Hay mucha fruta.', 'Есть много фруктов.'],
          ['Queda poco pan.', 'Осталось мало хлеба.'],
          ['Tenemos bastantes bebidas.', 'У нас достаточно напитков.'],
        ],
      },
      {
        title: 'Артикли с едой',
        paragraphs: [
          'Когда продукт называется вообще после gustar/preferir, обычно используется определённый артикль: Me gusta el pescado; Prefiero la fruta. При заказе одной порции — un/una: Quiero una ensalada.',
          'После comer/beber/tomar при неопределённом количестве артикль часто отсутствует: Bebo café. Конкретный продукт получает el/la: Bebo el café que preparaste.',
        ],
        examples: [
          ['No me gusta la leche.', 'Мне не нравится молоко.'],
          ['Para mí, una ensalada.', 'Мне салат.'],
          ['Bebo el agua de esta botella.', 'Я пью воду из этой бутылки.'],
        ],
      },
      {
        title: 'Мини-диалог в кафе',
        paragraphs: [
          'Начните с вежливого обращения, назовите заказ через Quiero… или Para mí…, уточните цену через ¿Cuánto cuesta…? и попросите счёт: La cuenta, por favor.',
          'Quisiera звучит мягче, но на начальном уровне корректное Quiero…, por favor тоже нормально. Официант может спросить ¿Qué desea? или ¿Qué va a tomar?',
        ],
        examples: [
          [
            '— ¿Qué va a tomar? — Un café con leche.',
            '— Что будете пить? — Кофе с молоком.',
          ],
          ['¿Cuánto cuesta el menú?', 'Сколько стоит комплексный обед?'],
          ['La cuenta, por favor.', 'Счёт, пожалуйста.'],
        ],
      },
    ] as TheoryBlock[],
    exercises: diversifyExercises(lesson5),
  },
];
