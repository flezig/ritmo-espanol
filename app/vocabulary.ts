export type VocabularyEntry = {
  id: number;
  ru: string;
  es: string;
  example: string;
  exampleRu?: string;
  extraExample?: string;
  extraExampleRu?: string;
};

import { corpusExamples } from './vocabulary-corpus.ts';
import { legacyExampleTranslations } from './legacy-translations.ts';
import { a2VocabularyTopics } from './a2-vocabulary.ts';

const legacyVocabularyTopics = [
  {
    name: 'Путешествия',
    icon: '✈️',
    entries: [
      {
        id: 1,
        ru: 'путешествие',
        es: 'viaje',
        example: 'Nuestro viaje duró diez días.',
      },
      {
        id: 2,
        ru: 'путешествовать',
        es: 'viajar',
        example: 'Me encanta viajar por España.',
      },
      {
        id: 3,
        ru: 'турист',
        es: 'turista',
        example: 'En verano hay muchos turistas.',
      },
      {
        id: 4,
        ru: 'отпуск',
        es: 'vacaciones',
        example: 'Nos vamos de vacaciones en agosto.',
      },
      {
        id: 5,
        ru: 'поездка',
        es: 'viaje / excursión',
        example: 'Hicimos una excursión a Toledo.',
      },
      {
        id: 6,
        ru: 'маршрут',
        es: 'ruta',
        example: 'Esta ruta pasa por varios pueblos.',
      },
      {
        id: 7,
        ru: 'маршрут, путь',
        es: 'recorrido',
        example: 'El recorrido dura dos horas.',
      },
      {
        id: 8,
        ru: 'место назначения',
        es: 'destino',
        example: 'Madrid es nuestro destino final.',
      },
      {
        id: 9,
        ru: 'билет',
        es: 'billete',
        example: 'Compré un billete de tren.',
      },
      {
        id: 10,
        ru: 'билет туда и обратно',
        es: 'billete de ida y vuelta',
        example: 'Quiero un billete de ida y vuelta.',
      },
      {
        id: 11,
        ru: 'самолёт',
        es: 'avión',
        example: 'El avión sale a las ocho.',
      },
      {
        id: 12,
        ru: 'рейс',
        es: 'vuelo',
        example: 'Nuestro vuelo lleva retraso.',
      },
      {
        id: 13,
        ru: 'аэропорт',
        es: 'aeropuerto',
        example: 'Llegamos temprano al aeropuerto.',
      },
      {
        id: 14,
        ru: 'посадка',
        es: 'embarque',
        example: 'El embarque empieza a las seis.',
      },
      {
        id: 15,
        ru: 'посадочный талон',
        es: 'tarjeta de embarque',
        example: 'Tengo la tarjeta de embarque en el móvil.',
      },
      {
        id: 16,
        ru: 'выход на посадку',
        es: 'puerta de embarque',
        example: '¿Cuál es nuestra puerta de embarque?',
      },
      {
        id: 17,
        ru: 'багаж',
        es: 'equipaje',
        example: 'Mi equipaje pesa demasiado.',
      },
      {
        id: 18,
        ru: 'чемодан',
        es: 'maleta',
        example: 'He hecho la maleta esta mañana.',
      },
      {
        id: 19,
        ru: 'ручная кладь',
        es: 'equipaje de mano',
        example: 'Solo llevo equipaje de mano.',
      },
      {
        id: 20,
        ru: 'паспорт',
        es: 'pasaporte',
        example: 'No olvides el pasaporte.',
      },
      {
        id: 21,
        ru: 'виза',
        es: 'visado',
        example: 'Necesito un visado para entrar.',
      },
      {
        id: 22,
        ru: 'таможня',
        es: 'aduana',
        example: 'Pasamos por la aduana rápidamente.',
      },
      {
        id: 23,
        ru: 'граница',
        es: 'frontera',
        example: 'Cruzamos la frontera en coche.',
      },
      {
        id: 24,
        ru: 'отель',
        es: 'hotel',
        example: 'Reservamos un hotel céntrico.',
      },
      {
        id: 25,
        ru: 'жильё',
        es: 'alojamiento',
        example: 'Busco alojamiento barato.',
      },
      {
        id: 26,
        ru: 'номер',
        es: 'habitación',
        example: 'La habitación tiene vistas al mar.',
      },
      {
        id: 27,
        ru: 'бронирование',
        es: 'reserva',
        example: 'Tengo una reserva a mi nombre.',
      },
      {
        id: 28,
        ru: 'бронировать',
        es: 'reservar',
        example: 'Quiero reservar una habitación.',
      },
      {
        id: 29,
        ru: 'отменить',
        es: 'cancelar',
        example: 'Tuvimos que cancelar el viaje.',
      },
      {
        id: 30,
        ru: 'стойка регистрации',
        es: 'recepción',
        example: 'Pregunta en recepción.',
      },
      {
        id: 31,
        ru: 'заселиться',
        es: 'hacer el registro de entrada / hacer el check-in',
        example: 'Podemos hacer el check-in a las tres.',
      },
      {
        id: 32,
        ru: 'выселиться',
        es: 'hacer el registro de salida / hacer el check-out',
        example: 'Tenemos que hacer el check-out antes de las doce.',
      },
      {
        id: 33,
        ru: 'поезд',
        es: 'tren',
        example: 'Vamos a Sevilla en tren.',
      },
      {
        id: 34,
        ru: 'вокзал',
        es: 'estación',
        example: 'Nos vemos en la estación.',
      },
      {
        id: 35,
        ru: 'автобус',
        es: 'autobús',
        example: 'El autobús llega en cinco minutos.',
      },
      {
        id: 36,
        ru: 'метро',
        es: 'metro',
        example: 'Es más rápido ir en metro.',
      },
      {
        id: 37,
        ru: 'такси',
        es: 'taxi',
        example: 'Cogimos un taxi al aeropuerto.',
      },
      {
        id: 38,
        ru: 'арендовать машину',
        es: 'alquilar un coche',
        example: 'Vamos a alquilar un coche.',
      },
      {
        id: 39,
        ru: 'водительские права',
        es: 'carné de conducir',
        example: 'Necesitas el carné de conducir.',
      },
      {
        id: 40,
        ru: 'карта',
        es: 'mapa',
        example: 'Mira la ruta en el mapa.',
      },
      {
        id: 41,
        ru: 'центр города',
        es: 'centro de la ciudad',
        example: 'El hotel está en el centro de la ciudad.',
      },
      {
        id: 42,
        ru: 'достопримечательность',
        es: 'lugar de interés / atracción turística',
        example: 'La Alhambra es una gran atracción turística.',
      },
      {
        id: 43,
        ru: 'экскурсия с гидом',
        es: 'visita guiada',
        example: 'Reservamos una visita guiada.',
      },
      {
        id: 44,
        ru: 'гид',
        es: 'guía',
        example: 'Nuestra guía hablaba ruso.',
      },
      {
        id: 45,
        ru: 'пляж',
        es: 'playa',
        example: 'Pasamos todo el día en la playa.',
      },
      {
        id: 46,
        ru: 'задержка',
        es: 'retraso',
        example: 'El tren tiene veinte minutos de retraso.',
      },
      {
        id: 47,
        ru: 'потеряться',
        es: 'perderse',
        example: 'Nos perdimos en el casco antiguo.',
      },
      {
        id: 48,
        ru: 'добраться',
        es: 'llegar',
        example: '¿Cómo llego al centro?',
      },
      {
        id: 49,
        ru: 'отправляться',
        es: 'salir',
        example: 'El tren sale a las nueve.',
      },
      {
        id: 50,
        ru: 'прибывать',
        es: 'llegar',
        example: 'Llegamos a Barcelona por la noche.',
      },
    ],
  },
  {
    name: 'Ночная жизнь',
    icon: '🍹',
    entries: [
      {
        id: 1,
        ru: 'ночная жизнь',
        es: 'vida nocturna',
        example: 'Madrid tiene mucha vida nocturna.',
      },
      {
        id: 2,
        ru: 'вечеринка',
        es: 'fiesta',
        example: 'Esta noche hay una fiesta.',
      },
      {
        id: 3,
        ru: 'тусоваться',
        es: 'salir de fiesta',
        example: 'Los viernes solemos salir de fiesta.',
      },
      {
        id: 4,
        ru: 'бар',
        es: 'bar',
        example: 'Vamos a tomar algo a un bar.',
      },
      {
        id: 5,
        ru: 'паб',
        es: 'pub',
        example: 'Conocimos un pub muy tranquilo.',
      },
      {
        id: 6,
        ru: 'ночной клуб',
        es: 'discoteca',
        example: 'La discoteca cierra a las seis.',
      },
      {
        id: 7,
        ru: 'клуб',
        es: 'club',
        example: 'Ese club está siempre lleno.',
      },
      {
        id: 8,
        ru: 'танцевать',
        es: 'bailar',
        example: '¿Quieres bailar conmigo?',
      },
      {
        id: 9,
        ru: 'танец',
        es: 'baile',
        example: 'Me encanta el baile latino.',
      },
      {
        id: 10,
        ru: 'музыка',
        es: 'música',
        example: 'La música está demasiado alta.',
      },
      {
        id: 11,
        ru: 'диджей',
        es: 'DJ / disyóquey',
        example: 'El DJ empieza a medianoche.',
      },
      {
        id: 12,
        ru: 'концерт',
        es: 'concierto',
        example: 'Vamos a un concierto el sábado.',
      },
      {
        id: 13,
        ru: 'живая музыка',
        es: 'música en directo',
        example: 'Los viernes hay música en directo en este bar.',
      },
      {
        id: 14,
        ru: 'выпить',
        es: 'beber',
        example: 'No quiero beber mucho hoy.',
      },
      {
        id: 15,
        ru: 'выпить чего-нибудь',
        es: 'tomar algo',
        example: '¿Vamos a tomar algo?',
      },
      {
        id: 16,
        ru: 'напиток',
        es: 'bebida',
        example: '¿Qué bebida quieres?',
      },
      {
        id: 17,
        ru: 'бокал вина',
        es: 'copa de vino',
        example: 'Tomé una copa de vino.',
      },
      {
        id: 18,
        ru: 'бокал / алкогольный напиток',
        es: 'copa',
        example: 'Vamos a tomar unas copas.',
      },
      {
        id: 19,
        ru: 'пиво',
        es: 'cerveza',
        example: 'Ponme una cerveza, por favor.',
      },
      {
        id: 20,
        ru: 'коктейль',
        es: 'cóctel',
        example: 'Este cóctel está buenísimo.',
      },
      {
        id: 21,
        ru: 'рюмка / шот',
        es: 'chupito',
        example: 'Nos invitaron a un chupito.',
      },
      {
        id: 22,
        ru: 'заказать',
        es: 'pedir',
        example: 'Voy a pedir otra bebida.',
      },
      {
        id: 23,
        ru: 'барная стойка',
        es: 'barra',
        example: 'Nos quedamos junto a la barra.',
      },
      {
        id: 24,
        ru: 'официант',
        es: 'camarero / camarera',
        example: 'Llama al camarero.',
      },
      {
        id: 25,
        ru: 'вход',
        es: 'entrada',
        example: 'La entrada cuesta quince euros.',
      },
      {
        id: 26,
        ru: 'бесплатный вход',
        es: 'entrada gratuita',
        example: 'Antes de las doce hay entrada gratuita.',
      },
      {
        id: 27,
        ru: 'очередь',
        es: 'cola',
        example: 'Hay una cola enorme.',
      },
      {
        id: 28,
        ru: 'охранник',
        es: 'portero / personal de seguridad',
        example: 'El portero nos pidió el DNI.',
      },
      {
        id: 29,
        ru: 'документ удостоверяющий личность',
        es: 'DNI / documento de identidad',
        example: '¿Llevas el DNI?',
      },
      {
        id: 30,
        ru: 'танцпол',
        es: 'pista de baile',
        example: 'Nos vemos en la pista de baile.',
      },
      {
        id: 31,
        ru: 'познакомиться',
        es: 'conocer a alguien',
        example: 'Conocí a mucha gente anoche.',
      },
      {
        id: 32,
        ru: 'флиртовать',
        es: 'ligar',
        example: 'Está intentando ligar con ella.',
      },
      {
        id: 33,
        ru: 'пригласить кого-то выпить',
        es: 'invitar a una copa',
        example: 'Te invito a una copa.',
      },
      {
        id: 34,
        ru: 'платить',
        es: 'pagar',
        example: 'Esta ronda la pago yo.',
      },
      {
        id: 35,
        ru: 'угощать',
        es: 'invitar',
        example: 'Hoy te invito yo.',
      },
      {
        id: 36,
        ru: 'раунд напитков',
        es: 'ronda',
        example: 'Pedimos otra ronda.',
      },
      {
        id: 37,
        ru: 'тост',
        es: 'brindis',
        example: 'Hicimos un brindis por su cumpleaños.',
      },
      {
        id: 38,
        ru: 'произнести тост',
        es: 'brindar',
        example: 'Vamos a brindar por nosotros.',
      },
      {
        id: 39,
        ru: 'веселиться',
        es: 'divertirse',
        example: 'Nos divertimos muchísimo.',
      },
      {
        id: 40,
        ru: 'людный',
        es: 'abarrotado',
        example: 'El local está abarrotado.',
      },
      {
        id: 41,
        ru: 'атмосфера',
        es: 'ambiente',
        example: 'Este bar tiene muy buen ambiente.',
      },
      {
        id: 42,
        ru: 'громкий',
        es: 'ruidoso',
        example: 'Es un sitio muy ruidoso.',
      },
      {
        id: 43,
        ru: 'закрываться',
        es: 'cerrar',
        example: '¿A qué hora cierra este bar?',
      },
      {
        id: 44,
        ru: 'открываться',
        es: 'abrir',
        example: 'La discoteca abre a las once.',
      },
      {
        id: 45,
        ru: 'похмелье',
        es: 'resaca',
        example: 'Tengo una resaca terrible.',
      },
      {
        id: 46,
        ru: 'быть пьяным',
        es: 'estar borracho',
        example: 'Estaba bastante borracho.',
      },
      {
        id: 47,
        ru: 'протрезветь',
        es: 'despejarse',
        example: 'Salí a caminar para despejarme.',
      },
      {
        id: 48,
        ru: 'вернуться домой',
        es: 'volver a casa',
        example: 'Volvimos a casa muy tarde.',
      },
      {
        id: 49,
        ru: 'продолжить тусовку',
        es: 'seguir de fiesta',
        example: 'Ellos quieren seguir de fiesta.',
      },
      {
        id: 50,
        ru: 'тусовка / гулянка',
        es: 'juerga',
        example: 'Anoche nos fuimos de juerga.',
      },
    ],
  },
  {
    name: 'Живой сленг',
    icon: '🗣️',
    entries: [
      {
        id: 1,
        ru: 'крутой / классный',
        es: 'guay',
        example: 'La película está muy guay.',
      },
      {
        id: 2,
        ru: 'классно!',
        es: '¡Qué guay!',
        example: '¡Qué guay tu nueva casa!',
      },
      {
        id: 3,
        ru: 'чувак',
        es: 'tío',
        example: 'Tío, no me lo puedo creer.',
      },
      {
        id: 4,
        ru: 'девушка / тётка, разг.',
        es: 'tía',
        example: 'Esa tía me suena.',
      },
      {
        id: 5,
        ru: 'парень, молодой человек',
        es: 'chaval',
        example: 'Ese chaval estudia conmigo.',
      },
      {
        id: 6,
        ru: 'девчонка',
        es: 'chavala',
        example: 'La chavala es muy simpática.',
      },
      {
        id: 7,
        ru: 'приятель',
        es: 'colega',
        example: 'Voy con unos colegas.',
      },
      {
        id: 8,
        ru: 'народ / компания',
        es: 'peña',
        example: 'Había un montón de peña.',
      },
      {
        id: 9,
        ru: 'работать, разг.',
        es: 'currar',
        example: 'Mañana me toca currar.',
      },
      {
        id: 10,
        ru: 'работа, разг.',
        es: 'curro',
        example: 'Tengo muchísimo curro.',
      },
      {
        id: 11,
        ru: 'деньги, разг.',
        es: 'pasta',
        example: 'No tengo pasta para viajar.',
      },
      {
        id: 12,
        ru: 'нравиться, быть классным',
        es: 'molar',
        example: 'Ese sitio mola mucho.',
      },
      {
        id: 13,
        ru: 'офигеть',
        es: 'flipar',
        example: 'Vas a flipar cuando lo veas.',
      },
      {
        id: 14,
        ru: 'я в шоке',
        es: 'estoy flipando',
        example: 'Estoy flipando con el precio.',
      },
      {
        id: 15,
        ru: 'тема / дело / ситуация',
        es: 'rollo',
        example: 'No me gusta ese rollo.',
      },
      {
        id: 16,
        ru: 'зануда / скучная вещь',
        es: 'rollo',
        example: 'La reunión fue un rollo.',
      },
      {
        id: 17,
        ru: 'движуха / ситуация',
        es: 'movida',
        example: 'Ayer hubo una movida en el bar.',
      },
      {
        id: 18,
        ru: 'неприятности / бардак',
        es: 'follón',
        example: 'Se montó un follón enorme.',
      },
      {
        id: 19,
        ru: 'беспорядок / шум',
        es: 'jaleo',
        example: '¿Qué jaleo hay aquí?',
      },
      {
        id: 20,
        ru: 'проблема / передряга',
        es: 'lío',
        example: 'Me he metido en un lío.',
      },
      {
        id: 21,
        ru: 'устроить сцену / бардак',
        es: 'montarla',
        example: 'No la montes aquí.',
      },
      {
        id: 22,
        ru: 'ничего страшного',
        es: 'no pasa nada',
        example: 'Perdón. — No pasa nada.',
      },
      {
        id: 23,
        ru: 'да ладно!',
        es: '¡Venga ya!',
        example: '¡Venga ya! Eso no es verdad.',
      },
      {
        id: 24,
        ru: 'давай!',
        es: '¡Venga!',
        example: '¡Venga, vámonos!',
      },
      {
        id: 25,
        ru: 'конечно / да',
        es: 'claro',
        example: 'Claro, sin problema.',
      },
      {
        id: 26,
        ru: 'хорошо / ладно',
        es: 'vale',
        example: 'Vale, nos vemos mañana.',
      },
      {
        id: 27,
        ru: 'типа',
        es: 'en plan',
        example: 'Estaba en plan «no quiero ir».',
      },
      {
        id: 28,
        ru: 'реально / правда',
        es: 'de verdad',
        example: '¿De verdad hiciste eso?',
      },
      {
        id: 29,
        ru: 'серьёзно?',
        es: '¿En serio?',
        example: '¿En serio te vas mañana?',
      },
      {
        id: 30,
        ru: 'ни за что',
        es: 'ni de broma',
        example: 'Ni de broma pago eso.',
      },
      {
        id: 31,
        ru: 'шучу',
        es: 'es broma',
        example: 'Tranquilo, es broma.',
      },
      {
        id: 32,
        ru: 'без понятия',
        es: 'ni idea',
        example: 'No tengo ni idea.',
      },
      {
        id: 33,
        ru: 'мне всё равно',
        es: 'me da igual',
        example: 'Me da igual dónde cenemos.',
      },
      {
        id: 34,
        ru: 'как хочешь',
        es: 'como quieras',
        example: 'Podemos ir hoy o mañana, como quieras.',
      },
      {
        id: 35,
        ru: 'достало',
        es: 'estoy harto / harta',
        example: 'Estoy harto de esperar.',
      },
      {
        id: 36,
        ru: 'фигня / ерунда',
        es: 'tontería',
        example: 'No digas tonterías.',
      },
      {
        id: 37,
        ru: 'дурак',
        es: 'tonto / tonta',
        example: 'No seas tonto.',
      },
      {
        id: 38,
        ru: 'чёрт!',
        es: '¡Joder!',
        example: '¡Joder, qué susto!',
      },
      {
        id: 39,
        ru: 'охрененно / очень круто, грубо',
        es: 'de puta madre',
        example: 'La fiesta estuvo de puta madre.',
      },
      {
        id: 40,
        ru: 'очень плохо / ужасно',
        es: 'fatal',
        example: 'Hoy me encuentro fatal.',
      },
      {
        id: 41,
        ru: 'круто / здорово',
        es: 'genial',
        example: 'Tu idea me parece genial.',
      },
      {
        id: 42,
        ru: 'какая жесть',
        es: 'qué fuerte',
        example: '¡Qué fuerte lo que pasó!',
      },
      {
        id: 43,
        ru: 'какой кошмар',
        es: 'qué horror',
        example: '¡Qué horror de tráfico!',
      },
      {
        id: 44,
        ru: 'какой стыд',
        es: 'qué vergüenza',
        example: '¡Qué vergüenza, me equivoqué de nombre!',
      },
      {
        id: 45,
        ru: 'мне лень',
        es: 'me da pereza',
        example: 'Me da pereza salir hoy.',
      },
      {
        id: 46,
        ru: 'отвали / оставь меня',
        es: 'déjame en paz',
        example: 'Déjame en paz un rato.',
      },
      {
        id: 47,
        ru: 'успокойся',
        es: 'tranqui',
        example: 'Tranqui, llegaremos a tiempo.',
      },
      {
        id: 48,
        ru: 'сейчас / момент',
        es: 'un segundo',
        example: 'Espera un segundo.',
      },
      {
        id: 49,
        ru: 'офигенно провести время',
        es: 'pasarlo genial',
        example: 'Lo pasamos genial ayer.',
      },
      {
        id: 50,
        ru: 'тусоваться',
        es: 'quedar',
        example: 'He quedado con mis colegas.',
      },
    ],
  },
  {
    name: 'Знакомства и отношения',
    icon: '❤️',
    entries: [
      {
        id: 1,
        ru: 'свидание',
        es: 'cita',
        example: 'Tengo una cita esta noche.',
      },
      {
        id: 2,
        ru: 'назначить свидание',
        es: 'quedar',
        example: 'Hemos quedado para tomar un café.',
      },
      {
        id: 3,
        ru: 'познакомиться',
        es: 'conocerse',
        example: 'Nos conocimos en una fiesta.',
      },
      {
        id: 4,
        ru: 'знакомиться с кем-то',
        es: 'conocer a alguien',
        example: 'Quiero conocer gente nueva.',
      },
      {
        id: 5,
        ru: 'флиртовать',
        es: 'coquetear',
        example: 'Estaba coqueteando con él.',
      },
      {
        id: 6,
        ru: 'клеить / знакомиться, разг.',
        es: 'ligar',
        example: 'Le gusta ligar en las discotecas.',
      },
      {
        id: 7,
        ru: 'нравиться',
        es: 'gustar',
        example: 'Me gusta mucho Ana.',
      },
      {
        id: 8,
        ru: 'влюбляться',
        es: 'enamorarse',
        example: 'Se enamoró de su mejor amigo.',
      },
      {
        id: 9,
        ru: 'быть влюблённым',
        es: 'estar enamorado/a',
        example: 'Estoy enamorada de él.',
      },
      {
        id: 10,
        ru: 'любовь',
        es: 'amor',
        example: 'Fue amor a primera vista.',
      },
      {
        id: 11,
        ru: 'любовь с первого взгляда',
        es: 'amor a primera vista',
        example: '¿Crees en el amor a primera vista?',
      },
      {
        id: 12,
        ru: 'симпатия / увлечение',
        es: 'flechazo',
        example: 'Lo nuestro fue un flechazo.',
      },
      {
        id: 13,
        ru: 'парень',
        es: 'novio',
        example: 'Este es mi novio.',
      },
      {
        id: 14,
        ru: 'девушка',
        es: 'novia',
        example: 'Su novia vive en Valencia.',
      },
      {
        id: 15,
        ru: 'партнёр',
        es: 'pareja',
        example: 'Vivo con mi pareja.',
      },
      {
        id: 16,
        ru: 'бывший парень',
        es: 'exnovio / ex',
        example: 'Me encontré con mi exnovio.',
      },
      {
        id: 17,
        ru: 'бывшая девушка',
        es: 'exnovia / ex',
        example: 'Sigue hablando con su ex.',
      },
      {
        id: 18,
        ru: 'одинокий / без пары',
        es: 'soltero/a',
        example: 'Ahora estoy soltero.',
      },
      {
        id: 19,
        ru: 'женатый',
        es: 'casado',
        example: 'Está casado desde 2020.',
      },
      {
        id: 20,
        ru: 'замужняя',
        es: 'casada',
        example: 'Ella está casada.',
      },
      {
        id: 21,
        ru: 'отношения',
        es: 'relación',
        example: 'Tenemos una relación seria.',
      },
      {
        id: 22,
        ru: 'серьёзные отношения',
        es: 'relación seria',
        example: 'Busco una relación seria.',
      },
      {
        id: 23,
        ru: 'свободные отношения',
        es: 'relación abierta',
        example: 'Han decidido tener una relación abierta.',
      },
      {
        id: 24,
        ru: 'моногамный',
        es: 'monógamo/a',
        example: 'Prefiero una relación monógama.',
      },
      {
        id: 25,
        ru: 'встречаться',
        es: 'salir con alguien',
        example: 'Está saliendo con Marcos.',
      },
      {
        id: 26,
        ru: 'быть вместе',
        es: 'estar juntos',
        example: 'Llevamos dos años juntos.',
      },
      {
        id: 27,
        ru: 'целовать',
        es: 'besar',
        example: 'La besó al despedirse.',
      },
      {
        id: 28,
        ru: 'поцелуй',
        es: 'beso',
        example: 'Me dio un beso.',
      },
      {
        id: 29,
        ru: 'обнимать',
        es: 'abrazar',
        example: 'Me abrazó muy fuerte.',
      },
      {
        id: 30,
        ru: 'объятие',
        es: 'abrazo',
        example: 'Dame un abrazo.',
      },
      {
        id: 31,
        ru: 'привлекательный',
        es: 'atractivo/a',
        example: 'Me parece muy atractivo.',
      },
      {
        id: 32,
        ru: 'красивый',
        es: 'guapo/a',
        example: 'Estás muy guapa hoy.',
      },
      {
        id: 33,
        ru: 'милый',
        es: 'mono/a',
        example: 'Ese chico es muy mono.',
      },
      {
        id: 34,
        ru: 'симпатичный',
        es: 'simpático/a',
        example: 'Me pareció muy simpática.',
      },
      {
        id: 35,
        ru: 'химия',
        es: 'química',
        example: 'Hay mucha química entre nosotros.',
      },
      {
        id: 36,
        ru: 'иметь что-то общее',
        es: 'tener cosas en común',
        example: 'Tenemos muchas cosas en común.',
      },
      {
        id: 37,
        ru: 'заинтересоваться',
        es: 'interesarse por alguien',
        example: 'Creo que se ha interesado por ti.',
      },
      {
        id: 38,
        ru: 'признаться в любви',
        es: 'declararse',
        example: 'Finalmente se declaró.',
      },
      {
        id: 39,
        ru: 'пригласить на свидание',
        es: 'invitar a salir',
        example: 'Quiero invitarla a salir.',
      },
      {
        id: 40,
        ru: 'отказать',
        es: 'rechazar',
        example: 'Me rechazó con mucha educación.',
      },
      {
        id: 41,
        ru: 'расстаться',
        es: 'romper',
        example: 'Rompieron el mes pasado.',
      },
      {
        id: 42,
        ru: 'разрыв',
        es: 'ruptura',
        example: 'La ruptura fue difícil.',
      },
      {
        id: 43,
        ru: 'поссориться',
        es: 'discutir / reñir',
        example: 'Ayer discutimos por una tontería.',
      },
      {
        id: 44,
        ru: 'помириться',
        es: 'reconciliarse',
        example: 'Se reconciliaron después de hablar.',
      },
      {
        id: 45,
        ru: 'ревновать',
        es: 'estar celoso/a',
        example: 'Está celoso de su compañero.',
      },
      {
        id: 46,
        ru: 'ревность',
        es: 'celos',
        example: 'Los celos pueden causar problemas.',
      },
      {
        id: 47,
        ru: 'изменять',
        es: 'ser infiel',
        example: 'Descubrió que su pareja le era infiel.',
      },
      {
        id: 48,
        ru: 'доверять',
        es: 'confiar',
        example: 'Confío completamente en ti.',
      },
      {
        id: 49,
        ru: 'скучать по кому-то',
        es: 'echar de menos a alguien',
        example: 'Te echo de menos.',
      },
      {
        id: 50,
        ru: 'съехаться',
        es: 'irse a vivir juntos',
        example: 'Han decidido irse a vivir juntos.',
      },
    ],
  },
  {
    name: 'Еда и ресторан',
    icon: '🍽️',
    entries: [
      {
        id: 1,
        ru: 'еда',
        es: 'comida',
        example: 'La comida está muy rica.',
      },
      {
        id: 2,
        ru: 'завтрак',
        es: 'desayuno',
        example: 'El desayuno está incluido.',
      },
      {
        id: 3,
        ru: 'завтракать',
        es: 'desayunar',
        example: 'Desayuno café y tostadas.',
      },
      {
        id: 4,
        ru: 'обед',
        es: 'comida / almuerzo',
        example: 'Comemos a las dos.',
      },
      {
        id: 5,
        ru: 'ужин',
        es: 'cena',
        example: 'La cena está preparada.',
      },
      {
        id: 6,
        ru: 'ужинать',
        es: 'cenar',
        example: '¿Dónde quieres cenar?',
      },
      {
        id: 7,
        ru: 'ресторан',
        es: 'restaurante',
        example: 'Conozco un buen restaurante.',
      },
      {
        id: 8,
        ru: 'столик',
        es: 'mesa',
        example: 'Una mesa para dos, por favor.',
      },
      {
        id: 9,
        ru: 'забронировать стол',
        es: 'reservar una mesa',
        example: 'Quisiera reservar una mesa.',
      },
      {
        id: 10,
        ru: 'меню',
        es: 'menú',
        example: '¿Me trae el menú, por favor?',
      },
      {
        id: 11,
        ru: 'меню à la carte',
        es: 'carta',
        example: '¿Podemos ver la carta?',
      },
      {
        id: 12,
        ru: 'комплексный обед',
        es: 'menú del día',
        example: 'Voy a pedir el menú del día.',
      },
      {
        id: 13,
        ru: 'блюдо',
        es: 'plato',
        example: 'Este plato lleva marisco.',
      },
      {
        id: 14,
        ru: 'первое блюдо',
        es: 'primer plato',
        example: 'De primer plato quiero sopa.',
      },
      {
        id: 15,
        ru: 'второе блюдо',
        es: 'segundo plato',
        example: 'De segundo, pescado.',
      },
      {
        id: 16,
        ru: 'основное блюдо',
        es: 'plato principal',
        example: 'El plato principal es carne.',
      },
      {
        id: 17,
        ru: 'закуска',
        es: 'entrante',
        example: 'Pedimos unos entrantes para compartir.',
      },
      {
        id: 18,
        ru: 'тапас',
        es: 'tapas',
        example: 'Vamos de tapas por el centro.',
      },
      {
        id: 19,
        ru: 'порция',
        es: 'ración',
        example: 'Una ración de croquetas, por favor.',
      },
      {
        id: 20,
        ru: 'десерт',
        es: 'postre',
        example: '¿Qué hay de postre?',
      },
      {
        id: 21,
        ru: 'напиток',
        es: 'bebida',
        example: 'La bebida está incluida.',
      },
      {
        id: 22,
        ru: 'вода',
        es: 'agua',
        example: 'Una botella de agua, por favor.',
      },
      {
        id: 23,
        ru: 'вода без газа',
        es: 'agua sin gas',
        example: 'Quiero agua sin gas.',
      },
      {
        id: 24,
        ru: 'газированная вода',
        es: 'agua con gas',
        example: '¿Tienen agua con gas?',
      },
      {
        id: 25,
        ru: 'хлеб',
        es: 'pan',
        example: '¿Nos puede traer pan?',
      },
      {
        id: 26,
        ru: 'мясо',
        es: 'carne',
        example: 'No como mucha carne.',
      },
      {
        id: 27,
        ru: 'рыба',
        es: 'pescado',
        example: 'El pescado está fresco.',
      },
      {
        id: 28,
        ru: 'морепродукты',
        es: 'marisco',
        example: 'Soy alérgico al marisco.',
      },
      {
        id: 29,
        ru: 'овощи',
        es: 'verduras',
        example: 'Quiero verduras a la plancha.',
      },
      {
        id: 30,
        ru: 'салат',
        es: 'ensalada',
        example: 'Pedimos una ensalada para compartir.',
      },
      {
        id: 31,
        ru: 'официант',
        es: 'camarero',
        example: 'El camarero fue muy amable.',
      },
      {
        id: 32,
        ru: 'официантка',
        es: 'camarera',
        example: 'La camarera nos trajo la cuenta.',
      },
      {
        id: 33,
        ru: 'заказать еду',
        es: 'pedir',
        example: 'Ya estamos listos para pedir.',
      },
      {
        id: 34,
        ru: 'я буду…',
        es: 'para mí…',
        example: 'Para mí, la paella.',
      },
      {
        id: 35,
        ru: 'счёт',
        es: 'cuenta',
        example: 'La cuenta, por favor.',
      },
      {
        id: 36,
        ru: 'чаевые',
        es: 'propina',
        example: 'Dejamos cinco euros de propina.',
      },
      {
        id: 37,
        ru: 'платить картой',
        es: 'pagar con tarjeta',
        example: '¿Se puede pagar con tarjeta?',
      },
      {
        id: 38,
        ru: 'платить наличными',
        es: 'pagar en efectivo',
        example: 'Voy a pagar en efectivo.',
      },
      {
        id: 39,
        ru: 'разделить счёт',
        es: 'dividir la cuenta',
        example: '¿Podemos dividir la cuenta?',
      },
      {
        id: 40,
        ru: 'вкусный',
        es: 'rico/a',
        example: 'Esta tortilla está muy rica.',
      },
      {
        id: 41,
        ru: 'очень вкусный',
        es: 'delicioso/a',
        example: 'El postre está delicioso.',
      },
      {
        id: 42,
        ru: 'солёный',
        es: 'salado/a',
        example: 'La sopa está demasiado salada.',
      },
      {
        id: 43,
        ru: 'сладкий',
        es: 'dulce',
        example: 'No me gustan los postres muy dulces.',
      },
      {
        id: 44,
        ru: 'острый',
        es: 'picante',
        example: '¿Este plato es picante?',
      },
      {
        id: 45,
        ru: 'сырой',
        es: 'crudo/a',
        example: 'No como pescado crudo.',
      },
      {
        id: 46,
        ru: 'хорошо прожаренный',
        es: 'bien hecho',
        example: 'Quiero la carne bien hecha.',
      },
      {
        id: 47,
        ru: 'средней прожарки',
        es: 'al punto',
        example: 'El filete, al punto.',
      },
      {
        id: 48,
        ru: 'вегетарианский',
        es: 'vegetariano/a',
        example: '¿Tienen opciones vegetarianas?',
      },
      {
        id: 49,
        ru: 'аллергия',
        es: 'alergia',
        example: 'Tengo alergia a los frutos secos.',
      },
      {
        id: 50,
        ru: 'приятного аппетита',
        es: '¡Buen provecho!',
        example: '¡Buen provecho a todos!',
      },
    ],
  },
  {
    name: 'Переписка и интернет',
    icon: '📱',
    entries: [
      {
        id: 1,
        ru: 'сообщение',
        es: 'mensaje',
        example: 'Te he enviado un mensaje.',
      },
      {
        id: 2,
        ru: 'написать сообщение',
        es: 'escribir un mensaje',
        example: 'Te escribo un mensaje luego.',
      },
      {
        id: 3,
        ru: 'отправить',
        es: 'enviar / mandar',
        example: 'Mándame la dirección.',
      },
      {
        id: 4,
        ru: 'получить',
        es: 'recibir',
        example: 'He recibido tu mensaje.',
      },
      {
        id: 5,
        ru: 'ответить',
        es: 'responder / contestar',
        example: '¿Por qué no me respondes?',
      },
      {
        id: 6,
        ru: 'ответ',
        es: 'respuesta',
        example: 'Todavía espero su respuesta.',
      },
      {
        id: 7,
        ru: 'чат',
        es: 'chat',
        example: 'Seguimos hablando por chat.',
      },
      {
        id: 8,
        ru: 'переписываться',
        es: 'chatear',
        example: 'Estuvimos chateando toda la noche.',
      },
      {
        id: 9,
        ru: 'мобильный телефон',
        es: 'móvil',
        example: 'He perdido el móvil.',
      },
      {
        id: 10,
        ru: 'телефон',
        es: 'teléfono',
        example: 'Dame tu número de teléfono.',
      },
      {
        id: 11,
        ru: 'номер телефона',
        es: 'número de teléfono',
        example: '¿Cuál es tu número de teléfono?',
      },
      {
        id: 12,
        ru: 'контакт',
        es: 'contacto',
        example: 'Te guardo como contacto.',
      },
      {
        id: 13,
        ru: 'сохранить номер',
        es: 'guardar el número',
        example: 'Guarda mi número.',
      },
      {
        id: 14,
        ru: 'звонить',
        es: 'llamar',
        example: 'Te llamo después.',
      },
      {
        id: 15,
        ru: 'звонок',
        es: 'llamada',
        example: 'Tengo una llamada perdida.',
      },
      {
        id: 16,
        ru: 'пропущенный звонок',
        es: 'llamada perdida',
        example: 'Vi tu llamada perdida.',
      },
      {
        id: 17,
        ru: 'ответить на звонок',
        es: 'contestar una llamada',
        example: 'No pude contestar la llamada.',
      },
      {
        id: 18,
        ru: 'перезвонить',
        es: 'devolver la llamada',
        example: 'Te devuelvo la llamada luego.',
      },
      {
        id: 19,
        ru: 'видеозвонок',
        es: 'videollamada',
        example: 'Hacemos una videollamada esta noche.',
      },
      {
        id: 20,
        ru: 'голосовое сообщение',
        es: 'mensaje de voz',
        example: 'Te mandé un mensaje de voz.',
      },
      {
        id: 21,
        ru: 'аудио',
        es: 'audio',
        example: 'Escucha el audio que te mandé.',
      },
      {
        id: 22,
        ru: 'эмодзи',
        es: 'emoji',
        example: 'Me respondió con un emoji.',
      },
      {
        id: 23,
        ru: 'смайлик',
        es: 'emoticono',
        example: 'Añadió un emoticono al final.',
      },
      {
        id: 24,
        ru: 'фото',
        es: 'foto',
        example: 'Mándame una foto.',
      },
      {
        id: 25,
        ru: 'видео',
        es: 'vídeo',
        example: 'Te envío el vídeo ahora.',
      },
      {
        id: 26,
        ru: 'ссылка',
        es: 'enlace',
        example: 'Pásame el enlace.',
      },
      {
        id: 27,
        ru: 'переслать',
        es: 'reenviar',
        example: 'Reenvíame ese mensaje.',
      },
      {
        id: 28,
        ru: 'удалить',
        es: 'borrar / eliminar',
        example: 'Borré el mensaje por error.',
      },
      {
        id: 29,
        ru: 'заблокировать',
        es: 'bloquear',
        example: 'Lo bloqueé en WhatsApp.',
      },
      {
        id: 30,
        ru: 'разблокировать',
        es: 'desbloquear',
        example: 'Después decidió desbloquearlo.',
      },
      {
        id: 31,
        ru: 'заглушить уведомления',
        es: 'silenciar',
        example: 'He silenciado el grupo.',
      },
      {
        id: 32,
        ru: 'уведомление',
        es: 'notificación',
        example: 'Me llegó una notificación.',
      },
      {
        id: 33,
        ru: 'группа',
        es: 'grupo',
        example: 'Te añado al grupo.',
      },
      {
        id: 34,
        ru: 'добавить в группу',
        es: 'añadir al grupo',
        example: '¿Puedes añadirme al grupo?',
      },
      {
        id: 35,
        ru: 'выйти из группы',
        es: 'salir del grupo',
        example: 'Se salió del grupo ayer.',
      },
      {
        id: 36,
        ru: 'онлайн',
        es: 'en línea / conectado',
        example: 'Está conectado ahora mismo.',
      },
      {
        id: 37,
        ru: 'офлайн',
        es: 'desconectado',
        example: 'Lleva horas desconectado.',
      },
      {
        id: 38,
        ru: 'прочитано',
        es: 'leído',
        example: 'Lo dejó en leído.',
      },
      {
        id: 39,
        ru: 'оставить без ответа',
        es: 'dejar en visto',
        example: 'Me dejó en visto otra vez.',
      },
      {
        id: 40,
        ru: 'печатает…',
        es: 'está escribiendo…',
        example: 'Sale que está escribiendo.',
      },
      {
        id: 41,
        ru: 'набрать текст',
        es: 'escribir',
        example: 'Espera, estoy escribiendo.',
      },
      {
        id: 42,
        ru: 'опечатка',
        es: 'errata',
        example: 'Perdón, fue una errata.',
      },
      {
        id: 43,
        ru: 'автозамена',
        es: 'autocorrector',
        example: 'Ha sido culpa del autocorrector.',
      },
      {
        id: 44,
        ru: 'интернет',
        es: 'internet',
        example: 'No tengo internet.',
      },
      {
        id: 45,
        ru: 'Wi-Fi',
        es: 'wifi',
        example: '¿Cuál es la contraseña del wifi?',
      },
      {
        id: 46,
        ru: 'пароль',
        es: 'contraseña',
        example: 'He olvidado la contraseña.',
      },
      {
        id: 47,
        ru: 'зарядка',
        es: 'cargador',
        example: '¿Tienes un cargador?',
      },
      {
        id: 48,
        ru: 'батарея',
        es: 'batería',
        example: 'Me queda poca batería.',
      },
      {
        id: 49,
        ru: 'сесть, о батарее',
        es: 'quedarse sin batería',
        example: 'Me quedé sin batería.',
      },
      {
        id: 50,
        ru: 'быть на связи',
        es: 'estar en contacto',
        example: 'Seguimos en contacto.',
      },
    ],
  },
] as const;

