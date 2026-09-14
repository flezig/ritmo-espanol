'use client';
import { useParams } from 'next/navigation';
import EducationWorkspace from '../../../components/education-workspace';
export default function StudentAssignmentPage() { const params = useParams<{ assignmentId: string }>(); return <EducationWorkspace mode="student-assignment" id={params.assignmentId} />; }
