import type { Metadata } from 'next';
import { Manrope, Syne } from 'next/font/google';
import './globals.css';
const manrope=Manrope({variable:'--font-manrope',subsets:['latin','cyrillic']});
const syne=Syne({variable:'--font-syne',subsets:['latin']});
export const metadata:Metadata={title:'Ritmo Español — испанский в живом ритме',description:'Локальный тренажёр испанского языка: уроки, интервальное повторение, музыка и практика.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ru"><body className={`${manrope.variable} ${syne.variable}`}>{children}</body></html>}
