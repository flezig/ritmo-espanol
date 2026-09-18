-- Adds live activity and current vocabulary to the existing teacher-only summary.
create or replace function public.get_student_learning_summary(p_student uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  stored jsonb; profile_data jsonb := '{}'::jsonb; lesson_data jsonb := '{}'::jsonb;
  word_data jsonb := '{}'::jsonb; completed_lessons integer := 0; last_seen timestamptz;
  learning_words jsonb := '[]'::jsonb; active_today boolean := false;
begin
  if auth.uid() is null or not public.teacher_has_student(auth.uid(), p_student) then raise exception 'Student unavailable'; end if;
  select data, updated_at into stored, last_seen from public.user_progress where user_id = p_student;
  begin profile_data := coalesce((stored->>'ritmo-device-profile')::jsonb, '{}'::jsonb); exception when others then profile_data := '{}'::jsonb; end;
  begin lesson_data := coalesce((stored->>'ritmo-lesson-progress')::jsonb, '{}'::jsonb); exception when others then lesson_data := '{}'::jsonb; end;
  begin word_data := coalesce((stored->>'ritmo-word-progress')::jsonb, '{}'::jsonb); exception when others then word_data := '{}'::jsonb; end;
  if jsonb_typeof(word_data) <> 'object' then word_data := '{}'::jsonb; end if;
  select count(*) into completed_lessons from jsonb_each(lesson_data) item where coalesce((item.value->>'completed')::boolean, false);
  select coalesce(jsonb_agg(item.key order by item.key), '[]'::jsonb) into learning_words from jsonb_each_text(word_data) item where item.value in ('learning','difficult');
  active_today := coalesce(profile_data->'activeDays', '[]'::jsonb) ? to_char(current_date, 'YYYY-MM-DD');
  return jsonb_build_object(
    'level', coalesce(profile_data->>'level', 'A1'), 'xp', coalesce((profile_data->>'xp')::integer, 0),
    'streak', coalesce((profile_data->>'streak')::integer, 0), 'activeDays', case when jsonb_typeof(profile_data->'activeDays') = 'array' then jsonb_array_length(profile_data->'activeDays') else 0 end,
    'totalReviews', coalesce((profile_data->>'totalReviews')::integer, 0), 'totalCorrect', coalesce((profile_data->>'totalCorrect')::integer, 0),
    'completedLessons', completed_lessons, 'activeToday', active_today, 'lastSeenAt', last_seen, 'learningWords', learning_words
  );
exception when invalid_text_representation or numeric_value_out_of_range then
  return jsonb_build_object('level','A1','xp',0,'streak',0,'activeDays',0,'totalReviews',0,'totalCorrect',0,'completedLessons',0,'activeToday',false,'lastSeenAt',last_seen,'learningWords','[]'::jsonb);
end;
$$;

revoke all on function public.get_student_learning_summary(uuid) from public, anon;
grant execute on function public.get_student_learning_summary(uuid) to authenticated;
