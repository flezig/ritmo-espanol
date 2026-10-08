export type DeleTopic = {
  id: string;
  title: string;
  angle: string;
  words: [string, string][];
  constructions: [string, string, string][];
  written: string;
  oral: [string, string, string];
};
export const deleTopics: DeleTopic[] = [
  {
    id: 'culture',
    title: 'Культура и досуг',
    angle: 'Доступность культуры, музеи, чтение, организация мероприятий.',
    words: [
      ['el patrimonio cultural', 'культурное наследие'],
      ['la entrada gratuita', 'бесплатный вход'],
      ['la exposición', 'выставка'],
      ['el aforo', 'вместимость'],
      ['la subvención', 'субсидия'],
      ['fomentar la lectura', 'поощрять чтение'],
      ['accesible', 'доступный'],
      ['la oferta cultural', 'культурная программа'],
    ],
    constructions: [
      [
        'Conviene que + subjuntivo',
        'Стоит сделать так, чтобы…',
        'Conviene que los museos amplíen sus horarios.',
      ],
      [
        'No solo…, sino también…',
        'Не только…, но и…',
        'La cultura no solo entretiene, sino que también educa.',
      ],
      [
        'Estar al alcance de',
        'Быть доступным кому-либо',
        'El teatro debería estar al alcance de todos.',
      ],
    ],
    written:
      'Carta: el museo municipal sube los precios. Valore las consecuencias y proponga una alternativa.',
    oral: [
      'Valore seis medidas: descuentos, visitas escolares, horario nocturno, entradas gratuitas, talleres y campañas en redes.',
      'Imagine una historia sobre dos personas que salen de una exposición con opiniones diferentes.',
      'Comente qué actividades culturales prefiere la gente y compare los resultados con sus hábitos.',
    ],
  },
  {
    id: 'work',
    title: 'Работа и баланс жизни',
    angle: 'Удалённая работа, занятость молодёжи, график, стресс.',
    words: [
      ['la jornada laboral', 'рабочий день'],
      ['el teletrabajo', 'удалённая работа'],
      ['conciliar', 'совмещать работу и личную жизнь'],
      ['la carga de trabajo', 'нагрузка'],
      ['el contrato indefinido', 'бессрочный договор'],
      ['la conciliación', 'баланс работы и личной жизни'],
      ['el desplazamiento', 'поездка, перемещение'],
      ['la desconexión digital', 'отключение от рабочих коммуникаций'],
    ],
    constructions: [
      [
        'Si + imperfecto de subjuntivo, condicional',
        'Гипотетическое условие',
        'Si el horario fuera flexible, trabajaríamos mejor.',
      ],
      [
        'A condición de que + subjuntivo',
        'При условии, что…',
        'Aceptaría el cambio a condición de que se respetaran los descansos.',
      ],
      [
        'Permitir + infinitivo',
        'Позволять делать что-либо',
        'El teletrabajo permite ahorrar tiempo.',
      ],
    ],
    written:
      'Artículo: ¿deberían las empresas ofrecer un modelo híbrido? Presente ventajas, límites y una propuesta.',
    oral: [
      'Compare una semana de cuatro días, teletrabajo, horarios flexibles, más personal, apoyo psicológico y formación.',
      'Imagine una conversación entre dos compañeros después de una reunión difícil.',
      'Comente una encuesta sobre sueldo, estabilidad, ambiente laboral y horario.',
    ],
  },
  {
    id: 'education',
    title: 'Образование и языки',
    angle: 'Онлайн-обучение, экзамены, навыки, равные возможности.',
    words: [
      ['la enseñanza a distancia', 'дистанционное обучение'],
      ['la beca', 'стипендия'],
      ['el rendimiento académico', 'успеваемость'],
      ['adquirir competencias', 'приобретать навыки'],
      ['la igualdad de oportunidades', 'равенство возможностей'],
      ['la formación continua', 'непрерывное образование'],
      ['el abandono escolar', 'преждевременный уход из школы'],
      ['la matrícula', 'зачисление; плата за обучение'],
    ],
    constructions: [
      [
        'Para que + subjuntivo',
        'Чтобы… при разных субъектах',
        'Hay que ofrecer becas para que todos puedan estudiar.',
      ],
      [
        'Cuanto más…, más…',
        'Чем больше…, тем больше…',
        'Cuanto más practico, más confianza tengo.',
      ],
      [
        'No se trata de…, sino de…',
        'Речь о смене акцента',
        'No se trata de memorizar, sino de comprender.',
      ],
    ],
    written:
      'Entrada de blog: explique por qué aprende idiomas, cómo usa la tecnología y qué mejoraría en su aprendizaje.',
    oral: [
      'Valore tutorías, becas, clases pequeñas, recursos digitales, prácticas y orientación profesional.',
      'Imagine una situación entre una profesora y un alumno que acaba de recibir una nota inesperada.',
      'Compare preferencias por clases presenciales, en línea e híbridas.',
    ],
  },
  {
    id: 'environment',
    title: 'Экология и потребление',
    angle: 'Переработка, отходы, энергосбережение, ответственность.',
    words: [
      ['los residuos', 'отходы'],
      ['los envases', 'упаковка'],
      ['reciclar', 'перерабатывать'],
      ['reutilizar', 'использовать повторно'],
      ['la huella de carbono', 'углеродный след'],
      ['el consumo responsable', 'ответственное потребление'],
      ['las energías renovables', 'возобновляемая энергия'],
      ['el ahorro energético', 'экономия энергии'],
    ],
    constructions: [
      [
        'Reducir / aumentar en un… %',
        'Уменьшить / увеличить на… %',
        'El consumo se redujo en un diez por ciento.',
      ],
      [
        'Es imprescindible que + subjuntivo',
        'Крайне необходимо, чтобы…',
        'Es imprescindible que se reduzcan los residuos.',
      ],
      [
        'En lugar de + infinitivo',
        'Вместо того чтобы…',
        'Podemos reparar los aparatos en lugar de sustituirlos.',
      ],
    ],
    written:
      'Artículo con datos: compare los hábitos de reciclaje de dos grupos y proponga mejoras. Distinga datos e hipótesis.',
    oral: [
      'Compare más contenedores, multas, talleres, recogida a domicilio, envases retornables e incentivos.',
      'Imagine una discusión entre vecinos sobre la basura que alguien ha dejado en el portal.',
      'Comente qué hábitos sostenibles son más comunes y cuáles practica usted.',
    ],
  },
  {
    id: 'technology',
    title: 'Технологии и соцсети',
    angle: 'Смартфоны, приватность, цифровые навыки, ИИ.',
    words: [
      ['la privacidad', 'приватность'],
      ['los datos personales', 'личные данные'],
      ['la brecha digital', 'цифровое неравенство'],
      ['el uso excesivo', 'чрезмерное использование'],
      ['la inteligencia artificial', 'искусственный интеллект'],
      ['contrastar la información', 'сверять информацию'],
      ['la desinformación', 'дезинформация'],
      ['poner límites', 'устанавливать ограничения'],
    ],
    constructions: [
      [
        'Dudo que + subjuntivo',
        'Сомневаюсь, что…',
        'Dudo que una prohibición resuelva el problema.',
      ],
      [
        'Siempre que + subjuntivo',
        'При условии, что…',
        'Las redes pueden ser útiles siempre que se utilicen con criterio.',
      ],
      [
        'Por mucho que + subjuntivo',
        'Сколько бы ни…',
        'Por mucho que avance la tecnología, seguiremos necesitando criterio propio.',
      ],
    ],
    written:
      'Artículo: valore el uso de la inteligencia artificial en clase; incluya un beneficio, un riesgo y una norma.',
    oral: [
      'Valore prohibiciones, talleres, control del tiempo, deporte, acuerdos familiares y espacios sin pantallas.',
      'Imagine que una familia discute sobre una fotografía publicada sin permiso.',
      'Comente una encuesta sobre tiempo de pantalla y explique cómo gestiona el suyo.',
    ],
  },
  {
    id: 'health',
    title: 'Здоровье и спорт',
    angle: 'Образ жизни, стресс, профилактика, доступность спорта.',
    words: [
      ['el sedentarismo', 'малоподвижный образ жизни'],
      ['el bienestar', 'благополучие'],
      ['la salud mental', 'психическое здоровье'],
      ['una dieta equilibrada', 'сбалансированный рацион'],
      ['prevenir', 'предотвращать'],
      ['mantenerse en forma', 'поддерживать форму'],
      ['las instalaciones deportivas', 'спортивные объекты'],
      ['un hábito saludable', 'здоровая привычка'],
    ],
    constructions: [
      [
        'Contribuir a + infinitivo',
        'Способствовать чему-либо',
        'Caminar contribuye a reducir el estrés.',
      ],
      [
        'Me llama la atención que + subjuntivo',
        'Меня удивляет, что…',
        'Me llama la atención que tan pocos hagan deporte.',
      ],
      [
        'De ahí que + subjuntivo',
        'Отсюда следует, что…',
        'El coste es elevado; de ahí que algunas familias busquen alternativas.',
      ],
    ],
    written:
      'Carta al ayuntamiento: solicite actividades deportivas accesibles y explique quiénes se beneficiarían.',
    oral: [
      'Compare parques, gimnasios municipales, grupos de paseo, horarios amplios, campañas y descuentos.',
      'Imagine una conversación entre amigos después de su primera carrera popular.',
      'Comente motivos para hacer deporte: salud, estrés, relaciones sociales o competición.',
    ],
  },
  {
    id: 'tourism',
    title: 'Туризм и путешествия',
    angle: 'Массовый туризм, поездки, местные жители, транспортные сбои.',
    words: [
      ['el turismo de masas', 'массовый туризм'],
      ['el alojamiento turístico', 'туристическое жильё'],
      ['la temporada alta', 'высокий сезон'],
      ['los vecinos', 'местные жители, соседи'],
      ['el retraso', 'задержка'],
      ['la cancelación', 'отмена'],
      ['la convivencia', 'совместное проживание, сосуществование'],
      ['un destino sostenible', 'устойчивое туристическое направление'],
    ],
    constructions: [
      [
        'Puede que + subjuntivo',
        'Возможно, что…',
        'Puede que hayan cancelado el vuelo.',
      ],
      [
        'Haber + participio antes de…',
        'Предшествующее действие',
        'Ya habían reservado el hotel antes de comprar los billetes.',
      ],
      [
        'En beneficio de',
        'На пользу кому-либо',
        'Las medidas deberían aplicarse en beneficio de los vecinos.',
      ],
    ],
    written:
      'Carta al director: explique cómo afecta el turismo masivo a su barrio y proponga medidas.',
    oral: [
      'Compare límites al alquiler turístico, tasas, transporte, rutas alternativas, horarios y campañas.',
      'Imagine una historia sobre dos viajeros que esperan un vuelo cancelado.',
      'Comente preferencias por destinos urbanos, rurales y de playa; explique su elección.',
    ],
  },
  {
    id: 'city',
    title: 'Город, жильё и транспорт',
    angle: 'Аренда, мобильность, доступная среда, общественные пространства.',
    words: [
      ['el alquiler', 'арендная плата; аренда'],
      ['la vivienda asequible', 'доступное жильё'],
      ['el carril bici', 'велодорожка'],
      ['los atascos', 'пробки'],
      ['peatonalizar', 'делать улицу пешеходной'],
      ['el transporte público', 'общественный транспорт'],
      ['las zonas verdes', 'зелёные зоны'],
      ['las barreras arquitectónicas', 'препятствия для маломобильных людей'],
    ],
    constructions: [
      [
        'Habría que + infinitivo',
        'Следовало бы…',
        'Habría que mejorar la frecuencia de los autobuses.',
      ],
      [
        'Por un lado…, por otro…',
        'С одной стороны…, с другой…',
        'Por un lado, bajaría el ruido; por otro, cambiarían las rutas.',
      ],
      [
        'En comparación con',
        'По сравнению с…',
        'El autobús es más económico en comparación con el coche.',
      ],
    ],
    written:
      'Artículo: valore peatonalizar el centro; considere a residentes, comercios y personas con movilidad reducida.',
    oral: [
      'Compare autobuses, carriles bici, aparcamientos, peatonalización, tarifas y accesibilidad.',
      'Imagine que dos vecinos comentan las obras de su calle.',
      'Comente cómo se desplaza la gente y qué mejoraría en su ciudad.',
    ],
  },
  {
    id: 'family',
    title: 'Семья и отношения',
    angle: 'Поколения, домашние обязанности, конфликты, общение.',
    words: [
      ['el reparto de tareas', 'распределение обязанностей'],
      ['la autonomía', 'самостоятельность'],
      ['el apoyo mutuo', 'взаимная поддержка'],
      ['llegar a un acuerdo', 'достичь соглашения'],
      ['resolver un conflicto', 'разрешить конфликт'],
      ['el cuidado de mayores', 'забота о пожилых'],
      ['la confianza', 'доверие'],
      ['ponerse en el lugar de alguien', 'поставить себя на место другого'],
    ],
    constructions: [
      [
        'Es posible que + perfecto de subjuntivo',
        'Возможно, уже произошло…',
        'Es posible que hayan discutido por las tareas.',
      ],
      [
        'Si hubiera…, habría…',
        'Нереальное условие в прошлом',
        'Si hubieran hablado antes, habrían evitado el conflicto.',
      ],
      [
        'Entiendo que…, aunque…',
        'Признать позицию и уточнить свою',
        'Entiendo que estén preocupados, aunque necesitan escucharla.',
      ],
    ],
    written:
      'Artículo: ¿cómo repartir las tareas domésticas de forma justa? Incluya ejemplos y una propuesta concreta.',
    oral: [
      'Compare turnos, reuniones familiares, ayuda externa, calendarios, acuerdos y actividades compartidas.',
      'Imagine una familia que acaba de recibir una noticia inesperada.',
      'Comente con quién pasa la gente su tiempo libre y cómo cambian los hábitos según la edad.',
    ],
  },
  {
    id: 'shopping',
    title: 'Покупки и услуги',
    angle: 'Онлайн-покупки, реклама, возвраты, качество обслуживания.',
    words: [
      ['la reclamación', 'претензия'],
      ['el reembolso', 'возврат денег'],
      ['el plazo de entrega', 'срок доставки'],
      ['la garantía', 'гарантия'],
      ['la relación calidad-precio', 'соотношение цены и качества'],
      ['la publicidad engañosa', 'вводящая в заблуждение реклама'],
      ['el comercio local', 'местная торговля'],
      ['el consumo impulsivo', 'импульсивные покупки'],
    ],
    constructions: [
      [
        'Les ruego que + subjuntivo',
        'Прошу вас…',
        'Les ruego que revisen mi reclamación.',
      ],
      [
        'Agradecería que + imperfecto de subjuntivo',
        'Буду признателен, если…',
        'Agradecería que me ofrecieran una solución.',
      ],
      [
        'A pesar de + sustantivo / infinitivo',
        'Несмотря на…',
        'A pesar de haber pagado más, recibí un producto defectuoso.',
      ],
    ],
    written:
      'Carta: describa un servicio que no coincidió con lo anunciado y solicite una solución justificada.',
    oral: [
      'Compare atención presencial, devoluciones, entregas rápidas, comercio local, descuentos y control publicitario.',
      'Imagine una conversación entre una clienta y un empleado sobre un producto defectuoso.',
      'Comente una encuesta sobre compras en línea y explique cuándo prefiere una tienda física.',
    ],
  },
];

