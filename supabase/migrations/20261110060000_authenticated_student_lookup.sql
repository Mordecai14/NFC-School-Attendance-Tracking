-- Replace the development bypass with an authenticated, RLS-protected lookup.
begin;

create function public.student_by_bracelet(bracelet_uid text)
returns table (first_name text, last_name text, grade text, group_name text)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.first_name, s.last_name, s.grade, s.group_name
  from public.bracelets b
  join public.students s on s.id = b.student_id and s.school_id = b.school_id
  where b.uid = bracelet_uid and b.active and s.active
    and private.has_school_access(s.school_id)
  limit 1;
$$;

revoke all on function public.student_by_bracelet(text) from public, anon, authenticated;
grant execute on function public.student_by_bracelet(text) to authenticated;

drop function public.development_student_by_bracelet(text);

commit;
