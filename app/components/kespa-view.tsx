'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  Mic,
  Play,
  Search,
  Tag,
  Volume2,
  X,
} from 'lucide-react';
import { kespaPracticeSupplements } from '../data/kespa-practice';

type Pair = { ru: string; es: string };
type DialogueLine = Pair & { speaker: string; side: 'left' | 'right' };
type SpeechDrill = { title: string; subtitle: string; items: Pair[] };
type TheoryPanel = {
  title: string;
  text: string;
  formula?: string;
  examples: Pair[];
  note?: string;
  faq?: Pair;
};
type KespaLesson = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  source: string;
  tags: string[];
  theory: TheoryPanel[];
  fresh: Pair[];
  mixed: Pair[];
  miniText: Pair & { title: string };
  dialogue: { title: string; lines: DialogueLine[] };
};

const baseKespaLessons: KespaLesson[] = [
  {
    id: 'kespa-pronouns', number: '01', title: 'Кто говорит?', subtitle: 'Личные местоимения и естественная испанская фраза', source: 'Урок 01 · Знакомство и о себе',
    tags: ['местоимения', 'знакомство', 'A1'],
    theory: [{ title: 'Личные местоимения', text: 'Yo — я, tú — ты, él/ella — он/она, usted — Вы, nosotros — мы, vosotros — вы, ellos/ellas — они, ustedes — вы. В испанском местоимение часто опускают: форма глагола уже показывает, кто действует.', formula: 'yo / tú / él, ella / nosotros / vosotros / ellos', examples: [{ es: 'Soy Ana.', ru: 'Я Ана.' }, { es: 'Ella es médica.', ru: 'Она врач.' }, { es: 'Somos amigos.', ru: 'Мы друзья.' }] }],
    fresh: [{ ru: 'Я Ана.', es: 'Soy Ana.' }, { ru: 'Она врач.', es: 'Ella es médica.' }, { ru: 'Мы друзья.', es: 'Somos amigos.' }, { ru: 'Они студенты.', es: 'Son estudiantes.' }],
    mixed: [{ ru: 'Я из России, а она из Чили.', es: 'Soy de Rusia y ella es de Chile.' }, { ru: 'Мы друзья. Они тоже друзья.', es: 'Somos amigos. Ellos también son amigos.' }],
    miniText: { title: 'Первое знакомство', ru: 'Привет! Я Ана. Я из Мадрида. Мы с Лео друзья.', es: '¡Hola! Soy Ana. Soy de Madrid. Leo y yo somos amigos.' },
    dialogue: { title: 'На встрече', lines: [{ speaker: 'Ана', side: 'left', ru: 'Привет! Я Ана.', es: '¡Hola! Soy Ana.' }, { speaker: 'Лео', side: 'right', ru: 'Очень приятно. Я Лео.', es: 'Mucho gusto. Soy Leo.' }, { speaker: 'Ана', side: 'left', ru: 'Мы теперь друзья.', es: 'Ahora somos amigos.' }] },
  },
  {
    id: 'kespa-ser', number: '02', title: 'Ser: кто я и откуда', subtitle: 'Имя, профессия, происхождение и характеристика', source: 'Урок 01 · Знакомство и о себе',
    tags: ['ser', 'профессии', 'знакомство'],
    theory: [{ title: 'Шесть форм ser', text: 'Ser используют для идентификации, профессии, происхождения и общей характеристики. При простом указании профессии после ser артикль обычно не нужен.', formula: 'soy · eres · es · somos · sois · son', examples: [{ es: 'Soy diseñador.', ru: 'Я дизайнер.' }, { es: 'Eres de Perú.', ru: 'Ты из Перу.' }, { es: 'El gato es tranquilo.', ru: 'Кот спокойный.' }] }],
    fresh: [{ ru: 'Я дизайнер.', es: 'Soy diseñador.' }, { ru: 'Ты из Перу.', es: 'Eres de Perú.' }, { ru: 'Кот спокойный.', es: 'El gato es tranquilo.' }, { ru: 'Они из Колумбии.', es: 'Son de Colombia.' }],
    mixed: [{ ru: 'Я Ана, я врач.', es: 'Soy Ana, soy médica.' }, { ru: 'Мы друзья и мы из Мадрида.', es: 'Somos amigos y somos de Madrid.' }, { ru: 'Она преподаватель, а он дизайнер.', es: 'Ella es profesora y él es diseñador.' }],
    miniText: { title: 'Новая команда', ru: 'Мы небольшая команда. Я дизайнер. Ана врач, а Лео преподаватель. Мы из разных стран.', es: 'Somos un equipo pequeño. Soy diseñador. Ana es médica y Leo es profesor. Somos de países diferentes.' },
    dialogue: { title: 'Первый рабочий день', lines: [{ speaker: 'Ана', side: 'left', ru: 'Ты новый дизайнер?', es: '¿Eres el diseñador nuevo?' }, { speaker: 'Тимур', side: 'right', ru: 'Да, я Тимур. Я из России.', es: 'Sí, soy Timur. Soy de Rusia.' }, { speaker: 'Ана', side: 'left', ru: 'Отлично. Мы одна команда.', es: 'Genial. Somos un equipo.' }] },
  },
  {
    id: 'kespa-articles', number: '03', title: 'Род и артикли', subtitle: 'El, la, un, una и согласование', source: 'Урок 01 · Знакомство и о себе',
    tags: ['артикли', 'род', 'согласование'],
    theory: [{ title: 'Учите слово вместе с артиклем', text: 'El/la называют знакомый предмет, un/una вводят новый. Прилагательное согласуется с существительным по роду и числу. Есть исключения: el problema, el día, la mano.', formula: 'el / la · un / una · -o / -a · -os / -as', examples: [{ es: 'una chica alta', ru: 'высокая девушка' }, { es: 'el problema pequeño', ru: 'маленькая проблема' }, { es: 'dos gatos curiosos', ru: 'два любопытных кота' }] }],
    fresh: [{ ru: 'высокая девушка', es: 'una chica alta' }, { ru: 'маленькая проблема', es: 'el problema pequeño' }, { ru: 'два любопытных кота', es: 'dos gatos curiosos' }, { ru: 'добрая преподавательница', es: 'la profesora amable' }],
    mixed: [{ ru: 'Я врач. Я добрая врач.', es: 'Soy médica. Soy una médica amable.' }, { ru: 'У меня есть кот. Кот спокойный.', es: 'Tengo un gato. El gato es tranquilo.' }, { ru: 'Они испанские студенты.', es: 'Son estudiantes españoles.' }],
    miniText: { title: 'Кот по имени Соль', ru: 'У меня есть кот. Кота зовут Соль. Он маленький, чёрный и очень спокойный.', es: 'Tengo un gato. El gato se llama Sol. Es pequeño, negro y muy tranquilo.' },
    dialogue: { title: 'В приюте', lines: [{ speaker: 'Сотрудница', side: 'left', ru: 'Это спокойный кот.', es: 'Es un gato tranquilo.' }, { speaker: 'Гость', side: 'right', ru: 'А эта кошка?', es: '¿Y esta gata?' }, { speaker: 'Сотрудница', side: 'left', ru: 'Она маленькая и любопытная.', es: 'Es pequeña y curiosa.' }] },
  },
  {
    id: 'kespa-family', number: '04', title: 'Моя семья', subtitle: 'Tener и названия близких людей', source: 'Урок 02 · Семья и люди',
    tags: ['семья', 'tener', 'люди'],
    theory: [{ title: 'Tener — иметь', text: 'Tener используют, чтобы говорить о семье, возрасте и том, что у кого-то есть. Формы: tengo, tienes, tiene, tenemos, tenéis, tienen.', formula: 'tener → tengo · tienes · tiene · tenemos · tenéis · tienen', examples: [{ es: 'Tengo una hermana.', ru: 'У меня есть сестра.' }, { es: 'Tiene treinta años.', ru: 'Ему/ей тридцать лет.' }, { es: 'Tenemos dos hijos.', ru: 'У нас двое детей.' }] }],
    fresh: [{ ru: 'У меня есть сестра.', es: 'Tengo una hermana.' }, { ru: 'У нас двое детей.', es: 'Tenemos dos hijos.' }, { ru: 'У неё есть брат.', es: 'Tiene un hermano.' }, { ru: 'Им тридцать лет.', es: 'Tienen treinta años.' }],
    mixed: [{ ru: 'Моя сестра врач, ей тридцать лет.', es: 'Mi hermana es médica y tiene treinta años.' }, { ru: 'У нас есть маленький кот.', es: 'Tenemos un gato pequeño.' }, { ru: 'Они из Чили и у них двое детей.', es: 'Son de Chile y tienen dos hijos.' }],
    miniText: { title: 'Семейная фотография', ru: 'Это моя семья. У меня есть брат и сестра. Мой брат — преподаватель, а сестра — врач.', es: 'Esta es mi familia. Tengo un hermano y una hermana. Mi hermano es profesor y mi hermana es médica.' },
    dialogue: { title: 'Фотография на столе', lines: [{ speaker: 'Лус', side: 'left', ru: 'Это твоя семья?', es: '¿Esta es tu familia?' }, { speaker: 'Маркос', side: 'right', ru: 'Да. У меня есть брат и две сестры.', es: 'Sí. Tengo un hermano y dos hermanas.' }, { speaker: 'Лус', side: 'left', ru: 'Какая большая семья!', es: '¡Qué familia tan grande!' }] },
  },
  {
    id: 'kespa-possessives', number: '05', title: 'Чей это?', subtitle: 'Притяжательные слова и согласование', source: 'Урок 02 · Семья и люди',
    tags: ['семья', 'притяжательные', 'согласование'],
    theory: [{ title: 'Mi, tu, su, nuestro', text: 'Краткие притяжательные слова стоят перед существительным. Mi, tu и su меняются только по числу; nuestro и vuestro также согласуются по роду.', formula: 'mi(s) · tu(s) · su(s) · nuestro/a/os/as', examples: [{ es: 'mi madre', ru: 'моя мама' }, { es: 'sus amigos', ru: 'его/её/их друзья' }, { es: 'nuestra casa', ru: 'наш дом' }] }],
    fresh: [{ ru: 'моя мама', es: 'mi madre' }, { ru: 'твои друзья', es: 'tus amigos' }, { ru: 'наша семья', es: 'nuestra familia' }, { ru: 'их дети', es: 'sus hijos' }],
    mixed: [{ ru: 'Моя мама — преподаватель.', es: 'Mi madre es profesora.' }, { ru: 'У нашего брата есть две кошки.', es: 'Nuestro hermano tiene dos gatas.' }, { ru: 'Их дети маленькие и любопытные.', es: 'Sus hijos son pequeños y curiosos.' }],
    miniText: { title: 'Наш дом', ru: 'Наша семья небольшая. Мои родители из Перу. У моего брата есть собака, а у меня — кот.', es: 'Nuestra familia es pequeña. Mis padres son de Perú. Mi hermano tiene un perro y yo tengo un gato.' },
    dialogue: { title: 'В гостях', lines: [{ speaker: 'Карла', side: 'left', ru: 'Это ваша собака?', es: '¿Es vuestro perro?' }, { speaker: 'Пабло', side: 'right', ru: 'Нет, это собака наших друзей.', es: 'No, es el perro de nuestros amigos.' }, { speaker: 'Карла', side: 'left', ru: 'Она очень дружелюбная.', es: 'Es muy simpática.' }] },
  },
  {
    id: 'kespa-description', number: '06', title: 'Какие они?', subtitle: 'Внешность, характер и множественное число', source: 'Урок 02 · Семья и люди',
    tags: ['описание', 'прилагательные', 'люди'],
    theory: [{ title: 'Описание человека', text: 'Прилагательное обычно стоит после существительного и согласуется с ним. Прилагательные на -e часто одинаковы для мужского и женского рода: amable, inteligente.', formula: 'persona + ser + прилагательное', examples: [{ es: 'Ana es alta y amable.', ru: 'Ана высокая и добрая.' }, { es: 'Son jóvenes e inteligentes.', ru: 'Они молодые и умные.' }, { es: 'Mi padre es serio.', ru: 'Мой папа серьёзный.' }] }],
    fresh: [{ ru: 'Ана высокая и добрая.', es: 'Ana es alta y amable.' }, { ru: 'Они молодые и умные.', es: 'Son jóvenes e inteligentes.' }, { ru: 'Мой папа серьёзный.', es: 'Mi padre es serio.' }, { ru: 'Её сёстры весёлые.', es: 'Sus hermanas son divertidas.' }],
    mixed: [{ ru: 'У меня есть сестра. Она молодая и умная.', es: 'Tengo una hermana. Es joven e inteligente.' }, { ru: 'Наши родители спокойные и добрые.', es: 'Nuestros padres son tranquilos y amables.' }, { ru: 'Их брат — высокий преподаватель.', es: 'Su hermano es un profesor alto.' }],
    miniText: { title: 'Похожи, но разные', ru: 'Мои сёстры — близнецы. Они высокие и молодые. Лаура серьёзная, а Марта очень весёлая.', es: 'Mis hermanas son gemelas. Son altas y jóvenes. Laura es seria y Marta es muy divertida.' },
    dialogue: { title: 'Кого ты ищешь?', lines: [{ speaker: 'Администратор', side: 'left', ru: 'Как выглядит твоя сестра?', es: '¿Cómo es tu hermana?' }, { speaker: 'Даниэль', side: 'right', ru: 'Она высокая, молодая и у неё тёмные волосы.', es: 'Es alta, joven y tiene el pelo oscuro.' }, { speaker: 'Администратор', side: 'left', ru: 'Она там, рядом с дверью.', es: 'Está allí, junto a la puerta.' }] },
  },
  {
    id: 'kespa-ar', number: '07', title: 'Глаголы на -ar', subtitle: 'Настоящее время в ежедневных действиях', source: 'Урок 03 · Presente: глаголы в действии',
    tags: ['presente', '-ar', 'действия'],
    theory: [{ title: 'Убираем -ar и добавляем окончание', text: 'У правильных глаголов основа сохраняется, а окончание показывает лицо. Местоимение можно не повторять.', formula: 'hablar → hablo · hablas · habla · hablamos · habláis · hablan', examples: [{ es: 'Hablo español.', ru: 'Я говорю по-испански.' }, { es: 'Trabajamos en casa.', ru: 'Мы работаем дома.' }, { es: 'Estudian mucho.', ru: 'Они много учатся.' }] }],
    fresh: [{ ru: 'Я говорю по-испански.', es: 'Hablo español.' }, { ru: 'Ты работаешь дома.', es: 'Trabajas en casa.' }, { ru: 'Мы много учимся.', es: 'Estudiamos mucho.' }, { ru: 'Они танцуют.', es: 'Bailan.' }],
    mixed: [{ ru: 'Моя сестра работает и учится.', es: 'Mi hermana trabaja y estudia.' }, { ru: 'Мы из России, но говорим по-испански.', es: 'Somos de Rusia, pero hablamos español.' }, { ru: 'Их дети танцуют и поют.', es: 'Sus hijos bailan y cantan.' }],
    miniText: { title: 'Обычный день', ru: 'Я работаю дома. Утром я занимаюсь испанским, а вечером разговариваю с друзьями.', es: 'Trabajo en casa. Por la mañana estudio español y por la noche hablo con mis amigos.' },
    dialogue: { title: 'После работы', lines: [{ speaker: 'Нора', side: 'left', ru: 'Ты работаешь дома?', es: '¿Trabajas en casa?' }, { speaker: 'Луис', side: 'right', ru: 'Да, а вечером я занимаюсь испанским.', es: 'Sí, y por la noche estudio español.' }, { speaker: 'Нора', side: 'left', ru: 'Отлично! Тогда поговорим по-испански.', es: '¡Genial! Entonces hablamos en español.' }] },
  },
  {
    id: 'kespa-er-ir', number: '08', title: 'Глаголы на -er и -ir', subtitle: 'Есть, жить, читать и понимать', source: 'Урок 03 · Presente: глаголы в действии',
    tags: ['presente', '-er', '-ir'],
    theory: [{ title: 'Две похожие модели', text: 'У -er и -ir большинство окончаний совпадают. Отличаются формы nosotros и vosotros: comemos/coméis, vivimos/vivís.', formula: 'comer → como, comes, come… · vivir → vivo, vives, vive…', examples: [{ es: 'Como en casa.', ru: 'Я ем дома.' }, { es: 'Vivimos en Madrid.', ru: 'Мы живём в Мадриде.' }, { es: 'Lees mucho.', ru: 'Ты много читаешь.' }] }],
    fresh: [{ ru: 'Я ем дома.', es: 'Como en casa.' }, { ru: 'Мы живём в Мадриде.', es: 'Vivimos en Madrid.' }, { ru: 'Ты много читаешь.', es: 'Lees mucho.' }, { ru: 'Они пишут письма.', es: 'Escriben cartas.' }],
    mixed: [{ ru: 'Мы живём в Мадриде и работаем дома.', es: 'Vivimos en Madrid y trabajamos en casa.' }, { ru: 'Мой брат читает и занимается испанским.', es: 'Mi hermano lee y estudia español.' }, { ru: 'Они едят вместе со своими детьми.', es: 'Comen con sus hijos.' }],
    miniText: { title: 'В Мадриде', ru: 'Мы живём в Мадриде. Днём работаем, вечером едим вместе и иногда пишем друзьям.', es: 'Vivimos en Madrid. De día trabajamos, por la noche comemos juntos y a veces escribimos a nuestros amigos.' },
    dialogue: { title: 'Книжный магазин', lines: [{ speaker: 'Продавец', side: 'left', ru: 'Вы много читаете по-испански?', es: '¿Lee mucho en español?' }, { speaker: 'Покупатель', side: 'right', ru: 'Да, но я понимаю не всё.', es: 'Sí, pero no entiendo todo.' }, { speaker: 'Продавец', side: 'left', ru: 'Эта книга читается легко.', es: 'Este libro se lee fácilmente.' }] },
  },
  {
    id: 'kespa-irregular', number: '09', title: 'Живые формы presente', subtitle: 'Особые формы yo и чередование гласных', source: 'Урок 03 · Presente: глаголы в действии',
    tags: ['presente', 'неправильные глаголы', 'повторение'],
    theory: [{ title: 'Запоминаем заметную форму', text: 'У частотных глаголов меняется основа или форма yo: tener → tengo/tienes, hacer → hago, poder → puedo, querer → quiero. Изменение основы обычно не происходит в nosotros и vosotros.', formula: 'tengo · hago · puedo · quiero · tenemos · podemos', examples: [{ es: 'Quiero aprender español.', ru: 'Я хочу учить испанский.' }, { es: '¿Puedes ayudarme?', ru: 'Ты можешь мне помочь?' }, { es: 'Hago la tarea.', ru: 'Я делаю домашнее задание.' }] }],
    fresh: [{ ru: 'Я хочу учить испанский.', es: 'Quiero aprender español.' }, { ru: 'Ты можешь мне помочь?', es: '¿Puedes ayudarme?' }, { ru: 'Я делаю домашнее задание.', es: 'Hago la tarea.' }, { ru: 'Мы можем поговорить.', es: 'Podemos hablar.' }],
    mixed: [{ ru: 'Я хочу говорить по-испански с моей семьёй.', es: 'Quiero hablar español con mi familia.' }, { ru: 'Моя сестра может читать, но понимает не всё.', es: 'Mi hermana puede leer, pero no entiende todo.' }, { ru: 'Мы работаем дома и делаем задания вместе.', es: 'Trabajamos en casa y hacemos las tareas juntos.' }],
    miniText: { title: 'Почему я учусь', ru: 'Я хочу жить в Испании. Сейчас я занимаюсь каждый день: читаю, пишу и разговариваю. Моя сестра иногда помогает мне.', es: 'Quiero vivir en España. Ahora estudio todos los días: leo, escribo y hablo. Mi hermana a veces me ayuda.' },
    dialogue: { title: 'План на вечер', lines: [{ speaker: 'Инес', side: 'left', ru: 'Ты можешь заниматься сегодня?', es: '¿Puedes estudiar hoy?' }, { speaker: 'Рауль', side: 'right', ru: 'Да. Я хочу повторить глаголы.', es: 'Sí. Quiero repasar los verbos.' }, { speaker: 'Инес', side: 'left', ru: 'Отлично, сделаем задания вместе.', es: 'Genial, hacemos los ejercicios juntos.' }] },
  },
];

