-- Teacher access must be granted only by the project administrator.
-- Run after 0004_teacher_student.sql.

revoke execute on function public.enable_my_role(text) from authenticated;
drop function if exists public.enable_my_role(text);

-- Remove roles that could have been self-issued before this restriction existed.
-- The administrator grants the intended teachers again after this migration.
delete from public.user_roles where role = 'teacher';
update public.user_profiles set preferred_role = 'student' where preferred_role = 'teacher';