const introWords = `
hola=привет;adiós=пока;gracias=спасибо;por favor=пожалуйста;sí=да;no=нет;bien=хорошо;mal=плохо;nombre=имя;apellido=фамилия;persona=человек;hombre=мужчина;mujer=женщина;chico=парень;chica=девушка;amigo=друг;amiga=подруга;señor=господин;señora=госпожа;país=страна;ciudad=город;pueblo=городок / деревня;nacionalidad=национальность;idioma=язык;español=испанский;inglés=английский;francés=французский;alemán=немецкий;italiano=итальянский;ruso=русский;estudiante=студент;profesor=преподаватель;profesora=преподавательница;médico=врач;ingeniero=инженер;abogado=юрист;diseñador=дизайнер;camarero=официант;trabajo=работа;profesión=профессия;ser=быть;llamarse=называться;vivir=жить;trabajar=работать;estudiar=учиться;hablar=говорить;entender=понимать;conocer=знать / быть знакомым;saber=знать;tener=иметь;yo=я;tú=ты;él=он;ella=она;nosotros=мы;vosotros=вы;ellos=они;usted=Вы;ustedes=Вы / вы;mi=мой;tu=твой;su=его / её / Ваш;de=из / от;en=в;con=с;sin=без;y=и;o=или;pero=но;también=тоже;aquí=здесь;allí=там;dónde=где;de dónde=откуда;cómo=как;qué=что;quién=кто;cuál=какой / который;mucho=много;poco=мало;bueno=хороший;malo=плохой;grande=большой;pequeño=маленький;joven=молодой;mayor=старший;nuevo=новый;simpático=приятный;interesante=интересный;feliz=счастливый
`;

