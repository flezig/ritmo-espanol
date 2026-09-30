export type KespaPair = { ru: string; es: string };

type PracticeSupplement = { fresh: KespaPair[]; mixed: KespaPair[] };

export const kespaPracticeSupplements: Record<string, PracticeSupplement> = {
  'kespa-pronouns': {
    fresh: [
      { ru: 'я', es: 'yo' }, { ru: 'ты', es: 'tú' }, { ru: 'он', es: 'él' }, { ru: 'она', es: 'ella' },
      { ru: 'мы (мужчины или смешанная группа)', es: 'nosotros' }, { ru: 'мы (женщины)', es: 'nosotras' },
      { ru: 'вы (неформально, в Испании)', es: 'vosotros' }, { ru: 'Вы (вежливо, один человек)', es: 'usted' },
    ],
    mixed: [
      { ru: 'Вы (несколько человек)', es: 'ustedes' }, { ru: 'они (мужчины или смешанная группа)', es: 'ellos' },
      { ru: 'они (женщины)', es: 'ellas' }, { ru: 'Я — Ана.', es: 'Yo soy Ana.' },
      { ru: 'Ты — Лео.', es: 'Tú eres Leo.' }, { ru: 'Он — Пабло.', es: 'Él es Pablo.' },
      { ru: 'Она — Марта.', es: 'Ella es Marta.' }, { ru: 'Мы — Ана и Марта.', es: 'Nosotras somos Ana y Marta.' },
      { ru: 'Они — Лео и Пабло.', es: 'Ellos son Leo y Pablo.' }, { ru: 'Вы — госпожа Руис?', es: '¿Usted es la señora Ruiz?' },
    ],
  },
  'kespa-ser': {
    fresh: [
      { ru: 'Я из Испании.', es: 'Soy de España.' }, { ru: 'Ты студент.', es: 'Eres estudiante.' },
      { ru: 'Она фотограф.', es: 'Es fotógrafa.' }, { ru: 'Мы друзья.', es: 'Somos amigos.' },
      { ru: 'Вы преподаватели.', es: 'Sois profesores.' }, { ru: 'Они мексиканцы.', es: 'Son mexicanos.' },
      { ru: 'Сегодня понедельник.', es: 'Hoy es lunes.' }, { ru: 'Стол деревянный.', es: 'La mesa es de madera.' },
    ],
    mixed: [
      { ru: 'Я Ана и я врач.', es: 'Soy Ana y soy médica.' }, { ru: 'Ты Лео и ты из Чили.', es: 'Eres Leo y eres de Chile.' },
      { ru: 'Она испанка.', es: 'Ella es española.' }, { ru: 'Мы студенты из России.', es: 'Somos estudiantes de Rusia.' },
      { ru: 'Вы новая команда.', es: 'Sois un equipo nuevo.' }, { ru: 'Они хорошие друзья.', es: 'Son buenos amigos.' },
      { ru: 'Он отличный преподаватель.', es: 'Es un profesor excelente.' }, { ru: 'Вы господин Лопес?', es: '¿Usted es el señor López?' },
      { ru: 'Нет, я не господин Лопес.', es: 'No, no soy el señor López.' },
    ],
  },
  'kespa-articles': {
    fresh: [
      { ru: 'одна книга', es: 'un libro' }, { ru: 'один стол', es: 'una mesa' },
      { ru: 'эта книга', es: 'el libro' }, { ru: 'этот стол', es: 'la mesa' },
      { ru: 'высокие девушки', es: 'las chicas altas' }, { ru: 'маленькие дома', es: 'los pisos pequeños' },
      { ru: 'интересная проблема', es: 'un problema interesante' }, { ru: 'белые кошки', es: 'unas gatas blancas' },
    ],
    mixed: [
      { ru: 'Ана — высокая девушка.', es: 'Ana es una chica alta.' }, { ru: 'Лео — спокойный парень.', es: 'Leo es un chico tranquilo.' },
      { ru: 'Книга новая.', es: 'El libro es nuevo.' }, { ru: 'Столы старые.', es: 'Las mesas son antiguas.' },
      { ru: 'Это небольшая команда.', es: 'Es un equipo pequeño.' }, { ru: 'Они умные студентки.', es: 'Son unas estudiantes inteligentes.' },
      { ru: 'Это важная проблема.', es: 'Es un problema importante.' }, { ru: 'Это красивые города.', es: 'Son ciudades bonitas.' },
      { ru: 'Врач добрая.', es: 'La médica es amable.' },
    ],
  },
  'kespa-article-system': {
    fresh: [
      { ru: 'Мне нужна ручка.', es: 'Necesito un bolígrafo.' }, { ru: 'Ручка синяя.', es: 'El bolígrafo es azul.' },
      { ru: 'Я покупаю хлеб.', es: 'Compro pan.' }, { ru: 'Здесь есть книги.', es: 'Hay libros aquí.' },
      { ru: 'Кошки любопытны.', es: 'Los gatos son curiosos.' }, { ru: 'Она врач.', es: 'Es médica.' },
      { ru: 'Она отличный врач.', es: 'Es una médica excelente.' }, { ru: 'холодная вода', es: 'el agua fría' },
    ],
    mixed: [
      { ru: 'Это книга. Книга новая.', es: 'Es un libro. El libro es nuevo.' }, { ru: 'Это вода. Вода холодная.', es: 'Es agua. El agua está fría.' },
      { ru: 'Я студент и говорю по-испански.', es: 'Soy estudiante y hablo español.' }, { ru: 'Мне нужна чашка воды.', es: 'Necesito un vaso de agua.' },
      { ru: 'Испанский — красивый язык.', es: 'El español es una lengua bonita.' }, { ru: 'У нас есть несколько друзей.', es: 'Tenemos unos amigos.' },
      { ru: 'Это белый орёл.', es: 'Es un águila blanca.' }, { ru: 'Аудитории большие.', es: 'Las aulas son grandes.' },
      { ru: 'Я покупаю яблоки и воду.', es: 'Compro manzanas y agua.' },
    ],
  },
  'kespa-article-special': {
    fresh: [
      { ru: 'в центр', es: 'al centro' }, { ru: 'из музея', es: 'del museo' },
      { ru: 'в школу', es: 'a la escuela' }, { ru: 'из дома', es: 'de la casa' },
      { ru: 'в понедельник', es: 'el lunes' }, { ru: 'по понедельникам', es: 'los lunes' },
      { ru: 'в час', es: 'a la una' }, { ru: 'в восемь', es: 'a las ocho' },
    ],
    mixed: [
      { ru: 'Урок в понедельник.', es: 'La clase es el lunes.' }, { ru: 'Встреча в девять.', es: 'La reunión es a las nueve.' },
      { ru: 'Я иду в музей.', es: 'Voy al museo.' }, { ru: 'Мы возвращаемся из центра.', es: 'Volvemos del centro.' },
      { ru: 'Он моет руки.', es: 'Se lava las manos.' }, { ru: 'Она надевает куртку.', es: 'Se pone la chaqueta.' },
      { ru: 'Они живут в Испании.', es: 'Viven en España.' }, { ru: 'Она едет в Сальвадор.', es: 'Viaja a El Salvador.' },
      { ru: 'Эбро — река.', es: 'El Ebro es un río.' },
    ],
  },
  'kespa-gender-details': {
    fresh: [
      { ru: 'город', es: 'la ciudad' }, { ru: 'песня', es: 'la canción' }, { ru: 'карта', es: 'el mapa' },
      { ru: 'рука', es: 'la mano' }, { ru: 'фотография', es: 'la foto' }, { ru: 'день', es: 'el día' },
      { ru: 'студентка', es: 'la estudiante' }, { ru: 'журналист', es: 'el periodista' },
    ],
    mixed: [
      { ru: 'Большой город.', es: 'La ciudad es grande.' }, { ru: 'Новая карта.', es: 'El mapa es nuevo.' },
      { ru: 'Красивая фотография.', es: 'La foto es bonita.' }, { ru: 'Хорошая программа.', es: 'El programa es bueno.' },
      { ru: 'Она молодая журналистка.', es: 'Es una periodista joven.' }, { ru: 'Он испанский артист.', es: 'Es un artista español.' },
      { ru: 'Столица небольшая.', es: 'La capital es pequeña.' }, { ru: 'Капитал важен.', es: 'El capital es importante.' },
      { ru: 'Проблема серьёзная.', es: 'El problema es serio.' },
    ],
  },
  'kespa-lo-determiners': {
    fresh: [
      { ru: 'Я хочу одну (книгу).', es: 'Quiero una.' }, { ru: 'Мне нужен один (словарь).', es: 'Necesito uno.' },
      { ru: 'что-то хорошее', es: 'algo bueno' }, { ru: 'ничего нового', es: 'nada nuevo' },
      { ru: 'самое важное', es: 'lo más importante' }, { ru: 'то хорошее в книге', es: 'lo bueno del libro' },
      { ru: 'некоторые друзья', es: 'algunos amigos' }, { ru: 'никакая проблема', es: 'ningún problema' },
    ],
    mixed: [
      { ru: 'Мне нужна одна синяя ручка.', es: 'Necesito una azul.' }, { ru: 'Я хочу один новый словарь.', es: 'Quiero uno nuevo.' },
      { ru: 'Главное — регулярность.', es: 'Lo importante es la regularidad.' }, { ru: 'Самое трудное — начало.', es: 'Lo más difícil es el principio.' },
      { ru: 'Здесь есть что-то интересное.', es: 'Hay algo interesante aquí.' }, { ru: 'Нет ничего нового.', es: 'No hay nada nuevo.' },
      { ru: 'Некоторые книги дорогие.', es: 'Algunos libros son caros.' }, { ru: 'У меня нет никакой проблемы.', es: 'No tengo ningún problema.' },
      { ru: 'Один хороший, а другой плохой.', es: 'Uno es bueno y el otro es malo.' },
    ],
  },
  'kespa-family': {
    fresh: [
      { ru: 'У тебя есть брат.', es: 'Tienes un hermano.' }, { ru: 'У него есть дочь.', es: 'Tiene una hija.' },
      { ru: 'У нас большая семья.', es: 'Tenemos una familia grande.' }, { ru: 'У вас есть дети.', es: 'Tenéis hijos.' },
      { ru: 'У них есть бабушка.', es: 'Tienen una abuela.' }, { ru: 'У меня нет сестёр.', es: 'No tengo hermanas.' },
      { ru: 'Тебе двадцать лет.', es: 'Tienes veinte años.' }, { ru: 'Сколько вам лет?', es: '¿Cuántos años tenéis?' },
    ],
    mixed: [
      { ru: 'У меня есть старший брат.', es: 'Tengo un hermano mayor.' }, { ru: 'У неё есть младшая сестра.', es: 'Tiene una hermana menor.' },
      { ru: 'Нашим детям пять лет.', es: 'Nuestros hijos tienen cinco años.' }, { ru: 'У вас есть домашние животные?', es: '¿Tenéis mascotas?' },
      { ru: 'У них нет детей.', es: 'No tienen hijos.' }, { ru: 'Мои родители из Чили.', es: 'Mis padres son de Chile.' },
      { ru: 'Его брат — врач.', es: 'Su hermano es médico.' }, { ru: 'У бабушки есть кот.', es: 'La abuela tiene un gato.' },
      { ru: 'Сколько у неё братьев?', es: '¿Cuántos hermanos tiene?' },
    ],
  },
  'kespa-possessives': {
    fresh: [
      { ru: 'мой брат', es: 'mi hermano' }, { ru: 'мои сёстры', es: 'mis hermanas' }, { ru: 'твой дом', es: 'tu casa' },
      { ru: 'твои друзья', es: 'tus amigos' }, { ru: 'его дочь', es: 'su hija' }, { ru: 'их дети', es: 'sus hijos' },
      { ru: 'наша мама', es: 'nuestra madre' }, { ru: 'ваши родители', es: 'vuestros padres' },
    ],
    mixed: [
      { ru: 'Моя сестра — врач.', es: 'Mi hermana es médica.' }, { ru: 'Твои родители из Испании.', es: 'Tus padres son de España.' },
      { ru: 'У нашего брата есть сын.', es: 'Nuestro hermano tiene un hijo.' }, { ru: 'Их дом большой.', es: 'Su casa es grande.' },
      { ru: 'Её зовут Лус.', es: 'Su nombre es Luz.' }, { ru: 'Это его книга, не её.', es: 'Es el libro de él, no el de ella.' },
      { ru: 'Наши дочери — студентки.', es: 'Nuestras hijas son estudiantes.' }, { ru: 'Ваш кот спокойный.', es: 'Vuestro gato es tranquilo.' },
      { ru: 'У моих родителей есть собака.', es: 'Mis padres tienen un perro.' },
    ],
  },
  'kespa-description': {
    fresh: [
      { ru: 'Она высокая.', es: 'Es alta.' }, { ru: 'Он невысокий.', es: 'Es bajo.' }, { ru: 'Они молодые.', es: 'Son jóvenes.' },
      { ru: 'Мы дружелюбные.', es: 'Somos amables.' }, { ru: 'Она очень весёлая.', es: 'Es muy divertida.' },
      { ru: 'Он немного застенчивый.', es: 'Es un poco tímido.' }, { ru: 'У неё светлые волосы.', es: 'Tiene el pelo rubio.' },
      { ru: 'У него зелёные глаза.', es: 'Tiene los ojos verdes.' },
    ],
    mixed: [
      { ru: 'Моя сестра высокая и серьёзная.', es: 'Mi hermana es alta y seria.' }, { ru: 'Наши родители очень добрые.', es: 'Nuestros padres son muy amables.' },
      { ru: 'Её брат молодой и общительный.', es: 'Su hermano es joven y sociable.' }, { ru: 'У вашей дочери тёмные волосы.', es: 'Vuestra hija tiene el pelo oscuro.' },
      { ru: 'Сегодня Ана немного нервничает.', es: 'Hoy Ana está un poco nerviosa.' }, { ru: 'Лео носит очки.', es: 'Leo lleva gafas.' },
      { ru: 'Они весёлые, но довольно застенчивые.', es: 'Son divertidos, pero bastante tímidos.' }, { ru: 'У него много друзей.', es: 'Tiene muchos amigos.' },
      { ru: 'Она не скучная; ей скучно.', es: 'No es aburrida; está aburrida.' },
    ],
  },
  'kespa-tener-more': {
    fresh: [
      { ru: 'Я хочу пить.', es: 'Tengo sed.' }, { ru: 'Тебе холодно.', es: 'Tienes frío.' }, { ru: 'Ей жарко.', es: 'Tiene calor.' },
      { ru: 'Мы хотим спать.', es: 'Tenemos sueño.' }, { ru: 'Вы спешите.', es: 'Tenéis prisa.' }, { ru: 'Они боятся.', es: 'Tienen miedo.' },
      { ru: 'Мне нужно работать.', es: 'Tengo que trabajar.' }, { ru: 'Нам не нужно идти.', es: 'No tenemos que ir.' },
    ],
    mixed: [
      { ru: 'Моя сестра голодна.', es: 'Mi hermana tiene hambre.' }, { ru: 'Наши дети хотят пить.', es: 'Nuestros hijos tienen sed.' },
      { ru: 'Тебе нужно позвонить родителям.', es: 'Tienes que llamar a tus padres.' }, { ru: 'Ему не нужно работать сегодня.', es: 'No tiene que trabajar hoy.' },
      { ru: 'Нам нужно купить воду.', es: 'Tenemos que comprar agua.' }, { ru: 'Вы устали и хотите спать.', es: 'Estáis cansados y tenéis sueño.' },
      { ru: 'Она не спешит.', es: 'No tiene prisa.' }, { ru: 'Им нужно выйти в восемь.', es: 'Tienen que salir a las ocho.' },
      { ru: 'Тебе не нужно приходить.', es: 'No tienes que venir.' },
    ],
  },
  'kespa-demonstratives': {
    fresh: [
      { ru: 'эта книга', es: 'este libro' }, { ru: 'эти фотографии', es: 'estas fotos' }, { ru: 'тот стол у тебя', es: 'esa mesa' },
      { ru: 'те дома у тебя', es: 'esas casas' }, { ru: 'вон тот город', es: 'aquella ciudad' }, { ru: 'вон те деревья', es: 'aquellos árboles' },
      { ru: 'Что это?', es: '¿Qué es esto?' }, { ru: 'То вдалеке красиво.', es: 'Aquello es bonito.' },
    ],
    mixed: [
      { ru: 'Эта книга на столе.', es: 'Este libro está en la mesa.' }, { ru: 'Та сумка под стулом.', es: 'Esa bolsa está debajo de la silla.' },
      { ru: 'Вон тот дом далеко.', es: 'Aquella casa está lejos.' }, { ru: 'Эти фотографии моей семьи.', es: 'Estas fotos son de mi familia.' },
      { ru: 'Кафе рядом с музеем.', es: 'El café está cerca del museo.' }, { ru: 'Ключи внутри сумки.', es: 'Las llaves están dentro de la bolsa.' },
      { ru: 'Что это рядом с окном?', es: '¿Qué es eso junto a la ventana?' }, { ru: 'Вон те коробки старые.', es: 'Aquellas cajas son antiguas.' },
      { ru: 'Мой стол перед дверью.', es: 'Mi mesa está delante de la puerta.' },
    ],
  },
  'kespa-ar': {
    fresh: [
      { ru: 'Я пою.', es: 'Canto.' }, { ru: 'Ты танцуешь.', es: 'Bailas.' }, { ru: 'Она работает.', es: 'Trabaja.' },
      { ru: 'Мы разговариваем.', es: 'Hablamos.' }, { ru: 'Вы готовите.', es: 'Cocináis.' }, { ru: 'Они слушают.', es: 'Escuchan.' },
      { ru: 'Ты занимаешься сегодня?', es: '¿Estudias hoy?' }, { ru: 'Я сегодня не работаю.', es: 'No trabajo hoy.' },
    ],
    mixed: [
      { ru: 'Моя сестра работает дома.', es: 'Mi hermana trabaja en casa.' }, { ru: 'Наши друзья говорят по-испански.', es: 'Nuestros amigos hablan español.' },
      { ru: 'Я слушаю музыку и танцую.', es: 'Escucho música y bailo.' }, { ru: 'Вы готовите вместе?', es: '¿Cocináis juntos?' },
      { ru: 'Они не занимаются по воскресеньям.', es: 'No estudian los domingos.' }, { ru: 'Этот преподаватель объясняет хорошо.', es: 'Este profesor explica bien.' },
      { ru: 'Мы покупаем хлеб и воду.', es: 'Compramos pan y agua.' }, { ru: 'Когда ты заканчиваешь?', es: '¿Cuándo terminas?' },
      { ru: 'Ана завтракает в восемь.', es: 'Ana desayuna a las ocho.' },
    ],
  },
  'kespa-er-ir': {
    fresh: [
      { ru: 'Я пью воду.', es: 'Bebo agua.' }, { ru: 'Ты ешь дома.', es: 'Comes en casa.' }, { ru: 'Он читает.', es: 'Lee.' },
      { ru: 'Мы живём здесь.', es: 'Vivimos aquí.' }, { ru: 'Вы пишете.', es: 'Escribís.' }, { ru: 'Они открывают окно.', es: 'Abren la ventana.' },
      { ru: 'Ты понимаешь?', es: '¿Entiendes?' }, { ru: 'Я не получаю письма.', es: 'No recibo cartas.' },
    ],
    mixed: [
      { ru: 'Мой брат живёт в Мадриде.', es: 'Mi hermano vive en Madrid.' }, { ru: 'Мы читаем и пишем каждый день.', es: 'Leemos y escribimos cada día.' },
      { ru: 'Ваши дети едят дома.', es: 'Vuestros hijos comen en casa.' }, { ru: 'Ты открываешь эту книгу?', es: '¿Abres este libro?' },
      { ru: 'Они не понимают вопрос.', es: 'No entienden la pregunta.' }, { ru: 'Я работаю и живу здесь.', es: 'Trabajo y vivo aquí.' },
      { ru: 'Вы пьёте кофе в восемь.', es: 'Bebéis café a las ocho.' }, { ru: 'Она пишет короткие сообщения.', es: 'Escribe mensajes cortos.' },
      { ru: 'Мы получаем много писем.', es: 'Recibimos muchas cartas.' },
    ],
  },
  'kespa-irregular': {
    fresh: [
      { ru: 'Я хочу отдохнуть.', es: 'Quiero descansar.' }, { ru: 'Ты можешь прийти.', es: 'Puedes venir.' }, { ru: 'Он делает ужин.', es: 'Hace la cena.' },
      { ru: 'Мы хотим учиться.', es: 'Queremos estudiar.' }, { ru: 'Вы можете помочь.', es: 'Podéis ayudar.' }, { ru: 'Они делают упражнения.', es: 'Hacen ejercicios.' },
      { ru: 'Я выхожу в восемь.', es: 'Salgo a las ocho.' }, { ru: 'У тебя есть время?', es: '¿Tienes tiempo?' },
    ],
    mixed: [
      { ru: 'Я хочу говорить по-испански.', es: 'Quiero hablar español.' }, { ru: 'Моя сестра может помочь.', es: 'Mi hermana puede ayudar.' },
      { ru: 'Мы делаем задание вместе.', es: 'Hacemos la tarea juntos.' }, { ru: 'Вы хотите эту книгу?', es: '¿Queréis este libro?' },
      { ru: 'Они не могут прийти сегодня.', es: 'No pueden venir hoy.' }, { ru: 'Я знаю этого преподавателя.', es: 'Conozco a este profesor.' },
      { ru: 'Ты говоришь правду.', es: 'Dices la verdad.' }, { ru: 'Она приходит рано.', es: 'Viene temprano.' },
      { ru: 'Мы думаем, что это важно.', es: 'Pensamos que es importante.' },
    ],
  },
};
