// Russian counterparts of the generated grammar bank, indexed by its stable IDs.
const verbs: Record<string, [string, string, string, string]> = {
  hablar: ['говорить с преподавательницей', 'говорю|говоришь|говорит|говорим|говорите|говорят', 'говорил|говорила|говорили', 'поговорил|поговорила|поговорили'],
  trabajar: ['работать над проектом', 'работаю|работаешь|работает|работаем|работаете|работают', 'работал|работала|работали', 'поработал|поработала|поработали'],
  estudiar: ['изучать испанский', 'изучаю|изучаешь|изучает|изучаем|изучаете|изучают', 'изучал|изучала|изучали', 'изучил|изучила|изучили'],
  viajar: ['ездить в Мадрид', 'езжу|ездишь|ездит|ездим|ездите|ездят', 'ездил|ездила|ездили', 'съездил|съездила|съездили'],
  comprar: ['покупать билеты', 'покупаю|покупаешь|покупает|покупаем|покупаете|покупают', 'покупал|покупала|покупали', 'купил|купила|купили'],
  comer: ['есть дома', 'ем|ешь|ест|едим|едите|едят', 'ел|ела|ели', 'поел|поела|поели'],
  vivir: ['жить рядом с центром', 'живу|живёшь|живёт|живём|живёте|живут', 'жил|жила|жили', 'пожил|пожила|пожили'],
  escribir: ['писать отчёт', 'пишу|пишешь|пишет|пишем|пишете|пишут', 'писал|писала|писали', 'написал|написала|написали'],
  tener: ['иметь свободное время', 'имею|имеешь|имеет|имеем|имеете|имеют', 'имел|имела|имели', 'имел|имела|имели'],
  hacer: ['делать упражнения', 'делаю|делаешь|делает|делаем|делаете|делают', 'делал|делала|делали', 'сделал|сделала|сделали'],
  poder: ['мочь участвовать в собрании', 'могу|можешь|может|можем|можете|могут', 'мог|могла|могли', 'смог|смогла|смогли'],
  venir: ['приходить на занятие', 'прихожу|приходишь|приходит|приходим|приходите|приходят', 'приходил|приходила|приходили', 'пришёл|пришла|пришли'],
};
const complements: Record<string, string> = {
  hablar: 'с преподавательницей', trabajar: 'над проектом', estudiar: 'испанский', viajar: 'в Мадрид', comprar: 'билеты', comer: 'дома', vivir: 'рядом с центром', escribir: 'отчёт', tener: 'свободное время', hacer: 'упражнения', poder: 'участвовать в собрании', venir: 'на занятие',
};
export function grammarTranslation(id: string): string {
  const [, rule, inf, person] = id.split(':');
  const p = Number(person);
  const [infinitive, presentForms, pastForms, perfectForms] = verbs[inf];
  const subject = ['я', 'ты', 'она', 'мы', 'вы', 'они'][p];
  const gender = p === 2 ? 1 : p >= 3 ? 2 : 0;
  const present = `${subject} ${presentForms.split('|')[p]} ${complements[inf]}`;
  const past = `${subject} ${pastForms.split('|')[gender]} ${complements[inf]}`;
  const perfect = `${subject} ${perfectForms.split('|')[gender]} ${complements[inf]}`;
  const future = `${subject} ${['буду', 'будешь', 'будет', 'будем', 'будете', 'будут'][p]} ${infinitive}`;
  const conditional = `${subject} ${pastForms.split('|')[gender]} бы ${complements[inf]}`;
  const templates: Record<string, string> = {
    'presente de subjuntivo': `Важно, чтобы завтра ${past}.`,
    'perfecto de subjuntivo': `Меня радует, что уже ${perfect}.`,
    'imperfecto de subjuntivo (-ra)': `Было важно, чтобы на следующий день ${past}.`,
    'pluscuamperfecto de subjuntivo': `Меня обрадовало, что ещё до собрания ${perfect}.`,
    'presente de indicativo': `Я думаю, что обычно ${present}.`,
    indefinido: `Вчера ${perfect}.`,
    imperfecto: `В то время часто ${past}.`,
    'perfecto compuesto': `Сегодня уже ${perfect}.`,
    pluscuamperfecto: `Ещё до того дня ${perfect}.`,
    'futuro simple': `Завтра ${future}.`,
    'ir a + infinitivo': `В эти выходные ${subject} ${['собираюсь', 'собираешься', 'собирается', 'собираемся', 'собираетесь', 'собираются'][p]} ${infinitive}.`,
    'futuro compuesto': `К тому моменту ${subject} уже ${['успею', 'успеешь', 'успеет', 'успеем', 'успеете', 'успеют'][p]} ${infinitive}.`,
    'Тип 1 · условие': `Если ${present}, ситуация улучшится.`,
    'Тип 2 · условие': `Если бы ${past}, ситуация улучшилась бы.`,
    'Тип 3 · условие': `Если бы тогда ${perfect}, ситуация улучшилась бы.`,
    'Тип 1': `Если условия будут благоприятными, ${future}.`,
    'Тип 2': `Если бы условия были благоприятными, ${conditional}.`,
    'Тип 3': `Если бы тогда условия были благоприятными, ${conditional}.`,
  };
  const translation = templates[rule];
  return translation[0].toUpperCase() + translation.slice(1);
}