const familyWords = `
familia=семья;padre=отец;madre=мать;padres=родители;hermano=брат;hermana=сестра;hijo=сын;hija=дочь;hijos=дети;abuelo=дедушка;abuela=бабушка;abuelos=бабушка и дедушка;tío=дядя;tía=тётя;primo=двоюродный брат;prima=двоюродная сестра;marido=муж;esposa=жена;pareja=партнёр;novio=парень;novia=девушка;bebé=младенец;niño=ребёнок / мальчик;niña=девочка;adulto=взрослый;persona=человек;vecino=сосед;vecina=соседка;amigo=друг;amiga=подруга;compañero=коллега / одногруппник;compañera=коллега / одногруппница;tener=иметь;ser=быть;parecer=казаться;llamarse=называться;vivir=жить;querer=любить / хотеть;amar=любить;ayudar=помогать;alto=высокий;bajo=низкий;delgado=худой;gordo=полный;guapo=красивый;bonito=красивый;joven=молодой;viejo=старый;mayor=старший;pequeño=маленький;grande=большой;rubio=светловолосый;moreno=темноволосый;pelirrojo=рыжий;pelo=волосы;ojo=глаз;ojos=глаза;cara=лицо;nariz=нос;boca=рот;barba=борода;gafas=очки;simpático=дружелюбный;amable=добрый / любезный;serio=серьёзный;divertido=весёлый;tranquilo=спокойный;nervioso=нервный;sociable=общительный;tímido=застенчивый;trabajador=трудолюбивый;perezoso=ленивый;inteligente=умный;paciente=терпеливый;generoso=щедрый;cariñoso=ласковый;mi=мой;mis=мои;tu=твой;tus=твои;su=его / её;sus=их;nuestro=наш;nuestra=наша;nuestros=наши;nuestras=наши;casado=женат;soltero=холост;divorciado=разведён;edad=возраст;años=годы;mayor que=старше чем;menor que=младше чем;parecido=похожий;diferente=другой
`;

const routineWords = `
día=день;mañana=утро / завтра;tarde=день / вечер / поздно;noche=ночь;hora=час;minuto=минута;hoy=сегодня;ayer=вчера;siempre=всегда;normalmente=обычно;generalmente=обычно;a veces=иногда;nunca=никогда;primero=сначала;después=потом;luego=затем;temprano=рано;levantarse=вставать;despertarse=просыпаться;ducharse=принимать душ;lavarse=умываться;vestirse=одеваться;desayunar=завтракать;comer=есть / обедать;cenar=ужинать;trabajar=работать;estudiar=учиться;empezar=начинать;terminar=заканчивать;salir=выходить;llegar=приходить;volver=возвращаться;descansar=отдыхать;dormir=спать;leer=читать;escribir=писать;ver=смотреть;escuchar=слушать;hablar=говорить;caminar=ходить;correr=бегать;cocinar=готовить;limpiar=убирать;comprar=покупать;hacer=делать;ir=идти;venir=приходить;casa=дом;trabajo=работа;escuela=школа;universidad=университет;oficina=офис;desayuno=завтрак;comida=обед / еда;cena=ужин;café=кофе;agua=вода;autobús=автобус;metro=метро;coche=машина;pie=пешком;lunes=понедельник;martes=вторник;miércoles=среда;jueves=четверг;viernes=пятница;sábado=суббота;domingo=воскресенье;semana=неделя;fin de semana=выходные;a las ocho=в восемь;a la una=в час;por la mañana=утром;por la tarde=днём;por la noche=вечером;antes=до / раньше;después de=после;durante=во время;desde=с;hasta=до;cada día=каждый день;todos los días=каждый день;mucho=много;poco=мало;rápido=быстро;despacio=медленно;ocupado=занятый;libre=свободный
`;

