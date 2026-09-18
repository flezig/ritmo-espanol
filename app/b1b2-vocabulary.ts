import { b2VocabularyExpansion, type B2ExpansionRow } from './b2-vocabulary-expansion.ts';

export type B1B2VocabularyEntry = {
  id: number;
  es: string;
  ru: string;
  example: string;
  exampleRu: string;
  extraExample?: string;
  extraExampleRu?: string;
};

export type B1B2VocabularyTopic = {
  name: string;
  icon: string;
  entries: B1B2VocabularyEntry[];
};

type Row = B2ExpansionRow;

const topic = (name: string, icon: string, rows: Row[]): B1B2VocabularyTopic => ({
  name,
  icon,
  entries: [...rows, ...(b2VocabularyExpansion[name] || [])].map(([es, ru, example, exampleRu, extraExample, extraExampleRu], index) => ({
    id: index + 1,
    es,
    ru,
    example,
    exampleRu,
    extraExample,
    extraExampleRu,
  })),
});

// Curated B1–B2 core, organised by the thematic fields of the Instituto
// Cervantes Plan Curricular. Every item has one precise Russian gloss and a
// complete, natural sentence that can also be used for dictation and context.
export const b1b2VocabularyTopics: B1B2VocabularyTopic[] = [
  topic('Мнение и аргументация', '💬', [
    ['plantear', 'ставить вопрос', 'La periodista planteó una pregunta difícil al ministro.', 'Журналистка задала министру сложный вопрос.'],
    ['sostener', 'утверждать', 'El autor sostiene que la educación debe ser accesible para todos.', 'Автор утверждает, что образование должно быть доступно всем.'],
    ['cuestionar', 'ставить под сомнение', 'Nadie se atrevió a cuestionar aquella decisión.', 'Никто не решился поставить под сомнение то решение.'],
    ['matizar', 'уточнять', 'Quisiera matizar una parte de mi respuesta anterior.', 'Я хотел бы уточнить часть своего предыдущего ответа.'],
    ['rebatir', 'опровергать', 'La científica rebatió el argumento con datos fiables.', 'Учёная опровергла довод достоверными данными.'],
    ['respaldar', 'поддерживать', 'Varios estudios respaldan esta conclusión.', 'Несколько исследований подтверждают этот вывод.'],
    ['discrepar', 'не соглашаться', 'Podemos discrepar sin dejar de respetarnos.', 'Мы можем не соглашаться, продолжая уважать друг друга.'],
    ['coincidir', 'сходиться во мнении', 'Los expertos coinciden en la necesidad de actuar pronto.', 'Эксперты сходятся во мнении, что действовать нужно быстро.'],
    ['enfoque', 'подход', 'Necesitamos un enfoque más práctico para resolver el problema.', 'Нам нужен более практичный подход к решению проблемы.'],
    ['conclusión', 'вывод', 'Llegamos a la conclusión de que el plan era demasiado caro.', 'Мы пришли к выводу, что план был слишком дорогим.'],
  ]),
  topic('Эмоции и внутренние состояния', '🫶', [
    ['desasosiego', 'беспокойство', 'La falta de noticias le produjo un profundo desasosiego.', 'Отсутствие новостей вызвало у него глубокое беспокойство.'],
    ['angustia', 'тревога', 'La espera le produjo mucha angustia.', 'Ожидание вызвало у неё сильную тревогу.'],
    ['agobio', 'подавленность', 'El exceso de trabajo me provoca agobio.', 'Избыток работы вызывает у меня чувство подавленности.'],
    ['desilusión', 'разочарование', 'No pudo ocultar su desilusión al conocer la noticia.', 'Он не смог скрыть разочарование, узнав новость.'],
    ['resignación', 'смирение', 'Aceptó el cambio con cierta resignación.', 'Она приняла перемену с некоторым смирением.'],
    ['euforia', 'эйфория', 'La euforia se extendió por el estadio tras la victoria.', 'После победы эйфория охватила весь стадион.'],
    ['frustración', 'досада', 'La falta de avances le causó frustración.', 'Отсутствие прогресса вызвало у неё досаду.'],
    ['conmover', 'трогать', 'La historia consiguió conmover a todo el público.', 'Эта история смогла растрогать всю публику.'],
    ['ilusionarse', 'воодушевляться', 'Se ilusionó con la idea de vivir junto al mar.', 'Она воодушевилась идеей жить у моря.'],
    ['arrepentirse', 'сожалеть', 'Me arrepiento de no haber aceptado aquella oportunidad.', 'Я сожалею, что не воспользовался той возможностью.'],
  ]),
  topic('Карьера и рабочая среда', '💼', [
    ['candidatura', 'кандидатура', 'Presenté mi candidatura para el puesto de coordinador.', 'Я выдвинул свою кандидатуру на должность координатора.'],
    ['vacante', 'вакансия', 'La empresa publicó una vacante para el departamento jurídico.', 'Компания опубликовала вакансию в юридическом отделе.'],
    ['plantilla', 'штат сотрудников', 'La empresa aumentará su plantilla el próximo año.', 'В следующем году компания увеличит штат сотрудников.'],
    ['ascenso', 'повышение', 'Le ofrecieron un ascenso después de dirigir el proyecto.', 'После руководства проектом ему предложили повышение.'],
    ['rendimiento', 'результативность', 'El descanso mejora el rendimiento de todo el equipo.', 'Отдых повышает результативность всей команды.'],
    ['dimitir', 'уходить в отставку', 'El director decidió dimitir por motivos personales.', 'Директор решил уйти в отставку по личным причинам.'],
    ['contratar', 'нанимать', 'La agencia quiere contratar a dos diseñadores.', 'Агентство хочет нанять двух дизайнеров.'],
    ['despedir', 'увольнять', 'La empresa no puede despedir a alguien sin una causa válida.', 'Компания не может уволить человека без веской причины.'],
    ['emprender', 'начинать дело', 'Decidió emprender un negocio de comida sostenible.', 'Она решила открыть бизнес экологичной еды.'],
    ['conciliar', 'совмещать', 'No siempre es fácil conciliar el trabajo y la vida familiar.', 'Совмещать работу и семейную жизнь не всегда легко.'],
  ]),
  topic('Образование и исследования', '🔬', [
    ['tesis', 'диссертация', 'Está escribiendo una tesis sobre energías renovables.', 'Она пишет диссертацию о возобновляемой энергии.'],
    ['hallazgo', 'находка', 'El hallazgo cambió la dirección de la investigación.', 'Эта находка изменила направление исследования.'],
    ['encuesta', 'опрос', 'La universidad realizó una encuesta entre sus estudiantes.', 'Университет провёл опрос среди студентов.'],
    ['muestra', 'выборка', 'La muestra incluye a personas de distintas edades.', 'В выборку входят люди разных возрастов.'],
    ['fuente', 'источник', 'Comprueba siempre la fuente antes de compartir una noticia.', 'Всегда проверяй источник перед тем, как делиться новостью.'],
    ['citar', 'цитировать', 'Debes citar todas las obras utilizadas en el ensayo.', 'В эссе нужно процитировать все использованные работы.'],
    ['evaluar', 'оценивать', 'El comité evaluará cada propuesta por separado.', 'Комитет оценит каждое предложение отдельно.'],
    ['comprobar', 'проверять', 'Repetimos el experimento para comprobar el resultado.', 'Мы повторили эксперимент, чтобы проверить результат.'],
    ['analizar', 'анализировать', 'El equipo va a analizar los datos esta semana.', 'Команда проанализирует данные на этой неделе.'],
    ['aprendizaje', 'обучение', 'El aprendizaje continuo abre nuevas oportunidades profesionales.', 'Непрерывное обучение открывает новые профессиональные возможности.'],
  ]),
  topic('Новости и общество', '📰', [
    ['titular', 'заголовок', 'El titular no refleja bien el contenido del artículo.', 'Заголовок плохо отражает содержание статьи.'],
    ['reportaje', 'репортаж', 'El canal emitió un reportaje sobre la vida rural.', 'Телеканал показал репортаж о жизни в сельской местности.'],
    ['corresponsal', 'корреспондент', 'La corresponsal informó desde el lugar de los hechos.', 'Корреспондент сообщила новости с места событий.'],
    ['primicia', 'эксклюзивная новость', 'El periódico publicó la primicia antes que sus competidores.', 'Газета опубликовала эксклюзивную новость раньше конкурентов.'],
    ['difundir', 'распространять', 'No conviene difundir información que no está confirmada.', 'Не стоит распространять неподтверждённую информацию.'],
    ['contrastar', 'сверять', 'El periodista contrastó la versión con varias fuentes.', 'Журналист сверил эту версию с несколькими источниками.'],
    ['sesgo', 'предвзятость', 'El informe presenta un claro sesgo político.', 'В отчёте заметна явная политическая предвзятость.'],
    ['actualidad', 'текущие события', 'Este pódcast analiza la actualidad internacional.', 'Этот подкаст разбирает международные события.'],
    ['convivencia', 'сосуществование', 'El respeto es fundamental para una buena convivencia.', 'Уважение необходимо для мирного сосуществования.'],
    ['voluntariado', 'волонтёрство', 'Participa en un programa de voluntariado los fines de semana.', 'По выходным она участвует в волонтёрской программе.'],
  ]),
  topic('Экология и устойчивое развитие', '🌿', [
    ['sequía', 'засуха', 'La sequía ha reducido la producción agrícola.', 'Засуха сократила объём сельскохозяйственного производства.'],
    ['inundación', 'наводнение', 'La inundación obligó a evacuar varias viviendas.', 'Наводнение вынудило эвакуировать жителей нескольких домов.'],
    ['emisión', 'выброс', 'La ciudad quiere reducir la emisión de gases contaminantes.', 'Город хочет сократить выброс загрязняющих газов.'],
    ['residuo', 'отход', 'Cada residuo debe depositarse en el contenedor adecuado.', 'Каждый отход нужно выбрасывать в подходящий контейнер.'],
    ['biodiversidad', 'биоразнообразие', 'El parque protege la biodiversidad de la región.', 'Парк охраняет биоразнообразие региона.'],
    ['ecosistema', 'экосистема', 'La contaminación amenaza el ecosistema marino.', 'Загрязнение угрожает морской экосистеме.'],
    ['sostenible', 'устойчивый', 'Buscamos una forma más sostenible de producir alimentos.', 'Мы ищем более устойчивый способ производства продуктов.'],
    ['renovable', 'возобновляемый', 'La energía solar es una fuente renovable.', 'Солнечная энергия является возобновляемым источником.'],
    ['preservar', 'сохранять', 'Es responsabilidad de todos preservar los espacios naturales.', 'Сохранять природные территории — общая ответственность.'],
    ['desperdicio', 'напрасная трата', 'Planificar la compra ayuda a evitar el desperdicio de comida.', 'Планирование покупок помогает избежать напрасной траты еды.'],
  ]),
  topic('Экономика и личные финансы', '📈', [
    ['presupuesto', 'бюджет', 'Hemos preparado un presupuesto realista para la reforma.', 'Мы подготовили реалистичный бюджет на ремонт.'],
    ['ahorro', 'сбережения', 'Destina una parte de sus ingresos al ahorro.', 'Она направляет часть своих доходов в сбережения.'],
    ['deuda', 'долг', 'Terminó de pagar la deuda el mes pasado.', 'В прошлом месяце он закончил выплачивать долг.'],
    ['préstamo', 'заём', 'El banco rechazó su solicitud de préstamo.', 'Банк отклонил его заявку на заём.'],
    ['interés', 'процентная ставка', 'El interés del crédito subió este año.', 'В этом году процентная ставка по кредиту выросла.'],
    ['impuesto', 'налог', 'El precio final ya incluye el impuesto.', 'Налог уже включён в итоговую цену.'],
    ['ingreso', 'доход', 'El alquiler representa su principal fuente de ingreso.', 'Аренда является его главным источником дохода.'],
    ['gasto', 'расход', 'Anota cada gasto para controlar mejor tus finanzas.', 'Записывай каждый расход, чтобы лучше контролировать финансы.'],
    ['inflación', 'инфляция', 'La inflación ha aumentado el coste de los alimentos.', 'Инфляция повысила стоимость продуктов.'],
    ['rentable', 'рентабельный', 'El proyecto solo será rentable a largo plazo.', 'Проект станет рентабельным только в долгосрочной перспективе.'],
  ]),
  topic('Наука и цифровой мир', '🧠', [
    ['algoritmo', 'алгоритм', 'El algoritmo recomienda contenidos según tus intereses.', 'Алгоритм рекомендует материалы с учётом твоих интересов.'],
    ['privacidad', 'конфиденциальность', 'Revisa la configuración de privacidad de la aplicación.', 'Проверь настройки конфиденциальности приложения.'],
    ['almacenar', 'хранить', 'El sistema permite almacenar los archivos de forma segura.', 'Система позволяет безопасно хранить файлы.'],
    ['automatizar', 'автоматизировать', 'La herramienta sirve para automatizar tareas repetitivas.', 'Инструмент помогает автоматизировать повторяющиеся задачи.'],
    ['cifrar', 'шифровать', 'La aplicación permite cifrar los mensajes privados.', 'Приложение позволяет шифровать личные сообщения.'],
    ['hallar', 'обнаруживать', 'Los astrónomos lograron hallar un planeta parecido a la Tierra.', 'Астрономам удалось обнаружить планету, похожую на Землю.'],
    ['desarrollar', 'разрабатывать', 'El laboratorio está desarrollando un nuevo material.', 'Лаборатория разрабатывает новый материал.'],
    ['avance', 'достижение', 'Este avance podría mejorar el diagnóstico temprano.', 'Это достижение может улучшить раннюю диагностику.'],
    ['fiable', 'надёжный', 'Necesitamos una conexión fiable para la videollamada.', 'Для видеозвонка нам нужно надёжное соединение.'],
    ['fallo', 'сбой', 'Un fallo del servidor interrumpió el servicio durante una hora.', 'Сбой сервера прервал работу сервиса на час.'],
  ]),
  topic('Здоровье и благополучие', '🩺', [
    ['diagnóstico', 'диагноз', 'El médico confirmó el diagnóstico después de las pruebas.', 'Врач подтвердил диагноз после обследований.'],
    ['dolencia', 'недомогание', 'Esta dolencia requiere seguimiento médico regular.', 'Это недомогание требует регулярного наблюдения врача.'],
    ['lesión', 'травма', 'La lesión le impidió competir durante varios meses.', 'Травма не позволяла ему участвовать в соревнованиях несколько месяцев.'],
    ['recuperación', 'восстановление', 'La recuperación fue más rápida de lo esperado.', 'Восстановление прошло быстрее, чем ожидалось.'],
    ['bienestar', 'благополучие', 'Dormir bien es esencial para el bienestar físico y mental.', 'Хороший сон необходим для физического и душевного благополучия.'],
    ['prevenir', 'предотвращать', 'Una revisión anual ayuda a prevenir algunas enfermedades.', 'Ежегодное обследование помогает предотвратить некоторые заболевания.'],
    ['aliviar', 'облегчать', 'Este ejercicio puede aliviar el dolor de espalda.', 'Это упражнение может облегчить боль в спине.'],
    ['recaer', 'переживать рецидив', 'Volvió a recaer porque retomó el trabajo demasiado pronto.', 'У него снова случился рецидив, потому что он слишком рано вернулся к работе.'],
    ['recuperarse', 'выздоравливать', 'Necesitó dos semanas para recuperarse por completo.', 'Ему понадобилось две недели, чтобы полностью восстановиться.'],
    ['agotamiento', 'истощение', 'El estrés prolongado puede causar agotamiento.', 'Продолжительный стресс может вызвать истощение.'],
  ]),
  topic('Искусство и культурная жизнь', '🎭', [
    ['patrimonio', 'наследие', 'La ciudad protege su patrimonio histórico.', 'Город охраняет своё историческое наследие.'],
    ['guion', 'сценарий', 'El guion combina humor y crítica social.', 'Сценарий сочетает юмор и социальную критику.'],
    ['rodaje', 'съёмки', 'El rodaje de la película duró cuatro meses.', 'Съёмки фильма длились четыре месяца.'],
    ['interpretación', 'исполнение', 'Su interpretación emocionó al público.', 'Её исполнение растрогало публику.'],
    ['trayectoria', 'творческий путь', 'La exposición recorre toda la trayectoria del pintor.', 'Выставка охватывает весь творческий путь художника.'],
    ['ensayo', 'эссе', 'Publicó un ensayo sobre la memoria y la identidad.', 'Он опубликовал эссе о памяти и идентичности.'],
    ['puesta en escena', 'постановка', 'La puesta en escena destaca por su sencillez.', 'Постановка выделяется своей простотой.'],
    ['cartelera', 'афиша', 'La película sigue en cartelera después de seis semanas.', 'Фильм остаётся в афише после шести недель проката.'],
    ['destacar', 'выделяться', 'La novela destaca por la naturalidad de sus diálogos.', 'Роман выделяется естественностью диалогов.'],
    ['transmitir', 'передавать', 'La fotografía transmite una sensación de calma.', 'Фотография передаёт ощущение спокойствия.'],
  ]),
];