const additionalKespaLessons: KespaLesson[] = [
  {
    id: 'kespa-article-system', number: '10', title: 'Полная система артиклей', subtitle: 'Определённый, неопределённый и нулевой артикль', source: 'Урок 01 · Знакомство и о себе',
    tags: ['артикли', 'нулевой артикль', 'A1'],
    theory: [
      { title: 'Три варианта перед существительным', text: 'В испанском перед существительным выбирают определённый артикль el, la, los, las, неопределённый un, una, unos, unas либо не ставят ничего. Выбор зависит не от самого слова, а от смысла: предмет известен, вводится впервые или называется как категория.', formula: 'el libro · un libro · comprar libros', examples: [{ es: 'El libro está aquí.', ru: 'Эта книга здесь.' }, { es: 'Busco un libro.', ru: 'Я ищу какую-нибудь книгу.' }, { es: 'Compro libros.', ru: 'Я покупаю книги.' }], note: 'Одно существительное может появляться со всеми тремя вариантами в разных ситуациях.' },
      { title: 'Определённый артикль и обобщение', text: 'El и la нужны не только для конкретного предмета. С ними говорят о классе предметов вообще: El café es popular. Во множественном числе los и las охватывают всю группу или уже известную группу.', formula: 'El + категория · Los/las + группа', examples: [{ es: 'El español es bonito.', ru: 'Испанский язык красив.' }, { es: 'Los gatos son curiosos.', ru: 'Кошки любопытны.' }, { es: 'Las llaves están en la mesa.', ru: 'Ключи лежат на столе.' }], faq: { ru: 'Почему в общем утверждении стоит el?', es: 'Определённый артикль может обозначать весь класс предметов или явлений.' } },
      { title: 'Неопределённый артикль', text: 'Un и una вводят один новый или неконкретный предмет. Формы unos и unas могут означать несколько предметов либо приблизительное количество. С профессией после ser артикль обычно исчезает, если нет дополнительного описания.', formula: 'un / una · unos / unas', examples: [{ es: 'Necesito una silla.', ru: 'Мне нужен какой-нибудь стул.' }, { es: 'Hay unos cafés cerca.', ru: 'Рядом есть несколько кафе.' }, { es: 'Es profesora.', ru: 'Она преподавательница.' }], note: 'Es una profesora excelente — артикль вернулся, потому что профессию описывает прилагательное.' },
      { title: 'Нулевой артикль', text: 'Без артикля часто называют профессию после ser, язык после hablar или estudiar, неисчисляемое вещество и неопределённые предметы во множественном числе. Определённый артикль появляется, когда язык становится темой высказывания или уточняется.', formula: 'Soy médico. · Hablo español. · Estudio español.', examples: [{ es: 'Somos estudiantes.', ru: 'Мы студенты.' }, { es: 'Habla francés.', ru: 'Он/она говорит по-французски.' }, { es: 'El español de esta región es diferente.', ru: 'Испанский язык этого региона отличается.' }], faq: { ru: 'Можно ли сказать Estudio el español?', es: 'Да, но нейтральное Estudio español очень употребительно; артикль особенно естественен при уточнении языка.' } },
      { title: 'El перед женскими словами с ударным a-', text: 'Некоторые существительные женского рода начинаются с ударного a- или ha-. В единственном числе перед ними ставят el или un, чтобы избежать двух одинаковых ударных звуков подряд. Само слово остаётся женского рода, поэтому прилагательное получает женскую форму. Во множественном числе возвращается las.', formula: 'el agua fría · un águila blanca · las aguas frías', examples: [{ es: 'el agua fría', ru: 'холодная вода' }, { es: 'un águila blanca', ru: 'белый орёл' }, { es: 'las aulas grandes', ru: 'большие аудитории' }], note: 'El здесь не меняет род слова: правильно el agua fría, а не el agua frío.' },
    ],
    fresh: [{ ru: 'Я ищу какую-нибудь книгу.', es: 'Busco un libro.' }, { ru: 'Эта книга здесь.', es: 'El libro está aquí.' }, { ru: 'Я покупаю книги.', es: 'Compro libros.' }, { ru: 'Я говорю по-испански.', es: 'Hablo español.' }],
    mixed: [{ ru: 'Я преподаватель и изучаю испанский язык.', es: 'Soy profesor y estudio español.' }, { ru: 'У нас есть кот. Кошки очень любопытны.', es: 'Tenemos un gato. Los gatos son muy curiosos.' }, { ru: 'Она пьёт воду и ищет чашку.', es: 'Bebe agua y busca una taza.' }],
    miniText: { title: 'В книжном магазине', ru: 'Я ищу книгу для сестры. Продавец показывает мне одну книгу о Мадриде. Книга красивая, но дорогая. Рядом лежат путеводители без фотографий. Я покупаю путеводитель и несколько открыток. Открытки очень яркие.', es: 'Busco un libro para mi hermana. El vendedor me muestra un libro sobre Madrid. El libro es bonito, pero caro. Al lado hay guías sin fotos. Compro una guía y unas postales. Las postales son muy alegres.' },
    dialogue: { title: 'Какую книгу?', lines: [{ speaker: 'Продавец', side: 'left', ru: 'Вы ищете конкретную книгу?', es: '¿Busca un libro concreto?' }, { speaker: 'Покупатель', side: 'right', ru: 'Нет, мне нужна книга об Испании.', es: 'No, necesito un libro sobre España.' }, { speaker: 'Продавец', side: 'left', ru: 'Вот книга о Мадриде.', es: 'Aquí tiene un libro sobre Madrid.' }, { speaker: 'Покупатель', side: 'right', ru: 'В книге есть фотографии?', es: '¿El libro tiene fotos?' }, { speaker: 'Продавец', side: 'left', ru: 'Да, фотографии очень красивые.', es: 'Sí, las fotos son muy bonitas.' }, { speaker: 'Покупатель', side: 'right', ru: 'Отлично, я беру эту книгу.', es: 'Perfecto, me llevo el libro.' }] },
  },
  {
    id: 'kespa-article-special', number: '11', title: 'Артикли в особых случаях', subtitle: 'Al, del, время, дни недели и географические названия', source: 'Урок 01 · Знакомство и о себе',
    tags: ['артикли', 'al и del', 'время'],
    theory: [
      { title: 'Обязательные слияния al и del', text: 'Предлоги a и de с мужским артиклем el всегда сливаются: a + el = al, de + el = del. С la, los и las слияния нет. Артикль el в составе имени собственного El Salvador не сокращается.', formula: 'a + el → al · de + el → del', examples: [{ es: 'Voy al centro.', ru: 'Я иду в центр.' }, { es: 'Vengo del trabajo.', ru: 'Я иду с работы.' }, { es: 'Vamos a la escuela.', ru: 'Мы идём в школу.' }], note: 'Формы a el и de el перед обычным существительным считаются ошибкой.' },
      { title: 'Дни недели, даты и время', text: 'С днём недели определённый артикль показывает конкретный день или регулярность. В датах обычно используют el. При указании времени употребляют a la для одного часа и a las для остальных.', formula: 'el lunes · los lunes · el 5 de mayo · a las ocho', examples: [{ es: 'Trabajo el lunes.', ru: 'Я работаю в понедельник.' }, { es: 'Estudio los martes.', ru: 'Я занимаюсь по вторникам.' }, { es: 'La clase es a las nueve.', ru: 'Урок в девять.' }], faq: { ru: 'Почему los lunes означает регулярно?', es: 'Множественное число дня недели обозначает повторяющееся действие по этим дням.' } },
      { title: 'Части тела, одежда и личные вещи', text: 'Когда владелец понятен из контекста, испанский предпочитает определённый артикль вместо притяжательного слова. Особенно часто это происходит с частями тела, одеждой и предметами личного пользования.', formula: 'Me lavo las manos. · Me pongo la chaqueta.', examples: [{ es: 'Me duele la cabeza.', ru: 'У меня болит голова.' }, { es: 'Se pone el abrigo.', ru: 'Он/она надевает пальто.' }, { es: 'Tengo el móvil en la mano.', ru: 'У меня телефон в руке.' }], note: 'Дословное mis manos возможно, но обычно звучит избыточно.' },
      { title: 'Страны, города, реки и горы', text: 'Большинство стран и городов употребляются без артикля: España, Madrid. Некоторые названия традиционно включают артикль. Реки, моря, океаны и горные цепи обычно требуют определённый артикль.', formula: 'España · Madrid · el Perú · el Ebro · los Andes', examples: [{ es: 'Vivo en España.', ru: 'Я живу в Испании.' }, { es: 'Viajan al Perú.', ru: 'Они едут в Перу.' }, { es: 'El Ebro es un río.', ru: 'Эбро — река.' }], faq: { ru: 'Нужно ли учить артикль географического названия?', es: 'Да, если он является традиционной частью употребления конкретного названия.' } },
    ],
    fresh: [{ ru: 'Я иду в центр.', es: 'Voy al centro.' }, { ru: 'Я иду с работы.', es: 'Vengo del trabajo.' }, { ru: 'Урок в девять.', es: 'La clase es a las nueve.' }, { ru: 'Я мою руки.', es: 'Me lavo las manos.' }],
    mixed: [{ ru: 'В понедельник мы едем в центр.', es: 'El lunes vamos al centro.' }, { ru: 'Моя сестра возвращается с работы в восемь.', es: 'Mi hermana vuelve del trabajo a las ocho.' }, { ru: 'Они живут в Испании, рядом с рекой Эбро.', es: 'Viven en España, cerca del río Ebro.' }],
    miniText: { title: 'Понедельник в Мадриде', ru: 'По понедельникам я выхожу из дома в восемь. Сначала иду в школу, а потом еду в центр. Урок начинается в девять. После урока возвращаюсь с занятий и встречаю сестру. Она приезжает из Перу и впервые видит Мадрид. Вечером мы гуляем вдоль реки.', es: 'Los lunes salgo de casa a las ocho. Primero voy a la escuela y después voy al centro. La clase empieza a las nueve. Después de la clase vuelvo del curso y encuentro a mi hermana. Ella llega del Perú y ve Madrid por primera vez. Por la noche paseamos junto al río.' },
    dialogue: { title: 'Встреча после урока', lines: [{ speaker: 'Лус', side: 'left', ru: 'Во сколько заканчивается твой урок?', es: '¿A qué hora termina tu clase?' }, { speaker: 'Даниэль', side: 'right', ru: 'В пять. Потом я иду в центр.', es: 'A las cinco. Después voy al centro.' }, { speaker: 'Лус', side: 'left', ru: 'Ты идёшь из школы пешком?', es: '¿Vas de la escuela a pie?' }, { speaker: 'Даниэль', side: 'right', ru: 'Нет, я еду на автобусе до музея.', es: 'No, voy en autobús hasta el museo.' }, { speaker: 'Лус', side: 'left', ru: 'Тогда встретимся у музея в шесть.', es: 'Entonces nos vemos junto al museo a las seis.' }, { speaker: 'Даниэль', side: 'right', ru: 'Хорошо, по понедельникам я свободен.', es: 'Bien, los lunes estoy libre.' }] },
  },
  {
    id: 'kespa-gender-details', number: '12', title: 'Род без догадок', subtitle: 'Окончания, общий род и слова, меняющие значение', source: 'Урок 01 · Знакомство и о себе',
    tags: ['род', 'существительные', 'исключения'],
    theory: [
      { title: 'Полезные окончания', text: 'Окончания -o и -a дают хорошую первую подсказку, но не абсолютное правило. Слова на -ción, -sión, -dad и -tad обычно женского рода. Многие слова на -ma греческого происхождения — мужского рода.', formula: '-ción/-sión/-dad → la · -ma → часто el', examples: [{ es: 'la ciudad', ru: 'город' }, { es: 'la canción', ru: 'песня' }, { es: 'el problema', ru: 'проблема' }], note: 'Всегда проверяйте и запоминайте существительное вместе с артиклем.' },
      { title: 'Профессии и слова общего рода', text: 'Одни профессии меняют окончание: profesor/profesora. Другие имеют одну форму, а род показывает артикль: el estudiante, la estudiante. Слова на -ista часто относятся к этой группе.', formula: 'el/la estudiante · el/la artista', examples: [{ es: 'una médica', ru: 'врач-женщина' }, { es: 'un periodista', ru: 'журналист-мужчина' }, { es: 'la artista española', ru: 'испанская артистка' }], faq: { ru: 'Почему artista оканчивается на -a, но бывает мужского рода?', es: 'Это слово общего рода; пол человека показывает артикль и согласование.' } },
      { title: 'Род меняет значение', text: 'У некоторых одинаково написанных существительных артикль меняет не только род, но и значение. Такие пары нужно учить как две отдельные словарные единицы.', formula: 'el capital ≠ la capital · el cura ≠ la cura', examples: [{ es: 'el capital', ru: 'капитал' }, { es: 'la capital', ru: 'столица' }, { es: 'el orden / la orden', ru: 'порядок / приказ' }], note: 'Переводите всю связку с артиклем, а не изолированное слово.' },
      { title: 'Неизменяемые и необычные слова', text: 'Некоторые слова не меняют форму во множественном числе или имеют неожиданное согласование. El día и el mapa мужского рода, la mano и la foto — женского. Иностранные слова часто получают род по подразумеваемому испанскому существительному.', formula: 'el día · el mapa · la mano · la foto', examples: [{ es: 'los lunes', ru: 'понедельники' }, { es: 'una foto bonita', ru: 'красивая фотография' }, { es: 'el mapa nuevo', ru: 'новая карта' }], faq: { ru: 'Можно ли определить род только по последней букве?', es: 'Нет. Окончание помогает, но исключения нужно хранить вместе с артиклем.' } },
    ],
    fresh: [{ ru: 'красивая фотография', es: 'una foto bonita' }, { ru: 'испанская артистка', es: 'la artista española' }, { ru: 'новая карта', es: 'el mapa nuevo' }, { ru: 'столица страны', es: 'la capital del país' }],
    mixed: [{ ru: 'Моя сестра — журналистка из столицы.', es: 'Mi hermana es periodista de la capital.' }, { ru: 'Этот новый план решает проблему.', es: 'Este plan nuevo resuelve el problema.' }, { ru: 'Артист смотрит на красивую карту.', es: 'El artista mira el mapa bonito.' }],
    miniText: { title: 'Новая журналистка', ru: 'Лаура — молодая журналистка. Она живёт в столице и работает в известной газете. На её столе лежат карта, фотография и программа фестиваля. Сегодня у неё проблема: фотография артиста очень маленькая. Лаура звонит фотографу и просит новый снимок. Вечером страница уже готова.', es: 'Laura es una periodista joven. Vive en la capital y trabaja en un periódico conocido. En su mesa hay un mapa, una foto y el programa de un festival. Hoy tiene un problema: la foto del artista es muy pequeña. Laura llama al fotógrafo y pide una imagen nueva. Por la noche la página ya está lista.' },
    dialogue: { title: 'Статья для газеты', lines: [{ speaker: 'Редактор', side: 'left', ru: 'У нас есть фотография артиста?', es: '¿Tenemos una foto del artista?' }, { speaker: 'Лаура', side: 'right', ru: 'Да, но фотография очень маленькая.', es: 'Sí, pero la foto es muy pequeña.' }, { speaker: 'Редактор', side: 'left', ru: 'А карта столицы готова?', es: '¿Y está listo el mapa de la capital?' }, { speaker: 'Лаура', side: 'right', ru: 'Да, новая карта лежит на столе.', es: 'Sí, el mapa nuevo está en la mesa.' }, { speaker: 'Редактор', side: 'left', ru: 'Отлично. Остаётся одна проблема.', es: 'Perfecto. Queda un problema.' }, { speaker: 'Лаура', side: 'right', ru: 'Я звоню фотографу прямо сейчас.', es: 'Llamo al fotógrafo ahora mismo.' }] },
  },
  {
    id: 'kespa-lo-determiners', number: '13', title: 'Uno, lo и другие определители', subtitle: 'Числа, нейтральные конструкции и финальная проверка артиклей', source: 'Урок 01 · Знакомство и о себе',
    tags: ['lo', 'uno', 'определители'],
    theory: [
      { title: 'Uno, un и числа', text: 'Числительное uno сокращается до un перед существительным мужского рода и меняется на una перед женским. В составных числах перед существительным действует то же правило. Самостоятельно форма uno сохраняется.', formula: 'uno · un libro · una casa · veintiún libros', examples: [{ es: 'Tengo un hermano.', ru: 'У меня один брат.' }, { es: 'Quiero uno.', ru: 'Я хочу один.' }, { es: 'Hay veintiuna personas.', ru: 'Здесь двадцать один человек.' }], note: 'Перед существительным нельзя говорить uno libro.' },
      { title: 'Нейтральное lo', text: 'Lo не является артиклем мужского рода и не ставится перед существительным. Оно превращает прилагательное или целую идею в абстрактное «то, что…»: lo importante, lo bueno, lo que dices.', formula: 'lo + прилагательное · lo que + фраза', examples: [{ es: 'Lo importante es practicar.', ru: 'Главное — практиковаться.' }, { es: 'Me gusta lo bueno.', ru: 'Мне нравится хорошее.' }, { es: 'Entiendo lo que dices.', ru: 'Я понимаю то, что ты говоришь.' }], faq: { ru: 'Можно ли сказать lo libro?', es: 'Нет. Перед существительным нужен el; lo создаёт абстрактное понятие.' } },
      { title: 'Артикль и другие определители', text: 'Артикль обычно не ставят рядом с притяжательным или указательным словом перед одним существительным: mi casa, esta casa. Количественные слова также могут занимать эту позицию самостоятельно.', formula: 'mi casa · esta casa · dos casas · algunas casas', examples: [{ es: 'Mi hermana vive aquí.', ru: 'Моя сестра живёт здесь.' }, { es: 'Esta ciudad es grande.', ru: 'Этот город большой.' }, { es: 'Algunos amigos vienen hoy.', ru: 'Несколько друзей придут сегодня.' }], note: 'Формы la mi casa и la esta ciudad в нейтральном современном испанском неверны.' },
      { title: 'Финальная проверка', text: 'Перед существительным задайте три вопроса: предмет известен или вводится впервые; говорится об одном предмете или о категории; нет ли уже другого определителя. Затем проверьте род и число, а также особые случаи al, del и нулевого артикля.', formula: 'смысл → определённость → род/число → особый случай', examples: [{ es: 'Esta es mi casa.', ru: 'Это мой дом.' }, { es: 'La casa tiene un jardín.', ru: 'У дома есть сад.' }, { es: 'El jardín es pequeño.', ru: 'Этот сад маленький.' }], faq: { ru: 'Что важнее: окончание слова или смысл фразы?', es: 'Сначала определяется смысл и тип определителя, затем согласуются род и число.' } },
    ],
    fresh: [{ ru: 'Я хочу один.', es: 'Quiero uno.' }, { ru: 'Главное — практиковаться.', es: 'Lo importante es practicar.' }, { ru: 'Мне нужен один новый.', es: 'Necesito uno nuevo.' }, { ru: 'Несколько друзей приходят сегодня.', es: 'Algunos amigos vienen hoy.' }],
    mixed: [{ ru: 'У моей сестры двадцать одна книга.', es: 'Mi hermana tiene veintiún libros.' }, { ru: 'Я понимаю то, что говорит преподаватель.', es: 'Entiendo lo que dice el profesor.' }, { ru: 'Этот дом большой, но его сад маленький.', es: 'Esta casa es grande, pero su jardín es pequeño.' }],
    miniText: { title: 'Что действительно важно', ru: 'У меня двадцать одна книга по испанскому, но каждый день я использую только одну. Эта книга небольшая и очень понятная. Главное для меня — не количество, а регулярная практика. Я читаю одну страницу, выписываю несколько слов и повторяю то, что уже знаю. Такой простой план работает лучше большой коллекции учебников.', es: 'Tengo veintiún libros de español, pero cada día uso solo uno. Este libro es pequeño y muy claro. Lo importante para mí no es la cantidad, sino la práctica regular. Leo una página, escribo algunas palabras y repaso lo que ya sé. Este plan sencillo funciona mejor que una gran colección de manuales.' },
    dialogue: { title: 'Выбор учебника', lines: [{ speaker: 'Марта', side: 'left', ru: 'Сколько у тебя учебников?', es: '¿Cuántos manuales tienes?' }, { speaker: 'Пабло', side: 'right', ru: 'Двадцать один, но я использую только один.', es: 'Veintiuno, pero uso solo uno.' }, { speaker: 'Марта', side: 'left', ru: 'Какой учебник твой любимый?', es: '¿Cuál es tu manual favorito?' }, { speaker: 'Пабло', side: 'right', ru: 'Вот этот маленький учебник.', es: 'Este manual pequeño.' }, { speaker: 'Марта', side: 'left', ru: 'Что в нём самое полезное?', es: '¿Qué es lo más útil de él?' }, { speaker: 'Пабло', side: 'right', ru: 'Главное — короткие тексты и понятные примеры.', es: 'Lo importante son los textos cortos y los ejemplos claros.' }] },
  },
  {
    id: 'kespa-tener-more', number: '14', title: 'Tener в живой речи', subtitle: 'Состояния, необходимость и устойчивые выражения', source: 'Урок 02 · Семья и люди',
    tags: ['tener', 'tener que', 'состояния'],
    theory: [
      { title: 'Частые выражения с tener', text: 'Испанский использует tener там, где русский часто говорит «мне…» или использует прилагательное. Tener hambre, sed, frío, calor, sueño, miedo и prisa нужно запоминать целыми сочетаниями.', formula: 'tener hambre / sed / frío / calor / sueño / miedo / prisa', examples: [{ es: 'Tengo hambre.', ru: 'Я голоден.' }, { es: 'Tenemos frío.', ru: 'Нам холодно.' }, { es: '¿Tienes prisa?', ru: 'Ты спешишь?' }], note: 'Estoy hambre неверно: физические ощущения из этого списка строятся с tener.' },
      { title: 'Tener que + инфинитив', text: 'Конструкция tener que выражает необходимость: кто-то должен или вынужден что-то сделать. Изменяется только tener, а второй глагол остаётся в инфинитиве.', formula: 'tener que + infinitivo', examples: [{ es: 'Tengo que trabajar.', ru: 'Мне нужно работать.' }, { es: 'Tenemos que salir.', ru: 'Нам нужно выйти.' }, { es: '¿Tienes que estudiar?', ru: 'Тебе нужно заниматься?' }], faq: { ru: 'Можно ли изменить второй глагол?', es: 'Нет. После que используется инфинитив: tengo que estudiar.' } },
      { title: 'Отрицание и степень необходимости', text: 'No tener que означает отсутствие необходимости, а не запрет. Для сильной обязанности можно добавить hoy, ahora или обязательно назвать причину. Вопрос строится без вспомогательного глагола.', formula: 'No tengo que… = мне не нужно…', examples: [{ es: 'No tienes que venir.', ru: 'Тебе не нужно приходить.' }, { es: '¿Tenemos que pagar ahora?', ru: 'Нам нужно платить сейчас?' }, { es: 'Tiene que llamar al médico.', ru: 'Ему/ей нужно позвонить врачу.' }], note: '«Нельзя приходить» — это No puedes venir, а не No tienes que venir.' },
      { title: 'Tener и описание человека', text: 'Через tener называют возраст, родственников, части внешности и то, чем человек обладает. Для характера и профессии остаётся ser, а для временного состояния часто используется estar.', formula: 'tiene 30 años · tiene ojos verdes · es amable · está cansado', examples: [{ es: 'Tiene el pelo oscuro.', ru: 'У него/неё тёмные волосы.' }, { es: 'Es muy amable.', ru: 'Он/она очень добрая.' }, { es: 'Está cansada hoy.', ru: 'Сегодня она устала.' }], faq: { ru: 'Почему «устал» не строится с tener?', es: 'Временное состояние описывается estar: estar cansado.' } },
    ],
    fresh: [{ ru: 'Я голоден.', es: 'Tengo hambre.' }, { ru: 'Нам нужно выйти.', es: 'Tenemos que salir.' }, { ru: 'Тебе не нужно приходить.', es: 'No tienes que venir.' }, { ru: 'Сегодня она устала.', es: 'Está cansada hoy.' }],
    mixed: [{ ru: 'Моему брату холодно, и ему нужно идти домой.', es: 'Mi hermano tiene frío y tiene que ir a casa.' }, { ru: 'Мы не спешим, но должны позвонить родителям.', es: 'No tenemos prisa, pero tenemos que llamar a nuestros padres.' }, { ru: 'Она добрая, но сегодня устала и хочет спать.', es: 'Es amable, pero hoy está cansada y tiene sueño.' }],
    miniText: { title: 'Очень занятой день', ru: 'Сегодня у меня очень мало времени. Утром мне нужно отвезти сестру к врачу. Потом я должен работать и позвонить родителям. В полдень я голоден, но у меня нет времени на кафе. Вечером мне уже не нужно никуда идти. Я устал, хочу пить и хочу только спокойно поужинать дома.', es: 'Hoy tengo muy poco tiempo. Por la mañana tengo que llevar a mi hermana al médico. Después tengo que trabajar y llamar a mis padres. Al mediodía tengo hambre, pero no tengo tiempo para ir a un café. Por la noche ya no tengo que ir a ningún sitio. Estoy cansado, tengo sed y solo quiero cenar tranquilamente en casa.' },
    dialogue: { title: 'Планы на сегодня', lines: [{ speaker: 'Нора', side: 'left', ru: 'Ты сегодня спешишь?', es: '¿Tienes prisa hoy?' }, { speaker: 'Луис', side: 'right', ru: 'Да, мне нужно позвонить врачу.', es: 'Sí, tengo que llamar al médico.' }, { speaker: 'Нора', side: 'left', ru: 'Тебе также нужно идти в офис?', es: '¿También tienes que ir a la oficina?' }, { speaker: 'Луис', side: 'right', ru: 'Нет, сегодня мне не нужно туда идти.', es: 'No, hoy no tengo que ir.' }, { speaker: 'Нора', side: 'left', ru: 'Тогда пообедаем вместе? Я голодна.', es: '¿Entonces comemos juntos? Tengo hambre.' }, { speaker: 'Луис', side: 'right', ru: 'Хорошо, но сначала мне нужно сделать звонок.', es: 'Vale, pero primero tengo que hacer una llamada.' }] },
  },
  {
    id: 'kespa-demonstratives', number: '15', title: 'Этот, тот и где он находится', subtitle: 'Указательные слова, предлоги и связное описание', source: 'Урок 02 · Семья и люди',
    tags: ['указательные', 'предлоги', 'описание'],
    theory: [
      { title: 'Este, ese и aquel', text: 'Испанский различает три степени расстояния. Este указывает на предмет рядом с говорящим, ese — рядом с собеседником или чуть дальше, aquel — далеко от обоих. Все формы согласуются с существительным по роду и числу.', formula: 'este/esta · ese/esa · aquel/aquella', examples: [{ es: 'este libro', ru: 'эта книга рядом со мной' }, { es: 'esa mesa', ru: 'тот стол рядом с тобой' }, { es: 'aquellas casas', ru: 'те далёкие дома' }], note: 'Указательное слово уже занимает место определителя, поэтому артикль перед ним не нужен.' },
      { title: 'Самые нужные предлоги', text: 'A показывает направление или адресата, de — происхождение и принадлежность, en — место, con и sin — наличие или отсутствие сопровождения, para — цель или получателя, por — путь, причину или средство.', formula: 'a · de · en · con · sin · para · por', examples: [{ es: 'Voy a Madrid.', ru: 'Я еду в Мадрид.' }, { es: 'Es de Ana.', ru: 'Это принадлежит Ане.' }, { es: 'Trabajo con Leo.', ru: 'Я работаю с Лео.' }], faq: { ru: 'Почему в Madrid иногда переводится как a, а иногда en?', es: 'A показывает движение в город, en — нахождение внутри города.' } },
      { title: 'Предлоги места', text: 'Сложные указания места обычно строятся с de: delante de, detrás de, cerca de, lejos de, al lado de, encima de и debajo de. Известный предмет после них получает артикль.', formula: 'delante de · detrás de · cerca de · al lado de', examples: [{ es: 'Está delante de la casa.', ru: 'Он находится перед домом.' }, { es: 'El café está cerca del hotel.', ru: 'Кафе рядом с отелем.' }, { es: 'La mochila está debajo de la mesa.', ru: 'Рюкзак под столом.' }], note: 'De + el снова превращается в del: cerca del hotel.' },
      { title: 'Связное описание', text: 'Чтобы описание не превращалось в список, чередуйте указательные слова, местоимения и связки y, pero, también. Сначала назовите предмет, затем уточните его положение и характеристику.', formula: 'предмет → положение → характеристика → связь со следующим предметом', examples: [{ es: 'Esta es mi mesa. Está junto a la ventana.', ru: 'Это мой стол. Он стоит у окна.' }, { es: 'Ese libro es nuevo, pero aquel es antiguo.', ru: 'Та книга новая, а вон та — старая.' }, { es: 'Aquí trabajo y también estudio.', ru: 'Здесь я работаю и также занимаюсь.' }], faq: { ru: 'Нужно ли повторять существительное в каждой фразе?', es: 'Нет. После первого упоминания его можно заменить контекстом или местоимением.' } },
    ],
    fresh: [{ ru: 'эта книга рядом со мной', es: 'este libro' }, { ru: 'вон те далёкие дома', es: 'aquellas casas' }, { ru: 'Кафе рядом с отелем.', es: 'El café está cerca del hotel.' }, { ru: 'Я работаю с Лео.', es: 'Trabajo con Leo.' }],
    mixed: [{ ru: 'Эта фотография моей сестры лежит на столе.', es: 'Esta foto de mi hermana está en la mesa.' }, { ru: 'Тот молодой преподаватель работает с нашими друзьями.', es: 'Ese profesor joven trabaja con nuestros amigos.' }, { ru: 'Вон тот дом далеко от центра, но рядом с рекой.', es: 'Aquella casa está lejos del centro, pero cerca del río.' }],
    miniText: { title: 'Моё рабочее место', ru: 'Это мой стол рядом с окном. На столе стоит лампа, а под ним лежит небольшая сумка. Эта фотография моей семьи находится рядом с компьютером. Тот высокий шкаф принадлежит моей сестре. Вон те коробки у двери нужно отнести в другую комнату. Здесь я работаю, занимаюсь испанским и иногда разговариваю с друзьями.', es: 'Este es mi escritorio junto a la ventana. Encima está una lámpara y debajo hay una bolsa pequeña. Esta foto de mi familia está al lado del ordenador. Ese armario alto es de mi hermana. Aquellas cajas junto a la puerta tienen que ir a otra habitación. Aquí trabajo, estudio español y a veces hablo con mis amigos.' },
    dialogue: { title: 'Где лежит подарок?', lines: [{ speaker: 'Марта', side: 'left', ru: 'Эта коробка для Аны?', es: '¿Esta caja es para Ana?' }, { speaker: 'Пабло', side: 'right', ru: 'Нет, её коробка рядом с дверью.', es: 'No, su caja está junto a la puerta.' }, { speaker: 'Марта', side: 'left', ru: 'Та большая коробка под столом?', es: '¿Esa caja grande debajo de la mesa?' }, { speaker: 'Пабло', side: 'right', ru: 'Нет, вон та синяя коробка.', es: 'No, aquella caja azul.' }, { speaker: 'Марта', side: 'left', ru: 'Она далеко от остальных подарков.', es: 'Está lejos de los otros regalos.' }, { speaker: 'Пабло', side: 'right', ru: 'Да, поставь её рядом с этой сумкой.', es: 'Sí, ponla al lado de esta bolsa.' }] },
  },
];