const homeWords = `
casa=дом;piso=квартира;apartamento=квартира;habitación=комната;dormitorio=спальня;salón=гостиная;cocina=кухня;baño=ванная;comedor=столовая;balcón=балкон;terraza=терраса;jardín=сад;puerta=дверь;ventana=окно;pared=стена;suelo=пол;techo=потолок / крыша;escalera=лестница;ascensor=лифт;llave=ключ;mesa=стол;silla=стул;sofá=диван;cama=кровать;armario=шкаф;estantería=полка;escritorio=письменный стол;lámpara=лампа;espejo=зеркало;alfombra=ковёр;cortina=штора;televisión=телевизор;nevera=холодильник;frigorífico=холодильник;horno=духовка;microondas=микроволновка;lavadora=стиральная машина;lavavajillas=посудомоечная машина;ducha=душ;bañera=ванна;lavabo=раковина;inodoro=туалет;mueble=мебель;cajón=ящик;sofá cama=диван-кровать;aire acondicionado=кондиционер;calefacción=отопление;luz=свет;agua=вода;electricidad=электричество;alquiler=аренда;alquilar=арендовать;comprar=покупать;vender=продавать;vivir=жить;limpiar=убирать;ordenar=приводить в порядок;cocinar=готовить;abrir=открывать;cerrar=закрывать;entrar=входить;salir=выходить;subir=подниматься;bajar=спускаться;grande=большой;pequeño=маленький;cómodo=удобный;incómodo=неудобный;bonito=красивый;feo=некрасивый;nuevo=новый;viejo=старый;moderno=современный;luminoso=светлый;oscuro=тёмный;limpio=чистый;sucio=грязный;tranquilo=тихий;ruidoso=шумный;caro=дорогой;barato=дешёвый;cerca=близко;lejos=далеко;arriba=наверху;abajo=внизу;dentro=внутри;fuera=снаружи;delante=перед;detrás=позади;al lado de=рядом с;entre=между;encima de=на;debajo de=под;enfrente de=напротив;Hay…=Есть…;No hay…=Нет…;Mi casa tiene…=В моём доме есть…;Vivo en un piso.=Я живу в квартире.;La cocina es grande.=Кухня большая.;¿Dónde está el baño?=Где ванная?
`;

const foodWords = `
comida=еда;bebida=напиток;desayuno=завтрак;almuerzo=обед;comida=обед / еда;cena=ужин;pan=хлеб;arroz=рис;pasta=паста;carne=мясо;pollo=курица;pescado=рыба;huevo=яйцо;queso=сыр;leche=молоко;yogur=йогурт;mantequilla=масло;aceite=масло;sal=соль;azúcar=сахар;fruta=фрукт;manzana=яблоко;plátano=банан;naranja=апельсин;pera=груша;fresa=клубника;uva=виноград;limón=лимон;sandía=арбуз;verdura=овощ;tomate=помидор;patata=картофель;cebolla=лук;zanahoria=морковь;lechuga=салат;pepino=огурец;ajo=чеснок;sopa=суп;ensalada=салат;bocadillo=сэндвич;pizza=пицца;hamburguesa=бургер;postre=десерт;pastel=торт;chocolate=шоколад;helado=мороженое;café=кофе;té=чай;agua=вода;zumo=сок;cerveza=пиво;vino=вино;botella=бутылка;vaso=стакан;taza=чашка;plato=тарелка;cuchara=ложка;tenedor=вилка;cuchillo=нож;servilleta=салфетка;comer=есть;beber=пить;cocinar=готовить;preparar=готовить / подготавливать;cortar=резать;probar=пробовать;pedir=заказывать;pagar=платить;gustar=нравиться;querer=хотеть;tener hambre=быть голодным;tener sed=хотеть пить;rico=вкусный;delicioso=очень вкусный;dulce=сладкий;salado=солёный;picante=острый;caliente=горячий;frío=холодный;fresco=свежий;menú=меню;carta=меню;restaurante=ресторан;cafetería=кафе;bar=бар;camarero=официант;cuenta=счёт;propina=чаевые;mesa=столик;reserva=бронь;¿Qué quieres comer?=Что ты хочешь поесть?;Quiero una ensalada.=Я хочу салат.;Me gusta el café.=Мне нравится кофе.;No me gusta el pescado.=Я не люблю рыбу.;Tengo hambre.=Я голоден.;Tengo sed.=Я хочу пить.;La cuenta, por favor.=Счёт, пожалуйста.;Para mí…=Для меня…;¿Qué recomienda?=Что вы рекомендуете?;Está muy rico.=Очень вкусно.
`;

const cityWords = `
ciudad=город;calle=улица;avenida=проспект;plaza=площадь;barrio=район;centro=центр;edificio=здание;tienda=магазин;supermercado=супермаркет;banco=банк;farmacia=аптека;hospital=больница;escuela=школа;universidad=университет;museo=музей;cine=кинотеатр;teatro=театр;restaurante=ресторан;cafetería=кафе;hotel=отель;parque=парк;estación=станция;parada=остановка;aeropuerto=аэропорт;estación de tren=вокзал;estación de autobuses=автовокзал;metro=метро;autobús=автобус;tren=поезд;taxi=такси;coche=машина;bicicleta=велосипед;moto=мотоцикл;billete=билет;tarjeta=карта;conductor=водитель;pasajero=пассажир;tráfico=движение;semáforo=светофор;cruce=перекрёсток;camino=путь;mapa=карта;dirección=адрес / направление;ir=идти / ехать;venir=приходить;llegar=прибывать;salir=отправляться;caminar=идти пешком;conducir=водить;coger=брать / садиться на транспорт;tomar=брать / садиться;cruzar=переходить;girar=поворачивать;seguir=продолжать идти;subir=садиться / подниматься;bajar=выходить / спускаться;parar=останавливаться;esperar=ждать;comprar=покупать;preguntar=спрашивать;cerca=близко;lejos=далеко;derecha=право;izquierda=лево;recto=прямо;delante=впереди;detrás=позади;aquí=здесь;allí=там;al lado=рядом;enfrente=напротив;rápido=быстро;lento=медленно;ocupado=занятый;libre=свободный;abierto=открытый;cerrado=закрытый;entrada=вход;salida=выход;esquina=угол;norte=север;sur=юг;este=восток;oeste=запад;centro histórico=исторический центр;zona=зона / район;puente=мост;río=река;carretera=дорога;autopista=автомагистраль;¿Dónde está…?=Где находится…?;¿Cómo llego a…?=Как мне добраться до…?;Sigue recto.=Идите прямо.;Gira a la derecha.=Поверните направо.;Gira a la izquierda.=Поверните налево.;Está cerca.=Это близко.;Está lejos.=Это далеко.;Voy en metro.=Я еду на метро.;Voy a pie.=Я иду пешком.;¿Qué autobús necesito?=Какой автобус мне нужен?
`;

const shoppingWords = `
tienda=магазин;centro comercial=торговый центр;mercado=рынок;ropa=одежда;camiseta=футболка;camisa=рубашка;blusa=блузка;jersey=свитер;chaqueta=куртка;abrigo=пальто;vestido=платье;falda=юбка;pantalón=брюки;vaqueros=джинсы;pantalones cortos=шорты;traje=костюм;zapato=туфля / обувь;zapatillas=кроссовки;botas=сапоги;sandalias=сандалии;calcetines=носки;sombrero=шляпа;gorra=кепка;bufanda=шарф;guantes=перчатки;bolso=сумка;mochila=рюкзак;cinturón=ремень;talla=размер;color=цвет;rojo=красный;azul=синий;verde=зелёный;amarillo=жёлтый;negro=чёрный;blanco=белый;gris=серый;marrón=коричневый;rosa=розовый;naranja=оранжевый;morado=фиолетовый;comprar=покупать;vender=продавать;pagar=платить;costar=стоить;probarse=примерять;llevar=носить;buscar=искать;encontrar=находить;necesitar=нуждаться;querer=хотеть;elegir=выбирать;cambiar=менять;devolver=возвращать;precio=цена;dinero=деньги;efectivo=наличные;tarjeta=карта;descuento=скидка;oferta=акция;rebajas=распродажа;caja=касса;recibo=чек;ticket=чек;dependiente=продавец;cliente=покупатель;probador=примерочная;caro=дорогой;barato=дешёвый;grande=большой;pequeño=маленький;largo=длинный;corto=короткий;ancho=широкий;estrecho=узкий;cómodo=удобный;bonito=красивый;feo=некрасивый;moderno=современный;nuevo=новый;usado=подержанный;talla pequeña=маленький размер;talla mediana=средний размер;talla grande=большой размер;¿Cuánto cuesta?=Сколько стоит?;¿Cuánto cuestan?=Сколько стоят?;Es muy caro.=Это очень дорого.;¿Tiene otra talla?=Есть другой размер?;¿Tiene otro color?=Есть другой цвет?;Quiero probarme esto.=Я хочу это примерить.;Me queda bien.=Мне хорошо подходит.;Me queda grande.=Мне велико.;Me queda pequeño.=Мне мало.;Solo estoy mirando.=Я просто смотрю.;Me lo llevo.=Я это беру.;Pago con tarjeta.=Плачу картой.;Pago en efectivo.=Плачу наличными.;¿Dónde está la caja?=Где касса?;¿Puedo cambiarlo?=Можно это обменять?;¿Puedo devolverlo?=Можно это вернуть?
`;

const travelPlusWords = `
viaje=поездка;viajar=путешествовать;vacaciones=отпуск;turista=турист;destino=направление;país=страна;ciudad=город;aeropuerto=аэропорт;avión=самолёт;vuelo=рейс;tren=поезд;autobús=автобус;taxi=такси;coche=машина;barco=корабль;billete=билет;reserva=бронь;pasaporte=паспорт;documento=документ;maleta=чемодан;equipaje=багаж;mochila=рюкзак;tarjeta de embarque=посадочный талон;puerta=выход на посадку;terminal=терминал;asiento=место;ventanilla=место у окна;pasillo=проход;salida=отправление;llegada=прибытие;retraso=задержка;cancelación=отмена;hotel=отель;habitación=номер;recepción=ресепшен;recepcionista=администратор;llave=ключ;desayuno=завтрак;cama=кровать;baño=ванная;reservar=бронировать;cancelar=отменять;confirmar=подтверждать;llegar=прибывать;salir=отправляться;volar=лететь;conducir=водить;visitar=посещать;conocer=знакомиться / узнавать место;quedarse=оставаться;alojarse=останавливаться в отеле;hacer la maleta=собирать чемодан;facturar=сдавать багаж;embarcar=садиться на самолёт;aterrizar=приземляться;despegar=взлетать;mapa=карта;guía=гид / путеводитель;excursión=экскурсия;playa=пляж;montaña=гора;mar=море;museo=музей;monumento=памятник;centro histórico=исторический центр;foto=фотография;cámara=камера;recuerdo=сувенир;extranjero=иностранный / иностранец;local=местный;ida=туда;vuelta=обратно;ida y vuelta=туда и обратно;directo=прямой;escala=пересадка;temprano=рано;tarde=поздно;lejos=далеко;cerca=близко;disponible=доступный;completo=полный / мест нет;libre=свободный;perdido=потерянный;¿Dónde está la puerta…?=Где выход…?;¿A qué hora sale el vuelo?=Во сколько вылет?;¿A qué hora llega?=Во сколько прибывает?;Tengo una reserva.=У меня бронь.;Quiero reservar una habitación.=Я хочу забронировать номер.;Una habitación para dos personas.=Номер на двоих.;¿El desayuno está incluido?=Завтрак включён?;¿Dónde recojo el equipaje?=Где получить багаж?;He perdido mi maleta.=Я потерял чемодан.;Quiero un billete a Madrid.=Я хочу билет до Мадрида.;Solo ida.=Только туда.;Ida y vuelta.=Туда и обратно.;¿Hay wifi?=Есть Wi-Fi?;¿A qué hora es el check-out?=Во сколько выезд?;Necesito un taxi.=Мне нужно такси.;Estoy de vacaciones.=Я в отпуске.;Buen viaje.=Счастливого пути.
`;

const workWords = `
trabajo=работа;empleo=работа / должность;profesión=профессия;empresa=компания;oficina=офис;jefe=начальник;jefa=начальница;compañero=коллега;compañera=коллега;cliente=клиент;reunión=встреча;proyecto=проект;tarea=задача;correo=электронная почта;ordenador=компьютер;documento=документ;informe=отчёт;horario=расписание;sueldo=зарплата;vacaciones=отпуск;estudiante=студент;profesor=преподаватель;profesora=преподавательница;escuela=школа;instituto=школа / институт;universidad=университет;clase=занятие;curso=курс;examen=экзамен;ejercicio=упражнение;deberes=домашнее задание;libro=книга;cuaderno=тетрадь;bolígrafo=ручка;lápiz=карандаш;papel=бумага;pregunta=вопрос;respuesta=ответ;nota=оценка / заметка;idioma=язык;trabajar=работать;estudiar=учиться;aprender=учить / изучать;enseñar=преподавать;leer=читать;escribir=писать;hablar=говорить;escuchar=слушать;explicar=объяснять;preguntar=спрашивать;responder=отвечать;entender=понимать;recordar=помнить;olvidar=забывать;practicar=практиковать;empezar=начинать;terminar=заканчивать;hacer=делать;enviar=отправлять;recibir=получать;llamar=звонить;organizar=организовывать;presentar=представлять;aprobar=сдать экзамен;suspender=не сдать экзамен;fácil=лёгкий;difícil=сложный;importante=важный;interesante=интересный;aburrido=скучный;ocupado=занятый;libre=свободный;correcto=правильный;incorrecto=неправильный;preparado=подготовленный;tarde=поздно;temprano=рано;tiempo completo=полный рабочий день;media jornada=неполный рабочий день;experiencia=опыт;entrevista=собеседование;currículum=резюме;contrato=контракт;puesto=должность;equipo=команда;objetivo=цель;resultado=результат;descanso=перерыв;¿A qué te dedicas?=Чем ты занимаешься?;Trabajo en una empresa.=Я работаю в компании.;Soy estudiante.=Я студент.;Estudio español.=Я учу испанский.;Tengo una reunión.=У меня встреча.;Tengo un examen mañana.=Завтра у меня экзамен.;No entiendo.=Я не понимаю.;¿Puedes repetir?=Можешь повторить?;¿Qué significa…?=Что значит…?;Tengo que estudiar.=Мне нужно учиться.;Trabajo desde casa.=Я работаю из дома.;Estoy buscando trabajo.=Я ищу работу.
`;

const healthWords = `
cuerpo=тело;cabeza=голова;cara=лицо;ojo=глаз;oreja=ухо;nariz=нос;boca=рот;diente=зуб;cuello=шея;hombro=плечо;brazo=рука;mano=кисть / рука;dedo=палец;pecho=грудь;espalda=спина;estómago=желудок;barriga=живот;pierna=нога;rodilla=колено;pie=стопа;corazón=сердце;sangre=кровь;salud=здоровье;médico=врач;doctora=врач;enfermero=медбрат;enfermera=медсестра;hospital=больница;clínica=клиника;farmacia=аптека;medicamento=лекарство;pastilla=таблетка;receta=рецепт;dolor=боль;fiebre=температура;tos=кашель;resfriado=простуда;gripe=грипп;alergia=аллергия;herida=рана;enfermedad=болезнь;síntoma=симптом;cita=запись / приём;seguro=страховка;doler=болеть;sentirse=чувствовать себя;estar=быть / находиться;tener=иметь;respirar=дышать;descansar=отдыхать;dormir=спать;tomar=принимать;beber=пить;comer=есть;llamar=звонить;necesitar=нуждаться;ayudar=помогать;mejorar=улучшаться;empeorar=ухудшаться;curarse=выздоравливать;sano=здоровый;enfermo=больной;cansado=уставший;débil=слабый;fuerte=сильный;mareado=с головокружением;bien=хорошо;mal=плохо;mejor=лучше;peor=хуже;mucho=сильно / много;poco=немного;aquí=здесь;desde ayer=со вчера;hoy=сегодня;mañana=завтра;urgente=срочный;emergencia=экстренная ситуация;ambulancia=скорая помощь;temperatura=температура;presión=давление;análisis=анализ;tratamiento=лечение;dolor de cabeza=головная боль;dolor de garganta=боль в горле;dolor de espalda=боль в спине;dolor de estómago=боль в животе;Tengo fiebre.=У меня температура.;Me duele la cabeza.=У меня болит голова.;Me duele el estómago.=У меня болит живот.;No me siento bien.=Я плохо себя чувствую.;Estoy cansado.=Я устал.;Tengo tos.=У меня кашель.;Tengo alergia.=У меня аллергия.;Necesito un médico.=Мне нужен врач.;¿Dónde está la farmacia?=Где аптека?;¿Tiene cita?=У вас есть запись?;Tome esta medicina.=Примите это лекарство.;Descanse.=Отдыхайте.;Que te mejores.=Поправляйся.
`;

