import type { VocabularyEntry } from './vocabulary';
import { unidad2Vocabulary } from './unidad2-vocabulary.ts';

type Row = [string, string, string, string, string, string];
const r = (...row: Row) => row;

const wordsFromUnidad2 = [
  'bueno','pequeño','malo','hijo','coche','actor','actriz','chico','chica','hombre','mujer','idioma','casa','tema','flor','ciudad','país','jefe','libro','familia','secretaria','empleada','camarero','día','noche','foto','amiga','novio','trabajo','canción','cantante','ingeniero','enfermera','revista','vida','pintora','periodista','abogado','intérprete','estudiante','turista','escritora','ser','español','género','número','sustantivo',
];

const rows: Row[] = [
  r('bonito','красивый','Es un barrio bonito y tranquilo.','Это красивый и спокойный район.','La plaza está muy bonita en primavera.','Весной площадь очень красивая.'),
  r('caro','дорогой','Ese restaurante es demasiado caro.','Этот ресторан слишком дорогой.','La entrada no es cara si la compras antes.','Билет недорогой, если купить его заранее.'),
  r('famoso','известный','Es un actor famoso en toda España.','Это известный во всей Испании актёр.','La ciudad es famosa por su arquitectura.','Город известен своей архитектурой.'),
  r('alegre','весёлый','Pablo es alegre y habla con todo el mundo.','Пабло весёлый и разговаривает со всеми.','La canción tiene una melodía alegre.','У песни весёлая мелодия.'),
  r('azul','синий','Hoy lleva un abrigo azul.','Сегодня на нём синее пальто.','Las paredes de la habitación son azules.','Стены комнаты синие.'),
  r('pesimista','пессимистичный','No seas tan pesimista: todavía hay tiempo.','Не будь таким пессимистичным: время ещё есть.','Su hermana es menos pesimista que él.','Его сестра менее пессимистична, чем он.'),
  r('dormilón','сонливый','Mi hermano es dormilón y nunca se levanta temprano.','Мой брат сонливый и никогда не встаёт рано.','La gata está dormilona esta mañana.','Кошка сегодня утром сонная.'),
  r('trabajador','трудолюбивый','Luis es muy trabajador y responsable.','Луис очень трудолюбивый и ответственный.','Buscan una persona trabajadora para el puesto.','На эту должность ищут трудолюбивого человека.'),
  r('importante','важный','Tenemos una reunión importante mañana.','Завтра у нас важное совещание.','Estas decisiones son importantes para el equipo.','Эти решения важны для команды.'),
  r('feliz','счастливый','Estoy feliz de verte otra vez.','Я счастлив снова тебя видеть.','Los niños parecen felices en la foto.','Дети выглядят счастливыми на фотографии.'),
  r('grande','большой','Vivimos en una ciudad grande.','Мы живём в большом городе.','Necesito una mesa más grande.','Мне нужен стол побольше.'),
  r('triste','грустный','La película tiene un final triste.','У фильма грустный конец.','Ana está triste porque su amiga se va.','Ана грустит, потому что её подруга уезжает.'),
  r('hermoso','прекрасный','Desde aquí se ve un paisaje hermoso.','Отсюда открывается прекрасный пейзаж.','Pasamos una tarde hermosa junto al mar.','Мы провели прекрасный вечер у моря.'),
  r('feo','некрасивый','El edificio es feo, pero muy práctico.','Здание некрасивое, но очень практичное.','Hace un día feo y lluvioso.','Сегодня ненастный дождливый день.'),
  r('rico','богатый','Es un país rico en recursos naturales.','Это страна, богатая природными ресурсами.','La familia era rica, pero vivía con sencillez.','Семья была богатой, но жила скромно.'),
  r('pobre','бедный','Era un barrio pobre con pocos servicios.','Это был бедный район с небольшим количеством услуг.','La familia pobre recibió ayuda.','Бедная семья получила помощь.'),
  r('joven','молодой','Es un profesor joven con mucha experiencia.','Это молодой преподаватель с большим опытом.','La actriz era muy joven en esa película.','Актриса была очень молодой в том фильме.'),
  r('viejo','старый','Mi abuelo guarda un reloj viejo.','Мой дедушка хранит старые часы.','Han reformado una casa vieja del centro.','Они отремонтировали старый дом в центре.'),
  r('barato','дешёвый','Encontramos un hotel barato cerca de la estación.','Мы нашли дешёвый отель рядом с вокзалом.','Estas entradas son más baratas por internet.','Эти билеты дешевле в интернете.'),
  r('interesante','интересный','Estoy leyendo un libro muy interesante.','Я читаю очень интересную книгу.','La profesora hizo preguntas interesantes.','Преподавательница задала интересные вопросы.'),
  r('aburrido','скучный','El viaje fue largo y aburrido.','Поездка была долгой и скучной.','La clase no es aburrida cuando practicamos juntos.','Занятие не скучное, когда мы практикуемся вместе.'),
  r('fácil','лёгкий','Este ejercicio es fácil de entender.','Это упражнение легко понять.','Las primeras preguntas son fáciles.','Первые вопросы лёгкие.'),
  r('difícil','трудный','La pronunciación parece difícil al principio.','Поначалу произношение кажется трудным.','Son decisiones difíciles para todos.','Это трудные решения для всех.'),
  r('inteligente','умный','Es una alumna inteligente y curiosa.','Она умная и любознательная ученица.','Los perros son animales inteligentes.','Собаки — умные животные.'),
  r('tonto','глупый','Fue un error tonto, pero fácil de corregir.','Это была глупая, но легко исправимая ошибка.','No hagas preguntas tontas solo para molestar.','Не задавай глупых вопросов только ради того, чтобы мешать.'),
  r('alto','высокий','Mi hermano es alto y delgado.','Мой брат высокий и худой.','Vivimos en un edificio muy alto.','Мы живём в очень высоком здании.'),
  r('bajo','низкий','La mesa es demasiado baja para trabajar.','Стол слишком низкий для работы.','Es un hombre bajo con gafas.','Это невысокий мужчина в очках.'),
  r('delgado','худой','El actor está más delgado en esta película.','Актёр выглядит худее в этом фильме.','La chica delgada lleva un vestido rojo.','На худой девушке красное платье.'),
  r('gordo','полный','El gato está un poco gordo.','Кот немного полный.','Era un hombre gordo y muy simpático.','Это был полный и очень приятный мужчина.'),
  r('fuerte','сильный','Necesitamos una persona fuerte para mover la mesa.','Нам нужен сильный человек, чтобы передвинуть стол.','El café está demasiado fuerte para mí.','Кофе для меня слишком крепкий.'),
  r('callado','молчаливый','El nuevo alumno es callado, pero amable.','Новый ученик молчаливый, но добрый.','Marta está muy callada hoy.','Марта сегодня очень молчалива.'),
  r('largo','длинный','Tuvimos un viaje largo en tren.','У нас была долгая поездка на поезде.','La calle es larga y estrecha.','Улица длинная и узкая.'),
  r('corto','короткий','Es un libro corto y fácil de leer.','Это короткая и лёгкая для чтения книга.','Tiene el pelo corto.','У неё короткие волосы.'),
  r('rápido','быстрый','Necesitamos una respuesta rápida.','Нам нужен быстрый ответ.','El tren rápido tarda dos horas.','Скорый поезд идёт два часа.'),
  r('tranquilo','спокойный','Buscamos un hotel tranquilo.','Мы ищем спокойный отель.','La niña está tranquila con su madre.','Девочка спокойна рядом с матерью.'),
  r('serio','серьёзный','Es un problema serio.','Это серьёзная проблема.','La jefa parece seria, pero es amable.','Начальница кажется серьёзной, но она добрая.'),
  r('guapo','красивый','Su novio es alto y guapo.','Её парень высокий и красивый.','La actriz está muy guapa en esa foto.','Актриса очень красивая на этой фотографии.'),
  r('tímido','застенчивый','Era tímido cuando era niño.','Он был застенчивым в детстве.','La estudiante nueva es un poco tímida.','Новая студентка немного застенчива.'),
  r('optimista','оптимистичный','Soy optimista sobre el futuro.','Я с оптимизмом смотрю в будущее.','Ella siempre ha sido optimista.','Она всегда была оптимисткой.'),
  r('listo','сообразительный','Tu hijo es muy listo para su edad.','Твой сын очень сообразительный для своего возраста.','La alumna lista encontró la solución.','Сообразительная ученица нашла решение.'),
  r('simpático','приятный','El camarero fue muy simpático con nosotros.','Официант был очень любезен с нами.','Tenemos unas vecinas simpáticas.','У нас приятные соседки.'),
  r('perezoso','ленивый','No seas perezoso y termina la tarea.','Не ленись и закончи задание.','Mi gata está perezosa los domingos.','По воскресеньям моя кошка ленивая.'),
  r('hablador','разговорчивый','Mi compañero es muy hablador.','Мой коллега очень разговорчивый.','La niña habladora hizo muchos amigos.','Разговорчивая девочка завела много друзей.'),
  r('débil','слабый','Después de la gripe todavía me siento débil.','После гриппа я всё ещё чувствую слабость.','La señal de internet es muy débil aquí.','Сигнал интернета здесь очень слабый.'),
  r('superficial','поверхностный','El artículo ofrece un análisis superficial.','Статья предлагает поверхностный анализ.','No quiero dar una respuesta superficial.','Я не хочу давать поверхностный ответ.'),
  r('limpio','чистый','El baño está limpio.','Ванная чистая.','Necesito una camisa limpia.','Мне нужна чистая рубашка.'),
  r('sucio','грязный','El coche está sucio después del viaje.','Машина грязная после поездки.','Deja los zapatos sucios en la entrada.','Оставь грязную обувь у входа.'),
  r('lengua','язык','El español es una lengua románica.','Испанский — романский язык.','La lengua cambia con el tiempo.','Язык меняется со временем.'),
  r('hija','дочь','Su hija estudia medicina.','Его дочь изучает медицину.','Tengo una hija de diez años.','У меня есть десятилетняя дочь.'),
  r('calle','улица','Vivimos en una calle tranquila.','Мы живём на тихой улице.','Cruza la calle en el semáforo.','Переходи улицу на светофоре.'),
  r('futbolista','футболист','El futbolista entrena cada mañana.','Футболист тренируется каждое утро.','La futbolista marcó dos goles.','Футболистка забила два гола.'),
  r('historia','история','Me contó una historia muy divertida.','Он рассказал мне очень забавную историю.','Es una historia corta con un final triste.','Это короткая история с грустным концом.'),
  r('situación','ситуация','Estamos en una situación difícil.','Мы находимся в трудной ситуации.','La situación mejoró por la tarde.','К вечеру ситуация улучшилась.'),
  r('niño','ребёнок','El niño juega en el parque.','Ребёнок играет в парке.','Cuando era niño vivía en Sevilla.','В детстве он жил в Севилье.'),
  r('reloj','часы','Mi reloj se ha parado.','Мои часы остановились.','Hay un reloj grande en la pared.','На стене висят большие часы.'),
  r('vino','вино','Este vino es de España.','Это вино из Испании.','Pedimos una copa de vino tinto.','Мы заказали бокал красного вина.'),
  r('ordenador','компьютер','Trabajo con el ordenador todo el día.','Я работаю за компьютером весь день.','El ordenador nuevo es muy rápido.','Новый компьютер очень быстрый.'),
  r('sauna','сауна','La sauna del hotel abre a las nueve.','Сауна в отеле открывается в девять.','Después de nadar fuimos a la sauna.','После плавания мы пошли в сауну.'),
  r('gorila','горилла','El gorila come fruta y hojas.','Горилла ест фрукты и листья.','Vimos una gorila con su cría.','Мы увидели гориллу с детёнышем.'),
  r('perfume','духи','Este perfume es francés.','Эти духи французские.','Le regalé un perfume por su cumpleaños.','Я подарил ей духи на день рождения.'),
  r('whisky','виски','El whisky escocés es conocido en todo el mundo.','Шотландский виски известен во всём мире.','Pidió un whisky con hielo.','Он заказал виски со льдом.'),
  r('moda','мода','La moda italiana es famosa.','Итальянская мода знаменита.','No siempre sigo la moda.','Я не всегда следую моде.'),
  r('porcelana','фарфор','La taza es de porcelana china.','Чашка сделана из китайского фарфора.','Colecciona figuras de porcelana.','Она коллекционирует фарфоровые фигурки.'),
  r('té','чай','El té inglés suele servirse con leche.','Английский чай часто подают с молоком.','¿Quieres una taza de té?','Хочешь чашку чая?'),
  r('oliva','оливка','Las olivas griegas tienen mucho sabor.','Греческие оливки обладают насыщенным вкусом.','Añade unas olivas a la ensalada.','Добавь несколько оливок в салат.'),
  r('puro','сигара','Los puros cubanos son muy conocidos.','Кубинские сигары очень известны.','Guardó el puro para una ocasión especial.','Он сохранил сигару для особого случая.'),
  r('tulipán','тюльпан','Los tulipanes florecen en primavera.','Тюльпаны цветут весной.','Compré un ramo de tulipanes.','Я купил букет тюльпанов.'),
  r('canguro','кенгуру','El canguro lleva a su cría en una bolsa.','Кенгуру носит детёныша в сумке.','Vimos varios canguros en Australia.','Мы увидели несколько кенгуру в Австралии.'),
  r('rey','король','El rey recibió a los invitados.','Король принял гостей.','Los reyes visitaron la ciudad.','Король и королева посетили город.'),
  r('un poco','немного','Estoy un poco cansado hoy.','Сегодня я немного устал.','Habla un poco de español.','Он немного говорит по-испански.'),
  r('adjetivo','прилагательное','Bonito es un adjetivo que cambia según el género.','Bonito — прилагательное, которое изменяется по родам.','El adjetivo suele ir después del sustantivo.','Прилагательное обычно стоит после существительного.'),
  r('nacionalidad','национальность','¿Cuál es tu nacionalidad?','Какая у тебя национальность?','La nacionalidad aparece en el formulario.','Национальность указана в анкете.'),
  r('antónimo','антоним','Triste es el antónimo de alegre.','Triste — антоним слова alegre.','Busca un antónimo para esta palabra.','Найди антоним к этому слову.'),
  r('singular','единственное число','Casa está en singular.','Casa стоит в единственном числе.','Escribe la frase en singular.','Напиши предложение в единственном числе.'),
  r('plural','множественное число','Casas está en plural.','Casas стоит во множественном числе.','Pasa estos adjetivos al plural.','Поставь эти прилагательные во множественное число.'),
  r('masculino','мужской род','Libro es un sustantivo masculino.','Libro — существительное мужского рода.','El adjetivo está en masculino singular.','Прилагательное стоит в мужском роде единственного числа.'),
  r('femenino','женский род','Casa es un sustantivo femenino.','Casa — существительное женского рода.','Cambia el adjetivo al femenino.','Поставь прилагательное в женский род.'),
  r('vocal','гласная','Esta palabra termina en vocal.','Это слово заканчивается на гласную.','Añade una ese después de la vocal.','Добавь букву s после гласной.'),
  r('consonante','согласная','Azul termina en consonante.','Azul заканчивается на согласную.','La última consonante se pronuncia claramente.','Последняя согласная произносится отчётливо.'),
];