const kespaLessonOrder = [
  'kespa-pronouns',
  'kespa-ser',
  'kespa-articles',
  'kespa-article-system',
  'kespa-article-special',
  'kespa-gender-details',
  'kespa-lo-determiners',
  'kespa-family',
  'kespa-possessives',
  'kespa-description',
  'kespa-tener-more',
  'kespa-demonstratives',
  'kespa-ar',
  'kespa-er-ir',
  'kespa-irregular',
] as const;

const lessonsById = new Map(
  [...baseKespaLessons, ...additionalKespaLessons].map((lesson) => [lesson.id, lesson]),
);

const lessonGoals: Record<string, string> = {
  'kespa-pronouns': 'После урока вы сможете назвать участников разговора и выбрать уместное обращение «ты» или «Вы».',
  'kespa-ser': 'После урока вы сможете представиться, назвать профессию и сказать, откуда вы.',
  'kespa-articles': 'После урока вы сможете назвать новый или уже известный предмет и согласовать его описание.',
  'kespa-article-system': 'После урока вы сможете выбирать определённый, неопределённый или нулевой артикль по смыслу.',
  'kespa-article-special': 'После урока вы сможете употреблять al и del, говорить о времени и узнавать особые случаи с артиклем.',
  'kespa-gender-details': 'После урока вы сможете надёжнее определять род существительных и проверять частые исключения.',
  'kespa-lo-determiners': 'После урока вы сможете заменять уже названный предмет словами uno и una и понимать конструкции с lo.',
  'kespa-family': 'После урока вы сможете рассказать, кто есть в вашей семье, и назвать возраст.',
  'kespa-possessives': 'После урока вы сможете сказать, кому принадлежит предмет, и уточнить неоднозначное su.',
  'kespa-description': 'После урока вы сможете кратко описать внешность, характер и временное состояние человека.',
  'kespa-tener-more': 'После урока вы сможете говорить о физических ощущениях и необходимости с tener que.',
  'kespa-demonstratives': 'После урока вы сможете указать на предмет и объяснить, где он находится.',
  'kespa-ar': 'После урока вы сможете говорить о регулярных действиях с правильными глаголами на -ar.',
  'kespa-er-ir': 'После урока вы сможете употреблять правильные глаголы на -er и -ir в настоящем времени.',
  'kespa-irregular': 'После урока вы сможете использовать частотные неправильные формы presente в живых фразах.',
};

