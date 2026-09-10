import { analyzeAnswer, normalizeText } from './learning-core.ts';

export type PlacementSkill = 'Грамматика' | 'Чтение' | 'Аудирование' | 'Письмо';
export type PlacementLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type PlacementQuestion = {
  id: string;
  skill: PlacementSkill;
  level: PlacementLevel;
  prompt: string;
  context?: string;
  audio?: string;
  options?: string[];
  answers: string[];
};
export type PlacementResult = {
  level: PlacementLevel;
  total: number;
  levels: Record<PlacementLevel, number>;
  skills: Record<PlacementSkill, number>;
  completedAt: string;
  attempt: number;
  questionSetId: string;
  questionIds: string[];
};

type Draft = Omit<PlacementQuestion, 'id' | 'skill'>;
const levels: PlacementLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const placementSkills: PlacementSkill[] = ['Грамматика', 'Чтение', 'Аудирование', 'Письмо'];
const section = (prefix: string, skill: PlacementSkill, rows: Draft[]) =>
  rows.map((row, index) => ({ ...row, skill, id: `${prefix}-${index + 1}` }));

const setOne: PlacementQuestion[] = [
  ...section('s1-g', 'Грамматика', [
    { level: 'A1', prompt: 'Yo ___ estudiante.', options: ['soy', 'eres', 'es', 'somos'], answers: ['soy'] },
    { level: 'A1', prompt: 'Выберите правильный вариант.', options: ['el problema', 'la problema', 'los problema', 'una problema'], answers: ['el problema'] },
    { level: 'A2', prompt: 'Ayer Marta ___ al museo.', options: ['fue', 'va', 'irá', 'iba siempre'], answers: ['fue'] },
    { level: 'A2', prompt: 'Cuando era niño, siempre ___ con mis primos.', options: ['jugaba', 'jugué', 'jugaré', 'haya jugado'], answers: ['jugaba'] },
    { level: 'B1', prompt: 'Espero que mañana no ___.', options: ['llueva', 'llueve', 'llovió', 'lloverá'], answers: ['llueva'] },
    { level: 'B1', prompt: 'Este regalo es ___ ti.', options: ['para', 'por', 'desde', 'hacia'], answers: ['para'] },
    { level: 'B2', prompt: 'Si lo hubiera sabido, te ___.', options: ['habría llamado', 'llamaré', 'llamaba', 'haya llamado'], answers: ['habría llamado'] },
    { level: 'B2', prompt: 'Se busca a alguien que ___ experiencia.', options: ['tenga', 'tiene', 'tuvo', 'tendrá'], answers: ['tenga'] },
    { level: 'C1', prompt: 'Por mucho que lo ___, no cambiará de opinión.', options: ['intentes', 'intentas', 'intentaste', 'intentarás'], answers: ['intentes'] },
    { level: 'C1', prompt: 'No es que no me ___, sino que necesito pensarlo.', options: ['interese', 'interesa', 'interesó', 'interesará'], answers: ['interese'] },
  ]),
  ...section('s1-r', 'Чтение', [
    { level: 'A1', context: 'Lucía trabaja por la mañana y estudia inglés por la tarde.', prompt: 'Когда Лусия изучает английский?', options: ['Днём', 'Утром', 'Ночью', 'По выходным'], answers: ['Днём'] },
    { level: 'A1', context: '— ¿Tiene una mesa para dos? — Sí, al lado de la ventana.', prompt: 'Где происходит разговор?', options: ['В ресторане', 'В аптеке', 'На вокзале', 'В банке'], answers: ['В ресторане'] },
    { level: 'A2', context: 'El tren llegó tarde y Pablo perdió el autobús. Llamó a su amiga para que fuera a buscarlo.', prompt: 'Почему Пабло позвонил?', options: ['Он опоздал на автобус', 'Он забыл билет', 'Поезд отменили', 'Он потерял телефон'], answers: ['Он опоздал на автобус'] },
    { level: 'A2', context: 'Aunque estaba cansada, Elena terminó el informe antes de salir.', prompt: 'Что верно?', options: ['Елена закончила отчёт', 'Елена перенесла отчёт', 'Елена не устала', 'Елена осталась ночевать'], answers: ['Елена закончила отчёт'] },
    { level: 'B1', context: 'La biblioteca ampliará su horario, pero los domingos seguirá cerrando a las ocho.', prompt: 'Что не изменится?', options: ['Время закрытия в воскресенье', 'Будничное расписание', 'Число читателей', 'Правила экзаменов'], answers: ['Время закрытия в воскресенье'] },
    { level: 'B1', context: 'Alquilaron el piso porque estaba bien comunicado y el precio incluía los gastos.', prompt: 'Почему они сняли квартиру?', options: ['Удобный транспорт и включённые расходы', 'Большая площадь', 'Новая мебель', 'Близость к морю'], answers: ['Удобный транспорт и включённые расходы'] },
    { level: 'B2', context: 'Los comerciantes temían perder clientes, pero cambiaron de opinión al aumentar las ventas.', prompt: 'Почему мнение изменилось?', options: ['Продажи выросли', 'Налог отменили', 'Парковку расширили', 'Магазины закрылись'], answers: ['Продажи выросли'] },
    { level: 'B2', context: 'La autora presenta datos contradictorios y deja que el lector saque sus propias conclusiones.', prompt: 'Какова стратегия автора?', options: ['Показать неоднозначность', 'Навязать вывод', 'Опровергнуть данные', 'Развлечь читателя'], answers: ['Показать неоднозначность'] },
    { level: 'C1', context: 'La aparente espontaneidad no era tal: cada pausa había sido ensayada para transmitir cercanía.', prompt: 'Что подчёркивает текст?', options: ['Спонтанность была подготовлена', 'Оратор забыл речь', 'Публика изменила тему', 'Паузы случайны'], answers: ['Спонтанность была подготовлена'] },
    { level: 'C1', context: 'Lejos de zanjar el debate, el informe lo reavivó: sus conclusiones admitían interpretaciones dispares.', prompt: 'Каков эффект доклада?', options: ['Он усилил спор', 'Он решил вопрос', 'Его не прочитали', 'Он объединил позиции'], answers: ['Он усилил спор'] },
  ]),
  ...section('s1-l', 'Аудирование', [
    { level: 'A1', prompt: 'Напишите услышанное время.', audio: 'La clase empieza a las ocho.', answers: ['a las ocho', 'las ocho'] },
    { level: 'A1', prompt: 'Выберите место.', audio: 'Necesito comprar pan y leche.', options: ['supermercado', 'hospital', 'estación', 'museo'], answers: ['supermercado'] },
    { level: 'A2', prompt: 'Напишите причину опоздания.', audio: 'Llegué tarde porque perdí el autobús.', answers: ['porque perdí el autobús', 'perdí el autobús'] },
    { level: 'A2', prompt: 'Какое намерение выражено?', audio: 'Este fin de semana voy a visitar a mis abuelos.', options: ['Посетить родственников', 'Работать дома', 'Купить билет', 'Переехать'], answers: ['Посетить родственников'] },
    { level: 'B1', prompt: 'Почему встречу перенесли?', audio: 'Como a Marta le surgió un imprevisto, hemos quedado media hora más tarde.', options: ['У Марты возникло дело', 'Сломался поезд', 'Кафе закрыто', 'Все пришли раньше'], answers: ['У Марты возникло дело'] },
    { level: 'B1', prompt: 'Напишите рекомендацию.', audio: 'Si quieres evitar las colas, te conviene reservar la entrada por internet.', answers: ['reservar la entrada por internet', 'conviene reservar la entrada por internet', 'reservar por internet'] },
    { level: 'B2', prompt: 'Какова позиция говорящего?', audio: 'No es que me parezca mala idea, pero quizá deberíamos valorar otras opciones.', options: ['Он предлагает сравнить варианты', 'Он полностью отказался', 'Он согласен без сомнений', 'Он не понял'], answers: ['Он предлагает сравнить варианты'] },
    { level: 'B2', prompt: 'Что произошло?', audio: 'Pensaban que la exposición sería minoritaria y, contra todo pronóstico, agotó las entradas.', options: ['Выставка стала популярной', 'Её отменили', 'Билеты подешевели', 'Прогноз подтвердился'], answers: ['Выставка стала популярной'] },
    { level: 'C1', prompt: 'Какой скрытый смысл?', audio: 'Hombre, puntual lo que se dice puntual, no ha sido.', options: ['Он заметно опоздал', 'Он пришёл вовремя', 'Он отменил встречу', 'Он пришёл рано'], answers: ['Он заметно опоздал'] },
    { level: 'C1', prompt: 'Что имеет в виду говорящий?', audio: 'Por más vueltas que le doy, no termino de ver por dónde coger el asunto.', options: ['Не понимает как подступиться', 'Уже решил', 'Не хочет обсуждать', 'Ищет вещь'], answers: ['Не понимает как подступиться'] },
  ]),
  ...section('s1-w', 'Письмо', [
    { level: 'A1', prompt: 'Напишите: «Меня зовут Анна, и я живу в Москве».', answers: ['Me llamo Ana y vivo en Moscú', 'Me llamo Anna y vivo en Moscú', 'Soy Ana y vivo en Moscú', 'Soy Anna y vivo en Moscú'] },
    { level: 'A1', prompt: 'Напишите: «У меня есть старший брат».', answers: ['Tengo un hermano mayor', 'Yo tengo un hermano mayor'] },
    { level: 'A2', prompt: 'Напишите: «Вчера мы поужинали дома, потому что шёл дождь».', answers: ['Ayer cenamos en casa porque llovía', 'Ayer cenamos en casa porque estaba lloviendo', 'Como llovía ayer cenamos en casa', 'Como estaba lloviendo ayer cenamos en casa'] },
    { level: 'A2', prompt: 'Напишите: «Я ещё не был в Севилье, но хочу туда поехать».', answers: ['Todavía no he estado en Sevilla pero quiero ir', 'Aún no he estado en Sevilla pero quiero ir', 'No he estado todavía en Sevilla pero quiero ir allí'] },
    { level: 'B1', prompt: 'Напишите: «Надеюсь, у тебя всё получится».', answers: ['Espero que todo te salga bien', 'Espero que te salga todo bien', 'Ojalá te salga todo bien', 'Ojalá todo te salga bien'] },
    { level: 'B1', prompt: 'Напишите: «Если будет хорошая погода, мы пойдём в парк».', answers: ['Si hace buen tiempo iremos al parque', 'Si hace buen tiempo vamos a ir al parque', 'Iremos al parque si hace buen tiempo', 'Vamos a ir al parque si hace buen tiempo'] },
    { level: 'B2', prompt: 'Напишите: «Если бы я знал раньше, я бы тебе помог».', answers: ['Si lo hubiera sabido antes te habría ayudado', 'Si hubiese sabido eso antes te habría ayudado', 'Te habría ayudado si lo hubiera sabido antes', 'Te habría ayudado si hubiese sabido eso antes'] },
    { level: 'B2', prompt: 'Напишите: «Несмотря на усталость, она продолжила работать».', answers: ['A pesar del cansancio siguió trabajando', 'A pesar de estar cansada siguió trabajando', 'Aunque estaba cansada siguió trabajando', 'Pese al cansancio continuó trabajando'] },
    { level: 'C1', prompt: 'Напишите: «Как бы он ни старался, ему не удаётся убедить их».', answers: ['Por mucho que lo intente no consigue convencerlos', 'Por más que lo intente no logra convencerlos', 'Por mucho que se esfuerce no consigue convencerlos', 'Por más que se esfuerce no logra convencerlos'] },
    { level: 'C1', prompt: 'Напишите: «Дело не в несогласии, а в том, что мне нужны доказательства».', answers: ['No es que no esté de acuerdo sino que necesito pruebas', 'No se trata de que no esté de acuerdo sino de que necesito pruebas', 'No es que esté en desacuerdo sino que necesito pruebas'] },
  ]),
];

