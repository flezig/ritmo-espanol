import {
  Award,
  BarChart3,
  BookOpen,
  GraduationCap,
  Headphones,
  Home,
  Languages,
  Library,
  Music2,
  Sparkles,
  UserRound,
  Zap,
} from 'lucide-react';
import type { Section } from '../types/learning';

export const nav: { name: Section; label: string; icon: typeof Home }[] = [
  { name: 'Home', label: 'Главная', icon: Home },
  { name: 'Learn', label: 'Быстрый старт', icon: BookOpen },
  { name: 'Lessons', label: 'Уроки', icon: GraduationCap },
  { name: 'Kespa', label: 'kespa', icon: Sparkles },
  { name: 'Vocabulary', label: 'Словарь', icon: Library },
  { name: 'Grammar', label: 'Грамматика', icon: Languages },
  { name: 'DeleB2', label: 'DELE B2', icon: GraduationCap },
  { name: 'Music', label: 'Музыка', icon: Music2 },
  { name: 'Practice', label: 'Практика', icon: Zap },
  { name: 'Dictation', label: 'Диктант', icon: Headphones },
  { name: 'Progress', label: 'Прогресс', icon: BarChart3 },
  { name: 'Achievements', label: 'Достижения', icon: Award },
  { name: 'Profile', label: 'Профиль', icon: UserRound },
];
