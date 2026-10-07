

export const starterLessons = [
  {
    title: '01 · Presente simple',
    lessonId: 'day',
    subtitle: 'Говорим о себе и ежедневных действиях',
    steps: [
      ['Основа', 'Уберите -ar/-er/-ir: hablar → habl-, comer → com-.'],
      ['Окончания -AR', '-o, -as, -a, -amos, -áis, -an'],
      ['Окончания -ER', '-o, -es, -e, -emos, -éis, -en'],
      ['Окончания -IR', '-o, -es, -e, -imos, -ís, -en'],
      ['В речи', 'Trabajo, estudio y vivo en Madrid.'],
    ],
  },
  {
    title: '02 · Артикли',
    lessonId: 'intro',
    subtitle: 'El, la, los, las и когда нужен un/una',
    steps: [
      ['Род', 'el — мужской род, la — женский: el viaje, la mesa.'],
      ['Множественное число', 'los viajes, las mesas.'],
      ['Неопределённый', 'un/una — один или впервые упомянутый предмет.'],
      ['Определённый', 'el/la — предмет уже известен собеседнику.'],
      ['В речи', 'Busco un hotel. El hotel está cerca.'],
    ],
  },
  {
    title: '03 · Предлоги',
    lessonId: 'day',
    subtitle: 'A, de, en, con, por и para без путаницы',
    steps: [
      ['a', 'направление и адресат: Voy a Madrid.'],
      ['de', 'происхождение и принадлежность: Soy de Perú.'],
      ['en / con', 'место или транспорт / совместность: en casa, con Ana.'],
      ['por / para', 'причина или путь / цель или получатель.'],
      ['В речи', 'Este regalo es para ti. Gracias por venir.'],
    ],
  },
  {
    title: '04 · Знакомство',
    lessonId: 'intro',
    subtitle: 'Поздороваться, представиться и поддержать первый разговор',
    steps: [
      ['Поздороваться', 'Buenos días. — Доброе утро.'],
      ['Узнать имя', '¿Cómo te llamas? — Как тебя зовут?'],
      ['Сказать, откуда вы', 'Soy de Rusia. — Я из России.'],
      ['Рассказать о себе', 'Soy estudiante. — Я студент.'],
      ['Завершить знакомство', 'Mucho gusto. — Очень приятно.'],
    ],
  },
  {
    title: '05 · В кафе',
    lessonId: 'food',
    subtitle: 'Сделать заказ, уточнить цену и попросить счёт',
    steps: [
      ['Вежливый заказ', 'Quisiera un café, por favor. — Я бы хотел кофе, пожалуйста.'],
      ['Выбрать блюдо', 'Para mí, una ensalada. — Мне салат.'],
      ['Спросить цену', '¿Cuánto cuesta? — Сколько это стоит?'],
      ['Попросить воду', '¿Me trae agua, por favor? — Принесите мне воду, пожалуйста.'],
      ['Попросить счёт', 'La cuenta, por favor. — Счёт, пожалуйста.'],
    ],
  },
  {
    title: '06 · В городе',
    lessonId: 'home',
    subtitle: 'Спросить дорогу и понять короткое объяснение маршрута',
    steps: [
      ['Начать вежливо', 'Perdone, ¿dónde está el metro? — Извините, где метро?'],
      ['Идти прямо', 'Siga recto. — Идите прямо.'],
      ['Повернуть', 'Gire a la derecha. — Поверните направо.'],
      ['Уточнить расстояние', '¿Está lejos? — Это далеко?'],
      ['Понять ориентир', 'Está al lado del banco. — Это рядом с банком.'],
    ],
  },
];