const setTwo: PlacementQuestion[] = [
  ...section('s2-g', 'Грамматика', [
    { level: 'A1', prompt: 'María y yo ___ de Colombia.', options: ['somos', 'son', 'soy', 'eres'], answers: ['somos'] },
    { level: 'A1', prompt: '¿Tú ___ hermanos?', options: ['tienes', 'tiene', 'tengo', 'tenéis'], answers: ['tienes'] },
    { level: 'A2', prompt: 'El sábado pasado yo ___ una chaqueta.', options: ['compré', 'compro', 'compraba siempre', 'compraré'], answers: ['compré'] },
    { level: 'A2', prompt: 'Antes nosotros ___ cerca del centro.', options: ['vivíamos', 'viviremos', 'hemos vivido mañana', 'vivimos ahora'], answers: ['vivíamos'] },
    { level: 'B1', prompt: 'Te llamaré cuando ___ a casa.', options: ['llegue', 'llego', 'llegaré', 'llegaba'], answers: ['llegue'] },
    { level: 'B1', prompt: 'Llevo tres años ___ español.', options: ['estudiando', 'estudiado', 'estudiar', 'estudio'], answers: ['estudiando'] },
    { level: 'B2', prompt: 'Me recomendó que ___ la solicitud cuanto antes.', options: ['enviara', 'envié', 'enviaré', 'envío'], answers: ['enviara'] },
    { level: 'B2', prompt: 'El proyecto ___ aprobado de no haber faltado financiación.', options: ['habría sido', 'será', 'ha sido', 'fuera'], answers: ['habría sido'] },
    { level: 'C1', prompt: 'De ahí que muchos expertos ___ revisar el acuerdo.', options: ['propongan', 'proponen', 'propusieron', 'propondrán'], answers: ['propongan'] },
    { level: 'C1', prompt: 'Sea cual ___ el resultado, publicaremos los datos.', options: ['sea', 'es', 'será', 'fuera'], answers: ['sea'] },
  ]),
  ...section('s2-r', 'Чтение', [
    { level: 'A1', context: 'Carlos desayuna a las siete. Después va al trabajo en metro.', prompt: 'Как Карлос едет на работу?', options: ['На метро', 'Пешком', 'На автобусе', 'На велосипеде'], answers: ['На метро'] },
    { level: 'A1', context: '— ¿Cuánto cuesta esta camiseta? — Veinte euros, pero hoy tiene descuento.', prompt: 'О чём спрашивает покупатель?', options: ['О цене', 'О цвете', 'О времени', 'О составе'], answers: ['О цене'] },
    { level: 'A2', context: 'Sofía no pudo entrar porque había dejado las llaves en la oficina. Su compañero se las llevó.', prompt: 'Почему София не могла войти?', options: ['Ключи остались в офисе', 'Дверь сломалась', 'Она ошиблась домом', 'Она потеряла адрес'], answers: ['Ключи остались в офисе'] },
    { level: 'A2', context: 'Raúl pensaba ir a la playa, pero como empezó a llover decidió visitar una exposición.', prompt: 'Что сделал Рауль?', options: ['Посетил выставку', 'Поехал на пляж', 'Остался работать', 'Пошёл к врачу'], answers: ['Посетил выставку'] },
    { level: 'B1', context: 'El curso era caro. Aun así, Clara se matriculó porque incluía prácticas remuneradas.', prompt: 'Почему Клара записалась?', options: ['Была оплачиваемая практика', 'Курс бесплатный', 'Её заставили', 'Курс онлайн'], answers: ['Была оплачиваемая практика'] },
    { level: 'B1', context: 'El vuelo fue cancelado. Diego tomó un tren nocturno para no perder la reunión.', prompt: 'Почему он выбрал поезд?', options: ['Чтобы успеть на встречу', 'Чтобы увидеть город', 'Он боялся летать', 'Чтобы поспать'], answers: ['Чтобы успеть на встречу'] },
    { level: 'B2', context: 'La medida, presentada como temporal, lleva vigente una década. La excepción se ha convertido en norma.', prompt: 'Что критикуют?', options: ['Временная мера стала постоянной', 'Меру отменили', 'Правило не применяют', 'О мере не знают'], answers: ['Временная мера стала постоянной'] },
    { level: 'B2', context: 'El narrador dice no recordar el incidente, aunque describe detalles secundarios con gran precisión.', prompt: 'Почему он кажется ненадёжным?', options: ['Подробности противоречат забывчивости', 'Он меняет язык', 'Он не был свидетелем', 'Он признался во лжи'], answers: ['Подробности противоречат забывчивости'] },
    { level: 'C1', context: 'El consenso no obedecía a principios comunes, sino al temor de que prolongar la disputa resultara más costoso.', prompt: 'На чём основывалось согласие?', options: ['На желании избежать цены конфликта', 'На одинаковых убеждениях', 'На приказе', 'На недостатке данных'], answers: ['На желании избежать цены конфликта'] },
    { level: 'C1', context: 'La novela subvierte el tópico del héroe: sus victorias van despojándolo de cuanto pretendía proteger.', prompt: 'Как меняется образ героя?', options: ['Победы ведут к утрате', 'Поражения обогащают', 'Герой избегает борьбы', 'Победы без последствий'], answers: ['Победы ведут к утрате'] },
  ]),
  ...section('s2-l', 'Аудирование', [
    { level: 'A1', prompt: 'Напишите услышанный день недели.', audio: 'La reunión es el miércoles.', answers: ['miércoles', 'el miércoles'] },
    { level: 'A1', prompt: 'Выберите услышанный предмет.', audio: 'La taza está encima de la mesa.', options: ['taza', 'cama', 'puerta', 'llave'], answers: ['taza'] },
    { level: 'A2', prompt: 'Что нужно купить?', audio: 'Se nos ha acabado el aceite, así que tengo que comprar una botella.', answers: ['aceite', 'una botella de aceite', 'botella de aceite', 'una botella'] },
    { level: 'A2', prompt: 'Как изменилась встреча?', audio: 'En vez de quedar a las seis, nos veremos media hora más tarde.', options: ['Она на полчаса позже', 'Она отменена', 'Она раньше', 'Изменилось место'], answers: ['Она на полчаса позже'] },
    { level: 'B1', prompt: 'Почему пальто не купили?', audio: 'Me quedaba bien, pero no me lo llevé porque era demasiado caro.', options: ['Оно слишком дорогое', 'Не подошёл размер', 'Не понравился цвет', 'Магазин закрывался'], answers: ['Оно слишком дорогое'] },
    { level: 'B1', prompt: 'Что советуют сделать заранее?', audio: 'Es mejor que compruebes los horarios antes de salir, por si hay cambios.', answers: ['comprobar los horarios', 'compruebes los horarios', 'comprobar los horarios antes de salir', 'mirar los horarios'] },
    { level: 'B2', prompt: 'Какова позиция говорящего?', audio: 'Entiendo que quieran ahorrar, pero recortar la formación me parece contraproducente.', options: ['Сокращение обучения даст обратный эффект', 'Любая экономия полезна', 'Обучение не нужно', 'Расходы надо сократить там'], answers: ['Сокращение обучения даст обратный эффект'] },
    { level: 'B2', prompt: 'Что подразумевается?', audio: 'El informe está bastante bien, aunque no le vendría mal una última revisión.', options: ['Отчёт стоит ещё проверить', 'Его надо переписать', 'Он уже отправлен', 'В нём нет достоинств'], answers: ['Отчёт стоит ещё проверить'] },
    { level: 'C1', prompt: 'Какой смысл у реплики?', audio: 'Que yo sepa, nadie le pidió que hablara en nombre de todos.', options: ['Оспариваются его полномочия', 'Его благодарят', 'Его выбрали все', 'Речь не слышали'], answers: ['Оспариваются его полномочия'] },
    { level: 'C1', prompt: 'Что означает реплика?', audio: 'La propuesta no está exenta de riesgos, pero tampoco es cuestión de quedarse de brazos cruzados.', options: ['Нужно действовать учитывая риски', 'Нужно ничего не делать', 'Рисков нет', 'Решение принято'], answers: ['Нужно действовать учитывая риски'] },
  ]),
  ...section('s2-w', 'Письмо', [
    { level: 'A1', prompt: 'Напишите: «Моя сестра работает в больнице».', answers: ['Mi hermana trabaja en un hospital', 'Mi hermana trabaja en el hospital', 'Mi hermana trabaja en un centro médico'] },
    { level: 'A1', prompt: 'Напишите: «По воскресеньям мы завтракаем дома».', answers: ['Los domingos desayunamos en casa', 'El domingo desayunamos en casa', 'Desayunamos en casa los domingos', 'Cada domingo desayunamos en casa'] },
    { level: 'A2', prompt: 'Напишите: «Я никогда не пробовал это блюдо».', answers: ['Nunca he probado este plato', 'No he probado nunca este plato', 'Jamás he probado este plato', 'Nunca probé este plato'] },
    { level: 'A2', prompt: 'Напишите: «Мы жили там два года».', answers: ['Vivimos allí durante dos años', 'Vivimos ahí durante dos años', 'Vivimos allí dos años', 'Estuvimos viviendo allí dos años'] },
    { level: 'B1', prompt: 'Напишите: «Мне посоветовали забронировать заранее».', answers: ['Me aconsejaron reservar con antelación', 'Me recomendaron reservar con antelación', 'Me aconsejaron que reservara con antelación', 'Me recomendaron que reservase con antelación', 'Me dijeron que reservara con antelación'] },
    { level: 'B1', prompt: 'Напишите: «Хотя квартира маленькая, она очень светлая».', answers: ['Aunque el piso es pequeño es muy luminoso', 'Aunque el apartamento es pequeño es muy luminoso', 'El piso es pequeño pero muy luminoso', 'El apartamento es pequeño pero muy luminoso'] },
    { level: 'B2', prompt: 'Напишите: «Не думаю, что они уже приняли решение».', answers: ['No creo que ya hayan tomado una decisión', 'No pienso que ya hayan tomado una decisión', 'No creo que hayan decidido ya', 'Dudo que ya hayan tomado una decisión', 'No me parece que ya hayan decidido'] },
    { level: 'B2', prompt: 'Напишите: «Проект был бы успешнее, если бы у нас было больше времени».', answers: ['El proyecto tendría más éxito si tuviéramos más tiempo', 'El proyecto sería más exitoso si dispusiéramos de más tiempo', 'Con más tiempo el proyecto tendría más éxito'] },
    { level: 'C1', prompt: 'Напишите: «Каким бы убедительным ни казался аргумент, он не подтверждён данными».', answers: ['Por convincente que parezca el argumento no está respaldado por datos', 'Por muy convincente que parezca el argumento no está apoyado por datos', 'Aunque el argumento parezca convincente no está respaldado por datos'] },
    { level: 'C1', prompt: 'Напишите: «Вряд ли мера даст результат без структурных изменений».', answers: ['Es poco probable que la medida dé resultado sin cambios estructurales', 'Difícilmente dará resultado la medida sin cambios estructurales', 'Dudo que la medida surta efecto sin cambios estructurales', 'La medida difícilmente funcionará sin cambios estructurales'] },
  ]),
];

