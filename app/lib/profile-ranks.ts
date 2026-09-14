export type ProfileGender = 'H' | 'M';

export type ProfileRank = {
  level: number;
  xp: number;
  male: string;
  female: string;
};

export const profileRanks: ProfileRank[] = [
  { level: 1, xp: 0, male: 'Novato', female: 'Novata' },
  { level: 2, xp: 100, male: 'Estudiante', female: 'Estudiante' },
  { level: 3, xp: 250, male: 'Aprendiz', female: 'Aprendiz' },
  { level: 4, xp: 450, male: 'Explorador', female: 'Exploradora' },
  { level: 5, xp: 700, male: 'Viajero', female: 'Viajera' },
  { level: 6, xp: 1_000, male: 'Compañero', female: 'Compañera' },
  { level: 7, xp: 1_400, male: 'Hablante', female: 'Hablante' },
  { level: 8, xp: 1_900, male: 'Conversador', female: 'Conversadora' },
  { level: 9, xp: 2_500, male: 'Conocedor', female: 'Conocedora' },
  { level: 10, xp: 3_200, male: 'Señor', female: 'Señora' },
  { level: 11, xp: 4_000, male: 'Guía', female: 'Guía' },
  { level: 12, xp: 5_000, male: 'Lingüista', female: 'Lingüista' },
  { level: 13, xp: 6_200, male: 'Experto', female: 'Experta' },
  { level: 14, xp: 7_600, male: 'Profesor', female: 'Profesora' },
  { level: 15, xp: 9_200, male: 'Maestro', female: 'Maestra' },
  { level: 16, xp: 11_000, male: 'Embajador', female: 'Embajadora' },
  { level: 17, xp: 13_000, male: 'Académico', female: 'Académica' },
  { level: 18, xp: 15_500, male: 'Sabio', female: 'Sabia' },
  { level: 19, xp: 18_500, male: 'Leyenda', female: 'Leyenda' },
  { level: 20, xp: 22_000, male: 'Maestro del Ritmo', female: 'Maestra del Ritmo' },
];

export const profileRankForXp = (xp: number, gender: ProfileGender = 'H') => {
  const safeXp = Math.max(0, Number(xp) || 0),
    rank = [...profileRanks].reverse().find((item) => safeXp >= item.xp) ||
      profileRanks[0],
    next = profileRanks[rank.level] || null,
    title = gender === 'M' ? rank.female : rank.male,
    nextTitle = next ? (gender === 'M' ? next.female : next.male) : null,
    progress = next
      ? Math.min(100, ((safeXp - rank.xp) / (next.xp - rank.xp)) * 100)
      : 100;
  return {
    ...rank,
    title,
    next,
    nextTitle,
    progress,
    remaining: next ? Math.max(0, next.xp - safeXp) : 0,
  };
};