export const deleOnlineExamples = [
  {
    id: 'web-letter',
    part: 'written',
    task: 'written-1',
    title: 'DELE Ahora · письмо о массовом туризме',
    url: 'https://deleahora.com/blog/expresion-escrita/dele-b2-tarea-1-expresion-e-interaccion-escritas',
    description:
      'Полное письмо и условие. Разберите связь между личной проблемой, последствиями для района и предложением решения.',
    kind: 'Учебный образец преподавателей',
  },
  {
    id: 'web-graph',
    part: 'written',
    task: 'written-2a',
    title: 'DELE Ahora · статья по графику переработки пластика',
    url: 'https://deleahora.com/blog/expresion-escrita/dele-b2-tarea-2-expresion-e-interaccion-escritas',
    description:
      'В разделе OPCIÓN 1 опубликована полная статья. Отметьте, где автор сравнивает цифры, а где предполагает причины.',
    kind: 'Учебный образец преподавателей',
  },
  {
    id: 'web-blog',
    part: 'written',
    task: 'written-2b',
    title: 'DELE Ahora · статья об изучении языков',
    url: 'https://deleahora.com/blog/expresion-escrita/dele-b2-tarea-2-expresion-e-interaccion-escritas',
    description:
      'В разделе OPCIÓN 2 есть полный ответ: позиция, личный опыт, роль технологии и заключение.',
    kind: 'Учебный образец преподавателей',
  },
  {
    id: 'web-proposals',
    part: 'oral',
    task: 'oral-1',
    title: 'LanguageNext · стресс на работе и городской транспорт',
    url: 'https://www.languagenext.com/blog/dele-b2-speaking-sample-papers/',
    description:
      'Sample papers 1 и 4: предложения и полные монологи. В первом примере есть ответ на возражение интервьюера.',
    kind: 'Учебные ответы школы, не оценка Cervantes',
  },
  {
    id: 'web-photo',
    part: 'oral',
    task: 'oral-2',
    title: 'LanguageNext · история в аэропорту',
    url: 'https://www.languagenext.com/blog/dele-b2-speaking-sample-papers/',
    description:
      'Sample paper 2 содержит полный монолог: наблюдения, история, эмоции и предполагаемый исход.',
    kind: 'Учебный ответ школы',
  },
  {
    id: 'web-survey',
    part: 'oral',
    task: 'oral-3',
    title: 'LanguageNext · что люди ценят в работе',
    url: 'https://www.languagenext.com/blog/dele-b2-speaking-sample-papers/',
    description:
      'Sample paper 3: учебная таблица и диалог. Обратите внимание на сравнение данных с личными приоритетами.',
    kind: 'Учебный диалог; данные вымышлены',
  },
  {
    id: 'web-audio',
    part: 'oral',
    task: 'oral-2',
    title: 'DELEexam · подкаст: история по фотографии',
    url: 'https://www.deleexam.com/podcast/98-foto-dele-b2/',
    description:
      'Аудио и текстовый разбор: как обосновывать гипотезы деталями фотографии и переходить к беседе.',
    kind: 'Объяснение преподавателя с примерами',
  },
  {
    id: 'official-written',
    part: 'written',
    task: 'written-1',
    title: 'Cervantes · работы кандидатов и комментарии',
    url: 'https://examenes.cervantes.es/sites/default/files/guia_examen_dele_b2_0.pdf',
    description:
      'Печатные страницы 19–26: полные письменные работы разных уровней и комментарии оценщиков. Ошибки кандидатов сохранены.',
    kind: 'Официальные образцы с оценками',
  },
  {
    id: 'official-oral',
    part: 'oral',
    task: 'oral-1',
    title: 'Cervantes · разбор выступлений кандидатов',
    url: 'https://examenes.cervantes.es/sites/default/files/guia_examen_dele_b2_0.pdf',
    description:
      'Печатные страницы 33–40: комментарии к речи и фрагменты выступлений. Это разбор, а не полная стенограмма всех трёх задач.',
    kind: 'Официальные комментарии оценщиков',
  },
] as const;