const kespaLessons: KespaLesson[] = kespaLessonOrder.map((id, index) => {
  const lesson = lessonsById.get(id);
  if (!lesson) throw new Error(`Kespa lesson is missing: ${id}`);
  const supplement = kespaPracticeSupplements[id];
  return {
    ...lesson,
    number: String(index + 1).padStart(2, '0'),
    subtitle: lessonGoals[id],
    fresh: [...lesson.fresh, ...(supplement?.fresh || [])],
    mixed: [...lesson.mixed, ...(supplement?.mixed || [])],
  };
});

export const kespaLessonSummaries = kespaLessons.map(
  ({ id, number, title }) => ({ id, number, title }),
);

const theoryExpansions: Record<string, TheoryPanel[]> = {
  'kespa-pronouns': [
    { title: 'Когда местоимение можно убрать', text: 'В русском мы почти всегда называем того, кто действует. В испанском окончание глагола уже хранит эту информацию: soy однозначно указывает на yo, а somos — на nosotros. Поэтому короткое Soy Ana звучит естественно и полно. Местоимение возвращают, когда нужно противопоставить людей или особенно подчеркнуть говорящего.', formula: 'Soy Ana. · Yo soy Ana, y él es Leo.', examples: [{ es: 'Vivo en Madrid.', ru: 'Я живу в Мадриде.' }, { es: 'Ella vive en Lima.', ru: 'Она живёт в Лиме.' }, { es: 'Yo soy médico, pero él es profesor.', ru: 'Я врач, а он преподаватель.' }], note: 'Не пытайтесь механически ставить yo перед каждой фразой: это делает речь тяжёлой.' },
    { title: 'Tú, usted и ustedes', text: 'Tú используют с друзьями, близкими и детьми. Usted — вежливое обращение к одному человеку, но глагол после него принимает форму третьего лица. В Латинской Америке ustedes — обычное «вы» для нескольких людей; в Испании в неформальной речи также употребляют vosotros и vosotras.', formula: 'tú eres · usted es · vosotros sois · ustedes son', examples: [{ es: '¿Tú eres Marta?', ru: 'Ты Марта?' }, { es: '¿Usted es el señor Ruiz?', ru: 'Вы господин Руис?' }, { es: '¿Ustedes son de México?', ru: 'Вы из Мексики?' }], faq: { ru: 'Почему после usted говорят es, а не eres?', es: 'Потому что usted грамматически требует форму третьего лица.' } },
    { title: 'Llamarse, вопросы и вежливое знакомство', text: 'Имя обычно сообщают возвратным глаголом llamarse: me llamo, te llamas, se llama. Вопросительные слова пишутся с ударением, а вопрос обрамляется знаками ¿?. Для вежливого знакомства пригодятся mucho gusto, encantado или encantada и por favor.', formula: 'Me llamo… · ¿Cómo te llamas? · ¿Cómo se llama usted?', examples: [{ es: 'Me llamo Elena.', ru: 'Меня зовут Элена.' }, { es: '¿Cómo te llamas?', ru: 'Как тебя зовут?' }, { es: 'Encantada de conocerle.', ru: 'Рада познакомиться с Вами.' }], note: 'Llamo Elena без me означает «я звоню Элене», а не «меня зовут Элена».' },
    { title: 'Имена, фамилии и титулы', text: 'Перед обычным именем или фамилией артикль обычно не ставят. Титулы señor, señora и doctor получают артикль, когда о человеке говорят, но часто обходятся без него при прямом обращении. Don и doña употребляются с именем, а не только с фамилией.', formula: 'Ana vive aquí. · El señor Ruiz trabaja. · Buenos días, señor Ruiz.', examples: [{ es: 'La doctora Pérez está aquí.', ru: 'Доктор Перес здесь.' }, { es: 'Buenos días, doctora.', ru: 'Доброе утро, доктор.' }, { es: 'Don Carlos vive en Madrid.', ru: 'Дон Карлос живёт в Мадриде.' }], faq: { ru: 'Почему в обращении артикль исчезает?', es: 'При прямом обращении титул работает как форма обращения, а не как именная группа.' } },
  ],
  'kespa-ser': [
    { title: 'Где именно нужен ser', text: 'Ser отвечает не только на вопрос «кто?». Он связывает человека или предмет с профессией, происхождением, материалом, временем и устойчивой характеристикой. Это глагол-связка: в русском настоящего времени он часто не виден, но в испанском пропускать его нельзя.', formula: 'кто/что + ser + характеристика', examples: [{ es: 'La mesa es de madera.', ru: 'Стол деревянный.' }, { es: 'Hoy es lunes.', ru: 'Сегодня понедельник.' }, { es: 'Son las ocho.', ru: 'Сейчас восемь часов.' }], note: 'Происхождение строится через ser de: Soy de Rusia, Somos de Chile.' },
    { title: 'Профессия без артикля', text: 'После ser название профессии обычно употребляется без un или una: Soy médico, Es profesora. Артикль появляется, если профессию дополнительно описывают или представляют человека как одного из представителей группы.', formula: 'Soy médico. · Soy un médico excelente.', examples: [{ es: 'Ana es profesora.', ru: 'Ана — преподавательница.' }, { es: 'Leo es un profesor excelente.', ru: 'Лео — отличный преподаватель.' }, { es: 'Somos diseñadores.', ru: 'Мы дизайнеры.' }], faq: { ru: 'Можно ли сказать Soy un médico?', es: 'Да, если дальше есть характеристика или важен смысл «один из врачей».' } },
    { title: 'Ser, estar и hay не взаимозаменяемы', text: 'Ser отвечает за идентичность и характеристику, estar — за состояние или местоположение уже известного предмета, hay — за существование или появление нового предмета. После hay обычно идёт неопределённая группа, а после estar — определённая.', formula: 'Es un hotel. · El hotel está aquí. · Hay un hotel aquí.', examples: [{ es: 'Madrid es una ciudad grande.', ru: 'Мадрид — большой город.' }, { es: 'Ana está cansada.', ru: 'Ана устала.' }, { es: 'Hay una cafetería cerca.', ru: 'Рядом есть кафе.' }], note: 'Нельзя сказать Hay el hotel: известный отель находится где-то через estar.' },
    { title: 'Национальности и языки', text: 'Национальность после ser согласуется с человеком и обычно пишется со строчной буквы. Название языка также пишется со строчной буквы. После hablar язык обычно употребляется без артикля, а после estudiar возможен определённый артикль.', formula: 'soy ruso/rusa · hablamos español · estudio el español', examples: [{ es: 'Ana es española.', ru: 'Ана испанка.' }, { es: 'Somos mexicanos.', ru: 'Мы мексиканцы.' }, { es: 'Hablan inglés y estudian el español.', ru: 'Они говорят по-английски и изучают испанский.' }], faq: { ru: 'Пишутся ли национальности с большой буквы?', es: 'Нет, в испанском español, rusa и mexicano пишутся со строчной.' } },
  ],
  'kespa-articles': [
    { title: 'Знакомый и новый предмет', text: 'Un и una впервые вводят предмет в разговор. El и la показывают, что собеседники уже знают, о каком предмете идёт речь. Поэтому артикль может меняться даже рядом с одним и тем же существительным.', formula: 'Tengo un gato. El gato se llama Sol.', examples: [{ es: 'Veo una casa. La casa es blanca.', ru: 'Я вижу дом. Этот дом белый.' }, { es: 'Hay un problema. El problema es pequeño.', ru: 'Есть проблема. Эта проблема небольшая.' }, { es: 'Tengo una hermana. La hermana vive aquí.', ru: 'У меня есть сестра. Эта сестра живёт здесь.' }], note: 'Учите не casa, а la casa; не problema, а el problema.' },
    { title: 'Как работает согласование', text: 'Прилагательное принимает род и число существительного: alto, alta, altos, altas. Если в группе есть хотя бы один объект мужского рода, традиционная общая форма будет мужского рода множественного числа. Прилагательные на -e обычно меняются только по числу.', formula: 'chico alto · chica alta · chicos altos · chicas altas', examples: [{ es: 'una ciudad interesante', ru: 'интересный город' }, { es: 'dos ciudades interesantes', ru: 'два интересных города' }, { es: 'Ana y Pedro son altos.', ru: 'Ана и Педро высокие.' }], faq: { ru: 'Почему el problema, хотя слово оканчивается на -a?', es: 'Это исключение греческого происхождения; род нужно запомнить вместе с артиклем.' } },
    { title: 'Позиция прилагательного', text: 'Нейтральное описательное прилагательное чаще стоит после существительного. Перед существительным оно может добавлять эмоциональную оценку, подчёркивать уже известное качество или менять оттенок значения. На начальном уровне безопаснее использовать позицию после существительного.', formula: 'una casa grande · una gran casa', examples: [{ es: 'un amigo viejo', ru: 'пожилой друг' }, { es: 'un viejo amigo', ru: 'давний друг' }, { es: 'una ciudad bonita', ru: 'красивый город' }], note: 'Grande перед существительным сокращается до gran: una gran ciudad.' },
  ],
  'kespa-family': [
    { title: 'Возраст в испанском', text: 'Испанский буквально говорит «иметь годы», поэтому для возраста нужен tener, а не ser. Число лет ставится после формы глагола и перед años. Эта модель одинакова для людей и животных.', formula: 'tener + число + años', examples: [{ es: 'Tengo treinta años.', ru: 'Мне тридцать лет.' }, { es: 'Mi hijo tiene cinco años.', ru: 'Моему сыну пять лет.' }, { es: '¿Cuántos años tienes?', ru: 'Сколько тебе лет?' }], note: 'Фраза Soy treinta años неверна: возраст — это всегда tener.' },
    { title: 'Tener в вопросе и отрицании', text: 'Для вопроса достаточно вопросительной интонации и знаков ¿?. В отрицании no ставится прямо перед tener. Если спрашиваем о количестве, используем cuánto, cuánta, cuántos или cuántas в согласовании с предметом.', formula: '¿Tienes hermanos? · No tengo hermanos.', examples: [{ es: '¿Tienes hijos?', ru: 'У тебя есть дети?' }, { es: 'No tenemos mascotas.', ru: 'У нас нет домашних животных.' }, { es: '¿Cuántas hermanas tiene?', ru: 'Сколько у него/неё сестёр?' }], faq: { ru: 'Нужен ли артикль после tener?', es: 'С исчисляемым предметом в единственном числе обычно нужен: Tengo un hermano.' } },
    { title: 'Семья: ключевая лексика', text: 'Padres может означать «родители», а parientes — родственники вообще. Hermano и hermana называют брата и сестру; hijo и hija — сына и дочь. Для старшего и младшего родственника добавляют mayor и menor после существительного.', formula: 'padres · parientes · hermano mayor · hermana menor', examples: [{ es: 'Mis padres viven aquí.', ru: 'Мои родители живут здесь.' }, { es: 'Tengo una hermana menor.', ru: 'У меня есть младшая сестра.' }, { es: 'Nuestros parientes son de Chile.', ru: 'Наши родственники из Чили.' }], note: 'Padres во множественном числе — родители, но padre в единственном — отец.' },
  ],
  'kespa-possessives': [
    { title: 'Согласование — с предметом, не с владельцем', text: 'Форма притяжательного слова зависит от того, чем владеют, а не от пола владельца. Su hermano может означать «его брат», «её брат» или «их брат». Формы nuestros и nuestras показывают род самого предмета.', formula: 'nuestro hermano · nuestra hermana · nuestros amigos', examples: [{ es: 'María y su hermano', ru: 'Мария и её брат' }, { es: 'Pablo y su hermana', ru: 'Пабло и его сестра' }, { es: 'nuestras hijas', ru: 'наши дочери' }], note: 'Su и sus различаются только числом того, чем владеют: su casa, sus casas.' },
    { title: 'Как убрать неоднозначность su', text: 'Если по контексту непонятно, чей предмет, после существительного добавляют de él, de ella или de ellos. Это особенно полезно, когда в разговоре участвуют несколько людей.', formula: 'su casa → la casa de ella', examples: [{ es: 'Es su libro, el de Ana.', ru: 'Это её книга, книга Аны.' }, { es: 'La madre de él vive aquí.', ru: 'Его мама живёт здесь.' }, { es: 'Sus hijos, los de Marta, estudian mucho.', ru: 'Её дети, дети Марты, много учатся.' }], faq: { ru: 'Почему нельзя выбрать между «его» и «её» только по слову su?', es: 'Потому что su согласуется с предметом и само по себе не показывает владельца.' } },
    { title: 'Притяжательное слово и артикль', text: 'Краткое притяжательное слово уже определяет существительное, поэтому перед ним не ставят el или la: mi casa, tu hermano, nuestros amigos. Если притяжательная форма стоит после существительного, появляется артикль и используется полная форма mío, tuyo, suyo.', formula: 'mi libro · el libro mío · un amigo nuestro', examples: [{ es: 'Esta es mi casa.', ru: 'Это мой дом.' }, { es: 'El libro es mío.', ru: 'Книга моя.' }, { es: 'Es una amiga nuestra.', ru: 'Она одна из наших подруг.' }], faq: { ru: 'Можно ли сказать la mi casa?', es: 'Нет. Перед кратким mi артикль в современном нейтральном испанском не ставится.' } },
  ],
  'kespa-description': [
    { title: 'Характер и внешность через ser', text: 'Ser используют для общей характеристики: высокий, добрый, серьёзный, умный. Внешние признаки, которые описываются через существительное, часто строят с tener: tener el pelo oscuro, tener los ojos verdes.', formula: 'ser + прилагательное · tener + существительное', examples: [{ es: 'Es alta y simpática.', ru: 'Она высокая и приятная.' }, { es: 'Tiene el pelo rubio.', ru: 'У неё светлые волосы.' }, { es: 'Tiene los ojos verdes.', ru: 'У него/неё зелёные глаза.' }], note: 'Не переводите «у неё тёмные волосы» через ser: естественно Tiene el pelo oscuro.' },
    { title: 'Очень, довольно и немного', text: 'Интенсивность качества можно менять словами muy, bastante и un poco. Muy ставят прямо перед прилагательным. Un poco с негативным или нейтральным качеством звучит мягче и менее категорично.', formula: 'muy amable · bastante serio · un poco tímida', examples: [{ es: 'Mi madre es muy amable.', ru: 'Моя мама очень добрая.' }, { es: 'Leo es bastante serio.', ru: 'Лео довольно серьёзный.' }, { es: 'Soy un poco tímida.', ru: 'Я немного застенчивая.' }], faq: { ru: 'Меняется ли muy по роду и числу?', es: 'Нет. Muy остаётся неизменным: muy alto, muy altas.' } },
    { title: 'Характер, состояние и llevar', text: 'Постоянную характеристику выражают через ser, временное состояние — через estar. Одежду, аксессуары и заметные детали внешности часто описывают глаголом llevar. Он буквально показывает, что человек «носит» сейчас.', formula: 'es alegre · está triste · lleva gafas', examples: [{ es: 'Es una persona tranquila.', ru: 'Он/она спокойный человек.' }, { es: 'Hoy está nerviosa.', ru: 'Сегодня она нервничает.' }, { es: 'Lleva una chaqueta roja.', ru: 'На нём/ней красная куртка.' }], note: 'Es aburrido — он скучный; está aburrido — ему скучно.' },
    { title: 'Множественное число и количество', text: 'После гласной обычно добавляют -s, после согласной — -es. Слова на -z меняют z на c: luz → luces. Muy усиливает прилагательное, mucho согласуется с существительным или обозначает большое количество действия, poco работает аналогично.', formula: 'casa/casas · papel/papeles · luz/luces · mucha gente', examples: [{ es: 'Son muy amables.', ru: 'Они очень добрые.' }, { es: 'Tiene muchos amigos.', ru: 'У него много друзей.' }, { es: 'Trabajamos poco.', ru: 'Мы мало работаем.' }], faq: { ru: 'Почему нельзя сказать mucho amable?', es: 'Перед прилагательным нужен неизменяемый усилитель muy: muy amable.' } },
  ],
  'kespa-ar': [
    { title: 'Как получить основу глагола', text: 'Инфинитив hablar состоит из основы habl- и окончания -ar. Чтобы поставить глагол в presente, убираем -ar и добавляем окончание нужного лица. Основа у правильного глагола не меняется.', formula: 'hablar → habl- → hablo / hablas / habla…', examples: [{ es: 'Trabajo en casa.', ru: 'Я работаю дома.' }, { es: 'Estudias español.', ru: 'Ты учишь испанский.' }, { es: 'Bailamos juntos.', ru: 'Мы танцуем вместе.' }], note: 'Окончания -o, -as, -a, -amos, -áis, -an полезно проговаривать как один ритмический ряд.' },
    { title: 'Вопросы и отрицания в presente', text: 'В испанском не нужен отдельный вспомогательный глагол для вопроса или отрицания. Для вопроса меняются интонация и знаки, а no ставится непосредственно перед смысловым глаголом.', formula: '¿Trabajas aquí? · No trabajo aquí.', examples: [{ es: '¿Hablas español?', ru: 'Ты говоришь по-испански?' }, { es: 'No estudiamos hoy.', ru: 'Мы сегодня не занимаемся.' }, { es: '¿Dónde trabajan?', ru: 'Где они работают?' }], faq: { ru: 'Нужно ли всегда ставить tú в вопросе?', es: 'Нет. Форма hablas уже указывает на tú.' } },
    { title: 'Все лица и ударение', text: 'Для правильных -ar глаголов окончания распределяются по шести лицам. У форм hablamos и habláis важно слышать ударение; письменное ударение в habláis отличает правильное произношение. Ustedes используют форму третьего лица множественного числа.', formula: 'hablo · hablas · habla · hablamos · habláis · hablan', examples: [{ es: 'Yo trabajo.', ru: 'Я работаю.' }, { es: 'Vosotros trabajáis.', ru: 'Вы работаете.' }, { es: 'Ustedes trabajan.', ru: 'Вы работаете.' }], note: 'В Латинской Америке vosotros почти не употребляется, но понимать эту форму полезно.' },
  ],
  'kespa-er-ir': [
    { title: 'Сравниваем две модели', text: 'Глаголы на -er и -ir имеют одинаковые окончания во всех лицах, кроме nosotros и vosotros. У -er там гласная e, а у -ir — i. Сравнение парами помогает не учить две таблицы изолированно.', formula: 'comemos / vivimos · coméis / vivís', examples: [{ es: 'Comemos en casa.', ru: 'Мы едим дома.' }, { es: 'Vivimos en Sevilla.', ru: 'Мы живём в Севилье.' }, { es: 'Leen y escriben.', ru: 'Они читают и пишут.' }], note: 'Форма yo у обеих моделей заканчивается на -o: como, vivo, leo, escribo.' },
    { title: 'Несколько действий в одной фразе', text: 'Одно и то же подлежащее не нужно повторять перед каждым глаголом. Глаголы можно соединить союзом y, а перед словом, начинающимся со звука i, союз превращается в e: lee y habla, lee e interpreta.', formula: 'Vivo en Madrid y trabajo en casa.', examples: [{ es: 'Leo, escribo y aprendo.', ru: 'Я читаю, пишу и учусь.' }, { es: 'Comemos y hablamos.', ru: 'Мы едим и разговариваем.' }, { es: 'Escribe e imprime el texto.', ru: 'Он пишет и печатает текст.' }], faq: { ru: 'Почему в фразе можно один раз сказать nosotros?', es: 'Потому что окончания глаголов сохраняют одного и того же действующего человека.' } },
    { title: 'Полные окончания -er и -ir', text: 'Обе модели начинаются одинаково: -o, -es, -e. Во множественном числе расходятся формы nosotros и vosotros, а затем снова совпадают в -en. Проговаривайте модели парами, чтобы различие оставалось только в двух позициях.', formula: 'como, comes, come, comemos, coméis, comen · vivo, vives, vive, vivimos, vivís, viven', examples: [{ es: 'Tú comes, nosotros comemos.', ru: 'Ты ешь, мы едим.' }, { es: 'Ella vive, vosotros vivís.', ru: 'Она живёт, вы живёте.' }, { es: 'Ustedes escriben.', ru: 'Вы пишете.' }], note: 'Неправильные формы вроде tengo не относятся к этой механической модели.' },
  ],
  'kespa-irregular': [
    { title: 'Изменение основы e → ie и o → ue', text: 'У некоторых частотных глаголов ударная гласная основы превращается в две: querer → quiero, poder → puedo. В формах nosotros и vosotros ударение уходит с основы, поэтому изменение исчезает: queremos, podemos.', formula: 'quiero, quieres, quiere · queremos · quieren', examples: [{ es: 'Quiero descansar.', ru: 'Я хочу отдохнуть.' }, { es: '¿Puedes venir?', ru: 'Ты можешь прийти?' }, { es: 'Podemos ayudar.', ru: 'Мы можем помочь.' }], note: 'Представьте «сапожок»: изменение есть во всех формах, кроме nosotros и vosotros.' },
    { title: 'Особая форма yo', text: 'Некоторые глаголы меняются только или особенно заметно в форме yo: hacer → hago, tener → tengo, salir → salgo. Остальные формы могут следовать другой модели, поэтому полезно запоминать инфинитив вместе с формой yo.', formula: 'hacer — hago · tener — tengo · salir — salgo', examples: [{ es: 'Hago la cena.', ru: 'Я готовлю ужин.' }, { es: 'Tengo una pregunta.', ru: 'У меня есть вопрос.' }, { es: 'Salgo a las ocho.', ru: 'Я выхожу в восемь.' }], faq: { ru: 'Можно ли вывести форму hago по обычному правилу?', es: 'Нет. Частотные особые формы нужно запомнить и закрепить в готовой фразе.' } },
    { title: 'Как учить неправильную парадигму', text: 'Не все формы неправильного глагола меняются одинаково. У tener сочетаются особая форма tengo и чередование tienes, tiene, tienen; nosotros tenemos остаётся без чередования. Поэтому запоминайте три опорные формы: yo, tú и nosotros.', formula: 'tengo · tienes · tenemos', examples: [{ es: 'Tengo tiempo.', ru: 'У меня есть время.' }, { es: '¿Tienes tiempo?', ru: 'У тебя есть время?' }, { es: 'Tenemos tiempo.', ru: 'У нас есть время.' }], note: 'Три опорные формы быстрее показывают обе нерегулярности, чем изолированный список.' },
  ],
};