const leisureWords = `
tiempo libre=свободное время;hobby=хобби;deporte=спорт;fútbol=футбол;tenis=теннис;baloncesto=баскетбол;natación=плавание;correr=бегать;caminar=гулять;gimnasio=спортзал;música=музыка;canción=песня;concierto=концерт;guitarra=гитара;piano=пианино;cine=кино;película=фильм;serie=сериал;televisión=телевидение;libro=книга;novela=роман;revista=журнал;periódico=газета;fotografía=фотография;foto=фото;cámara=камера;videojuego=видеоигра;juego=игра;internet=интернет;redes sociales=соцсети;viaje=путешествие;excursión=экскурсия;playa=пляж;montaña=гора;parque=парк;fiesta=вечеринка;bar=бар;restaurante=ресторан;amigo=друг;paseo=прогулка;jugar=играть;escuchar=слушать;ver=смотреть;leer=читать;bailar=танцевать;cantar=петь;tocar=играть на инструменте;dibujar=рисовать;pintar=рисовать красками;cocinar=готовить;viajar=путешествовать;nadar=плавать;correr=бегать;entrenar=тренироваться;salir=выходить;quedar=встречаться;visitar=посещать;descansar=отдыхать;disfrutar=наслаждаться;divertirse=веселиться;gustar=нравиться;encantar=очень нравиться;preferir=предпочитать;querer=хотеть;poder=мочь;interesante=интересный;divertido=весёлый;aburrido=скучный;favorito=любимый;bueno=хороший;malo=плохой;mucho=много;poco=мало;siempre=всегда;normalmente=обычно;a veces=иногда;nunca=никогда;solo=один;juntos=вместе;fin de semana=выходные;sábado=суббота;domingo=воскресенье;por la tarde=днём;por la noche=вечером;¿Qué haces en tu tiempo libre?=Что ты делаешь в свободное время?;Me gusta leer.=Мне нравится читать.;Me encanta viajar.=Я обожаю путешествовать.;Juego al fútbol.=Я играю в футбол.;Escucho música.=Я слушаю музыку.;Veo series.=Я смотрю сериалы.;Voy al gimnasio.=Я хожу в спортзал.;Salgo con amigos.=Я встречаюсь с друзьями.;¿Quieres venir?=Хочешь пойти?;¿Quedamos mañana?=Встретимся завтра?;No puedo hoy.=Я не могу сегодня.;Prefiero quedarme en casa.=Я предпочитаю остаться дома.;¿Cuál es tu película favorita?=Какой твой любимый фильм?;Me gusta mucho.=Мне очень нравится.;No me gusta nada.=Мне совсем не нравится.;Lo paso bien.=Я хорошо провожу время.
`;

const weatherWords = `
tiempo=погода;clima=климат;sol=солнце;lluvia=дождь;nieve=снег;viento=ветер;nube=облако;tormenta=буря / гроза;niebla=туман;calor=жара;frío=холод;temperatura=температура;grado=градус;primavera=весна;verano=лето;otoño=осень;invierno=зима;enero=январь;febrero=февраль;marzo=март;abril=апрель;mayo=май;junio=июнь;julio=июль;agosto=август;septiembre=сентябрь;octubre=октябрь;noviembre=ноябрь;diciembre=декабрь;naturaleza=природа;mar=море;océano=океан;río=река;lago=озеро;montaña=гора;bosque=лес;campo=сельская местность;playa=пляж;isla=остров;árbol=дерево;planta=растение;flor=цветок;hierba=трава;tierra=земля;cielo=небо;estrella=звезда;luna=луна;animal=животное;perro=собака;gato=кошка;pájaro=птица;pez=рыба;caballo=лошадь;vaca=корова;oveja=овца;hacer sol=быть солнечно;llover=идти о дожде;nevar=идти о снеге;hacer frío=быть холодно;hacer calor=быть жарко;hacer viento=быть ветрено;estar nublado=быть облачно;cambiar=меняться;subir=повышаться;bajar=понижаться;caliente=жаркий / горячий;frío=холодный;fresco=прохладный;seco=сухой;húmedo=влажный;soleado=солнечный;nublado=облачный;lluvioso=дождливый;nevado=снежный;bonito=красивый;natural=природный;verde=зелёный;azul=голубой / синий;limpio=чистый;contaminado=загрязнённый;norte=север;sur=юг;este=восток;oeste=запад;hoy=сегодня;mañana=завтра;esta semana=на этой неделе;¿Qué tiempo hace?=Какая погода?;Hace sol.=Солнечно.;Hace frío.=Холодно.;Hace calor.=Жарко.;Hace viento.=Ветрено.;Está nublado.=Облачно.;Llueve.=Идёт дождь.;Nieva.=Идёт снег.;Hace 20 grados.=20 градусов.;¿Qué temperatura hace?=Какая температура?;Me gusta el verano.=Мне нравится лето.;En invierno hace frío.=Зимой холодно.;Mañana va a llover.=Завтра будет дождь.
`;

const parseWords = (text: string) =>
  text
    .trim()
    .split(';')
    .map((pair) => {
      const separator = pair.indexOf('=');
      return {
        es: pair.slice(0, separator).trim(),
        ru: pair.slice(separator + 1).trim(),
      };
    });
const normalizeWord = (word: string) =>
  word.normalize('NFC').trim().toLowerCase();