const countries: Array<[string, string]> = [
  ['Alemania','Германия'],['Argentina','Аргентина'],['Australia','Австралия'],['Austria','Австрия'],['Bélgica','Бельгия'],['Brasil','Бразилия'],['Canadá','Канада'],['Cuba','Куба'],['China','Китай'],['Dinamarca','Дания'],['Egipto','Египет'],['Escocia','Шотландия'],['España','Испания'],['Los Estados Unidos','США'],['Finlandia','Финляндия'],['Francia','Франция'],['Georgia','Грузия'],['Grecia','Греция'],['Holanda','Голландия'],['Inglaterra','Англия'],['Italia','Италия'],['Japón','Япония'],['México','Мексика'],['Polonia','Польша'],['Portugal','Португалия'],['Rumanía','Румыния'],['Rusia','Россия'],['Suecia','Швеция'],['Suiza','Швейцария'],['Turquía','Турция'],['Ucrania','Украина'],
];
const countryRows: Row[] = countries.map(([es, ru]) => {
  const plural = es === 'Los Estados Unidos';
  return r(
    es, ru,
    `Mi próximo destino ${plural ? 'son los Estados Unidos' : `es ${es}`}.`,
    `Моё следующее направление — ${ru}.`,
    `${es} ${plural ? 'están' : 'está'} en mi lista de destinos.`,
    `${ru} есть в моём списке направлений.`,
  );
});