const narrativeExpansions: Record<string, { miniText: Pair & { title: string }; dialogue: KespaLesson['dialogue'] }> = {
  'kespa-pronouns': { miniText: { title: 'Первое знакомство', ru: 'Привет! Я Ана. Я из Мадрида и работаю в небольшой школе. Это Лео, он мой коллега. Мы преподаём испанский. Марта и Пабло — наши новые студенты. Они из Аргентины, но сейчас живут здесь.', es: '¡Hola! Soy Ana. Soy de Madrid y trabajo en una escuela pequeña. Este es Leo, él es mi compañero. Enseñamos español. Marta y Pablo son nuestros nuevos estudiantes. Son de Argentina, pero ahora viven aquí.' }, dialogue: { title: 'На встрече', lines: [{ speaker: 'Ана', side: 'left', ru: 'Привет! Я Ана. А ты?', es: '¡Hola! Soy Ana. ¿Y tú?' }, { speaker: 'Лео', side: 'right', ru: 'Очень приятно. Я Лео.', es: 'Mucho gusto. Soy Leo.' }, { speaker: 'Ана', side: 'left', ru: 'Ты из Мадрида?', es: '¿Eres de Madrid?' }, { speaker: 'Лео', side: 'right', ru: 'Нет, я из Валенсии. А вы?', es: 'No, soy de Valencia. ¿Y ustedes?' }, { speaker: 'Марта', side: 'left', ru: 'Мы из Аргентины.', es: 'Somos de Argentina.' }, { speaker: 'Ана', side: 'right', ru: 'Отлично. Теперь мы одна группа.', es: 'Genial. Ahora somos un grupo.' }] } },
  'kespa-ser': { miniText: { title: 'Новая команда', ru: 'Мы небольшая международная команда. Я Тимур, я дизайнер из России. Ана — врач из Испании, а Лео — преподаватель из Чили. Наш офис старый, но очень уютный. Сегодня понедельник, и это наш первый рабочий день вместе.', es: 'Somos un equipo internacional pequeño. Soy Timur, soy diseñador de Rusia. Ana es médica de España y Leo es profesor de Chile. Nuestra oficina es antigua, pero muy acogedora. Hoy es lunes y es nuestro primer día de trabajo juntos.' }, dialogue: { title: 'Первый рабочий день', lines: [{ speaker: 'Ана', side: 'left', ru: 'Ты новый дизайнер?', es: '¿Eres el diseñador nuevo?' }, { speaker: 'Тимур', side: 'right', ru: 'Да, я Тимур. Я из России.', es: 'Sí, soy Timur. Soy de Rusia.' }, { speaker: 'Ана', side: 'left', ru: 'А Марина тоже дизайнер?', es: '¿Marina también es diseñadora?' }, { speaker: 'Тимур', side: 'right', ru: 'Нет, она фотограф.', es: 'No, ella es fotógrafa.' }, { speaker: 'Ана', side: 'left', ru: 'Отлично. Мы небольшая, но сильная команда.', es: 'Genial. Somos un equipo pequeño, pero fuerte.' }, { speaker: 'Тимур', side: 'right', ru: 'Да, и этот офис очень красивый.', es: 'Sí, y esta oficina es muy bonita.' }] } },
  'kespa-articles': { miniText: { title: 'Кот по имени Соль', ru: 'У меня есть кот. Кота зовут Соль. Это маленький чёрный кот с зелёными глазами. У Соля есть любимый стул и синяя игрушка. Стул стоит у окна, а игрушка часто лежит под столом. Соль спокойный, но очень любопытный.', es: 'Tengo un gato. El gato se llama Sol. Es un gato pequeño y negro con ojos verdes. Sol tiene una silla favorita y un juguete azul. La silla está junto a la ventana y el juguete está muchas veces debajo de la mesa. Sol es tranquilo, pero muy curioso.' }, dialogue: { title: 'В приюте', lines: [{ speaker: 'Сотрудница', side: 'left', ru: 'Посмотрите: это очень спокойный кот.', es: 'Mire: es un gato muy tranquilo.' }, { speaker: 'Гость', side: 'right', ru: 'А эта белая кошка?', es: '¿Y esta gata blanca?' }, { speaker: 'Сотрудница', side: 'left', ru: 'Она маленькая и очень любопытная.', es: 'Es pequeña y muy curiosa.' }, { speaker: 'Гость', side: 'right', ru: 'У неё красивые зелёные глаза.', es: 'Tiene unos ojos verdes muy bonitos.' }, { speaker: 'Сотрудница', side: 'left', ru: 'Да, и она очень добрая.', es: 'Sí, y es muy amable.' }, { speaker: 'Гость', side: 'right', ru: 'Кажется, это идеальная кошка для нашей семьи.', es: 'Parece la gata perfecta para nuestra familia.' }] } },
  'kespa-family': { miniText: { title: 'Семейная фотография', ru: 'Это моя семья на старой фотографии. У меня есть старший брат и младшая сестра. Моему брату тридцать два года, он преподаватель. Сестре двадцать пять, она врач. У наших родителей есть маленький дом у моря. Летом вся семья встречается там.', es: 'Esta es mi familia en una foto antigua. Tengo un hermano mayor y una hermana menor. Mi hermano tiene treinta y dos años y es profesor. Mi hermana tiene veinticinco y es médica. Nuestros padres tienen una casa pequeña junto al mar. En verano toda la familia se reúne allí.' }, dialogue: { title: 'Фотография на столе', lines: [{ speaker: 'Лус', side: 'left', ru: 'Это твоя семья на фотографии?', es: '¿Esta es tu familia en la foto?' }, { speaker: 'Маркос', side: 'right', ru: 'Да. У меня есть брат и две сестры.', es: 'Sí. Tengo un hermano y dos hermanas.' }, { speaker: 'Лус', side: 'left', ru: 'Сколько лет твоему брату?', es: '¿Cuántos años tiene tu hermano?' }, { speaker: 'Маркос', side: 'right', ru: 'Ему тридцать лет, и у него двое детей.', es: 'Tiene treinta años y tiene dos hijos.' }, { speaker: 'Лус', side: 'left', ru: 'А твои родители живут здесь?', es: '¿Y tus padres viven aquí?' }, { speaker: 'Маркос', side: 'right', ru: 'Нет, они живут в маленьком городе у моря.', es: 'No, viven en una ciudad pequeña junto al mar.' }] } },
  'kespa-possessives': { miniText: { title: 'Наш дом', ru: 'Наша семья небольшая, но наш дом всегда полон гостей. Мои родители живут на первом этаже. Комната моей сестры рядом с их комнатой. У моего брата есть собака, а у меня — кот. Наши питомцы часто спят вместе в гостиной. По воскресеньям наши друзья приходят на обед.', es: 'Nuestra familia es pequeña, pero nuestra casa siempre está llena de invitados. Mis padres viven en la planta baja. La habitación de mi hermana está junto a la de ellos. Mi hermano tiene un perro y yo tengo un gato. Nuestras mascotas duermen muchas veces juntas en el salón. Los domingos nuestros amigos vienen a comer.' }, dialogue: { title: 'В гостях', lines: [{ speaker: 'Карла', side: 'left', ru: 'Это ваша собака?', es: '¿Es vuestro perro?' }, { speaker: 'Пабло', side: 'right', ru: 'Нет, это собака наших друзей.', es: 'No, es el perro de nuestros amigos.' }, { speaker: 'Карла', side: 'left', ru: 'А где ваш кот?', es: '¿Y dónde está vuestro gato?' }, { speaker: 'Пабло', side: 'right', ru: 'Наш кот спит в комнате моей сестры.', es: 'Nuestro gato duerme en la habitación de mi hermana.' }, { speaker: 'Карла', side: 'left', ru: 'Ваши питомцы очень дружелюбные.', es: 'Vuestras mascotas son muy simpáticas.' }, { speaker: 'Пабло', side: 'right', ru: 'Да, и их любимое место — диван.', es: 'Sí, y su lugar favorito es el sofá.' }] } },
  'kespa-description': { miniText: { title: 'Похожи, но разные', ru: 'Мои сёстры — близнецы, поэтому внешне они очень похожи. Обе высокие, молодые и у них тёмные волосы. Но характер у них разный. Лаура серьёзная и немного застенчивая. Марта весёлая, общительная и очень любопытная. Их друзья никогда не путают сестёр.', es: 'Mis hermanas son gemelas, por eso físicamente son muy parecidas. Las dos son altas, jóvenes y tienen el pelo oscuro. Pero tienen un carácter diferente. Laura es seria y un poco tímida. Marta es divertida, sociable y muy curiosa. Sus amigos nunca confunden a las hermanas.' }, dialogue: { title: 'Кого ты ищешь?', lines: [{ speaker: 'Администратор', side: 'left', ru: 'Как выглядит твоя сестра?', es: '¿Cómo es tu hermana?' }, { speaker: 'Даниэль', side: 'right', ru: 'Она высокая, молодая и у неё тёмные волосы.', es: 'Es alta, joven y tiene el pelo oscuro.' }, { speaker: 'Администратор', side: 'left', ru: 'Она серьёзная или весёлая?', es: '¿Es seria o divertida?' }, { speaker: 'Даниэль', side: 'right', ru: 'Она довольно серьёзная, но очень добрая.', es: 'Es bastante seria, pero muy amable.' }, { speaker: 'Администратор', side: 'left', ru: 'На ней красная куртка?', es: '¿Lleva una chaqueta roja?' }, { speaker: 'Даниэль', side: 'right', ru: 'Да, это она, рядом с дверью.', es: 'Sí, es ella, junto a la puerta.' }] } },
  'kespa-ar': { miniText: { title: 'Обычный день', ru: 'Я работаю дома и начинаю рано. Утром я завтракаю, слушаю музыку и занимаюсь испанским. В полдень мы с коллегами разговариваем по видеосвязи. После работы я гуляю в парке. Вечером готовлю ужин и иногда танцую. Перед сном снова повторяю новые слова.', es: 'Trabajo en casa y empiezo temprano. Por la mañana desayuno, escucho música y estudio español. Al mediodía mis compañeros y yo hablamos por videollamada. Después del trabajo camino por el parque. Por la noche preparo la cena y a veces bailo. Antes de dormir repaso otra vez las palabras nuevas.' }, dialogue: { title: 'После работы', lines: [{ speaker: 'Нора', side: 'left', ru: 'Ты работаешь дома каждый день?', es: '¿Trabajas en casa todos los días?' }, { speaker: 'Луис', side: 'right', ru: 'Да, начинаю в восемь и заканчиваю в пять.', es: 'Sí, empiezo a las ocho y termino a las cinco.' }, { speaker: 'Нора', side: 'left', ru: 'А когда ты занимаешься испанским?', es: '¿Y cuándo estudias español?' }, { speaker: 'Луис', side: 'right', ru: 'После работы слушаю подкаст и повторяю слова.', es: 'Después del trabajo escucho un pódcast y repaso palabras.' }, { speaker: 'Нора', side: 'left', ru: 'Ты также разговариваешь с друзьями?', es: '¿También hablas con amigos?' }, { speaker: 'Луис', side: 'right', ru: 'Да, по пятницам мы разговариваем только по-испански.', es: 'Sí, los viernes hablamos solo en español.' }] } },
  'kespa-er-ir': { miniText: { title: 'В Мадриде', ru: 'Мы живём в Мадриде недалеко от центра. Утром дети открывают окна и завтракают на кухне. Днём мы работаем, а они учатся в школе. Вечером вся семья ест вместе. После ужина я читаю, брат пишет сообщения друзьям, а дети смотрят старый фильм. Мы любим этот спокойный ритм.', es: 'Vivimos en Madrid cerca del centro. Por la mañana los niños abren las ventanas y desayunan en la cocina. De día trabajamos y ellos estudian en la escuela. Por la noche toda la familia come junta. Después de cenar yo leo, mi hermano escribe mensajes a sus amigos y los niños ven una película antigua. Nos gusta este ritmo tranquilo.' }, dialogue: { title: 'Книжный магазин', lines: [{ speaker: 'Продавец', side: 'left', ru: 'Вы много читаете по-испански?', es: '¿Lee mucho en español?' }, { speaker: 'Покупатель', side: 'right', ru: 'Да, но я понимаю не всё.', es: 'Sí, pero no entiendo todo.' }, { speaker: 'Продавец', side: 'left', ru: 'Какие книги вы обычно читаете?', es: '¿Qué libros lee normalmente?' }, { speaker: 'Покупатель', side: 'right', ru: 'Я читаю короткие рассказы и иногда пишу новые слова.', es: 'Leo relatos cortos y a veces escribo las palabras nuevas.' }, { speaker: 'Продавец', side: 'left', ru: 'Эта книга читается легко и содержит короткие главы.', es: 'Este libro se lee fácilmente y tiene capítulos cortos.' }, { speaker: 'Покупатель', side: 'right', ru: 'Отлично, тогда я беру её.', es: 'Perfecto, entonces me la llevo.' }] } },
  'kespa-irregular': { miniText: { title: 'Почему я учусь', ru: 'Я хочу жить в Испании и свободно говорить с людьми. Поэтому сейчас занимаюсь каждый день. Утром читаю новости и делаю короткое задание. Днём могу слушать испанское радио во время работы. Вечером пишу несколько фраз и разговариваю с сестрой. Она хорошо знает язык и всегда может мне помочь.', es: 'Quiero vivir en España y hablar con la gente con soltura. Por eso ahora estudio todos los días. Por la mañana leo las noticias y hago un ejercicio corto. Durante el día puedo escuchar la radio española mientras trabajo. Por la noche escribo varias frases y hablo con mi hermana. Ella conoce bien el idioma y siempre puede ayudarme.' }, dialogue: { title: 'План на вечер', lines: [{ speaker: 'Инес', side: 'left', ru: 'Ты можешь заниматься сегодня вечером?', es: '¿Puedes estudiar esta noche?' }, { speaker: 'Рауль', side: 'right', ru: 'Да. Я хочу повторить неправильные глаголы.', es: 'Sí. Quiero repasar los verbos irregulares.' }, { speaker: 'Инес', side: 'left', ru: 'Отлично. Сначала сделаем упражнения?', es: 'Genial. ¿Hacemos primero los ejercicios?' }, { speaker: 'Рауль', side: 'right', ru: 'Да, а потом я могу прочитать текст вслух.', es: 'Sí, y después puedo leer el texto en voz alta.' }, { speaker: 'Инес', side: 'left', ru: 'У тебя есть вопросы по querer и poder?', es: '¿Tienes preguntas sobre querer y poder?' }, { speaker: 'Рауль', side: 'right', ru: 'Один вопрос. Потом можем поговорить без учебника.', es: 'Tengo una pregunta. Después podemos hablar sin el libro.' }] } },
};

