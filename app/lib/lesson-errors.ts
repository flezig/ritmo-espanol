export type LessonErrorAttempt = {
  itemKey: string;
  prompt: string;
  studentAnswer: string | null;
  correctAnswer: string;
  explanation: string;
  rule: string;
  answeredAt: string | null;
};
export type LessonErrorState = {
  errorHistory?: Record<string, LessonErrorAttempt>;
  errorIds?: string[];
  errors?: number[];
};

// Independent keys let cloud sync merge mistakes made on different devices.
export function appendLessonError(
  history: Record<string, LessonErrorAttempt> | undefined,
  attempt: LessonErrorAttempt,
  id: string,
): Record<string, LessonErrorAttempt> {
  return { ...history, [id]: attempt };
}

export function lessonErrorsForTeacher(
  state: LessonErrorState,
  exercises: Array<{
    prompt: string;
    answer: string;
    explanation: string;
    kind: string;
  }>,
  normalize: (text: string) => string,
) {
  const history = Object.entries(state.errorHistory || {}).map(
    ([id, attempt]) => ({ id, ...attempt }),
  );
  const known = new Set(history.map((attempt) => attempt.itemKey));
  const legacy = new Set(state.errorIds || []);
  // Numeric positions predate stable exercise keys; only use them when keys are absent.
  if (!state.errorIds?.length)
    for (const index of state.errors || []) {
      const exercise = exercises[index];
      if (exercise)
        legacy.add(
          `${normalize(exercise.prompt)}::${normalize(exercise.answer)}`,
        );
    }
  for (const itemKey of legacy) {
    if (known.has(itemKey)) continue;
    const exercise = exercises.find(
      (item) =>
        `${normalize(item.prompt)}::${normalize(item.answer)}` === itemKey,
    );
    const separator = itemKey.lastIndexOf('::');
    history.push({
      id: `legacy:${itemKey}`,
      itemKey,
      prompt:
        exercise?.prompt ||
        (separator >= 0 ? itemKey.slice(0, separator) : itemKey),
      correctAnswer:
        exercise?.answer ||
        (separator >= 0 ? itemKey.slice(separator + 2) : ''),
      studentAnswer: null,
      answeredAt: null,
      explanation: exercise?.explanation || '',
      rule: exercise?.kind || 'Ранее сохранённая ошибка',
    });
  }
  return history.sort((a, b) =>
    (b.answeredAt || '').localeCompare(a.answeredAt || ''),
  );
}

// Stable identifiers from the home curriculum replaced by prepositions.
export const LEGACY_HOME_EXERCISE_KEYS: string[] = [
  'en mi piso dos dormitorios::hay',
  'впишите правильныи ответ без вариантов armario es nuevo рядом со мнои::este',
  'соберите стол у окна находится::la mesa esta junto a la ventana',
  'hay изменяется на han если предметов несколько::неверно',
  'la mesa al lado de la ventana::esta',
  'напишите в гостинои есть диван::en el salon hay un sofa',
  'соберите в доме есть сад::hay un jardin en la casa',
  'для положения конкретного предмета используется estar::верно',
  'donde las llaves::estan',
  'напишите диван находится рядом с окном::el sofa esta al lado de la ventana',
  'соберите ключи на столе::las llaves estan encima de la mesa',
  'la lampara esta debajo de la mesa означает что лампа под столом::верно',
  'una lampara encima de la mesa::hay',
  'напишите кот находится под столом::el gato esta debajo de la mesa',
  'соберите кресло между диваном и окном::el sillon esta entre el sofa y la ventana',
  'перед женским словом mesa нужно este::неверно',
  'el gato esta la cama::debajo de',
  'напишите книги находятся на полке::los libros estan en la estanteria',
  'соберите вопрос сколько комнат есть::cuantas habitaciones hay',
  'hay el sofa обычныи способ впервые представить диван::неверно',
  'el sofa esta la television::delante de',
  'напишите моя квартира светлая::mi piso es luminoso',
  'соберите эта квартира современная::este piso es moderno',
  'la cocina esta el salon y el bano::entre',
  'напишите в кухне нет окна::no hay una ventana en la cocina',
  'соберите лампа над столом::la lampara esta encima de la mesa',
  'la silla esta del escritorio::al lado',
  'напишите этот стол новыи::esta mesa es nueva',
  'соберите кот за дверью::el gato esta detras de la puerta',
  'ventana esta abierta рядом со мнои::esta',
  'напишите тот шкаф большои::ese armario es grande',
  'соберите здесь нет лифта::aqui no hay ascensor',
  'sofa de alli es comodo::ese',
  'напишите где находится ванная::donde esta el bano',
  'соберите та кровать удобная::esa cama es comoda',
  'lampara de alli es bonita::esa',
  'напишите в моеи квартире три комнаты::en mi piso hay tres habitaciones',
  'en el bano no ventana::hay',
  'напишите лампа находится между кроватью и шкафом::la lampara esta entre la cama y el armario',
  'madrid en espana::esta',
  'напишите рядом с диваном есть кошачья лежанка::hay una cama para el gato al lado del sofa',
  'la casa grande y luminosa::es',
  'напишите в спальне есть зеркало::hay un espejo en el dormitorio',
  'el libro esta de la mesa::encima',
  'напишите кухня находится за гостинои::la cocina esta detras del salon',
  'la alfombra esta del sofa::delante',
  'напишите эти стулья удобные::estas sillas son comodas',
  'hay espejo en el dormitorio::un',
  'habitacion es pequena::la',
  'necesito silla para el escritorio::una',
];