type NaturalExample = {
  example: string;
  exampleRu: string;
  extraExample: string;
  extraExampleRu: string;
};
const handWrittenExamples: Record<string, NaturalExample> = {
  calle: {
    example: 'Esta calle lleva directamente al centro.',
    exampleRu: 'Эта улица ведёт прямо в центр.',
    extraExample: 'Vivimos en una calle tranquila cerca del parque.',
    extraExampleRu: 'Мы живём на тихой улице рядом с парком.',
  },
  casa: {
    example: 'Nuestra casa tiene un pequeño jardín.',
    exampleRu: 'В нашем доме есть небольшой сад.',
    extraExample: 'Hoy vuelvo a casa un poco más tarde.',
    extraExampleRu: 'Сегодня я возвращаюсь домой немного позже.',
  },
  café: {
    example: 'Por la mañana tomo café con leche.',
    exampleRu: 'Утром я пью кофе с молоком.',
    extraExample: 'Este café está caliente y huele muy bien.',
    extraExampleRu: 'Этот кофе горячий и очень приятно пахнет.',
  },
  gato: {
    example: 'El gato duerme junto a la ventana.',
    exampleRu: 'Кот спит у окна.',
    extraExample: 'Mi gato viene cuando oye su nombre.',
    extraExampleRu: 'Мой кот приходит, когда слышит своё имя.',
  },
  viaje: {
    example: 'Nuestro viaje a Sevilla dura cuatro días.',
    exampleRu: 'Наша поездка в Севилью длится четыре дня.',
    extraExample: 'Preparo la maleta antes del viaje.',
    extraExampleRu: 'Я собираю чемодан перед поездкой.',
  },
  ciudad: {
    example: 'La ciudad está llena de plazas pequeñas.',
    exampleRu: 'В городе много маленьких площадей.',
    extraExample: 'Esta ciudad es fácil de recorrer a pie.',
    extraExampleRu: 'Этот город легко обойти пешком.',
  },
  familia: {
    example: 'Mi familia vive cerca de Valencia.',
    exampleRu: 'Моя семья живёт недалеко от Валенсии.',
    extraExample: 'Los domingos comemos con toda la familia.',
    extraExampleRu: 'По воскресеньям мы обедаем всей семьёй.',
  },
  trabajo: {
    example: 'Empiezo el trabajo a las nueve.',
    exampleRu: 'Я начинаю работу в девять.',
    extraExample: 'Hoy tengo mucho trabajo en la oficina.',
    extraExampleRu: 'Сегодня у меня много работы в офисе.',
  },
  tiempo: {
    example: 'Hoy hace buen tiempo para caminar.',
    exampleRu: 'Сегодня хорошая погода для прогулки.',
    extraExample: 'No tengo mucho tiempo antes de la clase.',
    extraExampleRu: 'У меня немного времени до занятия.',
  },
  español: {
    example: 'Estudio español todos los días.',
    exampleRu: 'Я учу испанский каждый день.',
    extraExample: 'Mi amiga habla español con mucha claridad.',
    extraExampleRu: 'Моя подруга очень ясно говорит по-испански.',
  },
  hola: {
    example: 'Al entrar en la cafetería, Ana dice: «Hola».',
    exampleRu: 'Входя в кафе, Ана говорит: «Привет».',
    extraExample: '— Hola, ¿cómo estás? — Muy bien, gracias.',
    extraExampleRu: '— Привет, как ты? — Очень хорошо, спасибо.',
  },
  adiós: {
    example: 'Antes de salir, Marta dijo adiós a todos.',
    exampleRu: 'Перед уходом Марта попрощалась со всеми.',
    extraExample: '— Adiós, nos vemos mañana.',
    extraExampleRu: '— Пока, увидимся завтра.',
  },
  gracias: {
    example: 'Gracias por ayudarme con la maleta.',
    exampleRu: 'Спасибо, что помог мне с чемоданом.',
    extraExample: '— Aquí tienes tu café. — Gracias.',
    extraExampleRu: '— Вот твой кофе. — Спасибо.',
  },
  'por favor': {
    example: 'La cuenta, por favor.',
    exampleRu: 'Счёт, пожалуйста.',
    extraExample: 'Habla más despacio, por favor.',
    extraExampleRu: 'Говори медленнее, пожалуйста.',
  },
  sí: {
    example: 'Sí, tengo una reserva para esta noche.',
    exampleRu: 'Да, у меня есть бронь на эту ночь.',
    extraExample: '— ¿Quieres venir? — Sí, claro.',
    extraExampleRu: '— Хочешь пойти? — Да, конечно.',
  },
  no: {
    example: 'No trabajo los domingos.',
    exampleRu: 'Я не работаю по воскресеньям.',
    extraExample: '— ¿Tienes hambre? — No, gracias.',
    extraExampleRu: '— Ты голоден? — Нет, спасибо.',
  },
  nombre: {
    example: 'Mi nombre es Daniel.',
    exampleRu: 'Меня зовут Даниэль.',
    extraExample: 'Escribe tu nombre en este formulario.',
    extraExampleRu: 'Напиши своё имя в этой анкете.',
  },
  apellido: {
    example: 'Su apellido es García.',
    exampleRu: 'Его фамилия — Гарсия.',
    extraExample: '¿Cómo se escribe tu apellido?',
    extraExampleRu: 'Как пишется твоя фамилия?',
  },
  mujer: {
    example: 'La mujer espera el autobús en la parada.',
    exampleRu: 'Женщина ждёт автобус на остановке.',
    extraExample: 'Esa mujer es la nueva profesora.',
    extraExampleRu: 'Эта женщина — новая преподавательница.',
  },
  ser: {
    example: 'Quiero ser profesor de español.',
    exampleRu: 'Я хочу быть преподавателем испанского.',
    extraExample: 'Puede ser una buena idea.',
    extraExampleRu: 'Это может быть хорошей идеей.',
  },
  llamarse: {
    example: 'Mi hermana se llama Elena.',
    exampleRu: 'Мою сестру зовут Елена.',
    extraExample: '¿Cómo se llama este pueblo?',
    extraExampleRu: 'Как называется этот городок?',
  },
  vivir: {
    example: 'Quiero vivir cerca del mar.',
    exampleRu: 'Я хочу жить рядом с морем.',
    extraExample: 'Mis padres viven en una casa pequeña.',
    extraExampleRu: 'Мои родители живут в небольшом доме.',
  },
  trabajar: {
    example: 'Trabajo en una oficina del centro.',
    exampleRu: 'Я работаю в офисе в центре.',
    extraExample: 'Ana trabaja de lunes a viernes.',
    extraExampleRu: 'Ана работает с понедельника по пятницу.',
  },
  estudiar: {
    example: 'Estudio español una hora cada día.',
    exampleRu: 'Я занимаюсь испанским по часу каждый день.',
    extraExample: 'Esta tarde estudiamos en la biblioteca.',
    extraExampleRu: 'Сегодня днём мы занимаемся в библиотеке.',
  },
  hablar: {
    example: 'Hablo con mi madre todas las noches.',
    exampleRu: 'Я разговариваю с мамой каждый вечер.',
    extraExample: 'En esta clase hablamos español.',
    extraExampleRu: 'На этом занятии мы говорим по-испански.',
  },
  entender: {
    example: 'Ahora entiendo mejor la pregunta.',
    exampleRu: 'Теперь я лучше понимаю вопрос.',
    extraExample: 'No entiendo esta palabra.',
    extraExampleRu: 'Я не понимаю это слово.',
  },
  conocer: {
    example: 'Quiero conocer mejor la ciudad.',
    exampleRu: 'Я хочу лучше узнать город.',
    extraExample: '¿Conoces a mi hermano?',
    extraExampleRu: 'Ты знаком с моим братом?',
  },
  saber: {
    example: 'No sé dónde está el hotel.',
    exampleRu: 'Я не знаю, где находится отель.',
    extraExample: '¿Sabes hablar español?',
    extraExampleRu: 'Ты умеешь говорить по-испански?',
  },
  tener: {
    example: 'Tengo una familia grande.',
    exampleRu: 'У меня большая семья.',
    extraExample: 'Hoy tengo una reunión importante.',
    extraExampleRu: 'Сегодня у меня важная встреча.',
  },
  nacionalidad: {
    example: '¿Cuál es tu nacionalidad?',
    exampleRu: 'Какая у тебя национальность?',
    extraExample: 'En el formulario preguntan por la nacionalidad.',
    extraExampleRu: 'В анкете спрашивают национальность.',
  },
  diseñador: {
    example: 'Mi hermano trabaja como diseñador gráfico.',
    exampleRu: 'Мой брат работает графическим дизайнером.',
    extraExample: 'El diseñador nos enseñó tres propuestas.',
    extraExampleRu: 'Дизайнер показал нам три варианта.',
  },
  profesión: {
    example: '¿Cuál es tu profesión?',
    exampleRu: 'Какая у тебя профессия?',
    extraExample: 'Soy médico de profesión.',
    extraExampleRu: 'По профессии я врач.',
  },
  compañera: {
    example: 'Mi compañera me ayuda con este proyecto.',
    exampleRu: 'Моя коллега помогает мне с этим проектом.',
    extraExample: 'Almuerzo con una compañera de trabajo.',
    extraExampleRu: 'Я обедаю с коллегой по работе.',
  },
  moreno: {
    example: 'Mi hermano es moreno y tiene los ojos verdes.',
    exampleRu: 'Мой брат темноволосый, и у него зелёные глаза.',
    extraExample: 'El chico moreno vive en el piso de arriba.',
    extraExampleRu: 'Темноволосый парень живёт этажом выше.',
  },
  pelirrojo: {
    example: 'El niño pelirrojo es mi primo.',
    exampleRu: 'Рыжий мальчик — мой двоюродный брат.',
    extraExample: 'Mi abuelo era pelirrojo de joven.',
    extraExampleRu: 'В молодости мой дедушка был рыжим.',
  },
  sociable: {
    example: 'Ana es muy sociable y hace amigos fácilmente.',
    exampleRu: 'Ана очень общительная и легко заводит друзей.',
    extraExample: 'No soy muy sociable cuando estoy cansado.',
    extraExampleRu: 'Я не очень общителен, когда устаю.',
  },
  generoso: {
    example: 'Pedro es generoso y siempre comparte la comida.',
    exampleRu: 'Педро щедрый и всегда делится едой.',
    extraExample: 'Fue muy generoso de tu parte ayudarme.',
    extraExampleRu: 'С твоей стороны было очень щедро помочь мне.',
  },
  cariñoso: {
    example: 'Mi abuelo es muy cariñoso con sus nietos.',
    exampleRu: 'Мой дедушка очень ласков со своими внуками.',
    extraExample: 'Tenemos un gato tranquilo y cariñoso.',
    extraExampleRu: 'У нас спокойный и ласковый кот.',
  },
  divorciado: {
    example: 'Está divorciado y vive con su hijo.',
    exampleRu: 'Он разведён и живёт со своим сыном.',
    extraExample: 'Mis padres están divorciados.',
    extraExampleRu: 'Мои родители разведены.',
  },
  ducharse: {
    example: 'Me ducho antes de desayunar.',
    exampleRu: 'Я принимаю душ перед завтраком.',
    extraExample: 'Después del gimnasio quiero ducharme.',
    extraExampleRu: 'После спортзала я хочу принять душ.',
  },
  'a la una': {
    example: 'La clase termina a la una.',
    exampleRu: 'Занятие заканчивается в час.',
    extraExample: 'Normalmente comemos a la una.',
    extraExampleRu: 'Обычно мы обедаем в час.',
  },
  balcón: {
    example: 'Desayunamos en el balcón cuando hace sol.',
    exampleRu: 'Мы завтракаем на балконе, когда солнечно.',
    extraExample: 'El piso tiene un balcón pequeño.',
    extraExampleRu: 'В квартире есть небольшой балкон.',
  },
  terraza: {
    example: 'Cenamos fuera, en la terraza.',
    exampleRu: 'Мы ужинаем на улице, на террасе.',
    extraExample: 'La terraza da al jardín.',
    extraExampleRu: 'Терраса выходит в сад.',
  },
  lavabo: {
    example: 'El jabón está junto al lavabo.',
    exampleRu: 'Мыло лежит рядом с раковиной.',
    extraExample: 'Tengo que limpiar el lavabo.',
    extraExampleRu: 'Мне нужно почистить раковину.',
  },
  inodoro: {
    example: 'El inodoro está al lado de la ducha.',
    exampleRu: 'Унитаз находится рядом с душем.',
    extraExample: 'El inodoro del baño no funciona.',
    extraExampleRu: 'Унитаз в ванной не работает.',
  },
  'sofá cama': {
    example: 'El sofá cama se convierte en una cama doble.',
    exampleRu: 'Диван-кровать превращается в двуспальную кровать.',
    extraExample: 'Puedes dormir en el sofá cama.',
    extraExampleRu: 'Ты можешь поспать на диване-кровати.',
  },
  luminoso: {
    example: 'El salón es amplio y luminoso.',
    exampleRu: 'Гостиная просторная и светлая.',
    extraExample: 'Buscamos un piso luminoso cerca del centro.',
    extraExampleRu: 'Мы ищем светлую квартиру рядом с центром.',
  },
  'enfrente de': {
    example: 'La farmacia está enfrente del supermercado.',
    exampleRu: 'Аптека находится напротив супермаркета.',
    extraExample: 'Me siento enfrente de la ventana.',
    extraExampleRu: 'Я сижу напротив окна.',
  },
  fresa: {
    example: 'Para desayunar tomo yogur con fresas.',
    exampleRu: 'На завтрак я ем йогурт с клубникой.',
    extraExample: 'Esta fresa está muy dulce.',
    extraExampleRu: 'Эта клубника очень сладкая.',
  },
  uva: {
    example: 'En Nochevieja comemos doce uvas.',
    exampleRu: 'В новогоднюю ночь мы съедаем двенадцать виноградин.',
    extraExample: 'Prefiero las uvas sin semillas.',
    extraExampleRu: 'Я предпочитаю виноград без косточек.',
  },
  patata: {
    example: 'La tortilla lleva huevo y patata.',
    exampleRu: 'В тортилью входят яйца и картофель.',
    extraExample: 'Quiero una ración de patatas fritas.',
    extraExampleRu: 'Я хочу порцию картофеля фри.',
  },
  zanahoria: {
    example: 'Corta la zanahoria en trozos pequeños.',
    exampleRu: 'Нарежь морковь небольшими кусочками.',
    extraExample: 'Esta sopa lleva zanahoria y cebolla.',
    extraExampleRu: 'В этот суп входят морковь и лук.',
  },
  lechuga: {
    example: 'La ensalada lleva tomate y lechuga.',
    exampleRu: 'В салат входят помидор и листья салата.',
    extraExample: 'Lava bien la lechuga antes de comerla.',
    extraExampleRu: 'Хорошо помой салат перед едой.',
  },
  pepino: {
    example: 'Añade un poco de pepino a la ensalada.',
    exampleRu: 'Добавь в салат немного огурца.',
    extraExample: 'Corto el pepino en rodajas finas.',
    extraExampleRu: 'Я нарезаю огурец тонкими кружочками.',
  },
  bocadillo: {
    example: 'He comprado un bocadillo de jamón.',
    exampleRu: 'Я купил бутерброд с хамоном.',
    extraExample: 'Me llevo un bocadillo para el viaje.',
    extraExampleRu: 'Я беру с собой бутерброд в дорогу.',
  },
  servilleta: {
    example: '¿Me trae otra servilleta, por favor?',
    exampleRu: 'Принесите мне ещё одну салфетку, пожалуйста.',
    extraExample: 'La servilleta está junto al plato.',
    extraExampleRu: 'Салфетка лежит рядом с тарелкой.',
  },
  'tener hambre': {
    example: 'Tengo hambre porque no he desayunado.',
    exampleRu: 'Я голоден, потому что не завтракал.',
    extraExample: 'Cuando tengo hambre, como una fruta.',
    extraExampleRu: 'Когда я голоден, я ем фрукт.',
  },
  'tener sed': {
    example: 'Tengo sed después de correr.',
    exampleRu: 'После пробежки я хочу пить.',
    extraExample: 'Si tienes sed, hay agua en la nevera.',
    extraExampleRu: 'Если хочешь пить, в холодильнике есть вода.',
  },
  salado: {
    example: 'El arroz está demasiado salado.',
    exampleRu: 'Рис слишком солёный.',
    extraExample: 'Prefiero un desayuno salado.',
    extraExampleRu: 'Я предпочитаю несладкий завтрак.',
  },
  propina: {
    example: 'Dejamos una propina del diez por ciento.',
    exampleRu: 'Мы оставили чаевые в размере десяти процентов.',
    extraExample: '¿La propina está incluida en la cuenta?',
    extraExampleRu: 'Чаевые включены в счёт?',
  },
  'estación de autobuses': {
    example: 'El taxi nos deja en la estación de autobuses.',
    exampleRu: 'Такси высаживает нас на автовокзале.',
    extraExample: '¿Cómo llego a la estación de autobuses?',
    extraExampleRu: 'Как мне добраться до автовокзала?',
  },
  enfrente: {
    example: 'El banco está justo enfrente.',
    exampleRu: 'Банк находится прямо напротив.',
    extraExample: 'Nos vemos en la cafetería de enfrente.',
    extraExampleRu: 'Встретимся в кафе напротив.',
  },
  'centro histórico': {
    example: 'Vamos a recorrer el centro histórico a pie.',
    exampleRu: 'Мы собираемся обойти исторический центр пешком.',
    extraExample: 'El hotel está cerca del centro histórico.',
    extraExampleRu: 'Отель находится рядом с историческим центром.',
  },
  autopista: {
    example: 'Hay mucho tráfico en la autopista.',
    exampleRu: 'На шоссе сильное движение.',
    extraExample: 'Toma la autopista en dirección a Valencia.',
    extraExampleRu: 'Выезжай на шоссе в направлении Валенсии.',
  },
  pantalón: {
    example: 'Este pantalón me queda un poco largo.',
    exampleRu: 'Эти брюки мне немного длинны.',
    extraExample: 'Busco un pantalón negro para el trabajo.',
    extraExampleRu: 'Я ищу чёрные брюки для работы.',
  },
  'pantalones cortos': {
    example: 'Hoy hace calor, así que llevo pantalones cortos.',
    exampleRu: 'Сегодня жарко, поэтому я в шортах.',
    extraExample: 'Necesito unos pantalones cortos para la playa.',
    extraExampleRu: 'Мне нужны шорты для пляжа.',
  },
  zapatillas: {
    example: 'Me pongo las zapatillas para salir a correr.',
    exampleRu: 'Я надеваю кроссовки, чтобы пойти на пробежку.',
    extraExample: 'Estas zapatillas son cómodas para caminar.',
    extraExampleRu: 'В этих кроссовках удобно ходить.',
  },
  sandalias: {
    example: 'En verano suelo llevar sandalias.',
    exampleRu: 'Летом я обычно ношу сандалии.',
    extraExample: 'Estas sandalias me quedan pequeñas.',
    extraExampleRu: 'Эти сандалии мне малы.',
  },
  probarse: {
    example: '¿Puedo probarme esta chaqueta?',
    exampleRu: 'Можно мне примерить эту куртку?',
    extraExample: 'Voy a probarme una talla más grande.',
    extraExampleRu: 'Я примерю размер побольше.',
  },
  'talla pequeña': {
    example: 'Necesito este vestido en una talla pequeña.',
    exampleRu: 'Мне нужно это платье маленького размера.',
    extraExample: 'La talla pequeña me queda demasiado ajustada.',
    extraExampleRu: 'Маленький размер мне слишком тесен.',
  },
  'talla mediana': {
    example: '¿Tiene esta camisa en talla mediana?',
    exampleRu: 'У вас есть эта рубашка среднего размера?',
    extraExample: 'Normalmente uso una talla mediana.',
    extraExampleRu: 'Обычно я ношу средний размер.',
  },
  'talla grande': {
    example: 'La talla grande me queda más cómoda.',
    exampleRu: 'Большой размер сидит на мне удобнее.',
    extraExample: 'Busco un abrigo de talla grande.',
    extraExampleRu: 'Я ищу пальто большого размера.',
  },
  'tarjeta de embarque': {
    example: 'Llevo la tarjeta de embarque en el móvil.',
    exampleRu: 'Посадочный талон у меня в телефоне.',
    extraExample: 'Muestre su tarjeta de embarque y el pasaporte.',
    extraExampleRu: 'Покажите посадочный талон и паспорт.',
  },
  ventanilla: {
    example: 'Quisiera un asiento de ventanilla.',
    exampleRu: 'Я хотел бы место у окна.',
    extraExample: 'Compro el billete en la ventanilla.',
    extraExampleRu: 'Я покупаю билет в кассе.',
  },
  recepción: {
    example: 'Deje la llave en recepción, por favor.',
    exampleRu: 'Оставьте ключ на стойке регистрации, пожалуйста.',
    extraExample: 'La recepción está abierta las veinticuatro horas.',
    extraExampleRu: 'Стойка регистрации работает круглосуточно.',
  },
  recepcionista: {
    example: 'La recepcionista nos entrega la llave.',
    exampleRu: 'Администратор выдаёт нам ключ.',
    extraExample: 'Pregunte a la recepcionista por el desayuno.',
    extraExampleRu: 'Спросите администратора о завтраке.',
  },
  alojarse: {
    example: 'Vamos a alojarnos cerca de la playa.',
    exampleRu: 'Мы собираемся остановиться рядом с пляжем.',
    extraExample: '¿Dónde se alojan durante el viaje?',
    extraExampleRu: 'Где вы остановитесь во время поездки?',
  },
  'hacer la maleta': {
    example: 'Tengo que hacer la maleta esta noche.',
    exampleRu: 'Мне нужно собрать чемодан сегодня вечером.',
    extraExample: 'Siempre hago la maleta el día anterior.',
    extraExampleRu: 'Я всегда собираю чемодан накануне.',
  },
  facturar: {
    example: 'Quiero facturar esta maleta.',
    exampleRu: 'Я хочу сдать этот чемодан в багаж.',
    extraExample: 'Puede facturar en el mostrador número cinco.',
    extraExampleRu: 'Вы можете зарегистрироваться у стойки номер пять.',
  },
  embarcar: {
    example: 'Empezamos a embarcar en veinte minutos.',
    exampleRu: 'Посадка начнётся через двадцать минут.',
    extraExample: 'Los pasajeros ya pueden embarcar.',
    extraExampleRu: 'Пассажиры уже могут пройти на посадку.',
  },
  ida: {
    example: 'El viaje de ida dura tres horas.',
    exampleRu: 'Поездка туда занимает три часа.',
    extraExample: 'Para la ida prefiero viajar por la mañana.',
    extraExampleRu: 'Туда я предпочитаю ехать утром.',
  },
  'ida y vuelta': {
    example: 'Quiero un billete de ida y vuelta.',
    exampleRu: 'Я хочу билет туда и обратно.',
    extraExample: 'El vuelo de ida y vuelta cuesta cien euros.',
    extraExampleRu: 'Перелёт туда и обратно стоит сто евро.',
  },
  escala: {
    example: 'El vuelo hace escala en Madrid.',
    exampleRu: 'Рейс делает пересадку в Мадриде.',
    extraExample: 'Tenemos una escala de dos horas.',
    extraExampleRu: 'У нас пересадка длительностью два часа.',
  },
  jefa: {
    example: 'Mi jefa quiere hablar conmigo esta tarde.',
    exampleRu: 'Моя начальница хочет поговорить со мной сегодня днём.',
    extraExample: 'La jefa ha aprobado el proyecto.',
    extraExampleRu: 'Начальница одобрила проект.',
  },
  organizar: {
    example: 'Tenemos que organizar una reunión.',
    exampleRu: 'Нам нужно организовать встречу.',
    extraExample: 'Organizo mis tareas al empezar el día.',
    extraExampleRu: 'В начале дня я распределяю свои задачи.',
  },
  suspender: {
    example: 'No quiero suspender el examen.',
    exampleRu: 'Я не хочу провалить экзамен.',
    extraExample: 'Suspendió matemáticas y tiene que repetir el examen.',
    extraExampleRu: 'Он не сдал математику и должен пересдать экзамен.',
  },
  'media jornada': {
    example: 'Trabajo a media jornada por las mañanas.',
    exampleRu: 'Я работаю неполный день по утрам.',
    extraExample: 'Busco un empleo de media jornada.',
    extraExampleRu: 'Я ищу работу на неполный день.',
  },
  currículum: {
    example: 'Envíe su currículum por correo electrónico.',
    exampleRu: 'Отправьте резюме по электронной почте.',
    extraExample: 'Estoy actualizando mi currículum.',
    extraExampleRu: 'Я обновляю своё резюме.',
  },
  barriga: {
    example: 'Me duele la barriga desde esta mañana.',
    exampleRu: 'У меня болит живот с самого утра.',
    extraExample: 'El bebé duerme boca abajo, sobre la barriga.',
    extraExampleRu: 'Младенец спит лицом вниз, на животе.',
  },
  clínica: {
    example: 'Tengo una cita en la clínica a las diez.',
    exampleRu: 'У меня приём в клинике в десять.',
    extraExample: 'La clínica está al lado de la farmacia.',
    extraExampleRu: 'Клиника находится рядом с аптекой.',
  },
  alergia: {
    example: 'Tengo alergia al polen.',
    exampleRu: 'У меня аллергия на пыльцу.',
    extraExample: '¿Tiene alguna alergia a medicamentos?',
    extraExampleRu: 'У вас есть аллергия на какие-либо лекарства?',
  },
  síntoma: {
    example: 'La fiebre puede ser un síntoma de gripe.',
    exampleRu: 'Температура может быть симптомом гриппа.',
    extraExample: 'Cuéntele al médico todos sus síntomas.',
    extraExampleRu: 'Расскажите врачу обо всех своих симптомах.',
  },
  curarse: {
    example: 'Necesitas descansar para curarte bien.',
    exampleRu: 'Тебе нужно отдохнуть, чтобы полностью выздороветь.',
    extraExample: 'La herida tardó una semana en curarse.',
    extraExampleRu: 'Рана зажила за неделю.',
  },
  análisis: {
    example: 'El médico me pidió un análisis de sangre.',
    exampleRu: 'Врач назначил мне анализ крови.',
    extraExample: 'Mañana recojo los resultados del análisis.',
    extraExampleRu: 'Завтра я заберу результаты анализа.',
  },
  'dolor de espalda': {
    example: 'Tengo dolor de espalda por estar sentado todo el día.',
    exampleRu: 'У меня болит спина из-за того, что я весь день сижу.',
    extraExample: 'Este ejercicio ayuda con el dolor de espalda.',
    extraExampleRu: 'Это упражнение помогает при боли в спине.',
  },
  videojuego: {
    example: 'Juego a este videojuego con mis amigos.',
    exampleRu: 'Я играю в эту видеоигру с друзьями.',
    extraExample: 'Este videojuego tiene una historia interesante.',
    extraExampleRu: 'У этой видеоигры интересный сюжет.',
  },
  'redes sociales': {
    example: 'Paso menos tiempo en las redes sociales.',
    exampleRu: 'Я провожу меньше времени в социальных сетях.',
    extraExample: 'Compartimos las fotos en redes sociales.',
    extraExampleRu: 'Мы публикуем фотографии в социальных сетях.',
  },
  preferir: {
    example: 'Prefiero leer antes que ver la televisión.',
    exampleRu: 'Я предпочитаю читать, а не смотреть телевизор.',
    extraExample: '¿Prefieres ir al cine o quedarte en casa?',
    extraExampleRu: 'Ты предпочитаешь пойти в кино или остаться дома?',
  },
  septiembre: {
    example: 'Las clases empiezan en septiembre.',
    exampleRu: 'Занятия начинаются в сентябре.',
    extraExample: 'En septiembre todavía hace buen tiempo.',
    extraExampleRu: 'В сентябре всё ещё хорошая погода.',
  },
  'hacer sol': {
    example: 'Mañana va a hacer sol.',
    exampleRu: 'Завтра будет солнечно.',
    extraExample: 'Cuando hace sol, desayunamos en la terraza.',
    extraExampleRu: 'Когда солнечно, мы завтракаем на террасе.',
  },
  'hacer frío': {
    example: 'Por la noche empieza a hacer frío.',
    exampleRu: 'Ночью начинает холодать.',
    extraExample: 'Si hace frío, ponte el abrigo.',
    extraExampleRu: 'Если холодно, надень пальто.',
  },
  'hacer viento': {
    example: 'Hoy va a hacer mucho viento.',
    exampleRu: 'Сегодня будет очень ветрено.',
    extraExample: 'Cuando hace viento, cerramos las ventanas.',
    extraExampleRu: 'Когда ветрено, мы закрываем окна.',
  },
  'estar nublado': {
    example: 'Puede llover porque está nublado.',
    exampleRu: 'Может пойти дождь, потому что облачно.',
    extraExample: 'El cielo suele estar nublado en invierno.',
    extraExampleRu: 'Зимой небо часто затянуто облаками.',
  },
  contaminado: {
    example: 'El aire está muy contaminado en esta zona.',
    exampleRu: 'Воздух в этом районе сильно загрязнён.',
    extraExample: 'No podemos nadar porque el río está contaminado.',
    extraExampleRu: 'Мы не можем купаться, потому что река загрязнена.',
  },
  camarero: {
    example: 'El camarero nos trae la carta.',
    exampleRu: 'Официант приносит нам меню.',
    extraExample: 'Disculpe, camarero, ¿nos trae la cuenta?',
    extraExampleRu: 'Извините, официант, принесите нам счёт, пожалуйста.',
  },
  bajo: {
    example: 'Mi abuelo es bajo y lleva gafas.',
    exampleRu: 'Мой дедушка невысокий и носит очки.',
    extraExample: 'El niño es más bajo que su hermana.',
    extraExampleRu: 'Мальчик ниже своей сестры.',
  },
  tranquilo: {
    example: 'Mi padre es una persona tranquila.',
    exampleRu: 'Мой отец — спокойный человек.',
    extraExample: 'El bebé está tranquilo después de comer.',
    extraExampleRu: 'После еды младенец спокоен.',
  },
  pasta: {
    example: 'Hoy vamos a cenar pasta con tomate.',
    exampleRu: 'Сегодня мы будем ужинать пастой с томатным соусом.',
    extraExample: 'Cuece la pasta durante ocho minutos.',
    extraExampleRu: 'Вари пасту восемь минут.',
  },
  fresco: {
    example: 'Compro pan fresco cada mañana.',
    exampleRu: 'Я покупаю свежий хлеб каждое утро.',
    extraExample: 'El pescado está fresco y huele bien.',
    extraExampleRu: 'Рыба свежая и хорошо пахнет.',
  },
  mercado: {
    example: 'Los sábados compro fruta en el mercado.',
    exampleRu: 'По субботам я покупаю фрукты на рынке.',
    extraExample: 'El mercado abre a las ocho de la mañana.',
    extraExampleRu: 'Рынок открывается в восемь утра.',
  },
  perdido: {
    example: 'Estoy perdido, ¿puede ayudarme?',
    exampleRu: 'Я заблудился, вы можете мне помочь?',
    extraExample: 'El turista perdido busca la estación.',
    extraExampleRu: 'Заблудившийся турист ищет вокзал.',
  },
  empleo: {
    example: 'Estoy buscando empleo en Madrid.',
    exampleRu: 'Я ищу работу в Мадриде.',
    extraExample: 'Encontró un empleo cerca de casa.',
    extraExampleRu: 'Он нашёл работу рядом с домом.',
  },
  cuerpo: {
    example: 'Es importante mover el cuerpo todos los días.',
    exampleRu: 'Важно двигаться каждый день.',
    extraExample: 'Después del ejercicio me duele todo el cuerpo.',
    extraExampleRu: 'После упражнения у меня болит всё тело.',
  },
  oreja: {
    example: 'Me duele la oreja izquierda.',
    exampleRu: 'У меня болит левое ухо.',
    extraExample: 'El médico me examinó la oreja.',
    extraExampleRu: 'Врач осмотрел моё ухо.',
  },
  mejorar: {
    example: 'Con este tratamiento, tu salud va a mejorar.',
    exampleRu: 'Благодаря этому лечению твоё здоровье улучшится.',
    extraExample: 'El paciente empieza a mejorar.',
    extraExampleRu: 'Состояние пациента начинает улучшаться.',
  },
  hobby: {
    example: 'Mi hobby es tocar la guitarra.',
    exampleRu: 'Моё хобби — играть на гитаре.',
    extraExample: 'Su hobby es jugar al tenis los domingos.',
    extraExampleRu: 'Его хобби — играть в теннис по воскресеньям.',
  },
  naturaleza: {
    example: 'Los fines de semana salimos a disfrutar de la naturaleza.',
    exampleRu: 'По выходным мы выбираемся на природу.',
    extraExample: 'Debemos cuidar la naturaleza y mantener limpio el bosque.',
    extraExampleRu: 'Мы должны беречь природу и сохранять лес чистым.',
  },
};
const feminineNouns = new Set([
  'calle',
  'noche',
  'clase',
  'gente',
  'leche',
  'sal',
  'luz',
  'flor',
  'nariz',
  'imagen',
  'sangre',
  'mano',
  'foto',
  'moto',
  'radio',
  'ciudad',
  'pared',
  'mujer',
]);
const masculineNouns = new Set([
  'problema',
  'día',
  'mapa',
  'idioma',
  'clima',
  'tema',
  'planeta',
  'sofá',
  'café',
  'país',
  'autobús',
  'tren',
  'hotel',
  'mar',
]);
const pluralNouns = new Set([
  'padres',
  'hijos',
  'abuelos',
  'ojos',
  'gafas',
  'años',
  'vacaciones',
  'deberes',
  'redes sociales',
  'pantalones',
  'vaqueros',
  'zapatillas',
  'botas',
  'sandalias',
  'calcetines',
  'guantes',
  'rebajas',
]);
const functionExamples: Record<string, [string, string, string, string]> = {
  yo: [
    'Yo vivo cerca del centro.',
    'Я живу недалеко от центра.',
    'Yo estudio español por la tarde.',
    'Я занимаюсь испанским днём.',
  ],
  tú: [
    'Tú hablas español muy bien.',
    'Ты очень хорошо говоришь по-испански.',
    '¿Tú trabajas los sábados?',
    'Ты работаешь по субботам?',
  ],
  él: [
    'Él es médico y trabaja aquí.',
    'Он врач и работает здесь.',
    'Él tiene una hermana menor.',
    'У него есть младшая сестра.',
  ],
  ella: [
    'Ella vive con su familia.',
    'Она живёт со своей семьёй.',
    'Ella siempre llega temprano.',
    'Она всегда приходит рано.',
  ],
  nosotros: [
    'Nosotros cenamos a las ocho.',
    'Мы ужинаем в восемь.',
    'Nosotros vamos al centro en metro.',
    'Мы едем в центр на метро.',
  ],
  vosotros: [
    '¿Vosotros vivís en Madrid?',
    'Вы живёте в Мадриде?',
    'Vosotros habláis muy rápido.',
    'Вы говорите очень быстро.',
  ],
  ellos: [
    'Ellos trabajan en la misma oficina.',
    'Они работают в одном офисе.',
    'Ellos tienen dos hijos.',
    'У них двое детей.',
  ],
  usted: [
    '¿Usted tiene una reserva?',
    'У Вас есть бронь?',
    '¿Cómo se llama usted?',
    'Как Вас зовут?',
  ],
  ustedes: [
    '¿Ustedes quieren tomar café?',
    'Вы хотите выпить кофе?',
    'Ustedes pueden esperar aquí.',
    'Вы можете подождать здесь.',
  ],
  mi: [
    'Mi casa está cerca del parque.',
    'Мой дом находится рядом с парком.',
    'Esta es mi hermana Ana.',
    'Это моя сестра Ана.',
  ],
  tu: [
    '¿Dónde está tu hotel?',
    'Где находится твой отель?',
    'Tu café está en la mesa.',
    'Твой кофе стоит на столе.',
  ],
  su: [
    'Su hija estudia en la universidad.',
    'Его дочь учится в университете.',
    '¿Cuál es su profesión?',
    'Какая у Вас профессия?',
  ],
  de: [
    'Soy de Rusia, pero vivo en España.',
    'Я из России, но живу в Испании.',
    'La estación está cerca de aquí.',
    'Станция находится недалеко отсюда.',
  ],
  en: [
    'Vivo en una calle tranquila.',
    'Я живу на тихой улице.',
    'Nos vemos en la cafetería.',
    'Увидимся в кафе.',
  ],
  con: [
    'Tomo café con leche.',
    'Я пью кофе с молоком.',
    'Vivo con mi familia.',
    'Я живу со своей семьёй.',
  ],
  sin: [
    'Prefiero el café sin azúcar.',
    'Я предпочитаю кофе без сахара.',
    'Hoy salgo sin abrigo.',
    'Сегодня я выхожу без пальто.',
  ],
  y: [
    'Ana estudia y trabaja.',
    'Ана учится и работает.',
    'Compro pan y leche.',
    'Я покупаю хлеб и молоко.',
  ],
  o: [
    '¿Quieres café o té?',
    'Ты хочешь кофе или чай?',
    'Podemos ir en metro o a pie.',
    'Мы можем поехать на метро или пойти пешком.',
  ],
  dónde: [
    '¿Dónde está la estación?',
    'Где находится станция?',
    'No sé dónde vive Ana.',
    'Я не знаю, где живёт Ана.',
  ],
  'de dónde': [
    '¿De dónde eres?',
    'Откуда ты?',
    'No sé de dónde viene este tren.',
    'Я не знаю, откуда прибывает этот поезд.',
  ],
  cómo: [
    '¿Cómo te llamas?',
    'Как тебя зовут?',
    'Explícame cómo llegar al museo.',
    'Объясни мне, как добраться до музея.',
  ],
  qué: [
    '¿Qué quieres comer?',
    'Что ты хочешь поесть?',
    'No entiendo qué pasó.',
    'Я не понимаю, что произошло.',
  ],
  quién: [
    '¿Quién es esta mujer?',
    'Кто эта женщина?',
    'No sé quién llama.',
    'Я не знаю, кто звонит.',
  ],
  cuál: [
    '¿Cuál es tu profesión?',
    'Какая у тебя профессия?',
    '¿Cuál de estas calles es la correcta?',
    'Какая из этих улиц правильная?',
  ],
  mucho: [
    'Trabajo mucho durante la semana.',
    'Я много работаю в течение недели.',
    'Hoy hay mucho tráfico.',
    'Сегодня на дорогах большое движение.',
  ],
  poco: [
    'Duermo poco cuando tengo exámenes.',
    'Я мало сплю, когда у меня экзамены.',
    'Queda poco café en la taza.',
    'В чашке осталось мало кофе.',
  ],
  mañana: [
    'Mañana viajo a Valencia.',
    'Завтра я еду в Валенсию.',
    'Por la mañana desayuno en casa.',
    'Утром я завтракаю дома.',
  ],
  tarde: [
    'Esta tarde voy al museo.',
    'Сегодня днём я иду в музей.',
    'Hoy llego tarde al trabajo.',
    'Сегодня я поздно прихожу на работу.',
  ],
  después: [
    'Después llamo a mi madre.',
    'Потом я позвоню маме.',
    'Primero estudio y después descanso.',
    'Сначала я занимаюсь, а потом отдыхаю.',
  ],
  luego: [
    'Termino el trabajo y luego vuelvo a casa.',
    'Я заканчиваю работу, а затем возвращаюсь домой.',
    'Luego podemos tomar un café.',
    'Затем мы можем выпить кофе.',
  ],
  temprano: [
    'Los lunes me levanto temprano.',
    'По понедельникам я встаю рано.',
    'Llegamos temprano al aeropuerto.',
    'Мы рано приезжаем в аэропорт.',
  ],
  bien: [
    'Hoy estoy bien y tengo mucha energía.',
    'Сегодня я чувствую себя хорошо, и у меня много сил.',
    'Todo salió bien durante el viaje.',
    'Во время поездки всё прошло хорошо.',
  ],
  mal: [
    'Esta noche he dormido mal.',
    'Сегодня ночью я плохо спал.',
    'Sin el mapa, todo empezó mal.',
    'Без карты всё началось плохо.',
  ],
  aquí: [
    'Puedes sentarte aquí, junto a la ventana.',
    'Ты можешь сесть здесь, у окна.',
    'Aquí empieza el centro histórico.',
    'Здесь начинается исторический центр.',
  ],
  allí: [
    'Mi hotel está allí, detrás del museo.',
    'Мой отель находится там, за музеем.',
    'Allí venden pan fresco cada mañana.',
    'Там каждое утро продают свежий хлеб.',
  ],
  hoy: [
    'Hoy estudio español después del trabajo.',
    'Сегодня я занимаюсь испанским после работы.',
    'Hoy hace sol en Madrid.',
    'Сегодня в Мадриде солнечно.',
  ],
  ayer: [
    'Ayer cenamos en un restaurante pequeño.',
    'Вчера мы ужинали в маленьком ресторане.',
    'Ayer llegué a casa a las ocho.',
    'Вчера я пришёл домой в восемь.',
  ],
  siempre: [
    'Siempre desayuno antes de salir.',
    'Я всегда завтракаю перед выходом.',
    'Mi abuela siempre llama los domingos.',
    'Моя бабушка всегда звонит по воскресеньям.',
  ],
  nunca: [
    'Nunca tomo café por la noche.',
    'Я никогда не пью кофе вечером.',
    'Ella nunca llega tarde a clase.',
    'Она никогда не опаздывает на занятие.',
  ],
  también: [
    'Mi hermano también estudia español.',
    'Мой брат тоже изучает испанский.',
    'Quiero visitar Sevilla y también Valencia.',
    'Я хочу посетить Севилью, а также Валенсию.',
  ],
  pero: [
    'Quiero salir, pero está lloviendo.',
    'Я хочу выйти, но идёт дождь.',
    'El piso es pequeño, pero muy luminoso.',
    'Квартира маленькая, но очень светлая.',
  ],
};
const articleFor = (es: string) => {
  const base = normalizeWord(es).split(' ')[0];
  if (pluralNouns.has(base) || base.endsWith('os'))
    return feminineNouns.has(base) || base.endsWith('as') ? 'unas' : 'unos';
  if (masculineNouns.has(base)) return 'un';
  if (feminineNouns.has(base) || /(a|ción|sión|dad|tad|tud|umbre)$/.test(base))
    return 'una';
  return 'un';
};
const looksLikeVerb = (es: string, ru: string) => {
  const base = normalizeWord(es).split(' ')[0],
    meaning = normalizeWord(ru).split(' / ')[0];
  return (
    /(ar|er|ir|arse|erse|irse)$/.test(base) &&
    (/(ть|ться)$/.test(meaning) || ['быть', 'идти', 'мочь'].includes(meaning))
  );
};
const looksLikeAdjective = (ru: string) =>
  /(ый|ий|ой|ая|яя|ое|ее|ые|ие|ен|женат|холост|разведён)$/.test(
    normalizeWord(ru).split(' / ')[0],
  );