export type DeleFullExample = {
  id: string;
  task: string;
  topic: string;
  title: string;
  prompt: string;
  text: string;
  analysis: string[];
};
// All inline texts below are original, not reproductions of third-party answers.
export const deleFullExamples: DeleFullExample[] = [
  {
    id: 'museum-letter',
    task: 'written-1',
    topic: 'culture',
    title: 'Письмо · доступные музеи',
    prompt:
      'Ответ на тренировочное условие Tarea 1 выше: повышение цен, льготы детям и бесплатный день; оцените последствия и предложите альтернативу. Учебный текстовый стимул заменяет аудио.',
    text: `Estimados señores:
Me llamo Elena Martín y soy vecina de esta ciudad. Me dirijo a ustedes en relación con la propuesta de aumentar el precio de las entradas de los museos municipales.
Según la información difundida, los menores seguirán entrando gratis y habrá un día con tarifas reducidas. Valoro estas medidas, pero considero que la subida podría alejar a estudiantes y familias que ya tienen dificultades económicas. La cultura debería ser un espacio de encuentro y no un gasto reservado a unos pocos.
Comprendo que conservar las colecciones exige recursos. Sin embargo, antes de trasladar todo el coste a los visitantes, convendría buscar acuerdos con empresas locales y mejorar la difusión de las exposiciones. Además, propongo que se mantenga una franja semanal gratuita para todos los residentes.
Estas alternativas permitirían ampliar el público sin renunciar a una financiación responsable. Les agradecería que valoraran su aplicación y explicaran cómo se utilizarán los ingresos adicionales.
Atentamente,
Elena Martín`,
    analysis: [
      'Повод и адресат названы в начале; затем включены сведения из учебного стимула.',
      'Уступка Comprendo que… вводит контраргумент, а не отменяет позицию.',
      'Propongo que se mantenga: presente de subjuntivo; agradecería que valoraran: вежливая просьба с imperfecto.',
    ],
  },
  {
    id: 'culture-graph',
    task: 'written-2a',
    topic: 'culture',
    title: 'Статья по графику · досуг студентов',
    prompt:
      'Учебный опрос 200 студентов, один ответ: кино 40%, концерты 30%, музеи 20%, театр 10%. Представьте тему, сравните данные, предложите объяснение и вывод.',
    text: `La cultura más allá de la pantalla
Una encuesta realizada a doscientos estudiantes permite conocer qué actividades culturales prefieren. Aunque todas las opciones tienen público, las diferencias entre ellas resultan significativas.
El cine reúne el cuarenta por ciento de las respuestas, mientras que los conciertos alcanzan el treinta por ciento. Los museos, con un veinte por ciento, ocupan el tercer lugar. El teatro recibe únicamente el diez por ciento, es decir, una cuarta parte del apoyo obtenido por el cine.
Una posible explicación sería la facilidad para organizar una salida al cine con amigos. También podrían influir los horarios y la publicidad. Sin embargo, el estudio no ofrece información sobre precios ni disponibilidad, por lo que no podemos asegurar que estos factores sean decisivos.
A mi juicio, las universidades deberían colaborar con museos y teatros para ofrecer actividades atractivas. No se trata de imponer gustos, sino de facilitar nuevas experiencias. En definitiva, conocer estas preferencias puede ayudar a diseñar una oferta cultural más variada y accesible.`,
    analysis: [
      'Все четыре процента соответствуют условию, сравнение «четверть» относится к 10% против 40%.',
      'Sería и podrían маркируют предположение; отсутствие данных ограничивает выводы.',
      'Заключение связывает статистику с конкретным предложением университетам.',
    ],
  },
  {
    id: 'exhibition-review',
    task: 'written-2b',
    topic: 'culture',
    title: 'Рецензия · выставка о городской жизни',
    prompt:
      'Для городского блога опишите выставку: где и когда она проходила, что запомнилось, недостатки и кому вы её рекомендуете. Все сведения вымышлены.',
    text: `Una ciudad contada por sus vecinos
El sábado pasado visité la exposición «Historias de nuestro barrio», organizada en el centro cultural municipal. La muestra reúne fotografías, objetos cotidianos y testimonios de personas que han vivido aquí durante varias décadas.
Lo que más me gustó fue la combinación de imágenes antiguas con grabaciones de los vecinos. Gracias a ellas, las calles dejaron de parecer simples escenarios y se convirtieron en lugares llenos de recuerdos. Además, las explicaciones eran claras y permitían disfrutar de la visita sin conocimientos previos.
No obstante, la iluminación de algunas fotografías era insuficiente y faltaban asientos para quienes necesitaban descansar. Habría sido conveniente que la organización hubiera previsto estas necesidades, especialmente porque acudieron muchas personas mayores.
A pesar de esos detalles, considero que la exposición merece la pena. La recomendaría tanto a quienes conocen bien el barrio como a quienes acaban de instalarse en él. Es una oportunidad para comprender cómo cambia una ciudad sin perder de vista a sus habitantes.`,
    analysis: [
      'Название и первый абзац дают контекст; два достоинства подкреплены деталями.',
      'Habría sido conveniente que… hubiera previsto оценивает уже прошедшую ситуацию.',
      'Рекомендация адресована двум конкретным аудиториям.',
    ],
  },
  {
    id: 'hybrid-work',
    task: 'written-2b',
    topic: 'work',
    title: 'Статья-мнение · гибридная работа',
    prompt:
      'Журнал обсуждает обязательное присутствие в офисе. Напишите статью: оцените гибридную модель, приведите пример, назовите ограничение и предложите решение. Учебная ситуация.',
    text: `Trabajar mejor, no simplemente desde casa
La discusión sobre el regreso a la oficina suele plantearse como una elección entre dos extremos. Sin embargo, un modelo híbrido puede responder mejor a las necesidades de muchas empresas y de sus trabajadores.
Por un lado, trabajar algunos días desde casa permite reducir los desplazamientos y organizar mejor la vida personal. Por ejemplo, una persona que tarda una hora en llegar a la oficina podría dedicar parte de ese tiempo a descansar o formarse. Por otro lado, las reuniones presenciales facilitan ciertos intercambios que resultan más lentos por correo.
El problema aparece cuando la flexibilidad se convierte en disponibilidad permanente. Si no se respetaran los horarios, el supuesto beneficio desaparecería. Por eso, sería necesario acordar objetivos claros y garantizar la desconexión digital.
En mi opinión, cada equipo debería probar un sistema adaptado a sus tareas y revisar los resultados. La clave no consiste en contar horas delante de una pantalla, sino en combinar autonomía, colaboración y condiciones de trabajo razonables.`,
    analysis: [
      'Тезис допускает ограничения: «многие компании», а не все профессии без исключения.',
      'Числовой пример иллюстрирует мысль и не выдаётся за исследование.',
      'Si no se respetaran…, desaparecería: согласованное гипотетическое условие.',
    ],
  },
  {
    id: 'phones-oral',
    task: 'oral-1',
    topic: 'technology',
    title: 'Устный ответ · смартфоны в школе',
    prompt:
      'Полный учебный сценарий к шести мерам из Tarea 1. Начните с монолога, затем разыграйте вопросы с партнёром. Темп речи и длительность беседы проверяйте по таймеру.',
    text: `CANDIDATO — MONÓLOGO
El objetivo debería ser que los alumnos aprendieran a utilizar el móvil con responsabilidad, sin que las pantallas ocuparan todo su tiempo. Por eso, combinaría varias de las propuestas en lugar de confiar en una sola.
En primer lugar, limitaría el uso del teléfono durante las explicaciones. La ventaja es que resultaría más fácil concentrarse; el inconveniente es que también se perderían algunas oportunidades de utilizar recursos educativos. Haría excepciones cuando el profesor lo considerara útil.
Los talleres de educación digital me parecen fundamentales porque enseñan a reconocer información falsa y a proteger los datos personales. Sin embargo, una charla aislada tendría poco efecto: habría que trabajar estos temas durante todo el curso.
También apoyaría los clubes deportivos. Ofrecen una alternativa atractiva, aunque deberían ser gratuitos o baratos para que nadie quedara excluido. Las reuniones con las familias ayudarían a mantener criterios parecidos en casa y en clase, pero tendrían que celebrarse en horarios accesibles.
Respecto a las zonas sin teléfonos, podrían favorecer la conversación durante los descansos. Aun así, convendría explicar su finalidad y escuchar a los alumnos. Por último, una aplicación para controlar el tiempo podría servir de apoyo, siempre que no recogiera información innecesaria.
Si tuviera que establecer prioridades, empezaría por los talleres y unas normas claras. Después evaluaría los resultados con los propios estudiantes.

ENTREVISTADOR: ¿No sería más sencillo prohibir los móviles por completo?
CANDIDATO: Sería más sencillo de aplicar, pero no necesariamente más educativo. Los alumnos seguirían utilizándolos fuera del colegio. Preferiría que aprendieran a reconocer cuándo les ayudan y cuándo les distraen. La prohibición podría ser útil en determinados momentos, no como única respuesta.

ENTREVISTADOR: ¿Y si las familias no colaboran?
CANDIDATO: El colegio aún puede establecer normas dentro de sus instalaciones. Además, habría que averiguar por qué no participan: quizá los horarios sean incompatibles con su trabajo. Ofrecer reuniones breves en línea podría facilitar el contacto.

ENTREVISTADOR: ¿Cómo sabría si las medidas funcionan?
CANDIDATO: Compararía la participación en clase y preguntaría a alumnos y profesores por los cambios. No mediría únicamente el tiempo de pantalla, porque una actividad educativa también puede requerir un dispositivo. Revisaría las medidas al final de cada trimestre.`,
    analysis: [
      'Оценены все шесть предложений; у каждого есть польза или ограничение.',
      'В диалоге кандидат уточняет позицию, отвечает на препятствие и предлагает способ оценки результата.',
      'Aprendieran, quedara, recogiera согласованы с условным характером рекомендаций.',
    ],
  },
  {
    id: 'airport-oral',
    task: 'oral-2',
    topic: 'tourism',
    title: 'Устный ответ · задержка в аэропорту',
    prompt:
      'Авторская словесная сцена вместо фотографии: мужчина с чемоданом смотрит на табло, молодая женщина рядом разговаривает по телефону; зал почти пуст. Придумайте связную историю, обсудите опыт. Это отдельная учебная сцена, не описание конкретной фотографии Cervantes.',
    text: `CANDIDATO — MONÓLOGO
En esta escena hay un hombre con una maleta que mira el panel de vuelos y una mujer joven que habla por teléfono. Como el aeropuerto parece casi vacío, imagino que es muy temprano y que llevan bastante tiempo esperando.
Voy a suponer que son compañeros de trabajo y que tenían que asistir a una reunión en otra ciudad. El hombre podría estar comprobando si han anunciado una nueva hora de salida, mientras ella intenta avisar a la persona que iba a recibirlos.
Es posible que el vuelo se haya retrasado por el mal tiempo. Antes de llegar al aeropuerto, quizá habían organizado todo con mucho cuidado: reservaron un hotel y prepararon los documentos necesarios. Por eso, esta espera les habrá resultado especialmente frustrante.
Por la actitud de cada uno, diría que están afrontando el problema de manera distinta. Él parece centrado en encontrar información; ella podría estar preocupada por las consecuencias del retraso. No sabemos exactamente qué sienten, pero sus acciones permiten imaginar una cierta tensión.
Creo que, después de consultar el panel, hablarán con el personal de la compañía. Si no hubiera otro vuelo disponible, podrían proponer una reunión por videollamada. Esa solución no sería ideal, aunque evitaría cancelar el encuentro por completo.
En definitiva, me imagino una situación incómoda que terminará resolviéndose gracias a la colaboración entre ambos. La experiencia seguramente les hará prever más margen de tiempo en futuros viajes.

ENTREVISTADOR: ¿Le ha ocurrido algo parecido?
CANDIDATO: Una vez mi tren salió con dos horas de retraso. Al principio me preocupé porque tenía una cita, pero llamé para explicar lo que ocurría. Pudimos cambiarla. Aprendí que avisar pronto suele ayudar más que enfadarse sin tener información.

ENTREVISTADOR: ¿Es mejor viajar solo o acompañado?
CANDIDATO: Depende del viaje. Solo puedo decidir con más libertad, pero acompañado comparto responsabilidades. Si surge un problema, es útil que una persona busque alternativas mientras la otra contacta con el alojamiento. Lo importante es acordar las prioridades antes de salir.

ENTREVISTADOR: ¿Qué cambiaría en la atención a los viajeros?
CANDIDATO: Mejoraría la claridad de los avisos. Aunque no se pueda resolver un retraso inmediatamente, saber cuándo llegará la próxima información reduce la incertidumbre. También ofrecería asistencia accesible para quienes no manejan bien las aplicaciones móviles.`,
    analysis: [
      'В первом абзаце — наблюдения; затем imagino, voy a suponer, es posible que маркируют историю.',
      'Habrá resultado выражает предположение о прошлом, а не будущее действие.',
      'Ответы в беседе переходят от конкретной сцены к опыту и обоснованным предложениям.',
    ],
  },
  {
    id: 'sport-survey',
    task: 'oral-3',
    topic: 'health',
    title: 'Устный диалог · зачем люди занимаются спортом',
    prompt:
      'Учебный опрос из Tarea 3: 100 взрослых, один главный мотив. Здоровье 50%, снижение стресса 25%, общение 15%, соревнования 10%. Разыграйте весь диалог, затем поменяйте личные ответы.',
    text: `ENTREVISTADOR: ¿Qué resultado le llama más la atención?
CANDIDATO: Me llama la atención que la mitad de las personas elija la salud. Es el doble que quienes mencionan el estrés y cinco veces la proporción de quienes prefieren competir. Parece que el bienestar pesa más que el rendimiento deportivo. Aun así, los datos no indican la edad de los participantes, así que sería prudente evitar conclusiones generales.

ENTREVISTADOR: ¿Qué habría respondido usted?
CANDIDATO: Probablemente habría elegido reducir el estrés. Después de pasar muchas horas sentado, salir a caminar me ayuda a desconectar. También disfruto cuando voy con amigos. Como había que escoger una sola razón, habría dejado fuera esa parte social, aunque para mí también es importante.

ENTREVISTADOR: ¿Le sorprende que tan pocas personas mencionen la competición?
CANDIDATO: No demasiado. Para competir hay que entrenar con regularidad y no todo el mundo dispone del tiempo necesario. Además, algunas personas prefieren actividades sin presión. Eso no significa que no se esfuercen; simplemente buscan otro tipo de satisfacción. Yo, por ejemplo, valoro más mantener la constancia que mejorar una marca.

ENTREVISTADOR: ¿Cree que las respuestas serían iguales entre los jóvenes?
CANDIDATO: Podrían ser distintas, pero necesitaríamos otro estudio para comprobarlo. Quizá las relaciones sociales tuvieran más peso, porque muchos jóvenes se apuntan a una actividad con sus compañeros. También dependería de si la encuesta se realiza en un club deportivo o entre personas que apenas hacen ejercicio.

ENTREVISTADOR: ¿Qué podría hacer el ayuntamiento para fomentar el deporte?
CANDIDATO: Empezaría por actividades gratuitas cerca de los barrios: grupos de paseo, pistas cuidadas y clases para principiantes. No bastaría con construir un gran polideportivo lejos del centro. Si el desplazamiento resulta complicado, mucha gente dejará de ir. También convendría ofrecer horarios compatibles con el trabajo y el cuidado de los hijos.

ENTREVISTADOR: ¿No debería ser una responsabilidad individual?
CANDIDATO: En parte sí; nadie puede adquirir un hábito por otra persona. Sin embargo, las condiciones influyen. Tener un parque seguro cerca facilita salir a caminar. Por eso, creo que la responsabilidad personal y las políticas públicas se complementan. Lo razonable sería eliminar obstáculos y dejar que cada persona elija la actividad que más le guste.`,
    analysis: [
      '50% корректно сравнивается с 25% и 10%; выводы ограничены неизвестной выборкой.',
      'Кандидат учитывает, что разрешён один ответ, поэтому мотивы могут пересекаться.',
      'Каждая реплика отвечает на вопрос; нет подготовленного монолога вместо взаимодействия.',
    ],
  },
];
