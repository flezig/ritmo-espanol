'use client';
import { useParams } from 'next/navigation';
import EducationWorkspace from '../../../components/education-workspace';
export default function TeacherStudentPage() { const params = useParams<{ studentId: string }>(); return <EducationWorkspace mode="teacher-student" id={params.studentId} />; }