const naturalExamplesFor = (
  word: { es: string; ru: string },
  _topic: string,
): NaturalExample => {
  const key = normalizeWord(word.es),
    manual = editorialExamples[key] || handWrittenExamples[key],
    functional = functionExamples[key],
    corpus = corpusExamples[key];
  if (manual) return manual;
  if (functional)
    return {
      example: functional[0],
      exampleRu: functional[1],
      extraExample: functional[2],
      extraExampleRu: functional[3],
    };
  if (/[¿?¡!.]$/.test(word.es))
    return {
      example: word.es,
      exampleRu: word.ru,
      extraExample: '',
      extraExampleRu: '',
    };
  if (corpus) return corpus;
  if (looksLikeVerb(word.es, word.ru)) {
    const afterQuiero = word.es.endsWith('se')
      ? `${word.es.slice(0, -2)}me`
      : word.es;
    return {
      example: `Quiero ${afterQuiero} antes de salir.`,
      exampleRu: `Я хочу ${word.ru} перед выходом.`,
      extraExample: `Necesito tiempo para ${word.es}.`,
      extraExampleRu: `Мне нужно время, чтобы ${word.ru}.`,
    };
  }
  if (looksLikeAdjective(word.ru))
    return {
      example: `Él es ${word.es}, pero muy amable.`,
      exampleRu: `Он ${word.ru}, но очень добрый.`,
      extraExample: `Mi nuevo compañero es ${word.es}.`,
      extraExampleRu: `Мой новый коллега ${word.ru}.`,
    };
  const article = articleFor(word.es);
  return {
    example: `Necesito información sobre ${article} ${word.es}.`,
    exampleRu: `Мне нужна информация по теме «${word.ru}».`,
    extraExample: `Hoy hablamos de ${article} ${word.es}.`,
    extraExampleRu: `Сегодня мы говорим о теме «${word.ru}».`,
  };
};

