export type LessonExercise = {
  kind: string;
  mode: 'choice' | 'type' | 'order' | 'truefalse';
  prompt: string;
  options?: string[];
  answer: string;
  acceptedAnswers?: string[];
  hint: string;
  explanation: string;
};

export type TheoryBlock = {
  title: string;
  paragraphs: string[];
  examples: [string, string][];
  highlight?: string;
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
  acceptedAnswers?: string[],
): LessonExercise => ({
  kind,
  mode: 'type',
  prompt,
  answer,
  acceptedAnswers,
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
  hint: 'Сверьте утверждение с правилом и выберите «Верно» или «Неверно».',
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

const lesson1Original: LessonExercise[] = [
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

const lesson1Keep = (prompt: string) => {
  const exercise = lesson1Original.find((item) => item.prompt === prompt);
  if (!exercise) throw new Error(`Missing lesson 1 exercise: ${prompt}`);
  return exercise;
};

// Reuse useful original tasks so existing resume points and mistake IDs remain
// valid, while replacing repeated drills with practice for the wider theory.
const lesson1: LessonExercise[] = [
  ...[
    'Yo ___ Ana.',
    'Tú ___ de Chile.',
    'Él ___ médico.',
    'Nosotros ___ estudiantes.',
    'Usted ___ el señor Ruiz.',
    'Luna y Sol ___ mis gatos.',
    '___ gato duerme en la silla.',
    '___ gata se llama Luna.',
    '___ problema es pequeño.',
    '___ mano está fría.',
    'Busco ___ trabajo.',
    'Tengo ___ amigo en Perú.',
    'María es ___.',
    'Carlos es ___.',
    'La doctora es ___.',
    'Los amigos son ___.',
    'Pedro y Ana son ___.',
  ].map(lesson1Keep),
  ...lesson1Original.filter(
    (item) => !['Ser', 'Артикли', 'Согласование'].includes(item.kind),
  ),
  ...[
    ['Madrid ___ la capital de España.', ['es', 'está', 'hay'], 'es'],
    ['Ana ___ cansada hoy.', ['está', 'es', 'hay'], 'está'],
    ['Mis amigos ___ en casa.', ['están', 'son', 'hay'], 'están'],
    ['En mi calle ___ una cafetería.', ['hay', 'está', 'es'], 'hay'],
    ['En la mesa ___ dos libros.', ['hay', 'están', 'son'], 'hay'],
    ['El libro ___ encima de la mesa.', ['está', 'es', 'hay'], 'está'],
    ['Mi hermana ___ muy inteligente.', ['es', 'está', 'hay'], 'es'],
    ['¿Dónde ___ el baño?', ['está', 'es', 'hay'], 'está'],
  ].map(([prompt, options, answer]) =>
    choice(
      'Ser, estar или hay',
      prompt as string,
      options as string[],
      answer as string,
      'Ser — характеристика; estar — состояние или местонахождение; hay — наличие.',
      'Выберите конструкцию по смыслу предложения.',
    ),
  ),
  ...[
    ['Soy ___ médico.', ['без артикля', 'un', 'el'], 'без артикля'],
    ['Ana es ___ estudiante.', ['без артикля', 'una', 'la'], 'без артикля'],
    ['Hablo ___ español.', ['без артикля', 'el', 'un'], 'без артикля'],
    ['Vivo con ___ mi madre.', ['без артикля', 'la', 'una'], 'без артикля'],
    ['Laura es ___ excelente médica.', ['una', 'без артикля', 'la'], 'una'],
  ].map(([prompt, options, answer]) =>
    choice(
      'Нулевой артикль',
      prompt as string,
      options as string[],
      answer as string,
      'Перед профессией после ser обычно нет артикля; другой определитель также заменяет артикль.',
      'Артикль зависит от конструкции и наличия другого определителя.',
    ),
  ),
  ...[
    [
      'Hay ___ gato en el jardín. ___ gato es negro.',
      ['un / El', 'el / Un', 'un / Un'],
      'un / El',
    ],
    [
      'Busco ___ piso pequeño, no конкретную квартиру.',
      ['un', 'el', 'без артикля'],
      'un',
    ],
    [
      'Cierra ___ puerta, por favor. Оба знают, о какой двери речь.',
      ['la', 'una', 'без артикля'],
      'la',
    ],
    ['Necesito ___ bolígrafo cualquiera.', ['un', 'el', 'без артикля'], 'un'],
    ['___ sol sale por el este.', ['El', 'Un', 'без артикля'], 'El'],
    ['Esta es ___ casa de Ana.', ['la', 'una', 'без артикля'], 'la'],
  ].map(([prompt, options, answer]) =>
    choice(
      'Определённый и неопределённый артикль',
      prompt as string,
      options as string[],
      answer as string,
      'Un/una вводит новый или неконкретный предмет; el/la указывает на известный или единственный.',
      'Сначала определите, известен ли собеседникам предмет.',
    ),
  ),
  ...[
    ['Voy ___ supermercado.', ['al', 'a el', 'del'], 'al'],
    ['Vengo ___ supermercado.', ['del', 'de el', 'al'], 'del'],
    ['Escribo ___ profesor.', ['al', 'del', 'a la'], 'al'],
    ['La puerta ___ hotel está abierta.', ['del', 'al', 'de el'], 'del'],
  ].map(([prompt, options, answer]) =>
    choice(
      'Al и del',
      prompt as string,
      options as string[],
      answer as string,
      'a + el = al; de + el = del.',
      'Перед мужским артиклем el предлоги a и de образуют слитные формы.',
    ),
  ),
  choice(
    'Вопросы и отрицание',
    'Как спросить: «Ты студент?»',
    ['¿Eres estudiante?', '¿Estudiante eres qué?', '¿Tú ser estudiante?'],
    '¿Eres estudiante?',
    'В испанском не нужен вспомогательный глагол.',
    'Интонация и знаки ¿? превращают утверждение в общий вопрос.',
  ),
  choice(
    'Вопросы и отрицание',
    'Как сказать: «Я не врач»?',
    ['No soy médico.', 'Soy no médico.', 'No médico soy no.'],
    'No soy médico.',
    'No ставится перед спрягаемым глаголом.',
    'Правильный порядок: no + soy.',
  ),
  choice(
    'Вопросы и отрицание',
    'Как вежливо спросить незнакомого взрослого о профессии?',
    ['¿A qué se dedica usted?', '¿Qué trabajas tú?', '¿Dónde profesión?'],
    '¿A qué se dedica usted?',
    'Используйте usted и форму третьего лица.',
    '¿A qué se dedica usted? — нейтральный вежливый вопрос о профессии.',
  ),
  choice(
    'Вопросы и отрицание',
    '___ eres? — Soy de México.',
    ['¿De dónde', '¿Cómo', '¿Qué'],
    '¿De dónde',
    'Ответ сообщает происхождение.',
    'Для происхождения спрашивают ¿De dónde eres?',
  ),
  choice(
    'Вопросы и отрицание',
    '___ te llamas? — Me llamo Elena.',
    ['¿Cómo', '¿Dónde', '¿Quién'],
    '¿Cómo',
    'Нужен вопрос о имени.',
    'Стандартная модель: ¿Cómo te llamas?',
  ),
  ...[
    [
      'Выберите обычный нейтральный порядок.',
      ['una casa grande', 'una grande casa', 'casa una grande'],
      'una casa grande',
    ],
    [
      'Выберите обычный нейтральный порядок.',
      ['un gato blanco', 'un blanco gato', 'blanco un gato'],
      'un gato blanco',
    ],
    [
      'В сочетании una gran ciudad слово gran означает:',
      [
        'великий / значительный город',
        'город большого размера',
        'старый город',
      ],
      'великий / значительный город',
    ],
  ].map(([prompt, options, answer]) =>
    choice(
      'Позиция прилагательного',
      prompt as string,
      options as string[],
      answer as string,
      'Описательное прилагательное обычно стоит после существительного.',
      'Позиция прилагательного может быть нейтральной или менять оттенок значения.',
    ),
  ),
  ...[
    ['___ casa es grande. (моя)', ['Mi', 'La mi', 'Una mi'], 'Mi'],
    [
      '___ libro es interesante. (этот)',
      ['Este', 'El este', 'Un este'],
      'Este',
    ],
    [
      '___ amigos viven aquí. (некоторые)',
      ['Algunos', 'Los algunos', 'Unos los'],
      'Algunos',
    ],
  ].map(([prompt, options, answer]) =>
    choice(
      'Артикль и определители',
      prompt as string,
      options as string[],
      answer as string,
      'Притяжательное, указательное или неопределённое слово уже занимает место артикля.',
      'Обычный артикль перед таким определителем не добавляется.',
    ),
  ),
];

const lesson2Original: LessonExercise[] = [
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

const lesson2Keep = (prompt: string) => {
  const exercise = lesson2Original.find((item) => item.prompt === prompt);
  if (!exercise) throw new Error(`Missing lesson 2 exercise: ${prompt}`);
  return exercise;
};

// Keep the lesson at 50 focused tasks. Existing prompts are reused where they
// still fit so saved mistake IDs and resume points continue to resolve.
const lesson2: LessonExercise[] = [
  ...[
    'Yo ___ una hermana.',
    'Tú ___ dos gatos.',
    'Mi madre ___ ojos verdes.',
    'Nosotros ___ una familia grande.',
    '___ madre se llama Elena.',
    '¿Cómo se llama ___ hermano?',
    'Ana vive con ___ familia.',
    'Tenemos dos gatos. ___ gatos son naranjas.',
    'Mi hermana es ___.',
    'Pedro tiene los ojos ___.',
    'la mujer → …',
    'la luz → …',
    'Напишите: «Моей кошке три года».',
  ].map(lesson2Keep),
  typed(
    'Множественное число',
    'Преобразуйте всё словосочетание во множественное число: la hija pequeña.',
    'las hijas pequeñas',
    'Измените артикль, существительное и прилагательное.',
    'la → las, hija → hijas, pequeña → pequeñas.',
  ),
  typed(
    'Множественное число',
    'Преобразуйте всё словосочетание во множественное число: su hermana.',
    'sus hermanas',
    'Измените притяжательное и существительное.',
    'su → sus, hermana → hermanas.',
  ),
  choice(
    'Семья',
    'Mi tío es el ___ de mi madre.',
    ['hermano', 'hijo', 'abuelo'],
    'hermano',
    'Определите родственную связь.',
    'Дядя — брат отца или матери.',
  ),
  ...[
    [
      'Después de caminar, tengo ___. Quiero comer.',
      ['hambre', 'sed', 'sueño'],
      'hambre',
      'быть голодным',
    ],
    [
      'Después de correr, tenemos ___. Queremos agua.',
      ['sed', 'frío', 'suerte'],
      'sed',
      'хотеть пить',
    ],
    [
      'Es medianoche y Ana tiene ___.',
      ['sueño', 'calor', 'prisa'],
      'sueño',
      'хотеть спать',
    ],
    [
      'Cierra la ventana: tengo ___.',
      ['frío', 'hambre', 'razón'],
      'frío',
      'мёрзнуть',
    ],
    [
      'Abre la ventana: tenemos ___.',
      ['calor', 'miedo', 'sed'],
      'calor',
      'испытывать жару',
    ],
    [
      'El niño tiene ___ de la oscuridad.',
      ['miedo', 'prisa', 'suerte'],
      'miedo',
      'бояться',
    ],
    [
      'Salimos en dos minutos: tengo ___.',
      ['prisa', 'razón', 'sueño'],
      'prisa',
      'спешить',
    ],
    [
      'Sí, tú tienes ___. Esta respuesta es correcta.',
      ['razón', 'hambre', 'frío'],
      'razón',
      'быть правым',
    ],
    [
      'Encontré el último billete: tengo ___.',
      ['suerte', 'sed', 'calor'],
      'suerte',
      'мне повезло',
    ],
  ].map(([prompt, options, answer, meaning]) =>
    choice(
      'Выражения с tener',
      prompt as string,
      options as string[],
      answer as string,
      `tener ${answer as string} — ${meaning as string}`,
      'В устойчивом выражении изменяется только форма tener.',
    ),
  ),
  ...[
    [
      'Yo ___ llamar a mi madre.',
      ['tengo que', 'tienes que', 'tiene'],
      'tengo que',
    ],
    [
      'Nosotros ___ ayudar a la abuela.',
      ['tenemos que', 'tienen que', 'tenemos'],
      'tenemos que',
    ],
    [
      'После tengo que нужна форма ___.',
      ['инфинитива', 'yo', 'прошедшего времени'],
      'инфинитива',
    ],
    [
      'No tienes que venir hoy означает:',
      [
        'Тебе не обязательно приходить сегодня.',
        'Тебе запрещено приходить сегодня.',
        'Ты не пришёл сегодня.',
      ],
      'Тебе не обязательно приходить сегодня.',
    ],
  ].map(([prompt, options, answer]) =>
    choice(
      'Tener que',
      prompt as string,
      options as string[],
      answer as string,
      'Спрягайте tener; после que оставляйте инфинитив.',
      'Tener que + infinitivo выражает необходимость конкретного человека.',
    ),
  ),
  ...[
    [
      '___ libro que tengo en la mano es interesante.',
      ['Este', 'Ese', 'Aquel'],
      'Este',
    ],
    [
      '¿Cuánto cuesta ___ revista que está junto a usted?',
      ['esa', 'esta', 'aquella'],
      'esa',
    ],
    [
      'Mira las montañas lejanas. ___ montañas son altas.',
      ['Aquellas', 'Estas', 'Esos'],
      'Aquellas',
    ],
    ['No sé qué es ___ que está aquí.', ['esto', 'este', 'esta'], 'esto'],
    [
      'Nací en 1983. ___ mismo año nació mi prima.',
      ['Ese', 'Este', 'Aquel'],
      'Ese',
    ],
    [
      '2001 fue un año extraordinario. ___ verano conocí a Maite.',
      ['Ese', 'Este', 'Aquel'],
      'Ese',
    ],
    [
      'Luis se casó en 1970. En ___ época yo vivía en México.',
      ['aquella', 'esta', 'esas'],
      'aquella',
    ],
    [
      '___ mes ha sido fabuloso: he encontrado piso y trabajo.',
      ['Este', 'Ese', 'Aquel'],
      'Este',
    ],
    ['¿Qué haces ___ noche?', ['esta', 'esa', 'aquella'], 'esta'],
  ].map(([prompt, options, answer]) =>
    choice(
      'Указательные',
      prompt as string,
      options as string[],
      answer as string,
      'este — близко; ese — у собеседника или прошлое; aquel — далеко.',
      'Форма согласуется с существительным; esto/eso/aquello употребляются самостоятельно.',
    ),
  ),
  ...[
    ['Voy ___ Madrid mañana.', ['a', 'en', 'de'], 'a'],
    ['Soy ___ Perú.', ['de', 'a', 'con'], 'de'],
    ['Vivo ___ Moscú.', ['en', 'a', 'por'], 'en'],
    ['Café ___ leche, por favor.', ['con', 'sin', 'de'], 'con'],
    ['Este regalo es ___ mi hermana.', ['para', 'por', 'a'], 'para'],
    ['Gracias ___ tu ayuda.', ['por', 'para', 'en'], 'por'],
  ].map(([prompt, options, answer]) =>
    choice(
      'Базовые предлоги',
      prompt as string,
      options as string[],
      answer as string,
      'a — направление; de — откуда/чей; en — где; con — с; para — цель; por — причина.',
      'Выбор предлога зависит от отношения между словами.',
    ),
  ),
  order(
    'Соберите описание внешности',
    ['Mi padre tiene el pelo corto.'],
    'Mi padre tiene el pelo corto.',
    'Части тела и внешность часто описывают через tener.',
  ),
  choice(
    'Ser или estar',
    'Mi hermana обычно спокойная, но сегодня нервничает: Es tranquila, pero hoy ___.',
    ['está nerviosa', 'es nerviosa', 'tiene nerviosa'],
    'está nerviosa',
    'Постоянная черта — ser; состояние сейчас — estar.',
    'Временное состояние выражается estar + прилагательное.',
  ),
  choice(
    'Особое множественное число',
    'un joven feliz → …',
    ['unos jóvenes felices', 'unos jovenes feliz', 'unas jóvenes felices'],
    'unos jóvenes felices',
    'joven получает ударение, z меняется на c.',
    'Правильно: jóvenes и felices.',
  ),
  choice(
    'Muy и mucho',
    'Mi abuela es ___ paciente.',
    ['muy', 'mucho', 'mucha'],
    'muy',
    'Перед прилагательным используется muy.',
    'Muy не меняется и усиливает прилагательное.',
  ),
  choice(
    'Muy и mucho',
    'Tenemos ___ amigos.',
    ['muchos', 'muy', 'mucho'],
    'muchos',
    'Перед существительным mucho согласуется в роде и числе.',
    'С amigos нужна форма muchos.',
  ),
  truth(
    '«Su madre» может означать «его мама», «её мама», «Ваша мама» или «их мама».',
    'Верно',
    'Если владелец неясен, уточните: la madre de él/de ella/de usted/de ellos.',
  ),
  ...[
    [
      'Yo ___ español con mi amiga. Глагол: hablar.',
      ['hablo', 'hablas', 'habla'],
      'hablo',
    ],
    [
      'Tú ___ desde casa. Глагол: trabajar.',
      ['trabajas', 'trabajo', 'trabaja'],
      'trabajas',
    ],
    [
      'Ella ___ español cada día. Глагол: estudiar.',
      ['estudia', 'estudias', 'estudio'],
      'estudia',
    ],
    [
      'Nosotros ___ música por la tarde. Глагол: escuchar.',
      ['escuchamos', 'escuchan', 'escucháis'],
      'escuchamos',
    ],
    [
      'Vosotros ___ mucho en verano. Глагол: viajar.',
      ['viajáis', 'viajamos', 'viajan'],
      'viajáis',
    ],
    [
      'Ellos ___ fruta en el mercado. Глагол: comprar.',
      ['compran', 'compra', 'compramos'],
      'compran',
    ],
    [
      'Usted ___ descansar. Глагол: necesitar.',
      ['necesita', 'necesitas', 'necesito'],
      'necesita',
    ],
    [
      'Mi padre ___ muy bien. Глагол: cocinar.',
      ['cocina', 'cocino', 'cocinan'],
      'cocina',
    ],
    [
      'Ana y Luis ___ salsa. Глагол: bailar.',
      ['bailan', 'baila', 'bailamos'],
      'bailan',
    ],
    [
      'Для nosotros у правильного глагола на -ar окончание:',
      ['-amos', '-áis', '-an'],
      '-amos',
    ],
  ].map(([prompt, options, answer]) =>
    choice(
      'Presente · глаголы на -ar',
      prompt as string,
      options as string[],
      answer as string,
      'Уберите -ar и добавьте окончание: -o, -as, -a, -amos, -áis, -an.',
      'Правильный глагол на -ar получает окончание, соответствующее подлежащему.',
    ),
  ),
];

const lesson2TheoryOrder = [
  'Tener: иметь и описывать',
  'Tener: все частые выражения',
  'Tener que + инфинитив',
  'Presente: первое спряжение на -ar',
  'Семья: ключевая лексика',
  'Mi, tu, su',
  'Чьи вещи: su и уточнение владельца',
  'Множественное число',
  'Множественное число: особые случаи',
  'Прилагательные',
  'Muy, mucho, poco и bastante',
  'Внешность: ser, tener и llevar',
  'Характер и состояние',
  'Указательные: este, ese, aquel',
  'Самые нужные предлоги',
] as const;

const lesson3: LessonExercise[] = [
  choice(
    'Правильные глаголы',
    'Yo ___ español cada día. (hablar)',
    ['hablo', 'hablas', 'habla', 'hablamos'],
    'hablo',
    'Для yo у правильных глаголов окончание -o.',
    'hablar → hablo.',
  ),
  typed(
    'Правильные глаголы',
    'Впишите только форму глагола trabajar для tú.',
    'trabajas',
    'Уберите -ar и добавьте -as.',
    'trabajar → trabajas.',
  ),
  order(
    'Соберите предложение: мы / живём / в Мадриде.',
    ['Vivimos en Madrid.', 'Viven en Madrid.', 'Vivimos Madrid en.'],
    'Vivimos en Madrid.',
    'Для nosotros: vivir → vivimos.',
  ),
  truth(
    'Форма «comemos» соответствует nosotros.',
    'Верно',
    'У глаголов на -er для nosotros окончание -emos.',
  ),
  choice(
    'Правильные глаголы',
    'Ana y Luis ___ mucho. (trabajar)',
    ['trabajan', 'trabaja', 'trabajáis', 'trabajamos'],
    'trabajan',
    'Подлежащее во множественном числе: ellos.',
    'trabajar → trabajan.',
  ),
  typed(
    'Правильные глаголы',
    'Напишите по-испански: «Я пишу письмо». Используйте escribir и una carta.',
    'Escribo una carta.',
    'escribir → escribo; carta пишется с артиклем una.',
    'Правильно: Escribo una carta.',
    ['Yo escribo una carta.'],
  ),
  typed(
    'Правильные глаголы',
    'Впишите только форму глагола beber для vosotros.',
    'bebéis',
    'Для vosotros у -er окончание -éis.',
    'beber → bebéis.',
  ),
  truth(
    'Форма «vivís» соответствует vosotros.',
    'Верно',
    'У правильных глаголов на -ir для vosotros окончание -ís.',
  ),
  choice(
    'Правильные глаголы',
    'Nosotros ___ en una escuela. (trabajar)',
    ['trabajamos', 'trabajan', 'trabajáis', 'trabajo'],
    'trabajamos',
    'Для nosotros у -ar окончание -amos.',
    'trabajar → trabajamos.',
  ),
  typed(
    'Правильные глаголы',
    'Составьте предложение по опорам: ellos / comer / el pan. Личное местоимение можно опустить.',
    'Comen el pan.',
    'comer → comen; pan пишется с артиклем el.',
    'Правильно: Comen el pan.',
    ['Ellos comen el pan.'],
  ),
  order(
    'Соберите предложение: ты / изучаешь / испанский.',
    ['Estudias español.', 'Estudia español.', 'Español estudias tú.'],
    'Estudias español.',
    'Для tú у -ar окончание -as.',
  ),
  choice(
    'Правильные глаголы',
    'Usted ___ aquí. (vivir)',
    ['vive', 'vives', 'vivo', 'viven'],
    'vive',
    'Usted требует форму 3-го лица единственного числа.',
    'vivir → vive.',
  ),
  typed(
    'Правильные глаголы',
    'Впишите только форму глагола escribir для ella.',
    'escribe',
    'Для él/ella у -ir окончание -e.',
    'escribir → escribe.',
  ),
  truth(
    'В форме «habláis» ударение обязательно.',
    'Верно',
    'У правильных -ar глаголов форма vosotros оканчивается на -áis.',
  ),
  choice(
    'Правильные глаголы',
    'Vosotros ___ el café. (beber)',
    ['bebéis', 'bebemos', 'beben', 'bebes'],
    'bebéis',
    'Для vosotros у -er окончание -éis.',
    'beber → bebéis.',
  ),
  typed(
    'Правильные глаголы',
    'Напишите по-испански: «Мы говорим по-испански». Используйте hablar.',
    'Hablamos español.',
    'hablar → hablamos. После hablar название языка употребляется без артикля.',
    'Правильно: Hablamos español.',
    ['Nosotros hablamos español.', 'Nosotras hablamos español.'],
  ),
  order(
    'Соберите предложение: она / пишет / книгу.',
    ['Escribe un libro.', 'Escriben un libro.', 'Un escribe libro.'],
    'Escribe un libro.',
    'Для ella: escribir → escribe. Libro пишется с артиклем.',
  ),
  typed(
    'Правильные глаголы',
    'Впишите только форму глагола comer для yo.',
    'como',
    'Для yo окончание -o.',
    'comer → como.',
  ),

  choice(
    'Чередование в корне',
    'Yo ___ pronto. (volver)',
    ['vuelvo', 'volvo', 'vuelves', 'volvemos'],
    'vuelvo',
    'В ударной основе o меняется на ue.',
    'volver → vuelvo.',
  ),
  typed(
    'Чередование в корне',
    'Впишите только форму pensar для él.',
    'piensa',
    'e → ie в ударной основе.',
    'pensar → piensa.',
  ),
  truth(
    'В форме «pensamos» чередования e → ie нет.',
    'Верно',
    'В nosotros и vosotros корень обычно не чередуется.',
  ),
  order(
    'Соберите предложение: они / спят / в доме.',
    ['Duermen en la casa.', 'Dormimos en la casa.', 'Duermen la en casa.'],
    'Duermen en la casa.',
    'dormir: o → ue; casa пишется с артиклем.',
  ),
  choice(
    'Чередование в корне',
    'Nosotros ___ volver mañana. (poder)',
    ['podemos', 'puedemos', 'pueden', 'poderemos'],
    'podemos',
    'В nosotros чередования нет.',
    'poder → podemos.',
  ),
  typed(
    'Чередование в корне',
    'Напишите по-испански: «Я предпочитаю чай». Используйте preferir и el té.',
    'Prefiero el té.',
    'preferir: e → ie; té пишется с артиклем el.',
    'Правильно: Prefiero el té.',
    ['Yo prefiero el té.'],
  ),
  choice(
    'Чередование в корне',
    'Tú ___ la comida. (pedir)',
    ['pides', 'pedes', 'pide', 'pedimos'],
    'pides',
    'У pedir чередование e → i.',
    'pedir → pides.',
  ),
  typed(
    'Чередование в корне',
    'Впишите только форму dormir для nosotros.',
    'dormimos',
    'В nosotros чередования нет.',
    'dormir → dormimos.',
  ),
  truth(
    'Форма «jugamos» правильная для nosotros.',
    'Верно',
    'У jugar чередование u → ue не происходит в nosotros.',
  ),
  choice(
    'Чередование в корне',
    'Ella ___ jugar hoy. (querer)',
    ['quiere', 'quere', 'quieres', 'queremos'],
    'quiere',
    'У querer чередование e → ie.',
    'querer → quiere.',
  ),
  typed(
    'Чередование в корне',
    'Напишите по-испански: «Они возвращаются в дом». Используйте volver и la casa.',
    'Vuelven a la casa.',
    'volver: o → ue; casa пишется с артиклем la.',
    'Правильно: Vuelven a la casa.',
    ['Ellos vuelven a la casa.', 'Ellas vuelven a la casa.'],
  ),
  order(
    'Соберите предложение: я / понимаю / урок.',
    ['Entiendo la lección.', 'Entendemos la lección.', 'Entiendo lección la.'],
    'Entiendo la lección.',
    'entender: e → ie; lección пишется с артиклем.',
  ),
  typed(
    'Чередование в корне',
    'Впишите только форму repetir для vosotros.',
    'repetís',
    'В vosotros чередования нет.',
    'repetir → repetís.',
  ),
  truth(
    'Форма «duermimos» правильная для nosotros.',
    'Неверно',
    'Правильно dormimos: в nosotros чередования нет.',
  ),
  choice(
    'Чередование в корне',
    'Vosotros ___ este libro. (preferir)',
    ['preferís', 'prefierís', 'prefieren', 'preferimos'],
    'preferís',
    'В vosotros основа не чередуется.',
    'preferir → preferís.',
  ),
  typed(
    'Чередование в корне',
    'Напишите по-испански «Кот спит», используя el gato и dormir. Порядок: подлежащее + глагол.',
    'El gato duerme.',
    'dormir: o → ue; gato пишется с артиклем el.',
    'Правильно: El gato duerme.',
  ),

  choice(
    'Особая форма yo',
    'Yo ___ la comida. (hacer)',
    ['hago', 'hazo', 'hace', 'hacemos'],
    'hago',
    'У hacer особая форма yo.',
    'hacer → hago.',
  ),
  typed(
    'Особая форма yo',
    'Впишите только форму poner для yo.',
    'pongo',
    'Форма yo оканчивается на -go.',
    'poner → pongo.',
  ),
  order(
    'Соберите предложение: я / выхожу / из дома.',
    ['Salgo de la casa.', 'Salo de la casa.', 'Salgo la de casa.'],
    'Salgo de la casa.',
    'salir → salgo; casa пишется с артиклем.',
  ),
  truth(
    'Форма yo глагола conocer — «conozco».',
    'Верно',
    'У глаголов на -ocer/-ucir часто появляется -zco.',
  ),
  typed(
    'Особая форма yo',
    'Напишите по-испански: «Я приношу книгу». Используйте traer и un libro.',
    'Traigo un libro.',
    'traer → traigo; libro пишется с артиклем un.',
    'Правильно: Traigo un libro.',
    ['Yo traigo un libro.'],
  ),
  choice(
    'Особая форма yo',
    'Yo ___ la verdad. (saber)',
    ['sé', 'sabo', 'sabe', 'soy'],
    'sé',
    'Эту короткую форму нужно запомнить.',
    'saber → sé.',
  ),
  typed(
    'Особая форма yo',
    'Впишите только форму decir для yo.',
    'digo',
    'У decir особая форма yo.',
    'decir → digo.',
  ),
  order(
    'Соберите предложение: я / смотрю / фильм.',
    ['Veo la película.', 'Vo la película.', 'Veo película la.'],
    'Veo la película.',
    'Особая форма ver для yo — veo. Película пишется с артиклем la.',
  ),
  truth('Форма yo глагола dar — «do».', 'Неверно', 'Правильная форма: doy.'),
  choice(
    'Особая форма yo',
    'Yo ___ un libro. (tener)',
    ['tengo', 'teno', 'tiene', 'tengo que'],
    'tengo',
    'У tener особая форма yo на -go.',
    'tener → tengo.',
  ),
  typed(
    'Особая форма yo',
    'Напишите по-испански: «Я прихожу сегодня». Используйте venir; поставьте hoy после глагола.',
    'Vengo hoy.',
    'venir → vengo.',
    'Правильно: Vengo hoy.',
    ['Yo vengo hoy.'],
  ),
  order(
    'Соберите предложение: я / вожу / машину.',
    ['Conduzco el coche.', 'Conduco el coche.', 'Conduzco coche el.'],
    'Conduzco el coche.',
    'conducir → conduzco; существительное пишите с артиклем.',
  ),
  typed(
    'Особая форма yo',
    'Впишите только форму oír для yo.',
    'oigo',
    'У oír форма yo оканчивается на -go.',
    'oír → oigo.',
  ),
  choice(
    'Особая форма yo',
    'Yo ___ una película. (ver)',
    ['veo', 'vo', 'vee', 'ves'],
    'veo',
    'У ver особая форма yo.',
    'ver → veo.',
  ),
  typed(
    'Особая форма yo',
    'Напишите по-испански: «Я даю еду коту». Используйте dar, la comida и al gato.',
    'Doy la comida al gato.',
    'dar → doy; comida пишется с артиклем la, a + el = al.',
    'Правильно: Doy la comida al gato.',
    [
      'Yo doy la comida al gato.',
      'Doy al gato la comida.',
      'Yo doy al gato la comida.',
    ],
  ),
  typed(
    'Особая форма yo',
    'Впишите только форму conducir для yo.',
    'conduzco',
    'У -ucir в yo появляется -zco.',
    'conducir → conduzco.',
  ),
];

const lesson4: LessonExercise[] = [
  {
    kind: 'A и EN',
    mode: 'choice',
    prompt: 'Выберите пропуск: Vivo ___ Barcelona. (живу в городе)',
    answer: 'en',
    hint: 'Место проживания: vivir en.',
    explanation: 'Место проживания: vivir en.',
    options: ['en', 'a', 'de'],
  },
  {
    kind: 'A и EN',
    mode: 'type',
    prompt: 'Впишите только пропуск: Mañana voy ___ Madrid. (еду в город)',
    answer: 'a',
    hint: 'Направление с ir: a Madrid.',
    explanation: 'Направление с ir: a Madrid.',
  },
  {
    kind: 'A и EN',
    mode: 'choice',
    prompt: 'Выберите пропуск: Estoy ___ casa. (нахожусь дома)',
    answer: 'en',
    hint: 'Где? Estar en casa.',
    explanation: 'Где? Estar en casa.',
    options: ['por', 'en', 'a'],
  },
  {
    kind: 'A и EN',
    mode: 'choice',
    prompt: 'Выберите пропуск: Voy ___ casa. (иду домой)',
    answer: 'a',
    hint: 'Куда? Ir a casa, без артикля.',
    explanation: 'Куда? Ir a casa, без артикля.',
    options: ['a', 'en', 'de'],
  },
  {
    kind: 'Слияния',
    mode: 'type',
    prompt: 'Впишите только пропуск: Voy ___ cine. (a + el)',
    answer: 'al',
    hint: 'A + el образуют al.',
    explanation: 'A + el образуют al.',
  },
  {
    kind: 'Слияния',
    mode: 'choice',
    prompt: 'Выберите пропуск: Vamos ___ la playa. (идём на пляж)',
    answer: 'a',
    hint: 'Перед la предлог a не сливается с артиклем.',
    explanation: 'Перед la предлог a не сливается с артиклем.',
    options: ['en', 'a', 'al'],
  },
  {
    kind: 'Личное a',
    mode: 'choice',
    prompt: 'Выберите пропуск: Veo ___ María. (вижу Марию)',
    answer: 'a',
    hint: 'Определённый человек как прямое дополнение требует a.',
    explanation: 'Определённый человек как прямое дополнение требует a.',
    options: ['a', '—', 'en'],
  },
  {
    kind: 'Личное a',
    mode: 'type',
    prompt: 'Впишите только пропуск: Veo ___ la casa. (вижу дом)',
    answer: '—',
    hint: 'Перед предметом личное a не ставится.',
    explanation: 'Перед предметом личное a не ставится.',
  },
  {
    kind: 'Личное a',
    mode: 'choice',
    prompt: 'Выберите пропуск: Tengo ___ un hermano. (у меня есть брат)',
    answer: '—',
    hint: 'Tener в значении обладания не требует личного a.',
    explanation: 'Tener в значении обладания не требует личного a.',
    options: ['con', '—', 'a'],
  },
  {
    kind: 'Адресат',
    mode: 'choice',
    prompt: 'Выберите пропуск: Doy el libro ___ Ana. (даю книгу Ане)',
    answer: 'a',
    hint: 'Адресат действия: a Ana.',
    explanation: 'Адресат действия: a Ana.',
    options: ['a', 'en', 'de'],
  },
  {
    kind: 'Время',
    mode: 'type',
    prompt:
      'Впишите только пропуск: La clase empieza ___ las nueve. (в девять)',
    answer: 'a',
    hint: 'Точный час вводится предлогом a.',
    explanation: 'Точный час вводится предлогом a.',
  },
  {
    kind: 'Время',
    mode: 'choice',
    prompt: 'Выберите пропуск: Como ___ la una. (в час дня)',
    answer: 'a',
    hint: 'Один час: a la una.',
    explanation: 'Один час: a la una.',
    options: ['de', 'a', 'en'],
  },
  {
    kind: 'Транспорт',
    mode: 'choice',
    prompt: 'Выберите пропуск: Voy al trabajo ___ metro. (на метро)',
    answer: 'en',
    hint: 'Способ передвижения: en metro.',
    explanation: 'Способ передвижения: en metro.',
    options: ['en', 'a', 'con'],
  },
  {
    kind: 'Транспорт',
    mode: 'type',
    prompt: 'Впишите только пропуск: Voy al trabajo ___ pie. (пешком)',
    answer: 'a',
    hint: 'Устойчивое выражение a pie.',
    explanation: 'Устойчивое выражение a pie.',
  },
  {
    kind: 'Время',
    mode: 'choice',
    prompt: 'Выберите пропуск: Mi cumpleaños es ___ mayo. (в мае)',
    answer: 'en',
    hint: 'Названия месяцев: en mayo.',
    explanation: 'Названия месяцев: en mayo.',
    options: ['por', 'en', 'a'],
  },
  {
    kind: 'Время',
    mode: 'choice',
    prompt: 'Выберите пропуск: ___ invierno hace frío. (зимой)',
    answer: 'En',
    hint: 'Сезон: en invierno.',
    explanation: 'Сезон: en invierno.',
    options: ['En', 'A', 'De'],
  },
  {
    kind: 'Язык',
    mode: 'type',
    prompt:
      'Впишите только пропуск: El libro está ___ español. (книга на испанском)',
    answer: 'en',
    hint: 'Язык текста: en español.',
    explanation: 'Язык текста: en español.',
  },
  {
    kind: 'DE',
    mode: 'choice',
    prompt: 'Выберите пропуск: Soy ___ Rusia. (родом из России)',
    answer: 'de',
    hint: 'Происхождение выражается через ser de.',
    explanation: 'Происхождение выражается через ser de.',
    options: ['a', 'de', 'en'],
  },
  {
    kind: 'DE',
    mode: 'choice',
    prompt: 'Выберите пропуск: Es el libro ___ Ana. (книга Аны)',
    answer: 'de',
    hint: 'De указывает на владельца.',
    explanation: 'De указывает на владельца.',
    options: ['de', 'a', 'en'],
  },
  {
    kind: 'Слияния',
    mode: 'type',
    prompt: 'Впишите только пропуск: Es el coche ___ profesor. (de + el)',
    answer: 'del',
    hint: 'De + el образуют del.',
    explanation: 'De + el образуют del.',
  },
  {
    kind: 'DE',
    mode: 'choice',
    prompt: 'Выберите пропуск: La mesa es ___ madera. (сделана из дерева)',
    answer: 'de',
    hint: 'Материал: de madera.',
    explanation: 'Материал: de madera.',
    options: ['para', 'de', 'con'],
  },
  {
    kind: 'DE',
    mode: 'choice',
    prompt: 'Выберите пропуск: Quiero un vaso ___ agua. (стакан воды)',
    answer: 'de',
    hint: 'Содержимое: un vaso de agua.',
    explanation: 'Содержимое: un vaso de agua.',
    options: ['de', 'para', 'sin'],
  },
  {
    kind: 'DE',
    mode: 'type',
    prompt: 'Впишите только пропуск: Hablamos ___ música. (говорим о музыке)',
    answer: 'de',
    hint: 'Тема разговора: hablar de.',
    explanation: 'Тема разговора: hablar de.',
  },
  {
    kind: 'DE',
    mode: 'choice',
    prompt: 'Выберите пропуск: Salgo ___ casa a las ocho. (выхожу из дома)',
    answer: 'de',
    hint: 'Исходная точка с salir: salir de casa.',
    explanation: 'Исходная точка с salir: salir de casa.',
    options: ['en', 'de', 'a'],
  },
  {
    kind: 'CON и SIN',
    mode: 'choice',
    prompt: 'Выберите пропуск: Quiero café ___ leche. (с молоком)',
    answer: 'con',
    hint: 'Добавка: con leche.',
    explanation: 'Добавка: con leche.',
    options: ['con', 'sin', 'de'],
  },
  {
    kind: 'CON и SIN',
    mode: 'type',
    prompt: 'Впишите только пропуск: Quiero café ___ azúcar. (без сахара)',
    answer: 'sin',
    hint: 'Отсутствие: sin azúcar.',
    explanation: 'Отсутствие: sin azúcar.',
  },
  {
    kind: 'CON и SIN',
    mode: 'choice',
    prompt: 'Выберите пропуск: Escribo ___ un bolígrafo. (пишу ручкой)',
    answer: 'con',
    hint: 'Инструмент действия вводится через con.',
    explanation: 'Инструмент действия вводится через con.',
    options: ['para', 'con', 'en'],
  },
  {
    kind: 'Местоимения',
    mode: 'choice',
    prompt: 'Выберите пропуск: ¿Vienes ___? (со мной)',
    answer: 'conmigo',
    hint: 'Con + mí образуют conmigo.',
    explanation: 'Con + mí образуют conmigo.',
    options: ['conmigo', 'con yo', 'con mí'],
  },
  {
    kind: 'Местоимения',
    mode: 'type',
    prompt: 'Впишите только пропуск: Quiero hablar ___. (с тобой)',
    answer: 'contigo',
    hint: 'Con + ti образуют contigo.',
    explanation: 'Con + ti образуют contigo.',
  },
  {
    kind: 'PARA',
    mode: 'choice',
    prompt: 'Выберите пропуск: Este regalo es ___ ti. (предназначен тебе)',
    answer: 'para',
    hint: 'Предназначение подарка: para ti.',
    explanation: 'Предназначение подарка: para ti.',
    options: ['de', 'para', 'por'],
  },
  {
    kind: 'PARA',
    mode: 'choice',
    prompt:
      'Выберите пропуск: Estudio español ___ viajar. (чтобы путешествовать)',
    answer: 'para',
    hint: 'Цель: para + инфинитив.',
    explanation: 'Цель: para + инфинитив.',
    options: ['para', 'por', 'a'],
  },
  {
    kind: 'PARA',
    mode: 'type',
    prompt:
      'Впишите только пропуск: La tarea es ___ mañana. (срок сдачи — завтра)',
    answer: 'para',
    hint: 'Para указывает срок, к которому нужна работа.',
    explanation: 'Para указывает срок, к которому нужна работа.',
  },
  {
    kind: 'POR',
    mode: 'choice',
    prompt: 'Выберите пропуск: Paseamos ___ el parque. (гуляем по парку)',
    answer: 'por',
    hint: 'Por обозначает пространство прогулки.',
    explanation: 'Por обозначает пространство прогулки.',
    options: ['de', 'por', 'a'],
  },
  {
    kind: 'POR',
    mode: 'choice',
    prompt: 'Выберите пропуск: Gracias ___ tu ayuda. (спасибо за помощь)',
    answer: 'por',
    hint: 'Причина благодарности: gracias por.',
    explanation: 'Причина благодарности: gracias por.',
    options: ['por', 'para', 'a'],
  },
  {
    kind: 'Время',
    mode: 'type',
    prompt: 'Впишите только пропуск: Trabajo ___ la mañana. (работаю по утрам)',
    answer: 'por',
    hint: 'Часть суток без точного часа: por la mañana.',
    explanation: 'Часть суток без точного часа: por la mañana.',
  },
  {
    kind: 'Время',
    mode: 'choice',
    prompt:
      'Выберите пропуск: Empiezo a las nueve ___ la mañana. (в девять утра)',
    answer: 'de',
    hint: 'После часа часть суток вводится через de.',
    explanation: 'После часа часть суток вводится через de.',
    options: ['en', 'de', 'por'],
  },
  {
    kind: 'POR',
    mode: 'choice',
    prompt: 'Выберите пропуск: Hablamos ___ teléfono. (по телефону)',
    answer: 'por',
    hint: 'Способ связи: por teléfono.',
    explanation: 'Способ связи: por teléfono.',
    options: ['por', 'para', 'con'],
  },
  {
    kind: 'POR',
    mode: 'type',
    prompt:
      'Впишите только пропуск: Compro el libro ___ diez euros. (за десять евро)',
    answer: 'por',
    hint: 'Цена покупки: por diez euros.',
    explanation: 'Цена покупки: por diez euros.',
  },
  {
    kind: 'DESDE и HASTA',
    mode: 'choice',
    prompt:
      'Выберите пропуск: Trabajo ___ las nueve hasta las seis. (начало — в девять)',
    answer: 'desde',
    hint: 'Desde вводит начальную точку.',
    explanation: 'Desde вводит начальную точку.',
    options: ['en', 'desde', 'hasta'],
  },
  {
    kind: 'DESDE и HASTA',
    mode: 'choice',
    prompt:
      'Выберите пропуск: Trabajo desde las nueve ___ las seis. (до шести)',
    answer: 'hasta',
    hint: 'Hasta вводит конечную точку.',
    explanation: 'Hasta вводит конечную точку.',
    options: ['hasta', 'desde', 'por'],
  },
  {
    kind: 'Место',
    mode: 'type',
    prompt: 'Впишите только пропуск: El gato está ___ la cama. (под кроватью)',
    answer: 'debajo de',
    hint: 'Debajo de означает «под».',
    explanation: 'Debajo de означает «под».',
  },
  {
    kind: 'Место',
    mode: 'choice',
    prompt: 'Выберите пропуск: El jardín está ___ la casa. (позади дома)',
    answer: 'detrás de',
    hint: 'Detrás de означает «позади».',
    explanation: 'Detrás de означает «позади».',
    options: ['dentro de', 'detrás de', 'delante de'],
  },
  {
    kind: 'Место',
    mode: 'choice',
    prompt:
      'Выберите пропуск: La farmacia está ___ el banco y el hotel. (между)',
    answer: 'entre',
    hint: 'Entre X y Y: после entre нет de.',
    explanation: 'Entre X y Y: после entre нет de.',
    options: ['entre', 'entre de', 'al lado de'],
  },
  {
    kind: 'Место',
    mode: 'type',
    prompt: 'Впишите только пропуск: Vivo cerca ___ centro. (de + el)',
    answer: 'del',
    hint: 'Cerca de + el centro → cerca del centro.',
    explanation: 'Cerca de + el centro → cerca del centro.',
  },
  {
    kind: 'Место',
    mode: 'choice',
    prompt: 'Выберите пропуск: Las llaves están ___ la bolsa. (внутри сумки)',
    answer: 'dentro de',
    hint: 'Dentro de означает «внутри».',
    explanation: 'Dentro de означает «внутри».',
    options: ['lejos de', 'dentro de', 'fuera de'],
  },
  {
    kind: 'Время',
    mode: 'choice',
    prompt:
      'Выберите пропуск: Tengo clase ___ lunes. (в этот понедельник; вставьте артикль)',
    answer: 'el',
    hint: 'Разовое событие: el lunes без предлога.',
    explanation: 'Разовое событие: el lunes без предлога.',
    options: ['el', 'en', 'los'],
  },
  {
    kind: 'Время',
    mode: 'type',
    prompt:
      'Впишите только пропуск: Tengo clase ___ lunes. (каждый понедельник; вставьте артикль)',
    answer: 'los',
    hint: 'Регулярное событие: los lunes.',
    explanation: 'Регулярное событие: los lunes.',
  },
  {
    kind: 'Местоимения',
    mode: 'choice',
    prompt: 'Выберите пропуск: Este regalo es para ___. (для меня)',
    answer: 'mí',
    hint: 'После para нужна форма mí с ударением.',
    explanation: 'После para нужна форма mí с ударением.',
    options: ['mi', 'mí', 'yo'],
  },
  {
    kind: 'Глагол и предлог',
    mode: 'choice',
    prompt: 'Выберите пропуск: Pienso ___ mi familia. (думаю о семье)',
    answer: 'en',
    hint: 'Глагол pensar в этом значении сочетается с en.',
    explanation: 'Глагол pensar в этом значении сочетается с en.',
    options: ['en', 'de', 'a'],
  },
  {
    kind: 'Глагол и предлог',
    mode: 'type',
    prompt: 'Впишите только пропуск: Aprendo ___ cocinar. (учусь готовить)',
    answer: 'a',
    hint: 'Aprender a + инфинитив: учиться делать что-либо.',
    explanation: 'Aprender a + инфинитив: учиться делать что-либо.',
  },
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
    theory: (
      [
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
          highlight: 'tengo · tienes · tiene · tenemos · tenéis · tienen',
          note: 'Возраст по-испански «имеют»: Tengo veinte años, не Soy veinte años.',
        },
        {
          title: 'Presente: первое спряжение на -ar',
          paragraphs: [
            'Чтобы проспрягать правильный глагол на -ar в настоящем времени, уберите -ar и добавьте окончание: yo -o, tú -as, él/ella/usted -a, nosotros/nosotras -amos, vosotros/vosotras -áis, ellos/ellas/ustedes -an.',
            'Например, hablar: yo hablo, tú hablas, él/ella/usted habla, nosotros hablamos, vosotros habláis, ellos/ustedes hablan. Местоимение часто опускают, потому что лицо уже видно по окончанию: Trabajo en casa — «Я работаю дома».',
            'Отрицание no ставится перед личной формой: No viajamos. В вопросе окончания не меняются: ¿Estudias español?',
          ],
          examples: [
            ['hablar', 'говорить'],
            ['trabajar / estudiar', 'работать / учиться, изучать'],
            ['escuchar / viajar', 'слушать / путешествовать'],
            ['comprar / necesitar', 'покупать / нуждаться, быть необходимым'],
            ['cocinar / bailar', 'готовить / танцевать'],
          ],
          highlight:
            'yo -o · tú -as · él/ella -a · nosotros -amos · vosotros -áis · ellos -an',
          note: 'Правильное написание — bailar, не baliar. Ударение в форме vosotros сохраняется на окончании: habláis, trabajáis, estudiáis.',
        },
        {
          title: 'Mi, tu, su',
          paragraphs: [
            'Краткие притяжательные ставятся перед существительным: mi/mis, tu/tus, su/sus, nuestro/a/os/as, vuestro/a/os/as.',
            'Su и sus выбираются по числу предметов, а не по числу владельцев. Su ставится перед одним предметом: su hermano — «его / её / Ваш / их брат». Sus ставится перед несколькими предметами: sus hermanas — «его / её / Ваши / их сёстры». Значение владельца показывает только контекст.',
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
            'Кроме обладания и возраста tener используется в устойчивых сочетаниях. Их важно учить целиком: по-русски они часто переводятся прилагательным, глаголом или безличной конструкцией.',
            'Согласуется только tener, существительное остаётся неизменным: Tengo hambre; Ellos tienen hambre. Для состояния «мне жарко» не используйте estar caliente: это может иметь другое значение.',
          ],
          examples: [
            ['tener hambre / tener sed', 'быть голодным / хотеть пить'],
            [
              'tener sueño / tener frío / tener calor',
              'хотеть спать / мёрзнуть / испытывать жару',
            ],
            ['tener miedo / tener prisa', 'бояться / спешить'],
            [
              'tener razón / tener suerte',
              'быть правым / быть удачливым, «повезти»',
            ],
          ],
          note: 'На каждое из девяти выражений есть отдельное упражнение в практической части урока.',
        },
        {
          title: 'Tener que + инфинитив',
          paragraphs: [
            'Tener que + инфинитив выражает необходимость конкретного человека: «нужно», «надо», «должен». Спрягается только tener: tengo que, tienes que, tiene que, tenemos que, tenéis que, tienen que.',
            'После que всегда идёт инфинитив, а не личная форма: Tengo que trabajar. В вопросе меняется интонация: ¿Tienes que salir? Отрицание ставится перед tener: No tengo que trabajar — «мне не нужно / не обязательно работать», а не «мне запрещено».',
          ],
          examples: [
            ['Tengo que llamar a mi madre.', 'Мне нужно позвонить маме.'],
            ['Tenemos que ayudar a la abuela.', 'Нам нужно помочь бабушке.'],
            ['¿Tienes que salir ahora?', 'Тебе нужно сейчас уходить?'],
            [
              'No tienes que venir hoy.',
              'Тебе не обязательно приходить сегодня.',
            ],
          ],
        },
        {
          title: 'Указательные: este, ese, aquel',
          paragraphs: [
            'Este, ese, aquel — указательные слова, которые используются, чтобы указать на предмет или человека. Их форма зависит от рода и числа существительного, к которому они относятся.',
            'Este / esta / estos / estas указывают на то, что находится рядом с говорящим.',
            'Ese / esa / esos / esas указывают на то, что находится рядом с собеседником. При этом ese иногда употребляется и для чего-то, находящегося далеко и от говорящего, и от собеседника.',
            'Aquel / aquella / aquellos / aquellas указывают на то, что находится далеко и от говорящего, и от собеседника.',
            'Эти слова могут употребляться с существительным: esta revista, esos zapatos, aquella casa — или самостоятельно: ¿Cuál es tu maleta, esta, esa o aquella?',
            'Нейтральные формы esto, eso, aquello используются, когда существительное не называется — например, потому что неизвестно, что это, или потому что называть его не требуется: ¿Qué es esto? У этих форм нет рода и числа.',
            'Указательные слова также могут обозначать время: este — настоящее или ближайшее будущее (este año), ese — прошлое (ese año), aquel — далёкое прошлое (en aquella época).',
          ],
          examples: [
            [
              '¿Cuánto cuesta esta revista?',
              'Сколько стоит этот журнал рядом со мной?',
            ],
            ['Me gusta esa casa.', 'Мне нравится тот дом у вас / чуть дальше.'],
            ['¿Quiénes son aquellas chicas?', 'Кто те девушки вдали?'],
            ['No sé qué es esto.', 'Я не знаю, что это.'],
          ],
        },
        {
          title: 'Самые нужные предлоги',
          paragraphs: [
            'A обычно показывает направление, движение к месту или адресата: voy a Madrid, escribo a Ana.',
            'De обозначает происхождение, принадлежность, материал или связь: soy de Perú, la casa de Ana, una mesa de madera.',
            'En чаще всего обозначает место или нахождение где-либо: vivo en Moscú, estoy en casa.',
            'Con значит «с»: café con leche. Sin значит «без»: café sin azúcar.',
            'Para обычно обозначает цель, назначение или получателя: estudio para aprender, un regalo para mi hermana.',
            'Por может обозначать причину, движение через или по какому-либо месту, а также обмен: gracias por la ayuda, paseo por el parque, cambio un libro por otro.',
            'Перед артиклем el предлоги a и de сливаются с ним: a + el = al → voy al parque; de + el = del → vengo del trabajo.',
            'Перед la, los и las слияния нет: a la escuela, de los amigos.',
          ],
          examples: [
            ['Voy al parque.', 'Я иду в парк.'],
            ['Vengo del trabajo.', 'Я иду / возвращаюсь с работы.'],
            ['Café con leche y sin azúcar.', 'Кофе с молоком и без сахара.'],
            ['Este libro es para ti.', 'Эта книга для тебя.'],
            ['Gracias por todo.', 'Спасибо за всё.'],
          ],
          note: 'Базовая подсказка: куда — a, где — en, откуда/чей/из чего — de, с кем/чем — con, без чего — sin, цель — para, причина или путь — por.',
        },
        {
          title: 'Чьи вещи: su и уточнение владельца',
          paragraphs: [
            'И su, и sus могут означать «его», «её», «Ваш/Ваша/Ваши» или «их». Su используется с одним предметом: su gato — один его/её/Ваш/их кот. Sus используется с несколькими предметами: sus gatos — несколько его/её/Ваших/их котов.',
            'По форме su/sus нельзя определить владельца. Если контекст неясен, уточните его конструкцией de + человек: el gato de él, la casa de ella, los amigos de ellos.',
            'После существительного возможны полные формы mío, tuyo, suyo: un amigo mío. Они согласуются с предметом: una amiga mía, unos amigos míos.',
          ],
          examples: [
            ['Su gato / sus gatos', 'его, её, Ваш или их кот / коты'],
            ['La casa de ella', 'её дом — владелец указан точно'],
            ['Es una amiga mía.', 'Она одна из моих подруг.'],
          ],
          note: 'Запомните: su = один предмет, sus = несколько предметов. Не говорите un mi amigo: правильно mi amigo или un amigo mío.',
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
          title: 'Характер и состояние',
          paragraphs: [
            'Ser + прилагательное обычно описывает качество или характеристику человека или предмета: Es tranquilo. Es simpática.',
            'Estar + прилагательное обычно обозначает состояние в определённый момент: Está nervioso. Estoy cansada.',
            'Иногда выбор ser / estar полностью меняет смысл: es aburrido — он скучный; está aburrido — ему скучно.',
            'Другие частые пары: ser listo — быть умным, estar listo — быть готовым; ser malo — быть плохим, estar malo — болеть или быть испорченным; ser rico — быть богатым, estar rico — быть вкусным; ser seguro — быть безопасным, estar seguro — быть уверенным.',
          ],
          examples: [
            ['Mi hermana es alegre.', 'Моя сестра жизнерадостная.'],
            ['Hoy está triste.', 'Сегодня ей грустно.'],
            ['El gato está listo para jugar.', 'Кот готов играть.'],
            ['Esta sopa está muy rica.', 'Этот суп очень вкусный.'],
            ['Estoy seguro de la respuesta.', 'Я уверен в ответе.'],
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
            'Muy ставится перед прилагательным или наречием и не изменяется: muy amable, muy interesante, muy bien, muy rápido. Перед существительным muy не употребляется.',
            'Mucho после глагола обычно является наречием и не изменяется: trabaja mucho, estudia mucho. Перед существительным оно согласуется с ним в роде и числе: mucho tiempo, mucha paciencia, muchos amigos, muchas cosas.',
            'Poco работает похожим образом. После глагола оно может не изменяться: duerme poco, habla poco. Перед существительным согласуется: poco tiempo, poca agua, pocos libros, pocas personas.',
            'Bastante может означать «довольно» или «достаточно». Перед прилагательным и наречием оно не изменяется: bastante fácil, bastante bien. Перед существительным форма обычно зависит от числа: bastante tiempo, bastante paciencia, bastantes personas, bastantes problemas.',
            'Важно различать: muy interesante — очень интересный; mucho interés — большой интерес; trabaja mucho — много работает; poco interesante — малоинтересный или не очень интересный; bastante interesante — довольно интересный.',
            'Для усиления существительного нельзя использовать muy: не muy amigos, а muchos amigos; не muy paciencia, а mucha paciencia.',
            'Muy может усиливать poco: muy poco tiempo — очень мало времени; muy pocas personas — очень мало людей. В такой конструкции poco по-прежнему согласуется с существительным.',
          ],
          examples: [
            ['Es muy interesante.', 'Это очень интересно.'],
            ['Tenemos muchos amigos.', 'У нас много друзей.'],
            ['Los gatos duermen mucho.', 'Коты много спят.'],
            ['Hay pocas personas.', 'Людей мало.'],
            ['Es bastante fácil.', 'Это довольно легко.'],
            ['Tenemos muy poco tiempo.', 'У нас очень мало времени.'],
          ],
          note: 'Смотрите, что стоит после слова: прилагательное или наречие требуют неизменяемых muy/bastante, а mucho и poco перед существительным согласуются с ним.',
        },
      ] as TheoryBlock[]
    ).sort(
      (first, second) =>
        lesson2TheoryOrder.indexOf(
          first.title as (typeof lesson2TheoryOrder)[number],
        ) -
        lesson2TheoryOrder.indexOf(
          second.title as (typeof lesson2TheoryOrder)[number],
        ),
    ),
    exercises: diversifyExercises(lesson2),
  },
  {
    id: 'day',
    number: '03',
    title: 'Presente: глаголы в действии',
    subtitle: 'Правильные глаголы, чередование гласных и особые формы yo',
    reward: 'Огоньки и два котика в готовом доме',
    icon: '⏰',
    theory: [
      {
        title: 'Presente de Indicativo правильных глаголов',
        paragraphs: [
          'Presente de Indicativo описывает действие, которое происходит сейчас, повторяется регулярно или является общим фактом: Hablo español — я говорю по-испански; Trabajamos los lunes — мы работаем по понедельникам; Madrid está en España — Мадрид находится в Испании.',
          'Чтобы образовать форму правильного глагола, уберите окончание инфинитива и добавьте личное окончание. Для -AR: yo -o, tú -as, él/ella/usted -a, nosotros -amos, vosotros -áis, ellos/ustedes -an.',
          'Для -ER: yo -o, tú -es, él/ella/usted -e, nosotros -emos, vosotros -éis, ellos/ustedes -en. Для -IR: yo -o, tú -es, él/ella/usted -e, nosotros -imos, vosotros -ís, ellos/ustedes -en.',
          'Подлежащее часто можно опустить: окончание уже показывает лицо. Hablo и Yo hablo одинаково означают «я говорю»; местоимение добавляют, когда нужно подчеркнуть или противопоставить человека.',
        ],
        examples: [
          [
            'Hablo, hablas, habla, hablamos, habláis, hablan.',
            'Формы hablar — говорить.',
          ],
          ['Como, comes, come, comemos, coméis, comen.', 'Формы comer — есть.'],
          ['Vivo, vives, vive, vivimos, vivís, viven.', 'Формы vivir — жить.'],
          ['Escribimos una carta.', 'Мы пишем письмо.'],
        ],
        note: 'Сначала определите лицо и число подлежащего, затем выберите группу -ar, -er или -ir. Ударение в формах vosotros -áis и -éis обязательно.',
      },
      {
        title: 'Чередование гласных в корне',
        paragraphs: [
          'У некоторых глаголов под ударением меняется гласная в корне. Окончания остаются обычными, но основа меняется во всех лицах, кроме nosotros и vosotros.',
          'Основные модели: e → ie: pensar (думать) → pienso, querer (хотеть) → quiero, preferir (предпочитать) → prefiero, entender (понимать) → entiendo; o → ue: poder (мочь) → puedo, volver (возвращаться) → vuelvo, dormir (спать) → duermo; e → i: pedir (просить; заказывать) → pido, repetir (повторять) → repito; u → ue: jugar (играть) → juego.',
          'В nosotros и vosotros ударение падает на окончание, поэтому корень сохраняется: pensamos/pensáis, podemos/podéis, dormimos/dormís, pedimos/pedís, jugamos/jugáis.',
          'Тип окончания определяется инфинитивом и не меняется из-за чередования: dormir — «спать» — остаётся глаголом на -ir, поэтому получаем duermo, duermes, duerme, dormimos, dormís, duermen.',
        ],
        examples: [
          [
            'Pienso, piensas, piensa, pensamos, pensáis, piensan.',
            'Формы pensar — думать.',
          ],
          [
            'Duermo, duermes, duerme, dormimos, dormís, duermen.',
            'Формы dormir — спать.',
          ],
          [
            'Pido, pides, pide, pedimos, pedís, piden.',
            'Формы pedir — просить; заказывать.',
          ],
          ['El gato duerme en la casa.', 'Кот спит в доме.'],
        ],
        note: 'Удобно запоминать «ботинок»: изменение есть в yo, tú, él/ella/usted и ellos/ustedes, но нет в nosotros и vosotros.',
      },
      {
        title: 'Особые формы yo',
        paragraphs: [
          'Некоторые глаголы имеют особую форму только в первом лице единственного числа. Остальные формы могут быть обычными или следовать своему чередованию. Такие формы yo лучше учить вместе с инфинитивом.',
          'Частая группа на -go: hacer (делать) → hago, poner (класть; ставить) → pongo, salir (выходить) → salgo, traer (приносить) → traigo, decir (говорить; сказать) → digo, oír (слышать) → oigo. Глаголы tener (иметь) и venir (приходить) совмещают yo на -go с чередованием в других лицах: tengo, но tienes; vengo, но vienes.',
          'У глаголов на -ocer и -ucir перед -o часто появляется -zc-: conocer (знать; быть знакомым) → conozco, conducir (водить) → conduzco. Другие важные особые формы: saber (знать) → sé, ver (видеть; смотреть) → veo, dar (давать) → doy.',
          'Особенность относится именно к yo: digo, но dices; conozco, но conoces; conduzco, но conduces. Поэтому нельзя переносить -go или -zco на все лица.',
        ],
        examples: [
          ['Hago la comida.', 'Я готовлю еду.'],
          ['Pongo el libro en la mesa.', 'Я кладу книгу на стол.'],
          ['Conozco Madrid.', 'Я знаю Мадрид.'],
          [
            'Traigo un libro y doy agua al gato.',
            'Я приношу книгу и даю воду коту.',
          ],
        ],
        note: 'Проверяйте не только окончание, но и основу. Например: yo tengo, tú tienes, nosotros tenemos.',
      },
    ] as TheoryBlock[],
    exercises: diversifyExercises(lesson3, false),
  },
  {
    id: 'home',
    number: '04',
    title: 'Предлоги',
    subtitle: 'Направление, место, время, причина и цель',
    reward: 'Кошачье окно и мягкий плед',
    icon: '🧭',
    theory: [
      {
        title: 'Как выбирать предлог',
        paragraphs: [
          'Предлог связывает слова и уточняет направление, место, время, причину или цель. Один русский предлог не всегда соответствует одному испанскому: «в Мадрид» — a Madrid, «в Мадриде» — en Madrid, «в мае» — en mayo, «в понедельник» — el lunes без предлога.',
          'Сначала определите смысл всей фразы, затем проверьте сочетание с глаголом. Предлоги не меняются по роду и числу. Артикли после них подчиняются обычным правилам: en la casa, con los amigos.',
          'В этом уроке разбираются частые предлоги уровня A1–A2. Менее частые значения и исключения изучаются позднее. В заданиях на пропуски вводите только недостающую часть; знак — означает, что ничего вставлять не нужно.',
        ],
        examples: [],
      },
      {
        title: 'A — куда, кому, во сколько',
        paragraphs: [
          'A указывает направление с ir, venir и другими глаголами движения: voy a Madrid — еду в Мадрид. Название города обычно стоит без артикля; с обычным существительным артикль часто нужен: a la playa, al parque. Выражение a casa означает «домой».',
          'Адресат действия тоже вводится через a: doy el libro a Ana — даю книгу Ане; escribo a mi profesor — пишу преподавателю.',
          'Перед определённым человеком как прямым дополнением обычно ставится личное a: veo a María, visito a mi abuela. В русском отдельного слова для него нет. Перед предметом такого a нет: veo la casa. С неопределённым человеком выбор зависит от смысла: busco un profesor — ищу какого-нибудь преподавателя; busco a mi profesor — ищу своего преподавателя.',
          'После tener в значении «иметь» и в обычной конструкции hay личное a не ставится: tengo un hermano; hay tres estudiantes. Это правило относится к данным значениям, а не ко всем возможным оборотам с tener.',
          'Точное время: a la una — в час; a las dos, a las nueve — в два, в девять. A + el образуют al, но a la, a los и a las пишутся отдельно.',
          'Запомните a pie — пешком, a veces — иногда. В конструкции ir a + инфинитив предлог a обязателен: voy a estudiar — собираюсь учиться.',
        ],
        examples: [
          ['Voy a Madrid.', 'Я еду в Мадрид.'],
          ['Vamos a la playa.', 'Мы идём на пляж.'],
          ['Voy a casa.', 'Я иду домой.'],
          ['Voy al supermercado.', 'Я иду в супермаркет.'],
          ['Voy al parque.', 'Я иду в парк.'],
          ['Doy el libro a Ana.', 'Я даю книгу Ане.'],
          ['Escribo a mi profesor.', 'Я пишу своему преподавателю.'],
          ['La clase empieza a las nueve.', 'Занятие начинается в девять.'],
          ['Como a la una.', 'Я обедаю в час.'],
          ['Veo a María.', 'Я вижу Марию.'],
          ['Visito a mi abuela.', 'Я навещаю бабушку.'],
          ['Conozco a tu hermano.', 'Я знаю твоего брата.'],
          ['Veo la casa.', 'Я вижу дом.'],
          ['Tengo un hermano.', 'У меня есть брат.'],
          ['Hay tres estudiantes.', 'Здесь есть три студента.'],
          ['a pie', 'пешком'],
          ['a veces', 'иногда'],
          ['ir a + infinitivo', 'собираться что-то сделать.'],
          ['Voy a estudiar.', 'Я собираюсь учиться.'],
        ],
      },
      {
        title: 'EN — где, в чём, на каком транспорте',
        paragraphs: [
          'En обозначает место: vivo en España — живу в Испании; estoy en casa — нахожусь дома. В зависимости от предмета русским переводом будет «в» или «на»: en la mesa — на столе.',
          'Сравните местонахождение и направление: estoy en Madrid — я в Мадриде; voy a Madrid — еду в Мадрид. Выбор зависит от значения глагола, а не только от наличия движения: entrar en la casa — войти в дом.',
          'Транспорт обычно вводится через en: en coche, en autobús, en tren, en metro, en avión, en bicicleta. Пешком — a pie.',
          'Месяцы, годы и сезоны: en mayo, en 2026, en verano. Для дней недели это правило не подходит: el lunes, los lunes.',
          'Язык текста или высказывания: un libro en español; ¿Cómo se dice en español? Hablo español сообщает, на каком языке человек умеет говорить. Hablo en español означает, что в данной ситуации он говорит на испанском; en здесь тоже допустим.',
        ],
        examples: [
          ['Vivo en España.', 'Я живу в Испании.'],
          ['Estoy en casa.', 'Я дома.'],
          ['El libro está en la mesa.', 'Книга на столе.'],
          ['Estamos en la playa.', 'Мы на пляже.'],
          ['en coche', 'на машине'],
          ['en autobús', 'на автобусе'],
          ['en tren', 'на поезде'],
          ['en metro', 'на метро'],
          ['en avión', 'на самолёте'],
          ['en bicicleta', 'на велосипеде.'],
          ['Voy al trabajo en metro.', 'Я езжу на работу на метро.'],
          ['Mi cumpleaños es en mayo.', 'Мой день рождения в мае.'],
          ['En verano hace calor.', 'Летом жарко.'],
          ['Nací en 2000.', 'Я родился в 2000 году.'],
          ['El libro está en español.', 'Книга на испанском.'],
          ['¿Cómo se dice esto en español?', 'Как это сказать по-испански?'],
          ['Hablo español.', 'Я говорю по-испански.'],
        ],
      },
      {
        title: 'DE — откуда, чей, из чего, о чём',
        paragraphs: [
          'De выражает происхождение и исходную точку: soy de Rusia — я родом из России; salgo de casa — выхожу из дома; vengo de Madrid — приезжаю из Мадрида. Сравните soy de Madrid и vivo en Madrid: место происхождения может отличаться от места проживания.',
          'Принадлежность: el libro de Ana — книга Аны. Перед артиклем el получается del: el coche del profesor. С la, los и las слияния нет.',
          'Материал: una mesa de madera — деревянный стол. Содержимое и количество: un vaso de agua, una taza de café, un kilo de manzanas. Вид занятия: una clase de español.',
          'Una taza de café — чашка кофе, то есть содержимое. Una taza para café — чашка, предназначенная для кофе; она может быть пустой.',
          'Тема разговора: hablar de música — говорить о музыке. После точного часа de вводит часть суток: a las nueve de la mañana, a las seis de la tarde, a las diez de la noche.',
        ],
        examples: [
          ['Soy de Rusia.', 'Я из России.'],
          ['Soy de Moscú.', 'Я из Москвы.'],
          ['Soy de Madrid.', 'Я из Мадрида.'],
          ['Vivo en Madrid.', 'Я живу в Мадриде.'],
          ['Es el libro de Ana.', 'Это книга Аны.'],
          ['La casa de mis padres es grande.', 'Дом моих родителей большой.'],
          ['Es el coche del profesor.', 'Это машина преподавателя.'],
          ['una mesa de madera', 'деревянный стол'],
          ['una botella de plástico', 'пластиковая бутылка.'],
          ['un vaso de agua', 'стакан воды'],
          ['una taza de café', 'чашка кофе'],
          ['un kilo de manzanas', 'килограмм яблок'],
          ['una clase de español', 'урок испанского.'],
          ['una taza de café', 'чашка кофе'],
          ['una taza para café', 'чашка для кофе.'],
          ['Hablamos de música.', 'Мы говорим о музыке.'],
          ['Salgo de casa a las ocho.', 'Я выхожу из дома в восемь.'],
          ['Son las ocho de la mañana.', 'Сейчас восемь утра.'],
          ['La clase es a las seis de la tarde.', 'Занятие в шесть вечера.'],
          ['Son las diez de la noche.', 'Сейчас десять вечера.'],
        ],
      },
      {
        title: 'CON — с кем, с чем, при помощи чего',
        paragraphs: [
          'Con показывает совместность: vivo con mis padres — живу с родителями; voy con Ana — иду с Аной. С продуктами он обозначает добавку: café con leche — кофе с молоком.',
          'Инструмент действия тоже вводится через con: escribo con un bolígrafo — пишу ручкой. В русском переводе предлог может отсутствовать.',
          'Со мной — conmigo; с тобой — contigo. Формы con yo, con tú, con mí и con ti в этих значениях не употребляются. Для остальных лиц: con él, con ella, con usted, con nosotros/nosotras, con vosotros/vosotras, con ellos/ellas, con ustedes.',
        ],
        examples: [
          ['Vivo con mis padres.', 'Я живу с родителями.'],
          ['Voy al cine con Ana.', 'Я иду в кино с Аной.'],
          ['Quiero un café con leche.', 'Я хочу кофе с молоком.'],
          ['Escribo con un bolígrafo.', 'Я пишу ручкой.'],
          ['¿Vienes conmigo?', 'Ты идёшь со мной?'],
          ['Quiero hablar contigo.', 'Я хочу поговорить с тобой.'],
        ],
      },
      {
        title: 'SIN — без',
        paragraphs: [
          'Sin означает «без»: café sin azúcar — кофе без сахара; sin mi teléfono — без моего телефона.',
          'Sin + инфинитив обозначает действие, которого человек не совершает: sale sin desayunar — выходит, не позавтракав. После sin здесь нужен инфинитив, а не личная форма глагола.',
          'Con и sin позволяют выразить противоположные условия: con azúcar — с сахаром; sin azúcar — без сахара.',
        ],
        examples: [
          ['Café sin azúcar, por favor.', 'Кофе без сахара, пожалуйста.'],
          ['No salgo sin mi teléfono.', 'Я не выхожу без телефона.'],
          ['Sin + infinitivo', '«не делая чего-то»:'],
          ['Sale sin desayunar.', 'Он выходит, не позавтракав.'],
          ['con azúcar', 'с сахаром'],
          ['sin azúcar', 'без сахара.'],
        ],
      },
      {
        title: 'PARA — для кого, для чего, к какому сроку',
        paragraphs: [
          'Para обозначает получателя или предназначение: este regalo es para ti — этот подарок для тебя; la comida es para los niños — еда для детей.',
          'Цель выражается через para + инфинитив: estudio español para viajar — учу испанский, чтобы путешествовать. Если цель относится к другому действующему лицу, обычно требуется para que и сослагательное наклонение; эта конструкция изучается позднее.',
          'Para может указывать срок: la tarea es para mañana — задание нужно подготовить к завтрашнему дню. В таком предложении mañana обозначает срок, а не время выполнения.',
          'A и para перед человеком отвечают на разные вопросы: doy el libro a Ana — кому передаю; el libro es para Ana — для кого он предназначен.',
        ],
        examples: [
          ['Este regalo es para ti.', 'Этот подарок для тебя.'],
          ['La comida es para los niños.', 'Еда для детей.'],
          [
            'Estudio español para viajar.',
            'Я учу испанский, чтобы путешествовать.',
          ],
          ['Uso el móvil para estudiar.', 'Я использую телефон для учёбы.'],
          [
            'La tarea es para mañana.',
            'Задание на завтра / его нужно сделать к завтрашнему дню.',
          ],
        ],
      },
      {
        title: 'POR — через, по, из-за, за',
        paragraphs: [
          'Por обозначает маршрут или пространство движения: paseo por el parque — гуляю по парку; el autobús pasa por el centro — автобус проезжает через центр. Voy al parque называет место назначения, а не маршрут прогулки.',
          'Причина или мотив: gracias por tu ayuda — спасибо за помощь; lo hago por ti — делаю это ради тебя. Без контекста por ti иногда переводится «из-за тебя», поэтому русский перевод нужно выбирать по ситуации.',
          'Часть суток без точного часа: por la mañana — утром, por la tarde — днём или вечером, por la noche — вечером или ночью. Граница между tarde и noche зависит от распорядка и контекста. После точного часа употребляется de: a las nueve de la mañana.',
          'Способ связи: por teléfono, por correo electrónico. Цена или обмен: compro el libro por diez euros — покупаю книгу за десять евро. Выражение por favor означает «пожалуйста».',
          'Por объясняет причину, para называет цель или предназначение: gracias por ayudarme — благодарю за помощь; estudio para trabajar en España — учусь, чтобы работать в Испании. Это базовое различие, а не исчерпывающее правило для всех значений.',
          'Por qué пишется раздельно с ударением в вопросе «почему»: ¿Por qué estudias español? Porque пишется слитно без ударения в ответе «потому что»: porque me gusta.',
        ],
        examples: [
          ['Paseamos por el parque.', 'Мы гуляем по парку.'],
          ['El autobús pasa por el centro.', 'Автобус проезжает через центр.'],
          ['Voy al parque.', 'Я иду в парк.'],
          ['Paseo por el parque.', 'Я гуляю по парку.'],
          ['Gracias por tu ayuda.', 'Спасибо за твою помощь.'],
          ['por qué', 'почему'],
          ['porque', 'потому что.'],
          ['¿Por qué estudias español?', 'Почему ты учишь испанский?'],
          ['Porque me gusta.', 'Потому что мне нравится.'],
          ['por la mañana', 'утром'],
          ['por la tarde', 'днём / вечером'],
          ['por la noche', 'вечером / ночью.'],
          ['Trabajo por la mañana.', 'Я работаю по утрам.'],
          ['Trabajo por la mañana.', 'Я работаю утром.'],
          ['Empiezo a las nueve de la mañana.', 'Я начинаю в девять утра.'],
          ['Hablamos por teléfono.', 'Мы разговариваем по телефону.'],
          [
            'Te envío el documento por correo electrónico.',
            'Я отправлю тебе документ по электронной почте.',
          ],
          [
            'Compro el libro por diez euros.',
            'Я покупаю книгу за десять евро.',
          ],
          ['Por favor.', 'Пожалуйста.'],
        ],
      },
      {
        title: 'DESDE и HASTA — от / с и до',
        paragraphs: [
          'Desde называет начальную точку во времени или пространстве: desde las nueve — с девяти; desde septiembre — с сентября; desde Madrid — из Мадрида, начиная маршрут оттуда. Hasta называет конечную точку: hasta las seis — до шести; hasta la estación — до станции.',
          'Два привычных способа задать диапазон: de… a… и desde… hasta… . Работа с девяти до шести: trabajo de nueve a seis; trabajo desde las nueve hasta las seis. В первом варианте часы часто стоят без артикля, во втором — с артиклем.',
          'Дни недели в диапазоне: de lunes a viernes — с понедельника по пятницу. Эти пары удобно запомнить вместе, но смешанные сочетания тоже встречаются: de lunes hasta el viernes.',
        ],
        examples: [
          ['Desde', 'начальная точка'],
          ['Trabajo desde las nueve.', 'Я работаю с девяти.'],
          ['Vivo aquí desde septiembre.', 'Я живу здесь с сентября.'],
          ['Hasta', 'конечная точка'],
          ['Trabajo hasta las seis.', 'Я работаю до шести.'],
          ['Vamos hasta la estación.', 'Мы идём до станции.'],
          ['Trabajo de nueve a seis.', 'Я работаю с девяти до шести.'],
          ['De lunes a viernes.', 'С понедельника по пятницу.'],
          [
            'Trabajo desde las nueve hasta las seis.',
            'Я работаю с девяти до шести.',
          ],
        ],
      },
      {
        title: 'Предлоги и выражения места',
        paragraphs: [
          'Положение предмета уточняют сочетания encima de — на или над; debajo de — под; delante de — перед; detrás de — позади; al lado de — рядом с; cerca de — недалеко от; lejos de — далеко от.',
          'Для границ пространства: dentro de — внутри; fuera de — вне, снаружи. Enfrente de — напротив; a la derecha de — справа от; a la izquierda de — слева от. Перед el предлог de сливается с артиклем: cerca del centro, al lado del banco.',
          'Entre означает «между» и не требует de: entre el banco y el hotel. Два ориентира обычно соединяются союзом y; это союз, а не предлог.',
          'Некоторые наречия места употребляются без дополнения: el banco está cerca — банк близко; el gato está dentro — кот внутри. С названным ориентиром требуется de: cerca de mi casa, dentro de la bolsa.',
          'Sobre может обозначать положение на поверхности или над ней, а также тему: el libro está sobre la mesa — книга на столе; un libro sobre España — книга об Испании. Контекст позволяет различить значения. En, sobre и encima de иногда подходят к одной ситуации; они не всегда взаимоисключающие.',
        ],
        examples: [
          ['entre la mesa y la ventana', 'между столом и окном.'],
          ['El banco está cerca.', 'Банк близко.'],
          ['El banco está cerca de mi casa.', 'Банк рядом с моим домом.'],
          ['El libro está sobre la mesa.', 'Книга на столе.'],
          ['Un libro sobre España.', 'Книга об Испании.'],
        ],
      },
      {
        title: 'Предлоги времени: короткая схема',
        paragraphs: [
          'Точный час вводится через a: a las ocho. Часть суток без часа — por: por la mañana. Часть суток после часа — de: a las ocho de la mañana.',
          'Месяц, год и сезон вводятся через en: en enero, en 2026, en invierno. Разовое событие в день недели — el lunes; регулярное — los lunes. Перед днём недели en в этих обычных конструкциях не ставится.',
          'Hoy — сегодня, mañana — завтра, ayer — вчера обычно употребляются без предлога: trabajo mañana. Слово mañana может также означать утро: por la mañana.',
          'Начало периода — desde, конец — hasta. Antes de — до, перед; después de — после. Они употребляются с существительным или инфинитивом: antes de la clase, después de comer. Durante — во время; дополнительное de после него не требуется: durante la clase.',
        ],
        examples: [
          ['Tengo clase el lunes.', 'У меня занятие в понедельник.'],
          ['Tengo clase los lunes.', 'У меня занятия по понедельникам.'],
          ['Trabajo mañana.', 'Я работаю завтра.'],
          ['antes de la clase', 'до занятия'],
          ['después de la clase', 'после занятия'],
          ['antes de comer', 'перед едой'],
          ['después de comer', 'после еды'],
          ['durante la clase', 'во время занятия.'],
        ],
      },
      {
        title: 'Два обязательных слияния',
        paragraphs: [
          'A + артикль el обязательно образуют al; de + артикль el — del: voy al cine; vengo del supermercado. С другими артиклями слияния нет: a la, de la, a los, de las.',
          'Местоимение él — «он» — пишется с ударением и не сливается: de él, a él. В предложении le doy el libro a él местоимение le также сохраняется.',
          'Если El входит в официальное название, например El Salvador, слияние обычно не производится: viajo a El Salvador. Отличайте эту ситуацию от обычного артикля перед существительным.',
        ],
        examples: [
          ['Voy al cine.', 'Я иду в кино.'],
          ['Vengo del supermercado.', 'Я иду из супермаркета.'],
          ['El regalo es de él.', 'Подарок от него.'],
          ['Le doy el libro a él.', 'Я даю книгу ему.'],
        ],
      },
      {
        title: 'Местоимения после предлогов',
        paragraphs: [
          'После большинства предлогов вместо yo и tú используются mí и ti: para mí, para ti, sin mí, de ti. Mí пишется с ударением, ti — без. Mi без ударения означает «мой»: para mi hermano — для моего брата.',
          'Остальные формы сохраняются: él, ella, usted, nosotros/nosotras, vosotros/vosotras, ellos/ellas, ustedes. С con используются conmigo и contigo; с возвратным sí — consigo.',
          'Из правила о mí и ti есть исключения. Например, между тобой и мной — entre tú y yo. На начальном этапе полезно запомнить этот оборот целиком.',
          'De ti может означать «о тебе» или «от тебя», в зависимости от глагола и ситуации: hablamos de ti — говорим о тебе; un mensaje de ti — сообщение от тебя.',
        ],
        examples: [
          ['para mí', 'для меня'],
          ['para ti', 'для тебя'],
          ['sin mí', 'без меня'],
          ['de ti', 'о тебе / от тебя, по контексту.'],
        ],
      },
      {
        title: 'Частые сочетания, которые лучше учить целиком',
        paragraphs: [
          'Предлог часто определяется глаголом. Учите сочетания вместе: ir a — идти или ехать куда-то; venir de — приходить или приезжать откуда-то; salir de — выходить из; vivir en и estar en — жить и находиться в определённом месте; ser de — быть родом из.',
          'Hablar con называет собеседника, hablar de — тему: hablo con Ana de música — говорю с Аной о музыке. Pensar en — думать о; depender de — зависеть от.',
          'Перед инфинитивом: empezar a — начинать делать; aprender a — учиться делать. В aprendo a cocinar предлог a относится к aprender и не обозначает направление. Дословный перевод русского предлога здесь не помогает.',
        ],
        examples: [
          ['ir a', 'идти / ехать куда-то'],
          ['venir de', 'приходить / приезжать откуда-то'],
          ['salir de', 'выходить из'],
          ['vivir en', 'жить в'],
          ['estar en', 'находиться в / на'],
          ['ser de', 'быть родом из'],
          ['hablar con', 'разговаривать с'],
          ['hablar de', 'говорить о'],
          ['pensar en', 'думать о'],
          ['depender de', 'зависеть от'],
          ['empezar a + infinitivo', 'начинать делать'],
          ['aprender a + infinitivo', 'учиться делать'],
          ['Hablo con Ana de música.', 'Я говорю с Аной о музыке.'],
          ['Aprendo a cocinar.', 'Я учусь готовить.'],
        ],
      },
      {
        title: 'Самые частые ошибки',
        paragraphs: [
          'Для направления с ir выбирайте a, для места проживания с vivir — en: voy a Madrid; vivo en Madrid. Не переносите это правило механически на все глаголы движения.',
          'Проверяйте слияния: voy al cine, а не a el cine; el libro del profesor, а не de el profesor.',
          'Личное a: veo a María, но tengo un hermano. Дни недели: el lunes, а не en lunes. Пешком: a pie, а не en pie.',
          'После para нужна форма mí: es para mí, а не para yo. С con — contigo, а не con tú. С названным ориентиром: está cerca de la casa; без него: está cerca.',
          'В упражнениях указано значение пропуска. Если по-испански возможны несколько естественных конструкций, перевод или инструкция уточняют, какое значение нужно передать.',
        ],
        examples: [],
      },
    ] as TheoryBlock[],
    exercises: lesson4,
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