export const placementQuestionSets = [setOne, setTwo];

export const arrangedPlacementOptions = (
  question: PlacementQuestion,
  attempt: number,
) => {
  if (!question.options?.length) return [];
  const correct = question.options.find((option) =>
      question.answers.some(
        (answer) => normalizeText(answer) === normalizeText(option),
      ),
    ) || question.options[0],
    rest = question.options.filter((option) => option !== correct),
    seed = Array.from(`${question.id}-${attempt}`).reduce(
      (value, character) =>
        (value * 33 + character.charCodeAt(0)) >>> 0,
      5381,
    );
  rest.sort((left, right) => {
    const rank = (value: string) =>
      Array.from(value).reduce(
        (total, character) =>
          (total * 31 + character.charCodeAt(0) + seed) >>> 0,
        seed,
      );
    return rank(left) - rank(right);
  });
  const position = (seed + attempt) % question.options.length,
    result = [...rest];
  result.splice(position, 0, correct);
  return result;
};

export const placementAnswerIsCorrect = (value: string, answers: string[]) =>
  answers.some((answer) =>
    normalizeText(value) === normalizeText(answer) || analyzeAnswer(value, answer).correct,
  );

const emptySkills = (): Record<PlacementSkill, number> => ({ Грамматика: 0, Чтение: 0, Аудирование: 0, Письмо: 0 });
const emptyLevels = (): Record<PlacementLevel, number> => ({ A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 });