const speechPeople = ['Yo', 'Tú', 'Él', 'Ella', 'Nosotros', 'Vosotros', 'Ellos'];
const makeSpeechItems = (
  prompts: Array<{ ru: string; present: string[]; past: string[] }>,
): Pair[] => prompts.map(({ ru, present }) => ({
  ru: ru.split(/(?<=\.)\s/u)[0],
  es: speechPeople.map((person, index) => `${person} ${present[index]}.`).join('\n'),
}));

const speechDrills: Record<string, SpeechDrill> = {
  'kespa-ser': {
    title: 'Техника речи 1',
    subtitle: 'Одна модель во всех лицах настоящего времени',
    items: makeSpeechItems([
      { ru: 'Я член команды. Я был членом команды.', present: ['soy parte del equipo', 'eres parte del equipo', 'es parte del equipo', 'es parte del equipo', 'somos parte del equipo', 'sois parte del equipo', 'son parte del equipo'], past: ['fui parte del equipo', 'fuiste parte del equipo', 'fue parte del equipo', 'fue parte del equipo', 'fuimos parte del equipo', 'fuisteis parte del equipo', 'fueron parte del equipo'] },
      { ru: 'Я отвечаю за проект. Я отвечал за проект.', present: ['soy responsable del proyecto', 'eres responsable del proyecto', 'es responsable del proyecto', 'es responsable del proyecto', 'somos responsables del proyecto', 'sois responsables del proyecto', 'son responsables del proyecto'], past: ['fui responsable del proyecto', 'fuiste responsable del proyecto', 'fue responsable del proyecto', 'fue responsable del proyecto', 'fuimos responsables del proyecto', 'fuisteis responsables del proyecto', 'fueron responsables del proyecto'] },
      { ru: 'Я студент. Я был студентом.', present: ['soy estudiante', 'eres estudiante', 'es estudiante', 'es estudiante', 'somos estudiantes', 'sois estudiantes', 'son estudiantes'], past: ['fui estudiante', 'fuiste estudiante', 'fue estudiante', 'fue estudiante', 'fuimos estudiantes', 'fuisteis estudiantes', 'fueron estudiantes'] },
      { ru: 'Я лидер группы. Я был лидером группы.', present: ['soy líder del grupo', 'eres líder del grupo', 'es líder del grupo', 'es líder del grupo', 'somos líderes del grupo', 'sois líderes del grupo', 'son líderes del grupo'], past: ['fui líder del grupo', 'fuiste líder del grupo', 'fue líder del grupo', 'fue líder del grupo', 'fuimos líderes del grupo', 'fuisteis líderes del grupo', 'fueron líderes del grupo'] },
      { ru: 'Я преподаватель. Я был преподавателем.', present: ['soy profesor', 'eres profesor', 'es profesor', 'es profesora', 'somos profesores', 'sois profesores', 'son profesores'], past: ['fui profesor', 'fuiste profesor', 'fue profesor', 'fue profesora', 'fuimos profesores', 'fuisteis profesores', 'fueron profesores'] },
    ]),
  },
  'kespa-family': {
    title: 'Техника речи 1',
    subtitle: 'Одна модель во всех лицах настоящего времени',
    items: makeSpeechItems([
      { ru: 'У меня есть брат. У меня был брат.', present: ['tengo un hermano', 'tienes un hermano', 'tiene un hermano', 'tiene un hermano', 'tenemos un hermano', 'tenéis un hermano', 'tienen un hermano'], past: ['tuve un hermano', 'tuviste un hermano', 'tuvo un hermano', 'tuvo un hermano', 'tuvimos un hermano', 'tuvisteis un hermano', 'tuvieron un hermano'] },
      { ru: 'У меня есть вопрос. У меня был вопрос.', present: ['tengo una pregunta', 'tienes una pregunta', 'tiene una pregunta', 'tiene una pregunta', 'tenemos una pregunta', 'tenéis una pregunta', 'tienen una pregunta'], past: ['tuve una pregunta', 'tuviste una pregunta', 'tuvo una pregunta', 'tuvo una pregunta', 'tuvimos una pregunta', 'tuvisteis una pregunta', 'tuvieron una pregunta'] },
      { ru: 'У меня есть время. У меня было время.', present: ['tengo tiempo', 'tienes tiempo', 'tiene tiempo', 'tiene tiempo', 'tenemos tiempo', 'tenéis tiempo', 'tienen tiempo'], past: ['tuve tiempo', 'tuviste tiempo', 'tuvo tiempo', 'tuvo tiempo', 'tuvimos tiempo', 'tuvisteis tiempo', 'tuvieron tiempo'] },
      { ru: 'У меня есть собака. У меня была собака.', present: ['tengo un perro', 'tienes un perro', 'tiene un perro', 'tiene un perro', 'tenemos un perro', 'tenéis un perro', 'tienen un perro'], past: ['tuve un perro', 'tuviste un perro', 'tuvo un perro', 'tuvo un perro', 'tuvimos un perro', 'tuvisteis un perro', 'tuvieron un perro'] },
      { ru: 'У меня есть идея. У меня была идея.', present: ['tengo una idea', 'tienes una idea', 'tiene una idea', 'tiene una idea', 'tenemos una idea', 'tenéis una idea', 'tienen una idea'], past: ['tuve una idea', 'tuviste una idea', 'tuvo una idea', 'tuvo una idea', 'tuvimos una idea', 'tuvisteis una idea', 'tuvieron una idea'] },
    ]),
  },
  'kespa-ar': {
    title: 'Техника речи 1',
    subtitle: 'Одна модель во всех лицах настоящего времени',
    items: makeSpeechItems([
      { ru: 'Я говорю по-испански. Я говорил по-испански.', present: ['hablo español', 'hablas español', 'habla español', 'habla español', 'hablamos español', 'habláis español', 'hablan español'], past: ['hablé español', 'hablaste español', 'habló español', 'habló español', 'hablamos español', 'hablasteis español', 'hablaron español'] },
      { ru: 'Я работаю дома. Я работал дома.', present: ['trabajo en casa', 'trabajas en casa', 'trabaja en casa', 'trabaja en casa', 'trabajamos en casa', 'trabajáis en casa', 'trabajan en casa'], past: ['trabajé en casa', 'trabajaste en casa', 'trabajó en casa', 'trabajó en casa', 'trabajamos en casa', 'trabajasteis en casa', 'trabajaron en casa'] },
      { ru: 'Я занимаюсь каждый день. Я занимался каждый день.', present: ['estudio cada día', 'estudias cada día', 'estudia cada día', 'estudia cada día', 'estudiamos cada día', 'estudiáis cada día', 'estudian cada día'], past: ['estudié cada día', 'estudiaste cada día', 'estudió cada día', 'estudió cada día', 'estudiamos cada día', 'estudiasteis cada día', 'estudiaron cada día'] },
      { ru: 'Я слушаю музыку. Я слушал музыку.', present: ['escucho música', 'escuchas música', 'escucha música', 'escucha música', 'escuchamos música', 'escucháis música', 'escuchan música'], past: ['escuché música', 'escuchaste música', 'escuchó música', 'escuchó música', 'escuchamos música', 'escuchasteis música', 'escucharon música'] },
      { ru: 'Я танцую вечером. Я танцевал вечером.', present: ['bailo por la noche', 'bailas por la noche', 'baila por la noche', 'baila por la noche', 'bailamos por la noche', 'bailáis por la noche', 'bailan por la noche'], past: ['bailé por la noche', 'bailaste por la noche', 'bailó por la noche', 'bailó por la noche', 'bailamos por la noche', 'bailasteis por la noche', 'bailaron por la noche'] },
    ]),
  },
  'kespa-er-ir': {
    title: 'Техника речи 1',
    subtitle: 'Одна модель во всех лицах настоящего времени',
    items: makeSpeechItems([
      { ru: 'Я живу в Мадриде. Я жил в Мадриде.', present: ['vivo en Madrid', 'vives en Madrid', 'vive en Madrid', 'vive en Madrid', 'vivimos en Madrid', 'vivís en Madrid', 'viven en Madrid'], past: ['viví en Madrid', 'viviste en Madrid', 'vivió en Madrid', 'vivió en Madrid', 'vivimos en Madrid', 'vivisteis en Madrid', 'vivieron en Madrid'] },
      { ru: 'Я ем дома. Я ел дома.', present: ['como en casa', 'comes en casa', 'come en casa', 'come en casa', 'comemos en casa', 'coméis en casa', 'comen en casa'], past: ['comí en casa', 'comiste en casa', 'comió en casa', 'comió en casa', 'comimos en casa', 'comisteis en casa', 'comieron en casa'] },
      { ru: 'Я читаю книгу. Я читал книгу.', present: ['leo un libro', 'lees un libro', 'lee un libro', 'lee un libro', 'leemos un libro', 'leéis un libro', 'leen un libro'], past: ['leí un libro', 'leíste un libro', 'leyó un libro', 'leyó un libro', 'leímos un libro', 'leísteis un libro', 'leyeron un libro'] },
      { ru: 'Я пишу сообщение. Я написал сообщение.', present: ['escribo un mensaje', 'escribes un mensaje', 'escribe un mensaje', 'escribe un mensaje', 'escribimos un mensaje', 'escribís un mensaje', 'escriben un mensaje'], past: ['escribí un mensaje', 'escribiste un mensaje', 'escribió un mensaje', 'escribió un mensaje', 'escribimos un mensaje', 'escribisteis un mensaje', 'escribieron un mensaje'] },
      { ru: 'Я открываю окно. Я открыл окно.', present: ['abro la ventana', 'abres la ventana', 'abre la ventana', 'abre la ventana', 'abrimos la ventana', 'abrís la ventana', 'abren la ventana'], past: ['abrí la ventana', 'abriste la ventana', 'abrió la ventana', 'abrió la ventana', 'abrimos la ventana', 'abristeis la ventana', 'abrieron la ventana'] },
    ]),
  },
  'kespa-irregular': {
    title: 'Техника речи 1',
    subtitle: 'Одна модель во всех лицах настоящего времени',
    items: makeSpeechItems([
      { ru: 'Я могу помочь. Я смог помочь.', present: ['puedo ayudar', 'puedes ayudar', 'puede ayudar', 'puede ayudar', 'podemos ayudar', 'podéis ayudar', 'pueden ayudar'], past: ['pude ayudar', 'pudiste ayudar', 'pudo ayudar', 'pudo ayudar', 'pudimos ayudar', 'pudisteis ayudar', 'pudieron ayudar'] },
      { ru: 'Я хочу поехать. Я захотел поехать.', present: ['quiero ir', 'quieres ir', 'quiere ir', 'quiere ir', 'queremos ir', 'queréis ir', 'quieren ir'], past: ['quise ir', 'quisiste ir', 'quiso ir', 'quiso ir', 'quisimos ir', 'quisisteis ir', 'quisieron ir'] },
      { ru: 'Я делаю задание. Я сделал задание.', present: ['hago la tarea', 'haces la tarea', 'hace la tarea', 'hace la tarea', 'hacemos la tarea', 'hacéis la tarea', 'hacen la tarea'], past: ['hice la tarea', 'hiciste la tarea', 'hizo la tarea', 'hizo la tarea', 'hicimos la tarea', 'hicisteis la tarea', 'hicieron la tarea'] },
      { ru: 'Я прихожу рано. Я пришёл рано.', present: ['vengo temprano', 'vienes temprano', 'viene temprano', 'viene temprano', 'venimos temprano', 'venís temprano', 'vienen temprano'], past: ['vine temprano', 'viniste temprano', 'vino temprano', 'vino temprano', 'vinimos temprano', 'vinisteis temprano', 'vinieron temprano'] },
      { ru: 'Я говорю правду. Я сказал правду.', present: ['digo la verdad', 'dices la verdad', 'dice la verdad', 'dice la verdad', 'decimos la verdad', 'decís la verdad', 'dicen la verdad'], past: ['dije la verdad', 'dijiste la verdad', 'dijo la verdad', 'dijo la verdad', 'dijimos la verdad', 'dijisteis la verdad', 'dijeron la verdad'] },
    ]),
  },
  'kespa-tener-more': {
    title: 'Техника речи 1',
    subtitle: 'Одна модель во всех лицах настоящего времени',
    items: makeSpeechItems([
      { ru: 'Мне нужно работать. Мне пришлось работать.', present: ['tengo que trabajar', 'tienes que trabajar', 'tiene que trabajar', 'tiene que trabajar', 'tenemos que trabajar', 'tenéis que trabajar', 'tienen que trabajar'], past: ['tuve que trabajar', 'tuviste que trabajar', 'tuvo que trabajar', 'tuvo que trabajar', 'tuvimos que trabajar', 'tuvisteis que trabajar', 'tuvieron que trabajar'] },
      { ru: 'Мне нужно заниматься. Мне пришлось заниматься.', present: ['tengo que estudiar', 'tienes que estudiar', 'tiene que estudiar', 'tiene que estudiar', 'tenemos que estudiar', 'tenéis que estudiar', 'tienen que estudiar'], past: ['tuve que estudiar', 'tuviste que estudiar', 'tuvo que estudiar', 'tuvo que estudiar', 'tuvimos que estudiar', 'tuvisteis que estudiar', 'tuvieron que estudiar'] },
      { ru: 'Мне нужно готовить. Мне пришлось готовить.', present: ['tengo que cocinar', 'tienes que cocinar', 'tiene que cocinar', 'tiene que cocinar', 'tenemos que cocinar', 'tenéis que cocinar', 'tienen que cocinar'], past: ['tuve que cocinar', 'tuviste que cocinar', 'tuvo que cocinar', 'tuvo que cocinar', 'tuvimos que cocinar', 'tuvisteis que cocinar', 'tuvieron que cocinar'] },
      { ru: 'Мне нужно уйти. Мне пришлось уйти.', present: ['tengo que salir', 'tienes que salir', 'tiene que salir', 'tiene que salir', 'tenemos que salir', 'tenéis que salir', 'tienen que salir'], past: ['tuve que salir', 'tuviste que salir', 'tuvo que salir', 'tuvo que salir', 'tuvimos que salir', 'tuvisteis que salir', 'tuvieron que salir'] },
      { ru: 'Мне нужно позвонить. Мне пришлось позвонить.', present: ['tengo que llamar', 'tienes que llamar', 'tiene que llamar', 'tiene que llamar', 'tenemos que llamar', 'tenéis que llamar', 'tienen que llamar'], past: ['tuve que llamar', 'tuviste que llamar', 'tuvo que llamar', 'tuvo que llamar', 'tuvimos que llamar', 'tuvisteis que llamar', 'tuvieron que llamar'] },
    ]),
  },
};

