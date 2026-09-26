-- Keep recording answers when a submitted lesson gains new exercises.
-- The explicit assignment id prevents ordinary lesson repetition from being
-- attached to an unrelated old assignment. Teacher-completed work stays sealed.

drop function if exists public.record_learning_activity(uuid,text,text,text,text,text,text,boolean,integer,jsonb,uuid,text,text);

create function public.record_learning_activity(
  p_event_id uuid, p_activity_type text, p_content_id text, p_topic_id text,
  p_prompt text, p_student_answer text, p_correct_answer text, p_is_correct boolean,
  p_score_delta integer default 0, p_metadata jsonb default '{}'::jsonb,
  p_session_id uuid default null, p_event_kind text default 'answer', p_item_key text default '',
  p_assignment_id uuid default null
) returns integer language plpgsql security definer set search_path = '' as $$
declare item public.assignments; inserted_count integer := 0; answer_total integer; declared_total integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_activity_type not in ('lesson','practice','dictation','music') or p_event_id is null or p_session_id is null
    or p_event_kind not in ('answer','session_complete') or length(trim(p_prompt))=0 or length(p_prompt)>5000
    or length(coalesce(p_student_answer,''))>5000 or length(coalesce(p_correct_answer,''))>5000
    or p_score_delta not between 0 and 1000 or jsonb_typeof(coalesce(p_metadata,'{}'::jsonb))<>'object' then raise exception 'Invalid activity'; end if;
  for item in select a.* from public.assignments a where a.student_id=auth.uid()
    and (
      a.status in ('assigned','revision_requested','overdue')
      or (p_assignment_id is not null and a.id=p_assignment_id and a.status='submitted' and a.assignment_type='lesson')
    )
    and (p_assignment_id is null or a.id=p_assignment_id)
    and a.assignment_type=p_activity_type
    and (a.content_id is null or a.content_id='all' or a.content_id=p_content_id)
    and (a.topic_id is null or a.topic_id='all' or lower(a.topic_id)=lower(coalesce(p_topic_id,'')))
    for update
  loop
    if p_event_kind='session_complete' then
      select count(*) into answer_total from public.assignment_activity_events e
      where e.assignment_id=item.id and e.student_id=auth.uid() and e.session_id=p_session_id
        and e.attempt_no=item.current_attempt and e.event_kind='answer';
      begin declared_total := (p_metadata->>'total')::integer; exception when others then declared_total := null; end;
      if answer_total<1 or declared_total is null or (item.assignment_type<>'lesson' and declared_total<>answer_total) or declared_total<answer_total then continue; end if;
    end if;
    insert into public.assignment_activity_events(event_id,source_event_id,assignment_id,student_id,activity_type,content_id,
      prompt,student_answer,correct_answer,is_correct,score_delta,metadata,session_id,attempt_no,event_kind,item_key)
    values(gen_random_uuid(),p_event_id,item.id,auth.uid(),p_activity_type,coalesce(p_content_id,''),trim(p_prompt),
      coalesce(p_student_answer,''),coalesce(p_correct_answer,''),p_is_correct,p_score_delta,coalesce(p_metadata,'{}'::jsonb),
      p_session_id,item.current_attempt,p_event_kind,left(coalesce(p_item_key,''),500))
    on conflict(assignment_id,source_event_id) do nothing;
    if found then inserted_count:=inserted_count+1; end if;
    if p_event_kind='session_complete' and item.status in ('assigned','revision_requested','overdue') and
      (select count(*) from public.assignment_activity_events e where e.assignment_id=item.id and e.attempt_no=item.current_attempt and e.event_kind='session_complete')>=item.target_count then
      update public.assignments set status='submitted',updated_at=clock_timestamp() where id=item.id and status in ('assigned','revision_requested','overdue');
      if found then
        insert into public.assignment_submissions(assignment_id,student_id,attempt,text_answer,answers)
        values(item.id,item.student_id,item.current_attempt,'Учебная цель выполнена на сайте.',jsonb_build_object('automatic',true,'attempt',item.current_attempt,'target',item.target_count))
        on conflict(assignment_id,attempt) do nothing;
        insert into public.notifications(user_id,kind,title,body,entity_type,entity_id) values(item.teacher_id,'submission','Учебная цель выполнена',item.title,'assignment',item.id);
      end if;
    end if;
  end loop;
  return inserted_count;
end;
$$;

revoke all on function public.record_learning_activity(uuid,text,text,text,text,text,text,boolean,integer,jsonb,uuid,text,text,uuid) from public,anon;
grant execute on function public.record_learning_activity(uuid,text,text,text,text,text,text,boolean,integer,jsonb,uuid,text,text,uuid) to authenticated;

-- Older builds updated the general lesson progress after an assignment had
-- already been submitted, but did not keep the individual answer events.
-- Expose only the still-unresolved exercise ids to the assignment parties so
-- the teacher can see which current errors survived in durable progress.
create or replace function public.get_assignment_unresolved_lesson_errors(p_assignment uuid)
returns table(item_key text) language plpgsql stable security definer set search_path = '' as $$
declare item public.assignments; lessons jsonb; lesson_state jsonb; saved_errors jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select a.* into item from public.assignments a where a.id=p_assignment;
  if not found or auth.uid() not in (item.teacher_id,item.student_id) then raise exception 'Assignment unavailable'; end if;
  if item.assignment_type<>'lesson' or item.content_id is null then return; end if;
  lessons:=public.progress_fragment(item.student_id,'ritmo-lesson-progress');
  lesson_state:=coalesce(lessons->item.content_id,'{}'::jsonb);
  saved_errors:=coalesce(lesson_state->'errorIds','[]'::jsonb);
  if jsonb_typeof(saved_errors)<>'array' then return; end if;
  return query select distinct value from jsonb_array_elements_text(saved_errors) as saved(value)
    where length(value) between 1 and 2000;
end;
$$;

revoke all on function public.get_assignment_unresolved_lesson_errors(uuid) from public,anon;
grant execute on function public.get_assignment_unresolved_lesson_errors(uuid) to authenticated;