export const scorePlacement = (
  responses: Record<string, string>,
  questions: PlacementQuestion[],
  attempt: number,
): PlacementResult => {
  const skillCorrect = emptySkills(), skillTotal = emptySkills(), levelCorrect = emptyLevels(), levelTotal = emptyLevels();
  let correct = 0;
  questions.forEach((question) => {
    const right = placementAnswerIsCorrect(responses[question.id] || '', question.answers);
    skillTotal[question.skill] += 1;
    levelTotal[question.level] += 1;
    if (right) {
      correct += 1;
      skillCorrect[question.skill] += 1;
      levelCorrect[question.level] += 1;
    }
  });
  const skills = Object.fromEntries(placementSkills.map((skill) => [skill, Math.round(skillCorrect[skill] / skillTotal[skill] * 100)])) as Record<PlacementSkill, number>,
    scores = Object.fromEntries(levels.map((level) => [level, Math.round(levelCorrect[level] / levelTotal[level] * 100)])) as Record<PlacementLevel, number>,
    floor = Math.min(...Object.values(skills));
  let level: PlacementLevel = 'A1';
  if (scores.A1 >= 50 && scores.A2 >= 50 && floor >= 20) level = 'A2';
  if (level === 'A2' && scores.A1 >= 60 && scores.A2 >= 55 && scores.B1 >= 50 && floor >= 30) level = 'B1';
  if (level === 'B1' && scores.B2 >= 50 && floor >= 40) level = 'B2';
  if (level === 'B2' && scores.C1 >= 50 && floor >= 50) level = 'C1';
  return {
    level,
    total: Math.round(correct / questions.length * 100),
    levels: scores,
    skills,
    completedAt: new Date().toISOString(),
    attempt,
    questionSetId: `set-${((attempt - 1) % placementQuestionSets.length) + 1}`,
    questionIds: questions.map((question) => question.id),
  };
};
