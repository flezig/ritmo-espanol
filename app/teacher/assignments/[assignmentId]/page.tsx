'use client';
import { useParams } from 'next/navigation';
import EducationWorkspace from '../../../components/education-workspace';
export default function TeacherAssignmentPage() { const params = useParams<{ assignmentId: string }>(); return <EducationWorkspace mode="teacher-assignment" id={params.assignmentId} />; }