// Редакторские замены имеют приоритет над корпусом. Здесь находятся пары,
// которые были формально корректны, но неточны, неестественны или неуместны для A1.
const editorialExamples: Record<string, NaturalExample> = {
  calle: {
    example: 'Esta calle es muy ruidosa durante el día.',
    exampleRu: 'Эта улица очень шумная днём.',
    extraExample: 'Vivimos en una calle tranquila cerca del parque.',
    extraExampleRu: 'Мы живём на тихой улице рядом с парком.',
  },
  no: {
    example: 'No estoy en casa ahora.',
    exampleRu: 'Сейчас меня нет дома.',
    extraExample: '— ¿Quieres café? — No, gracias.',
    extraExampleRu: '— Хочешь кофе? — Нет, спасибо.',
  },
  hombre: {
    example: 'Ese hombre trabaja en la biblioteca.',
    exampleRu: 'Тот мужчина работает в библиотеке.',
    extraExample: 'El hombre de la chaqueta azul es mi profesor.',
    extraExampleRu: 'Мужчина в синей куртке — мой преподаватель.',
  },
  ser: {
    example: 'Soy estudiante y mi hermana es médica.',
    exampleRu: 'Я студент, а моя сестра — врач.',
    extraExample: '¿De dónde eres?',
    extraExampleRu: 'Откуда ты?',
  },
  usted: {
    example: '¿Cómo se llama usted?',
    exampleRu: 'Как Вас зовут?',
    extraExample: '¿Quiere usted ver la carta?',
    extraExampleRu: 'Вы хотите посмотреть меню?',
  },
  poco: {
    example: 'Tengo poco tiempo antes de la clase.',
    exampleRu: 'У меня мало времени до занятия.',
    extraExample: 'Hablo un poco de español.',
    extraExampleRu: 'Я немного говорю по-испански.',
  },
};
const usedWords = new Set<string>();
const createTopic = (name: string, icon: string, text: string) => {
  const entries = parseWords(text)
    .filter((word) => {
      const key = normalizeWord(word.es);
      const owner = releasedVocabularyTopic(word.es);
      if (owner && owner !== name) return false;
      if (usedWords.has(key)) return false;
      usedWords.add(key);
      return true;
    })
    .map((word, index) => ({
      id: index + 1,
      ...word,
      ...naturalExamplesFor(word, name),
    }));
  return { name, icon, entries };
};

const musicTopic = {
  name: 'Музыка',
  icon: '🎵',
  entries: [
    { id: 1, es: 'cantante', ru: 'певец / певица', example: 'Maluma es un cantante colombiano.', exampleRu: 'Малума — колумбийский певец.', extraExample: 'La cantante saludó al público antes de empezar.', extraExampleRu: 'Певица поприветствовала публику перед началом.' },
    { id: 2, es: 'concierto', ru: 'концерт', example: 'J Balvin dio un concierto en Madrid.', exampleRu: 'Джей Бальвин дал концерт в Мадриде.', extraExample: 'El concierto empieza a las nueve.', extraExampleRu: 'Концерт начинается в девять.' },
    { id: 3, es: 'entrada', ru: 'билет на мероприятие', example: 'Compré una entrada para el concierto.', exampleRu: 'Я купил билет на концерт.', extraExample: '¿Todavía quedan entradas para el viernes?', extraExampleRu: 'На пятницу ещё остались билеты?' },
    { id: 4, es: 'escenario', ru: 'сцена', example: 'Los músicos ya están en el escenario.', exampleRu: 'Музыканты уже на сцене.', extraExample: 'El escenario se iluminó al comenzar la canción.', extraExampleRu: 'Сцена осветилась, когда началась песня.' },
    { id: 5, es: 'álbum', ru: 'альбом', example: 'Escuché el álbum completo durante el viaje.', exampleRu: 'Я прослушал весь альбом во время поездки.', extraExample: 'Su nuevo álbum sale el mes que viene.', extraExampleRu: 'Его новый альбом выходит в следующем месяце.' },
    { id: 6, es: 'canción', ru: 'песня', example: 'Esta canción siempre me pone de buen humor.', exampleRu: 'Эта песня всегда поднимает мне настроение.', extraExample: '¿Cómo se llama la canción que está sonando?', extraExampleRu: 'Как называется песня, которая сейчас играет?' },
    { id: 7, es: 'gira', ru: 'гастрольный тур', example: 'El grupo empieza su gira por América Latina.', exampleRu: 'Группа начинает тур по Латинской Америке.', extraExample: 'La gira termina con dos conciertos en Bogotá.', extraExampleRu: 'Тур заканчивается двумя концертами в Боготе.' },
    { id: 8, es: 'ritmo', ru: 'ритм', example: 'Esta canción tiene un ritmo muy pegadizo.', exampleRu: 'У этой песни очень запоминающийся ритм.', extraExample: 'Sigue el ritmo con las palmas.', extraExampleRu: 'Отбивай ритм хлопками.' },
    { id: 9, es: 'letra', ru: 'текст песни', example: 'No entiendo toda la letra, pero reconozco el estribillo.', exampleRu: 'Я понимаю не весь текст, но узнаю припев.', extraExample: 'Busqué la letra para cantar la canción.', extraExampleRu: 'Я нашёл текст, чтобы спеть песню.' },
    { id: 10, es: 'voz', ru: 'голос', example: 'Tiene una voz clara y fácil de reconocer.', exampleRu: 'У него ясный голос, который легко узнать.', extraExample: 'Baja la música para que pueda oír tu voz.', extraExampleRu: 'Убавь музыку, чтобы я мог услышать твой голос.' },
    { id: 11, es: 'artista', ru: 'артист / артистка', example: 'La artista presentó dos canciones nuevas.', exampleRu: 'Артистка представила две новые песни.', extraExample: '¿Qué artista escuchas últimamente?', extraExampleRu: 'Какого артиста ты слушаешь в последнее время?' },
    { id: 12, es: 'público', ru: 'публика', example: 'El público cantó el estribillo entero.', exampleRu: 'Публика спела весь припев.', extraExample: 'El cantante dio las gracias al público.', extraExampleRu: 'Певец поблагодарил публику.' },
    { id: 13, es: 'micrófono', ru: 'микрофон', example: 'Habla más cerca del micrófono, por favor.', exampleRu: 'Говори ближе к микрофону, пожалуйста.', extraExample: 'El técnico probó el micrófono antes del concierto.', extraExampleRu: 'Техник проверил микрофон перед концертом.' },
    { id: 14, es: 'estribillo', ru: 'припев', example: 'El estribillo es fácil de recordar.', exampleRu: 'Припев легко запомнить.', extraExample: 'Todos bailaron cuando volvió el estribillo.', extraExampleRu: 'Все начали танцевать, когда снова зазвучал припев.' },
  ],
};

const coreTopics = [
  musicTopic,
  createTopic('Знакомство и о себе', '👋', introWords),
  createTopic('Семья и люди', '👨‍👩‍👧', familyWords),
  createTopic('Мой день и рутина', '⏰', routineWords),
  createTopic('Дом и жильё', '🏠', homeWords),
  createTopic('Еда и ресторан', '🍽️', foodWords),
  createTopic('Город и транспорт', '🏙️', cityWords),
  createTopic('Покупки и одежда', '🛍️', shoppingWords),
  createTopic('Путешествия', '✈️', travelPlusWords),
  createTopic('Работа и учёба', '💼', workWords),
  createTopic('Здоровье', '🩺', healthWords),
  createTopic('Досуг и хобби', '🎨', leisureWords),
  createTopic('Погода и природа', '🌦️', weatherWords),
];

const deduplicatedLegacyTopics = legacyVocabularyTopics
  .map((topic) => ({
    ...topic,
    entries: topic.entries
      .filter((entry) => {
        const key = normalizeWord(entry.es);
        const owner = releasedVocabularyTopic(entry.es);
        if (owner && owner !== topic.name) return false;
        if (usedWords.has(key)) return false;
        usedWords.add(key);
        return true;
      })
      .map((entry, index) => {
        const existing = entry as VocabularyEntry,
          fallback = naturalExamplesFor(entry, topic.name),
          key = normalizeWord(entry.es),
          translatedExample = legacyExampleTranslations[key];
        return {
          ...entry,
          id: index + 1,
          example: existing.example || fallback.example,
          exampleRu:
            existing.exampleRu || translatedExample || fallback.exampleRu,
          extraExample: existing.extraExample || fallback.extraExample,
          extraExampleRu: existing.extraExampleRu || fallback.extraExampleRu,
        };
      }),
  }))
  .filter((topic) => topic.entries.length);

const distinctionNotes: Record<string, string> = {
  'viaje': 'viaje — любая поездка; excursión — короткая организованная поездка или экскурсия.',
  'excursión': 'excursión — экскурсия или короткая поездка; viaje — более общее «путешествие/поездка».',
  'enviar': 'enviar нейтрально означает «отправлять»; mandar также разговорно значит «посылать» и «приказывать».',
  'mandar': 'mandar часто употребляется в разговорной речи; enviar нейтральнее и однозначно означает «отправлять».',
  'responder': 'responder — нейтральное «ответить»; contestar особенно часто употребляется об ответе на вопрос, звонок или сообщение.',
  'contestar': 'contestar — ответить на вопрос, звонок или сообщение; responder — более общее нейтральное слово.',
  'camarero': 'camarero — официант; camarera — официантка. Род указывается отдельной формой.',
  'camarera': 'camarera — официантка; camarero — официант. Род указывается отдельной формой.',
};

const expandHeadword = (entry: VocabularyEntry): VocabularyEntry[] => {
  const slashVariants = entry.es.replace(/\/a\b/g, '').split(/\s+\/\s+/).map((item) => item.trim());
  if (slashVariants.length === 1) return [{ ...entry, es: slashVariants[0] }];
  return slashVariants.map((es, index) => {
    const examples = naturalExamplesFor({ es, ru: entry.ru }, '');
    const note = distinctionNotes[normalizeWord(es)];
    return {
      ...entry,
      id: entry.id * 10 + index,
      es,
      example: index === 0 ? entry.example || examples.example : examples.example,
      exampleRu: index === 0 ? entry.exampleRu || examples.exampleRu : examples.exampleRu,
      extraExample: note || examples.extraExample,
      extraExampleRu: note ? `Различие: ${note}` : examples.extraExampleRu,
    };
  });
};
const mergedTopics = [
  ...coreTopics,
  ...a2VocabularyTopics,
  ...deduplicatedLegacyTopics,
].reduce<
  Array<{ name: string; icon: string; entries: VocabularyEntry[] }>
>((topics, topic) => {
  const existing = topics.find((item) => item.name === topic.name),
    cleanEntries = topic.entries.flatMap((entry) => expandHeadword(entry as VocabularyEntry));
  if (existing) existing.entries.push(...cleanEntries);
  else topics.push({ ...topic, entries: cleanEntries });
  return topics;
}, []);

const preferredTopicOrder = [
  'Знакомство и о себе',
  'Семья и люди',
  'Мой день и рутина',
  'Время, даты и планы',
  'Биография и события жизни',
  'Дом и жильё',
  'Быт и район',
  'Еда и ресторан',
  'Город и транспорт',
  'Покупки и одежда',
  'Путешествия',
  'Услуги и документы',
  'Работа и учёба',
  'Здоровье',
  'Проблемы и экстренные ситуации',
  'Эмоции и мнение',
  'Праздники и встречи',
  'Досуг и хобби',
  'Культура и медиа',
  'Техника и устройства',
  'Погода и природа',
  'Связующие слова и полезные конструкции',
  'Знакомства и отношения',
  'Переписка и интернет',
  'Музыка',
  'Ночная жизнь',
  'Живой сленг',
];
const orderedTopics = [...mergedTopics].sort(
  (first, second) =>
    preferredTopicOrder.indexOf(first.name) -
    preferredTopicOrder.indexOf(second.name),
);

const finalWords = new Set<string>();
const primaryRussianTranslation = (value: string) =>
  value.split(/\s+\/\s+/)[0].trim();
export const vocabularyTopics = orderedTopics.map((topic) => ({
  ...topic,
  entries: topic.entries
    .filter((entry) => {
      const key = normalizeWord(entry.es);
      const owner = releasedVocabularyTopic(entry.es);
      if (owner && owner !== topic.name) return false;
      if (finalWords.has(key)) return false;
      finalWords.add(key);
      return true;
    })
    .map((entry) => ({
      ...entry,
      id: vocabularyId(topic.name, entry.es),
      ru: primaryRussianTranslation(entry.ru),
    })),
}));
import { vocabularyId, releasedVocabularyTopic } from './lib/vocabulary-identities.ts';
