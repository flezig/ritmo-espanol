export const deleB2Sources = {
  guide: {
    title: 'Cervantes · Guía B2: критерии и ответы кандидатов',
    url: 'https://examenes.cervantes.es/sites/default/files/guia_examen_dele_b2_0.pdf',
  },
  model: {
    title: 'Cervantes · официальный образец экзамена B2',
    url: 'https://examenes.cervantes.es/sites/default/files/dele_b2_modelo0.pdf',
  },
  written1: {
    title: 'Cervantes · письменная Tarea 1 (PDF)',
    url: 'https://examenes.cervantes.es/sites/default/files/b2_eie_t1.pdf',
  },
  written2: {
    title: 'Cervantes · письменная Tarea 2, варианты A и B (PDF)',
    url: 'https://examenes.cervantes.es/sites/default/files/b2_eie_t2.pdf',
  },
  oral: {
    title: 'Cervantes · инструкции устной части',
    url: 'https://cvc.cervantes.es/ensenanza/dele/b2/oral/instrucciones-oral.htm',
  },
  scoring: {
    title: 'Cervantes · баллы и условия APTO',
    url: 'https://examenes.cervantes.es/es/dele/como',
  },
};
export type DeleB2Task = {
  id: string;
  part: 'written' | 'oral';
  title: string;
  format: string;
  officialExample: string;
  source: keyof typeof deleB2Sources;
  practice: string;
  steps: string[];
  template: string;
  example: string;
  checklist: string[];
};
// Official formats are paraphrased. Practice prompts, templates and snippets are original teaching material.
export const deleB2Tasks: DeleB2Task[] = [
  {
    id: 'written-1',
    part: 'written',
    title: 'Tarea 1 · Письмо или email',
    format:
      '150–180 слов · письмо по аудиоматериалу · формальный или неформальный регистр по условию',
    officialExample:
      'В образце из руководства: письмо с мнением о платном входе в музеи. Оригинальное условие и аудиоматериал ищите в официальном образце.',
    source: 'written1',
    practice:
      'Тренировочное условие: город планирует повысить стоимость музейных билетов, сохранить бесплатный вход детям и ввести льготный день. Напишите в отдел культуры: обозначьте повод, оцените меры, объясните последствия и предложите альтернативу. Это авторская текстовая тренировка; для полноценной симуляции используйте официальное аудио.',
    steps: [
      'На первом прослушивании выделите тему и позицию говорящего; на втором запишите факты, относящиеся к пунктам письма.',
      'Составьте план: повод → сведения из записи → собственная позиция → предложение → завершение.',
      'Сохраняйте usted или tú последовательно. Не приписывайте записи собственные выводы.',
    ],
    template:
      'Estimados señores:\nMe dirijo a ustedes en relación con [asunto]. Según la información difundida, [dato relevante].\nAunque comprendo que [argumento contrario], considero que [opinión], ya que [razón y ejemplo].\nPor ello, les propongo que [presente de subjuntivo]. Esta medida permitiría [beneficio].\nLes agradecería que tuvieran en cuenta esta propuesta.\nAtentamente,\n[nombre]\n\nДля неформального адресата: Hola, [nombre]: / Te escribo porque… / Un abrazo,',
    example:
      'Me dirijo a ustedes en relación con la subida del precio de las entradas. Aunque comprendo que el mantenimiento de los museos resulta costoso, considero que convendría ampliar los descuentos para estudiantes. De ese modo, sería posible mejorar la financiación sin limitar tanto el acceso a la cultura.',
    checklist: [
      'Указан адресат и выдержан регистр',
      'Включены нужные сведения из аудио',
      'Раскрыт каждый пункт условия',
      'Есть аргумент и конкретное предложение',
      '150–180 слов; проверены ударения и согласование',
    ],
  },
  {
    id: 'written-2a',
    part: 'written',
    title: 'Tarea 2 · Вариант A: статья по графику',
    format: '150–180 слов · в Tarea 2 выбирается только один вариант: A или B',
    officialExample:
      'В руководстве приведены ответы о культурном досуге молодёжи по графику. В PDF Tarea 2 доступны исходные задания обоих вариантов.',
    source: 'written2',
    practice:
      'Авторские данные для тренировки: опрос 200 студентов, один ответ на человека. Предпочитают кино — 40%, концерты — 30%, музеи — 20%, театр — 10%. Напишите статью для университетского журнала: представьте тему, сравните данные, предложите объяснение и сделайте вывод.',
    steps: [
      'Назовите тему графика и аудиторию, затем выберите два-три значимых сравнения.',
      'Разделяйте наблюдение и гипотезу: el gráfico muestra… / una posible explicación sería…',
      'Не перечисляйте все числа подряд. Добавьте аргумент и вывод, связанный с данными.',
    ],
    template:
      '[Título]\nLos datos de [fuente] permiten observar [tendencia].\nMientras que [grupo A] representa el [x] %, [grupo B] alcanza el [y] %. Llama la atención que [contraste].\nUna posible explicación es que [hipótesis]. Sin embargo, estos datos no permiten afirmar que [límite].\nEn definitiva, [conclusión y propuesta].',
    example:
      'El cine concentra el 40 % de las preferencias, el doble que los museos. Una posible explicación sería la variedad de películas y horarios. Sin embargo, el gráfico no informa sobre el precio de las entradas, por lo que no podemos atribuir esta diferencia únicamente al coste.',
    checklist: [
      'Есть заголовок и введение',
      'Числа и единицы переданы верно',
      'Сравнения заменяют простое перечисление',
      'Гипотезы не выдаются за факты',
      'Вывод и объём 150–180 слов',
    ],
  },
  {
    id: 'written-2b',
    part: 'written',
    title: 'Tarea 2 · Вариант B: статья или рецензия',
    format: '150–180 слов · жанр и содержание определяются конкретным условием',
    officialExample:
      'Официальный PDF Tarea 2 содержит альтернативу графику. Откройте вторую страницу для полного условия варианта B.',
    source: 'written2',
    practice:
      'Авторское условие: блог о городской жизни собирает рецензии на культурные мероприятия. Расскажите о посещённой выставке: где и когда она проходила, что запомнилось, какие были недостатки и кому вы её рекомендуете. Для статьи-мнения вместо пересказа события сформулируйте тезис и защитите его.',
    steps: [
      'Определите жанр: рецензия требует оценки конкретного объекта; статья-мнение — тезиса и аргументов.',
      'Выберите два наблюдения и подкрепите каждое примером.',
      'Завершите адресной рекомендацией или выводом. Не вставляйте заученные абзацы вне темы.',
    ],
    template:
      '[Título]\nHace poco tuve la oportunidad de [experiencia]. Se trata de [contexto].\nLo que más me llamó la atención fue [aspecto], porque [ejemplo].\nA pesar de [limitación], [valoración]. Habría sido preferible que [imperfecto de subjuntivo].\nEn conjunto, recomendaría [objeto] a quienes [perfil], especialmente si [condición].',
    example:
      'Lo que más me llamó la atención fue la sala dedicada a la vida cotidiana. Los objetos estaban acompañados de testimonios que ayudaban a comprender su contexto. No obstante, habría sido preferible que la organización hubiera ofrecido más visitas guiadas. Recomendaría la exposición a quienes disfrutan de la historia social.',
    checklist: [
      'Жанр соответствует заданию',
      'Присутствуют все запрошенные пункты',
      'Оценки подкреплены примерами',
      'Рекомендация связана с содержанием',
      '150–180 слов и логичные абзацы',
    ],
  },
  {
    id: 'oral-1',
    part: 'oral',
    title: 'Tarea 1 · Оценить предложения',
    format:
      '6–7 минут вместе с беседой · около 2 минут начального выступления · выбор одной темы из двух',
    officialExample:
      'В официальном образце обсуждаются меры против чрезмерного увлечения видеоиграми. Полный лист предложений — в образце экзамена.',
    source: 'guide',
    practice:
      'Авторская тренировка: школа хочет сократить чрезмерное использование смартфонов. Оцените меры: запрет на уроках; цифровая грамотность; спортивные кружки; встречи с родителями; зоны без телефонов; приложение контроля времени. Сравните плюсы и минусы, выберите наиболее убедительные меры и обоснуйте решение.',
    steps: [
      'По каждому предложению отметьте плюс и ограничение. Объединяйте близкие меры, чтобы уложиться во время.',
      'Выберите приоритет и объясните, почему он подходит именно этой ситуации.',
      'После монолога реагируйте на возражения интервьюера, а не повторяйте подготовленный текст.',
    ],
    template:
      'El problema principal es [problema].\nLa propuesta de [medida] tendría la ventaja de [beneficio]; sin embargo, [inconveniente].\nEn cambio, [alternativa] permitiría [resultado].\nSi tuviera que elegir, optaría por [opción], siempre que [subjuntivo].\nEntiendo su punto de vista, aunque creo que [respuesta al interlocutor].',
    example:
      'Prohibir los móviles durante las clases facilitaría la concentración, pero no enseñaría a utilizarlos de forma responsable. Por eso, combinaría esta medida con talleres de educación digital. Si las familias participaran también, sería más fácil mantener hábitos saludables fuera del colegio.',
    checklist: [
      'Оценены предложения и их ограничения',
      'Приоритет обоснован',
      'Монолог не заменяет диалог',
      'Есть ответы на уточнения и возражения',
      'Речь понятна, паузы не разрушают мысль',
    ],
  },
  {
    id: 'oral-2',
    part: 'oral',
    title: 'Tarea 2 · Ситуация по фотографии',
    format:
      '5–6 минут вместе с беседой · около 2 минут описания и гипотез · выбор одной фотографии из двух',
    officialExample:
      'В официальных материалах есть семейная ситуация: нужно предположить события и обсудить тему. Фотографии и вопросы смотрите в оригинале.',
    source: 'guide',
    practice:
      'Откройте фотографию в официальном образце. Опишите видимые детали; предположите отношения людей, предшествующие события и дальнейшее развитие ситуации. Затем ответьте: ¿Le ha ocurrido algo parecido? ¿Cómo habría reaccionado usted? Для каждой гипотезы найдите опору в изображении.',
    steps: [
      'Начните с того, что действительно видно: люди, место, действия.',
      'Отдельно обозначьте догадки: puede que… / quizá… / por su expresión, diría que…',
      'Свяжите «до → сейчас → после». В беседе переходите к собственному опыту и мнению.',
    ],
    template:
      'En la fotografía se ve a [personas] en [lugar].\nPor [detalle visible], diría que [interpretación].\nPuede que [presente de subjuntivo]. Antes de este momento, es posible que [perfecto de subjuntivo].\nProbablemente después [futuro o presente].\nEn una situación parecida, yo [condicional].',
    example:
      'En la fotografía se ve a varias personas alrededor de una mesa. Por sus expresiones, diría que están hablando de algo importante. Puede que una de ellas haya anunciado una decisión inesperada. Si yo estuviera en esa situación, intentaría escuchar antes de dar mi opinión.',
    checklist: [
      'Видимые факты отделены от догадок',
      'Раскрыты вопросы к фотографии',
      'Есть связная история, а не список предметов',
      'Гипотезы имеют языковые маркеры',
      'В беседе развиваются опыт и мнение',
    ],
  },
  {
    id: 'oral-3',
    part: 'oral',
    title: 'Tarea 3 · Обсудить опрос',
    format:
      '3–4 минуты беседы · выбор одного стимула из двух · без предварительной подготовки',
    officialExample:
      'Официальный формат предлагает результаты опроса и разговор с интервьюером. Конкретные данные и вопросы доступны в образце экзамена.',
    source: 'model',
    practice:
      'Авторский опрос: 100 взрослых, один главный мотив заниматься спортом. Здоровье — 50%, отдых от стресса — 25%, общение — 15%, соревнования — 10%. Обсудите: ¿Qué resultado le sorprende? ¿Coincide con su experiencia? ¿Qué podría hacer el ayuntamiento para fomentar el deporte?',
    steps: [
      'Быстро найдите максимум, минимум и неожиданный контраст.',
      'Дайте позицию, объяснение и пример из опыта. Реагируйте на собеседника.',
      'Не придумывайте характеристики выборки. Если причины неизвестны, сформулируйте предположение.',
    ],
    template:
      'Me llama la atención que [subjuntivo].\nSegún la encuesta, [dato], mientras que [contraste].\nEn mi caso, [experiencia]. Esto podría deberse a [hipótesis].\nEstoy de acuerdo en parte; no obstante, [matiz].\n¿Se refiere usted a [aclaración]?',
    example:
      'Me llama la atención que solo un 15 % mencione las relaciones sociales como motivo principal. En mi caso, entrenar con amigos me ayuda a ser constante. Quizá los participantes valoren más la salud porque la encuesta les obliga a elegir una sola razón.',
    checklist: [
      'Данные переданы точно',
      'Мнение обосновано примером',
      'Есть реакция на вопросы интервьюера',
      'Причины представлены как гипотезы',
      'Поддерживается естественный обмен репликами',
    ],
  },
];
export const deleB2Criteria = [
  {
    title: 'Письмо',
    text: 'Adecuación al género discursivo · Coherencia · Corrección · Alcance. Устная часть: Coherencia · Fluidez · Corrección · Alcance. Шкала 0–3; полоса 2 соответствует B2. Общее впечатление — 40%, аналитическая оценка — 60%.',
  },
  {
    title: 'Самопроверка письма',
    text: 'Кто адресат? Выполнены ли пункты? Один ли тезис в каждом абзаце? Подтверждены ли оценки? Проверьте ser/estar, согласование, предлоги, времена и акценты. Это учебный чек-лист, не автоматическая экзаменационная оценка.',
  },
  {
    title: 'Самопроверка речи',
    text: 'Запишите ответ на диктофон и переслушайте: понятна ли основная мысль, есть ли примеры, не слишком ли длинные паузы? Проверьте, отвечаете ли вы на вопрос, а не только рассказываете выученную тему.',
  },
];
export const deleB2Tips = [
  [
    'План письма по минутам',
    'Учебный ориентир на 80 минут: 5 минут — прочитать условия; 30 — Tarea 1; 30 — выбранный вариант Tarea 2; 15 — проверить оба текста. Это рекомендация, а не официальный регламент по задачам.',
  ],
  [
    'Подготовка к устной части',
    'За 20 минут наметьте ответы к задачам 1 и 2: ключевые слова, аргументы и примеры. Потренируйтесь с распределением 10 + 10 минут. Третью задачу заранее не готовят. Не пишите текст для чтения вслух.',
  ],
  [
    'Аргумент в три шага',
    'Позиция → причина → пример: Considero que… porque… Por ejemplo… Затем добавьте ограничение: No obstante… Это полезнее длинной цепочки связок без содержания.',
  ],
  [
    'Выиграть время',
    'Déjeme pensar un momento. / Si he entendido bien, me pregunta si… / Lo que quiero decir es que… Если забыли слово, объясните его: Es un objeto que sirve para…',
  ],
  [
    'Согласиться и возразить',
    'Entiendo lo que dice. / Coincido con usted en que… / Estoy de acuerdo hasta cierto punto; sin embargo… Отвечайте на конкретную мысль интервьюера.',
  ],
  [
    'Связки по функции',
    'Добавление: además; контраст: sin embargo; уступка: aunque; причина: ya que; следствие: por lo tanto; пример: por ejemplo; итог: en definitiva. Выбирайте их по смыслу.',
  ],
  [
    'Шаблон — опора',
    'Заменяйте все скобки содержанием задания. Проверяйте наклонение после связки: propongo que se amplíe; considero que es útil; no creo que sea suficiente. Не вставляйте subjuntivo ради самого subjuntivo.',
  ],
];
export const countDeleWords = (text: string) =>
  text.trim().split(/\s+/u).filter(Boolean).length;
