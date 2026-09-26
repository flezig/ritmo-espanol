-- Expands the teacher summary without rewriting any existing learner progress.
alter table public.user_profiles
  add column if not exists last_seen_at timestamptz;

update public.user_profiles
set last_seen_at = coalesce(last_seen_at, updated_at, created_at)
where last_seen_at is null;

create or replace function public.touch_my_last_seen()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.user_profiles
  set last_seen_at = clock_timestamp(), updated_at = clock_timestamp()
  where user_id = auth.uid();
end;
$$;

revoke all on function public.touch_my_last_seen() from public, anon;
grant execute on function public.touch_my_last_seen() to authenticated;

create or replace function public.get_student_learning_summary(p_student uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  stored jsonb := '{}'::jsonb;
  profile_data jsonb := '{}'::jsonb;
  lesson_data jsonb := '{}'::jsonb;
  word_data jsonb := '{}'::jsonb;
  history_data jsonb := '{}'::jsonb;
  review_data jsonb := '{}'::jsonb;
  insight_data jsonb := '{}'::jsonb;
  error_data jsonb := '{}'::jsonb;
  completed_lessons integer := 0;
  progress_seen_at timestamptz;
  profile_seen_at timestamptz;
  last_seen timestamptz;
  learning_words jsonb := '[]'::jsonb;
  recent_words jsonb := '[]'::jsonb;
  active_today boolean := false;
  now_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  due_now integer := 0;
  next_day integer := 0;
  next_week integer := 0;
  later integer := 0;
  answer_count integer := 0;
  response_total numeric := 0;
begin
  if auth.uid() is null or not public.teacher_has_student(auth.uid(), p_student) then
    raise exception 'Student unavailable';
  end if;

  select coalesce(up.data, '{}'::jsonb), up.updated_at
    into stored, progress_seen_at
    from public.user_progress up where up.user_id = p_student;
  select p.last_seen_at into profile_seen_at
    from public.user_profiles p where p.user_id = p_student;
  last_seen := greatest(progress_seen_at, profile_seen_at);

  begin profile_data := coalesce((stored->>'ritmo-device-profile')::jsonb, '{}'::jsonb); exception when others then profile_data := '{}'::jsonb; end;
  begin lesson_data := coalesce((stored->>'ritmo-lesson-progress')::jsonb, '{}'::jsonb); exception when others then lesson_data := '{}'::jsonb; end;
  begin word_data := coalesce((stored->>'ritmo-word-progress')::jsonb, '{}'::jsonb); exception when others then word_data := '{}'::jsonb; end;
  begin history_data := coalesce((stored->>'ritmo-word-history')::jsonb, '{}'::jsonb); exception when others then history_data := '{}'::jsonb; end;
  begin review_data := coalesce((stored->>'ritmo-srs')::jsonb, '{}'::jsonb); exception when others then review_data := '{}'::jsonb; end;
  begin insight_data := coalesce((stored->>'ritmo-learning-insights')::jsonb, '{}'::jsonb); exception when others then insight_data := '{}'::jsonb; end;
  begin error_data := coalesce((stored->>'ritmo-error-profile')::jsonb, '{}'::jsonb); exception when others then error_data := '{}'::jsonb; end;

  if jsonb_typeof(lesson_data) <> 'object' then lesson_data := '{}'::jsonb; end if;
  if jsonb_typeof(word_data) <> 'object' then word_data := '{}'::jsonb; end if;
  if jsonb_typeof(history_data) <> 'object' then history_data := '{}'::jsonb; end if;
  if jsonb_typeof(review_data) <> 'object' then review_data := '{}'::jsonb; end if;
  if jsonb_typeof(insight_data) <> 'object' then insight_data := '{}'::jsonb; end if;
  if jsonb_typeof(error_data) <> 'object' then error_data := '{}'::jsonb; end if;

  select count(*) into completed_lessons
    from jsonb_each(lesson_data) item
    where coalesce((item.value->>'completed')::boolean, false);
  select coalesce(jsonb_agg(item.key order by item.key), '[]'::jsonb) into learning_words
    from jsonb_each_text(word_data) item where item.value in ('learning','difficult');
  select coalesce(jsonb_agg(row_data.payload order by row_data.changed_at desc), '[]'::jsonb)
    into recent_words
    from (
      select jsonb_build_object(
        'key', item.key,
        'status', item.value,
        'firstStudiedAt', history_data->item.key->>'firstStudiedAt',
        'learnedAt', history_data->item.key->>'learnedAt',
        'lastChangedAt', history_data->item.key->>'lastChangedAt'
      ) payload,
      coalesce(history_data->item.key->>'lastChangedAt', history_data->item.key->>'firstStudiedAt', '') changed_at
      from jsonb_each_text(word_data) item
      where item.value in ('learning','difficult','learned')
      order by changed_at desc
      limit 100
    ) row_data;

  select
    count(*) filter (where next_review <= now_ms),
    count(*) filter (where next_review > now_ms and next_review <= now_ms + 86400000),
    count(*) filter (where next_review > now_ms + 86400000 and next_review <= now_ms + 604800000),
    count(*) filter (where next_review > now_ms + 604800000)
  into due_now, next_day, next_week, later
  from (
    select case when (item.value->>'nextReview') ~ '^[0-9]+$'
      then (item.value->>'nextReview')::bigint else null end next_review
    from jsonb_each(review_data) item
  ) reviews where next_review is not null;

  answer_count := coalesce((insight_data->'overall'->>'answers')::integer, 0);
  response_total := coalesce((insight_data->'overall'->>'totalResponseMs')::numeric, 0);
  active_today := coalesce(profile_data->'activeDays', '[]'::jsonb) ? to_char(current_date, 'YYYY-MM-DD');

  return jsonb_build_object(
    'level', coalesce(profile_data->>'level', 'A1'),
    'xp', coalesce((profile_data->>'xp')::integer, 0),
    'streak', coalesce((profile_data->>'streak')::integer, 0),
    'activeDays', case when jsonb_typeof(profile_data->'activeDays') = 'array' then jsonb_array_length(profile_data->'activeDays') else 0 end,
    'totalReviews', coalesce((profile_data->>'totalReviews')::integer, 0),
    'totalCorrect', coalesce((profile_data->>'totalCorrect')::integer, 0),
    'completedLessons', completed_lessons,
    'activeToday', active_today,
    'lastSeenAt', last_seen,
    'learningWords', learning_words,
    'lessonProgress', lesson_data,
    'lessonRules', coalesce(insight_data->'lessonRules', '{}'::jsonb),
    'reviewQueue', jsonb_build_object('dueNow', due_now, 'next24h', next_day, 'next7d', next_week, 'later', later),
    'averageResponseMs', case when answer_count > 0 then round(response_total / answer_count) else 0 end,
    'measuredAnswers', answer_count,
    'hintUses', coalesce((insight_data->'overall'->>'hints')::integer, 0),
    'skills', coalesce(insight_data->'skills', '{}'::jsonb),
    'weakTopics', coalesce(insight_data->'topics', '{}'::jsonb),
    'legacyErrors', error_data,
    'recentWords', recent_words
  );
exception when invalid_text_representation or numeric_value_out_of_range then
  return jsonb_build_object(
    'level','A1','xp',0,'streak',0,'activeDays',0,'totalReviews',0,'totalCorrect',0,
    'completedLessons',0,'activeToday',false,'lastSeenAt',last_seen,'learningWords','[]'::jsonb,
    'lessonProgress','{}'::jsonb,'lessonRules','{}'::jsonb,
    'reviewQueue',jsonb_build_object('dueNow',0,'next24h',0,'next7d',0,'later',0),
    'averageResponseMs',0,'measuredAnswers',0,'hintUses',0,'skills','{}'::jsonb,
    'weakTopics','{}'::jsonb,'legacyErrors','{}'::jsonb,'recentWords','[]'::jsonb
  );
end;
$$;

revoke all on function public.get_student_learning_summary(uuid) from public, anon;
grant execute on function public.get_student_learning_summary(uuid) to authenticated;