const narrativeAdditions: Record<string, { text: Pair; dialogue: DialogueLine[] }> = {
  'kespa-pronouns': {
    text: { ru: 'После занятий мы пьём кофе во дворе школы. Там мы лучше узнаём друг друга и много разговариваем.', es: 'Después de clase tomamos café en el patio de la escuela. Allí nos conocemos mejor y hablamos mucho.' },
    dialogue: [{ speaker: 'Лео', side: 'right', ru: 'Рад со всеми познакомиться. Вы часто занимаетесь вместе?', es: 'Me alegro de conoceros a todos. ¿Estudiáis juntos a menudo?' }, { speaker: 'Ана', side: 'left', ru: 'Да, мы встречаемся здесь два раза в неделю.', es: 'Sí, nos reunimos aquí dos veces por semana.' }],
  },
  'kespa-ser': {
    text: { ru: 'Наш офис находится в центре города. Мы очень разные, но вместе делаем один большой проект.', es: 'Nuestra oficina está en el centro de la ciudad. Somos muy diferentes, pero juntos hacemos un gran proyecto.' },
    dialogue: [{ speaker: 'Тимур', side: 'right', ru: 'А Лео тоже преподаватель?', es: '¿Leo también es profesor?' }, { speaker: 'Ана', side: 'left', ru: 'Да, он преподаватель испанского и очень хороший коллега.', es: 'Sí, es profesor de español y es un compañero muy bueno.' }],
  },
  'kespa-articles': {
    text: { ru: 'У него зелёные глаза и длинный хвост. Днём кот спит на диване, а вечером играет с маленьким мячом.', es: 'Tiene los ojos verdes y la cola larga. De día el gato duerme en el sofá y por la noche juega con una pelota pequeña.' },
    dialogue: [{ speaker: 'Гость', side: 'right', ru: 'Она любит играть с детьми?', es: '¿Le gusta jugar con niños?' }, { speaker: 'Сотрудница', side: 'left', ru: 'Да, она ласковая и хорошо знает людей.', es: 'Sí, es cariñosa y está acostumbrada a la gente.' }],
  },
  'kespa-family': {
    text: { ru: 'По воскресеньям к нам приезжают бабушка и дедушка. Мы готовим большой обед, смотрим фотографии и рассказываем семейные истории.', es: 'Los domingos vienen nuestros abuelos. Preparamos una gran comida, miramos fotos y contamos historias de la familia.' },
    dialogue: [{ speaker: 'Лус', side: 'left', ru: 'Вы часто встречаетесь всей семьёй?', es: '¿Os reunís a menudo toda la familia?' }, { speaker: 'Маркос', side: 'right', ru: 'Да, каждое воскресенье мы обедаем у родителей.', es: 'Sí, todos los domingos comemos en casa de mis padres.' }],
  },
  'kespa-possessives': {
    text: { ru: 'У каждого питомца есть своё любимое место. Но когда приходят наши друзья, кот и собака встречают их вместе у двери.', es: 'Cada mascota tiene su lugar favorito. Pero cuando vienen nuestros amigos, el gato y el perro los reciben juntos en la puerta.' },
    dialogue: [{ speaker: 'Карла', side: 'left', ru: 'Можно принести сюда игрушку моего кота?', es: '¿Puedo traer aquí el juguete de mi gato?' }, { speaker: 'Пабло', side: 'right', ru: 'Конечно, наши питомцы могут играть вместе.', es: 'Claro, nuestras mascotas pueden jugar juntas.' }],
  },
  'kespa-description': {
    text: { ru: 'Лаура любит читать и спокойно проводить время дома. Марта часто приглашает друзей, шутит и придумывает новые планы.', es: 'A Laura le gusta leer y pasar tiempo tranquilamente en casa. Marta invita a menudo a sus amigos, hace bromas e inventa nuevos planes.' },
    dialogue: [{ speaker: 'Администратор', side: 'left', ru: 'Рядом с ней стоит весёлая девушка. Это её сестра?', es: 'Hay una chica alegre a su lado. ¿Es su hermana?' }, { speaker: 'Даниэль', side: 'right', ru: 'Да, это Марта. Они близнецы, но характер у них разный.', es: 'Sí, es Marta. Son gemelas, pero tienen un carácter diferente.' }],
  },
  'kespa-ar': {
    text: { ru: 'По выходным мой распорядок меняется. Я долго гуляю, готовлю что-нибудь новое и созваниваюсь с семьёй.', es: 'Los fines de semana cambia mi rutina. Camino mucho, preparo algo nuevo y hablo por teléfono con mi familia.' },
    dialogue: [{ speaker: 'Нора', side: 'left', ru: 'А по выходным ты тоже работаешь?', es: '¿Y los fines de semana también trabajas?' }, { speaker: 'Луис', side: 'right', ru: 'Нет, по субботам я отдыхаю и гуляю с друзьями.', es: 'No, los sábados descanso y paseo con mis amigos.' }],
  },
  'kespa-er-ir': {
    text: { ru: 'По субботам мы не спешим и долго завтракаем. Потом идём в библиотеку, выбираем книги и читаем в ближайшем кафе.', es: 'Los sábados no tenemos prisa y desayunamos durante mucho tiempo. Después vamos a la biblioteca, elegimos libros y leemos en un café cercano.' },
    dialogue: [{ speaker: 'Продавец', side: 'left', ru: 'Хотите также книгу с короткими упражнениями?', es: '¿Quiere también un libro con ejercicios cortos?' }, { speaker: 'Покупатель', side: 'right', ru: 'Да, я занимаюсь каждый день и много пишу.', es: 'Sí, estudio todos los días y escribo mucho.' }],
  },
  'kespa-irregular': {
    text: { ru: 'На выходных мы можем заниматься вместе по видеосвязи. Так я быстрее исправляю ошибки и увереннее использую новые формы.', es: 'Los fines de semana podemos estudiar juntos por videollamada. Así corrijo los errores más rápido y uso las formas nuevas con más confianza.' },
    dialogue: [{ speaker: 'Инес', side: 'left', ru: 'После занятия хочешь посмотреть фильм на испанском?', es: '¿Después de estudiar quieres ver una película en español?' }, { speaker: 'Рауль', side: 'right', ru: 'Конечно. Я могу выбрать фильм и сделать чай.', es: 'Claro. Puedo elegir la película y hacer té.' }],
  },
  'kespa-article-system': {
    text: { ru: 'Продавец кладёт покупки в бумажный пакет и дарит мне карту города. На карте отмечены музеи, площади и небольшой книжный рынок.', es: 'El vendedor pone las compras en una bolsa de papel y me regala un mapa de la ciudad. En el mapa aparecen museos, plazas y un pequeño mercado de libros.' },
    dialogue: [{ speaker: 'Покупатель', side: 'right', ru: 'У вас также есть карта центра?', es: '¿Tiene también un mapa del centro?' }, { speaker: 'Продавец', side: 'left', ru: 'Да, вот карта с музеями и книжными магазинами.', es: 'Sí, aquí tiene un mapa con museos y librerías.' }],
  },
  'kespa-article-special': {
    text: { ru: 'Перед прогулкой сестра оставляет чемодан в отеле и надевает лёгкую куртку. Мы возвращаемся в отель поздно, но на следующий день снова едем в центр.', es: 'Antes del paseo mi hermana deja la maleta en el hotel y se pone una chaqueta ligera. Volvemos al hotel tarde, pero al día siguiente vamos otra vez al centro.' },
    dialogue: [{ speaker: 'Лус', side: 'left', ru: 'После музея пойдём к реке?', es: '¿Después del museo vamos al río?' }, { speaker: 'Даниэль', side: 'right', ru: 'Да, от музея до реки всего десять минут.', es: 'Sí, del museo al río hay solo diez minutos.' }],
  },
  'kespa-gender-details': {
    text: { ru: 'Редактор проверяет заголовок и выбирает красивую фотографию для обложки. На следующий день новая статья появляется в утренней газете.', es: 'El editor revisa el titular y elige una foto bonita para la portada. Al día siguiente el nuevo artículo aparece en el periódico de la mañana.' },
    dialogue: [{ speaker: 'Редактор', side: 'left', ru: 'Нам ещё нужен заголовок для новой страницы.', es: 'También necesitamos un titular para la página nueva.' }, { speaker: 'Лаура', side: 'right', ru: 'У меня есть идея, а в программе фестиваля указаны все детали.', es: 'Tengo una idea y el programa del festival tiene todos los detalles.' }],
  },
  'kespa-lo-determiners': {
    text: { ru: 'После чтения я закрываю книгу и пересказываю главное своими словами. Если что-то непонятно, я отмечаю это и спрашиваю преподавателя на следующем уроке.', es: 'Después de leer cierro el libro y cuento lo más importante con mis propias palabras. Si algo no está claro, lo marco y se lo pregunto al profesor en la clase siguiente.' },
    dialogue: [{ speaker: 'Марта', side: 'left', ru: 'Ты каждый день занимаешься по этой книге?', es: '¿Estudias con este libro todos los días?' }, { speaker: 'Пабло', side: 'right', ru: 'Да, но самое важное — повторять то, что я уже знаю.', es: 'Sí, pero lo más importante es repasar lo que ya sé.' }],
  },
  'kespa-tener-more': {
    text: { ru: 'После ужина у меня уже нет дел, и я могу отдохнуть. Завтра мне не нужно вставать рано, поэтому я читаю перед сном.', es: 'Después de cenar ya no tengo nada que hacer y puedo descansar. Mañana no tengo que levantarme temprano, así que leo antes de dormir.' },
    dialogue: [{ speaker: 'Нора', side: 'left', ru: 'После звонка тебе ещё нужно работать?', es: '¿Después de la llamada todavía tienes que trabajar?' }, { speaker: 'Луис', side: 'right', ru: 'Нет, потом я свободен и у нас есть время на обед.', es: 'No, después estoy libre y tenemos tiempo para comer.' }],
  },
  'kespa-demonstratives': {
    text: { ru: 'На полке над столом стоят мои словари и старые тетради. А в том ящике у окна я храню ручки, наушники и зарядное устройство.', es: 'En la estantería encima del escritorio están mis diccionarios y mis cuadernos viejos. En ese cajón junto a la ventana guardo bolígrafos, auriculares y un cargador.' },
    dialogue: [{ speaker: 'Марта', side: 'left', ru: 'А куда поставить этот маленький пакет?', es: '¿Y dónde pongo este paquete pequeño?' }, { speaker: 'Пабло', side: 'right', ru: 'Положи его на тот стул рядом с окном.', es: 'Ponlo en esa silla junto a la ventana.' }],
  },
};