const nationalities: Array<[string,string,string,string]> = [
  ['inglés','англичанин','inglesa','англичанка'],['griego','грек','griega','гречанка'],['italiano','итальянец','italiana','итальянка'],['suizo','швейцарец','suiza','швейцарка'],['francés','француз','francesa','француженка'],['japonés','японец','japonesa','японка'],['argentino','аргентинец','argentina','аргентинка'],['español','испанец','española','испанка'],['belga','бельгиец','belga','бельгийка'],['mexicano','мексиканец','mexicana','мексиканка'],['finlandés','финн','finlandesa','финка'],['polaco','поляк','polaca','полька'],['alemán','немец','alemana','немка'],['portugués','португалец','portuguesa','португалка'],['austriaco','австриец','austriaca','австрийка'],['chino','китаец','china','китаянка'],['sueco','швед','sueca','шведка'],['egipcio','египтянин','egipcia','египтянка'],['estadounidense','американец','estadounidense','американка'],['norteamericano','североамериканец','norteamericana','североамериканка'],['ucraniano','украинец','ucraniana','украинка'],['danés','датчанин','danesa','датчанка'],['holandés','голландец','holandesa','голландка'],['turco','турок','turca','турчанка'],['escocés','шотландец','escocesa','шотландка'],['ruso','русский','rusa','русская'],['cubano','кубинец','cubana','кубинка'],['brasileño','бразилец','brasileña','бразильянка'],['rumano','румын','rumana','румынка'],['canadiense','канадец','canadiense','канадка'],['noruego','норвежец','noruega','норвежка'],['australiano','австралиец','australiana','австралийка'],['georgiano','грузин','georgiana','грузинка'],
];
const nationalityRows: Row[] = nationalities.map(([es, ru, feminine, feminineRu], index) => {
  const first = index % 2 === 0 ? `Mi vecino es ${es}.` : `El nuevo alumno es ${es}.`;
  const firstRu = index % 2 === 0 ? `Мой сосед — ${ru}.` : `Новый ученик — ${ru}.`;
  const second = index % 3 === 0 ? `La profesora es ${feminine}.` : `La nueva estudiante es ${feminine}.`;
  const secondRu = index % 3 === 0 ? `Преподавательница — ${feminineRu}.` : `Новая студентка — ${feminineRu}.`;
  return r(es, ru, first, firstRu, second, secondRu);
});

const reused = unidad2Vocabulary.filter((entry) => wordsFromUnidad2.includes(entry.es));
const all = [...reused, ...rows, ...countryRows, ...nationalityRows];
const seen = new Set<string>();

export const unidad3Vocabulary: VocabularyEntry[] = all
  .filter((entry) => {
    const es = Array.isArray(entry) ? entry[0] : entry.es;
    const key = es.toLocaleLowerCase('es');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .map((entry, index) => {
    if (!Array.isArray(entry)) return { ...entry, id: index + 1 };
    const [es, ru, example, exampleRu, extraExample, extraExampleRu] = entry;
    return { id: index + 1, es, ru, example, exampleRu, extraExample, extraExampleRu };
  });