export const starterChecks = [
  [
    {
      prompt: 'Выберите форму: Yo ___ español.',
      options: ['hablo', 'hablas', 'habla'],
      answer: 'hablo',
    },
    {
      prompt: 'Nosotros ___ cada día.',
      options: ['trabajan', 'trabajamos', 'trabajo'],
      answer: 'trabajamos',
    },
    {
      prompt: 'Tú ___ pan.',
      options: ['comes', 'como', 'comen'],
      answer: 'comes',
    },
    {
      prompt: 'Ellos ___ en Madrid.',
      options: ['vive', 'vivimos', 'viven'],
      answer: 'viven',
    },
    {
      prompt: 'Какая фраза естественна?',
      options: [
        'Estudio español.',
        'Yo estudiar español.',
        'Estudio el español yo.',
      ],
      answer: 'Estudio español.',
    },
  ],
  [
    {
      prompt: 'Выберите правильный артикль: ___ problema.',
      options: ['el', 'la', 'una'],
      answer: 'el',
    },
    {
      prompt: 'Множественное число: la mesa →',
      options: ['los mesas', 'las mesas', 'las mesa'],
      answer: 'las mesas',
    },
    {
      prompt: 'Впервые упоминаем гостиницу:',
      options: ['Busco un hotel.', 'Busco el hotel.', 'Busco una hotel.'],
      answer: 'Busco un hotel.',
    },
    {
      prompt: 'Гостиница уже известна:',
      options: [
        'El hotel está cerca.',
        'Un hotel está cerca.',
        'La hotel está cerca.',
      ],
      answer: 'El hotel está cerca.',
    },
    {
      prompt: 'Выберите правильную пару:',
      options: ['la viaje', 'el viaje', 'una viaje'],
      answer: 'el viaje',
    },
  ],
  [
    {
      prompt: 'Направление: Voy ___ Madrid.',
      options: ['a', 'de', 'con'],
      answer: 'a',
    },
    {
      prompt: 'Происхождение: Soy ___ Perú.',
      options: ['por', 'de', 'para'],
      answer: 'de',
    },
    {
      prompt: 'Место: Estoy ___ casa.',
      options: ['en', 'a', 'por'],
      answer: 'en',
    },
    {
      prompt: 'Получатель: Este regalo es ___ ti.',
      options: ['por', 'para', 'de'],
      answer: 'para',
    },
    {
      prompt: 'Причина благодарности: Gracias ___ venir.',
      options: ['por', 'para', 'a'],
      answer: 'por',
    },
  ],
  [
    {
      prompt: 'Сейчас утро. Как поздороваться?',
      options: ['Buenos días.', 'Buenas noches.', 'Hasta mañana.'],
      answer: 'Buenos días.',
    },
    {
      prompt: 'Как спросить имя собеседника?',
      options: ['¿Cómo te llamas?', '¿Dónde vives?', '¿Cuántos años tienes?'],
      answer: '¿Cómo te llamas?',
    },
    {
      prompt: 'Вы из России. Выберите подходящую реплику.',
      options: ['Soy de Rusia.', 'Vivo Rusia.', 'Estoy de Rusia.'],
      answer: 'Soy de Rusia.',
    },
    {
      prompt: 'Как сказать «Я студент»?',
      options: ['Soy estudiante.', 'Tengo estudiante.', 'Estoy estudiante.'],
      answer: 'Soy estudiante.',
    },
    {
      prompt: 'Что уместно ответить при знакомстве?',
      options: ['Mucho gusto.', 'La cuenta, por favor.', 'Gire a la derecha.'],
      answer: 'Mucho gusto.',
    },
  ],
  [
    {
      prompt: 'Как вежливо заказать кофе?',
      options: ['Quisiera un café, por favor.', '¿Dónde está el café?', 'No tomo café nunca.'],
      answer: 'Quisiera un café, por favor.',
    },
    {
      prompt: 'Официант спрашивает: «¿Qué desea?». Вы хотите салат.',
      options: ['Para mí, una ensalada.', 'La ensalada está cerrada.', 'Soy una ensalada.'],
      answer: 'Para mí, una ensalada.',
    },
    {
      prompt: 'Как спросить «Сколько это стоит?»',
      options: ['¿Cuánto cuesta?', '¿Cómo se llama?', '¿A qué hora abre?'],
      answer: '¿Cuánto cuesta?',
    },
    {
      prompt: 'Как вежливо попросить принести воду?',
      options: ['¿Me trae agua, por favor?', '¿Me llama agua?', '¿Me cuesta agua?'],
      answer: '¿Me trae agua, por favor?',
    },
    {
      prompt: 'Вы закончили есть. Что сказать официанту?',
      options: ['La cuenta, por favor.', 'Siga recto.', 'Mucho gusto.'],
      answer: 'La cuenta, por favor.',
    },
  ],
  [
    {
      prompt: 'Как вежливо спросить, где метро?',
      options: ['Perdone, ¿dónde está el metro?', '¿Cuánto cuesta el metro?', 'El metro está cerrado.'],
      answer: 'Perdone, ¿dónde está el metro?',
    },
    {
      prompt: 'Вам говорят «Siga recto». Что нужно сделать?',
      options: ['Идти прямо.', 'Повернуть налево.', 'Вернуться назад.'],
      answer: 'Идти прямо.',
    },
    {
      prompt: 'Как сказать «Поверните направо»?',
      options: ['Gire a la derecha.', 'Siga hasta mañana.', 'Está a la izquierda.'],
      answer: 'Gire a la derecha.',
    },
    {
      prompt: 'Как уточнить, далеко ли нужное место?',
      options: ['¿Está lejos?', '¿Está abierto?', '¿Está ocupado?'],
      answer: '¿Está lejos?',
    },
    {
      prompt: 'Что означает «Está al lado del banco»?',
      options: ['Это рядом с банком.', 'Это внутри банка.', 'Это далеко от банка.'],
      answer: 'Это рядом с банком.',
    },
  ],
] as const;