const highlightedTerms = new Set([
  'местоимение', 'местоимения', 'глагол', 'глаголы', 'профессия', 'профессии',
  'артикль', 'артикли', 'существительное', 'прилагательное', 'основа', 'окончание',
  'ser', 'tener', 'soy', 'eres', 'es', 'somos', 'sois', 'son', 'tú', 'usted',
  'ustedes', 'vosotros', 'yo', 'nosotros', 'un', 'una', 'el', 'la', 'su', 'sus',
  'nuestro', 'muy', 'bastante', 'presente', 'quiero', 'puedo', 'hago', 'tengo',
]);
const highlightPattern = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])(${[...highlightedTerms].sort((a, b) => b.length - a.length).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}\\p{M}\\p{N}])`, 'giu');
function HighlightedText({ text }: { text: string }) {
  return <>{text.split(highlightPattern).map((part, index) => highlightedTerms.has(part.toLowerCase()) ? /[а-яё]/iu.test(part) ? <mark key={`${part}-${index}`}>{part}</mark> : <em key={`${part}-${index}`}>{part}</em> : part)}</>;
}

const progressKey = 'ritmo-kespa-progress-v1';
const voicePreferenceKey = 'ritmo-kespa-spanish-voice-v1';
const steps = ['theory', 'speech', 'fresh', 'mixed', 'text', 'dialogue'] as const;
type LessonStep = (typeof steps)[number];
const stepLabels: Record<LessonStep, string> = {
  theory: 'Теория',
  speech: 'Техника речи',
  fresh: 'Только новое',
  mixed: 'Новое + старое',
  text: 'Мини-текст',
  dialogue: 'Диалог',
};

function spanishVoiceScore(voice: SpeechSynthesisVoice) {
  const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  let score = voice.lang.toLowerCase() === 'es-es' ? 160 : 90;
  if (/natural|neural|premium|enhanced|studio|siri|compact/u.test(name)) score += 140;
  if (/ximena|elvira|marta|mónica|monica|google español/u.test(name)) score += 100;
  if (/álvaro|alvaro|jorge|paulina|dalia|paloma|helena/u.test(name)) score += 70;
  if (voice.default) score += 20;
  return score;
}

function bestSpanishVoices(voices: SpeechSynthesisVoice[]) {
  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith('es'))
    .sort((first, second) => spanishVoiceScore(second) - spanishVoiceScore(first))
    .slice(0, 6);
}

function voiceLabel(voice: SpeechSynthesisVoice) {
  return `${voice.name.replace(/^Microsoft\s+/u, '')} · ${voice.lang}`;
}

function speakSpanish(text: string, voiceURI?: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = 'es-ES';
  voice.rate = 0.92;
  voice.pitch = 1;
  const selectedVoice = window.speechSynthesis.getVoices().find((item) => item.voiceURI === voiceURI);
  if (selectedVoice) {
    voice.voice = selectedVoice;
    voice.lang = selectedVoice.lang;
  }
  window.speechSynthesis.speak(voice);
}

function MiniText({ text, voiceURI }: { text: Pair; voiceURI?: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [translationShown, setTranslationShown] = useState(false);
  const [allShown, setAllShown] = useState(false);
  const splitSentences = (value: string) => value.match(/[^.!?]+(?:[.!?]+|$)/gu)?.map((sentence) => sentence.trim()).filter(Boolean) || [];
  const russian = splitSentences(text.ru);
  const spanish = splitSentences(text.es);
  const selectedSpanish = selected === null ? null : spanish[selected];
  return <article>
    <p className="kespa-sentences">{russian.map((sentence, index) => <span key={index}>
      {index > 0 && ' '}
      <button type="button" className={`kespa-sentence${selected === index ? ' selected' : ''}`} aria-pressed={selected === index} onClick={() => { setSelected(index); setTranslationShown(false); }}>{sentence}</button>
    </span>)}</p>
    {selectedSpanish && <div className="kespa-sentence-detail" aria-live="polite">
      <small>ПРЕДЛОЖЕНИЕ {selected! + 1}</small>
      {translationShown && <p lang="es">{selectedSpanish}</p>}
      <footer>
        <button type="button" onClick={() => setTranslationShown((value) => !value)}><Eye /> {translationShown ? 'Скрыть перевод' : 'Перевод предложения'}</button>
        <button type="button" onClick={() => speakSpanish(selectedSpanish, voiceURI)}><Play /> Слушать предложение</button>
      </footer>
    </div>}
    {allShown && <b lang="es">{text.es}</b>}
    <footer><button type="button" onClick={() => setAllShown((value) => !value)}><Eye /> {allShown ? 'Скрыть весь перевод' : 'Перевод всего текста'}</button><button type="button" onClick={() => speakSpanish(text.es, voiceURI)}><Play /> Слушать весь текст</button></footer>
  </article>;
}

function PracticeLine({ item, index, voiceURI }: { item: Pair; index: number; voiceURI?: string }) {
  const [shown, setShown] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState(false);
  const stopTimer = useRef<number | null>(null);
  const recordingStream = useRef<MediaStream | null>(null);
  const record = async () => {
    if (recording) return;
    try {
      setRecordError(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStream.current = stream;
      const recorder = new MediaRecorder(stream);
      recorder.start();
      setRecording(true);
      stopTimer.current = window.setTimeout(() => {
        recorder.stop();
        stream.getTracks().forEach((track) => track.stop());
        recordingStream.current = null;
        setRecording(false);
      }, 5000);
    } catch {
      setRecording(false);
      setRecordError(true);
    }
  };
  useEffect(() => () => {
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    recordingStream.current?.getTracks().forEach((track) => track.stop());
  }, []);
  return (
    <article className="kespa-practice-line">
      <span>{String(index + 1).padStart(2, '0')}</span>
      <div className="kespa-line-actions">
        <button type="button" onClick={() => speakSpanish(item.es, voiceURI)} aria-label="Прослушать на испанском"><Play /></button>
        <button type="button" className={recording ? 'recording' : ''} onClick={record} aria-label="Записать свой голос"><Mic /></button>
      </div>
      <p>{item.ru}</p>
      <button type="button" className="kespa-eye" onClick={() => setShown((value) => !value)} aria-label={shown ? 'Скрыть перевод' : 'Показать перевод'}><Eye /></button>
      {shown && <b>{item.es}</b>}
      {(recording || recordError) && <small className={recordError ? 'kespa-record-status error' : 'kespa-record-status'} aria-live="polite">{recordError ? 'Не удалось включить микрофон' : 'Запись остановится через 5 секунд'}</small>}
    </article>
  );
}

export function KespaView() {
  const [lessonId, setLessonId] = useState(kespaLessons[0].id);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<LessonStep>('theory');
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [completed, setCompleted] = useState<string[]>([]);
  const [dialogueShown, setDialogueShown] = useState<number[]>([]);
  const [dialogueRecording, setDialogueRecording] = useState(false);
  const [spanishVoices, setSpanishVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState('');
  const lessonTop = useRef<HTMLDivElement>(null);
  const dialogueRecordTimer = useRef<number | null>(null);
  const dialogueStream = useRef<MediaStream | null>(null);
  const [dialogueRecordError, setDialogueRecordError] = useState(false);
  const lesson = kespaLessons.find((item) => item.id === lessonId) || kespaLessons[0];
  const speechDrill = speechDrills[lesson.id];
  const lessonSteps = steps.filter((step) => step !== 'speech' || speechDrill);
  const theoryPanels = [...lesson.theory, ...(theoryExpansions[lesson.id] || [])];
  const baseNarrative = narrativeExpansions[lesson.id] || { miniText: lesson.miniText, dialogue: lesson.dialogue };
  const narrativeAddition = narrativeAdditions[lesson.id];
  const narrative = narrativeAddition ? {
    miniText: {
      ...baseNarrative.miniText,
      ru: `${baseNarrative.miniText.ru} ${narrativeAddition.text.ru}`,
      es: `${baseNarrative.miniText.es} ${narrativeAddition.text.es}`,
    },
    dialogue: {
      ...baseNarrative.dialogue,
      lines: [...baseNarrative.dialogue.lines, ...narrativeAddition.dialogue],
    },
  } : baseNarrative;
  const allTags = useMemo(() => [...new Set(kespaLessons.flatMap((item) => item.tags))], []);
  const visibleLessons = kespaLessons.filter((item) =>
    (!tag || item.tags.includes(tag)) &&
    (!query.trim() || `${item.title} ${item.subtitle} ${item.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())),
  );
  useEffect(() => {
    try { setCompleted(JSON.parse(localStorage.getItem(progressKey) || '[]')); } catch {}
  }, []);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const recommended = bestSpanishVoices(window.speechSynthesis.getVoices());
      setSpanishVoices(recommended);
      setVoiceURI((current) => {
        const saved = localStorage.getItem(voicePreferenceKey) || '';
        if (recommended.some((voice) => voice.voiceURI === current)) return current;
        if (recommended.some((voice) => voice.voiceURI === saved)) return saved;
        return recommended[0]?.voiceURI || '';
      });
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);
  const chooseVoice = (nextVoiceURI: string) => {
    setVoiceURI(nextVoiceURI);
    localStorage.setItem(voicePreferenceKey, nextVoiceURI);
    speakSpanish('Hola. Esta es la voz seleccionada para el curso.', nextVoiceURI);
  };
  const openLesson = (id: string) => {
    setLessonId(id);
    setCatalogOpen(false);
    setActiveStep('theory');
    setTag(null);
    setDialogueShown([]);
    window.requestAnimationFrame(() => lessonTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const complete = () => {
    const next = [...new Set([...completed, lesson.id])];
    setCompleted(next);
    localStorage.setItem(progressKey, JSON.stringify(next));
  };
  const recordDialogue = async () => {
    if (dialogueRecording) return;
    try {
      setDialogueRecordError(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      dialogueStream.current = stream;
      const recorder = new MediaRecorder(stream);
      recorder.start();
      setDialogueRecording(true);
      dialogueRecordTimer.current = window.setTimeout(() => {
        recorder.stop();
        stream.getTracks().forEach((track) => track.stop());
        dialogueStream.current = null;
        setDialogueRecording(false);
      }, 15000);
    } catch {
      setDialogueRecording(false);
      setDialogueRecordError(true);
    }
  };
  useEffect(() => () => {
    if (dialogueRecordTimer.current) window.clearTimeout(dialogueRecordTimer.current);
    dialogueStream.current?.getTracks().forEach((track) => track.stop());
  }, []);
  const activeStepIndex = lessonSteps.indexOf(activeStep);
  const nextStep = lessonSteps[activeStepIndex + 1];
  const goToStep = (step: LessonStep) => {
    setActiveStep(step);
    window.requestAnimationFrame(() => lessonTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  return (
    <div className="view-stack kespa-view">
      <section className="kespa-toolbar">
        <div>
          <b>kespa</b>
          <span>{completed.length} из {kespaLessons.length} уроков завершено</span>
        </div>
        <div className="kespa-toolbar-actions">
          {spanishVoices.length > 0 && <label className="kespa-voice-picker" title="Выбрать испанский голос">
            <Volume2 />
            <select aria-label="Голос озвучки" value={voiceURI} onChange={(event) => chooseVoice(event.target.value)}>
              {spanishVoices.map((voice) => <option value={voice.voiceURI} key={voice.voiceURI}>{voiceLabel(voice)}</option>)}
            </select>
          </label>}
          <button type="button" aria-expanded={catalogOpen} aria-controls="kespa-library" onClick={() => setCatalogOpen((value) => !value)}>{catalogOpen ? 'Скрыть уроки' : `Все уроки · ${kespaLessons.length}`}</button>
        </div>
      </section>

      {catalogOpen && <section className="kespa-library" id="kespa-library" aria-label="Все уроки kespa">
        <header>
          <div><p className="eyebrow">МАРШРУТ</p><h2>{tag ? `Все уроки с тегом #${tag}` : `${kespaLessons.length} последовательных уроков`}</h2></div>
          <label><Search /><input aria-label="Найти урок или тег" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти урок или тег" /></label>
        </header>
        <div className="kespa-tag-directory">
          {tag && <button className="active" onClick={() => setTag(null)}><X /> Сбросить</button>}
          {allTags.map((item) => <button className={tag === item ? 'active' : ''} onClick={() => setTag(item)} key={item}>#{item}</button>)}
        </div>
        <div className="kespa-lesson-grid">
          {visibleLessons.map((item) => <button className={item.id === lesson.id ? 'active' : ''} onClick={() => openLesson(item.id)} key={item.id}>
            <span>{item.number}</span>{completed.includes(item.id) && <Check className="kespa-card-check" />}<small>{item.source}</small><h3>{item.title}</h3><p>{item.subtitle}</p><footer>{item.tags.slice(0, 2).map((label) => <b key={label}>#{label}</b>)}</footer>
          </button>)}
        </div>
      </section>}

      <div className="kespa-lesson" ref={lessonTop}>
        <header className="kespa-lesson-head">
          <div><span>УРОК {lesson.number}</span><small>{lesson.source}</small><h2>{lesson.title}</h2><p>{lesson.subtitle}</p></div>
          <button onClick={complete} className={completed.includes(lesson.id) ? 'completed' : ''}>{completed.includes(lesson.id) ? <><Check /> Завершено</> : 'Отметить пройденным'}</button>
        </header>
        <nav className={`kespa-sequence${speechDrill ? ' with-speech' : ''}`} aria-label="Последовательность урока">
          {lessonSteps.map((step, index) => <button type="button" className={activeStep === step ? 'active' : ''} aria-current={activeStep === step ? 'step' : undefined} onClick={() => goToStep(step)} key={step}><span>{index + 1}</span>{stepLabels[step]}</button>)}
        </nav>
        <div className="kespa-lesson-tags"><Tag />{lesson.tags.map((item) => <button onClick={() => { setTag(item); setCatalogOpen(true); window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.getElementById('kespa-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))); }} key={item}>#{item}</button>)}</div>

        {activeStep === 'theory' && <section id="kespa-theory" className="kespa-section kespa-theory">
          <header><span>01</span><div><small>СНАЧАЛА РАЗБИРАЕМ · ТЕОРЕТИЧЕСКИХ БЛОКОВ: {theoryPanels.length}</small><h2>Теория</h2><p>Читайте последовательно: от основной идеи к нюансам и частым вопросам.</p></div></header>
          {theoryPanels.map((block, blockIndex) => <article key={block.title}>
            <div className="kespa-theory-title"><BookOpen /><span>{String(blockIndex + 1).padStart(2, '0')}</span><h3>{block.title}</h3></div>
            <p><HighlightedText text={block.text} /></p>
            {block.formula && <strong><HighlightedText text={block.formula} /></strong>}
            <div className="kespa-example-table">{block.examples.map((example) => <button onClick={() => speakSpanish(example.es, voiceURI)} key={example.es}><span>{example.ru}</span><b>{example.es}</b><Play /></button>)}</div>
            {block.note && <aside className="kespa-theory-note"><b>Обратите внимание</b><p><HighlightedText text={block.note} /></p></aside>}
            {block.faq && <details className="kespa-theory-faq"><summary>Частый вопрос: {block.faq.ru}</summary><p>{block.faq.es}</p></details>}
          </article>)}
          <aside className="kespa-theory-summary">
            <small>РЕЗЮМЕ УРОКА</small>
            <h3>Что важно запомнить</h3>
            <ul>{theoryPanels.map((block) => <li key={block.title}><b>{block.title}</b><span><HighlightedText text={block.formula || block.text.split(/[.!?]/)[0]} /></span></li>)}</ul>
          </aside>
        </section>}

        {activeStep === 'speech' && speechDrill && <section id="kespa-speech" className="kespa-section kespa-training kespa-speech">
          <header><span>02</span><div><small>ДОВОДИМ ФОРМЫ ДО АВТОМАТИЗМА</small><h2>{speechDrill.title}</h2><p>{`${speechDrill.subtitle}. Сначала скажите фразу сами, затем откройте и прослушайте ответ.`}</p></div></header>
          <div>{speechDrill.items.map((item, index) => <PracticeLine item={item} index={index} voiceURI={voiceURI} key={item.ru} />)}</div>
        </section>}

        {activeStep === 'fresh' && <section id="kespa-fresh" className="kespa-section kespa-training">
          <header><span>{speechDrill ? '03' : '02'}</span><div><small>ЗАКРЕПЛЯЕМ ОДИН НОВЫЙ СЛОЙ</small><h2>Тренировка «Только новое»</h2><p>Здесь используются только слова и конструкция текущего урока.</p></div></header>
          <div>{lesson.fresh.map((item, index) => <PracticeLine item={item} index={index} voiceURI={voiceURI} key={item.ru} />)}</div>
        </section>}

        {activeStep === 'mixed' && <section id="kespa-mixed" className="kespa-section kespa-training mixed">
          <header><span>{speechDrill ? '04' : '03'}</span><div><small>СОЕДИНЯЕМ С ПРОЙДЕННЫМ</small><h2>Тренировка «Новое + старое»</h2><p>{lesson.number === '01' ? 'Это первый урок: здесь новое соединяется внутри коротких связных фраз.' : 'Новая конструкция встречается вместе с материалом предыдущих уроков.'}</p></div></header>
          <div>{lesson.mixed.map((item, index) => <PracticeLine item={item} index={index} voiceURI={voiceURI} key={item.ru} />)}</div>
        </section>}

        {activeStep === 'text' && <section id="kespa-text" className="kespa-section kespa-mini-text">
          <header><span>{speechDrill ? '05' : '04'}</span><div><small>ЧИТАЕМ В КОНТЕКСТЕ</small><h2>Мини-текст «{narrative.miniText.title}»</h2><p>Сначала прочитайте по-русски и попробуйте собрать испанскую версию вслух. Нажмите на предложение, чтобы выделить его, посмотреть перевод и послушать отдельно.</p></div></header>
          <MiniText key={lesson.id} text={narrative.miniText} voiceURI={voiceURI} />
        </section>}

        {activeStep === 'dialogue' && <section id="kespa-dialogue" className="kespa-section kespa-dialogue">
          <header><span>{speechDrill ? '06' : '05'}</span><div><small>В КОНЦЕ — ЖИВАЯ СЦЕНА · {narrative.dialogue.lines.length} РЕПЛИК</small><h2>Диалог «{narrative.dialogue.title}»</h2><p>Нажмите на любое сообщение, чтобы перевести только эту реплику на испанский.</p></div></header>
          <div>{narrative.dialogue.lines.map((line, index) => { const shown = dialogueShown.includes(index); return <button className={line.side} onClick={() => setDialogueShown((current) => shown ? current.filter((item) => item !== index) : [...current, index])} key={`${line.speaker}-${index}`}><i aria-hidden="true">{line.side === 'left' ? '👩🏻' : '🧑🏼'}</i><small>{line.speaker}</small><p>{shown ? line.es : line.ru}</p>{shown && <span onClick={(event) => { event.stopPropagation(); speakSpanish(line.es, voiceURI); }}><Play /></span>}</button>; })}</div>
          <footer className="kespa-dialogue-controls">
            <button type="button" onClick={() => setDialogueShown((current) => current.length === narrative.dialogue.lines.length ? [] : narrative.dialogue.lines.map((_, index) => index))} aria-label="Показать или скрыть весь перевод"><Eye /><span>{dialogueShown.length === narrative.dialogue.lines.length ? 'Скрыть' : 'Перевод'}</span></button>
            <button type="button" onClick={() => speakSpanish(narrative.dialogue.lines.map((line) => line.es).join(' '), voiceURI)} aria-label="Прослушать весь диалог"><Play /><span>Слушать</span></button>
            <button type="button" className={dialogueRecording ? 'recording' : ''} onClick={recordDialogue} aria-label="Записать диалог своим голосом"><Mic /><span>{dialogueRecording ? 'Запись…' : 'Говорить'}</span></button>
          </footer>
          {(dialogueRecording || dialogueRecordError) && <small className={dialogueRecordError ? 'kespa-dialogue-record-status error' : 'kespa-dialogue-record-status'} aria-live="polite">{dialogueRecordError ? 'Не удалось получить доступ к микрофону. Проверьте разрешение браузера.' : 'Идёт запись. Она автоматически остановится через 15 секунд.'}</small>}
        </section>}

        {nextStep && <footer className="kespa-section-next">
          <div><small>ДАЛЬШЕ</small><b>{stepLabels[nextStep]}</b></div>
          <button type="button" onClick={() => goToStep(nextStep)}>Перейти к следующему разделу <ArrowRight /></button>
        </footer>}

        {activeStep === 'dialogue' && <footer className="kespa-finish">
          <div>
            <small>{lesson.number === '15' ? 'КУРС KESPA ЗАВЕРШЁН' : `УРОК ${lesson.number} ЗАВЕРШЁН`}</small>
            <h2>{lesson.number === '15' ? 'Поздравляем: базовый маршрут A0–A1 пройден.' : 'Поздравляем: новый материал уже работает в речи.'}</h2>
            <p>{lesson.number === '15'
              ? 'Теперь вы умеете представляться, описывать людей и предметы, говорить о семье, местоположении и повседневных действиях. Вернитесь к разделам, где ответы давались не сразу.'
              : `${lesson.subtitle} Вы можете объяснить основное правило, выбрать нужную форму и построить собственную фразу. Если ответы давались не сразу, повторите теорию или одну из тренировок.`}</p>
          </div>
          <div><button onClick={complete}>{completed.includes(lesson.id) ? <><Check /> Пройдено</> : 'Завершить урок'}</button>{Number(lesson.number) < kespaLessons.length && <button className="next" onClick={() => openLesson(kespaLessons[Number(lesson.number)].id)}>Следующий урок <ArrowRight /></button>}</div>
        </footer>}
      </div>
    </div>
  );
}
