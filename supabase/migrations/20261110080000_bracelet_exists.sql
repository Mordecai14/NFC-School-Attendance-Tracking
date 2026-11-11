-- Expose only global UID existence, never another school's bracelet/student data.
begin;

create function public.bracelet_exists(bracelet_uid text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.school_access where profile_id = (select auth.uid())
  ) then
    raise exception 'School access is required' using errcode = '42501';
  end if;
  if bracelet_uid is null or pg_catalog.btrim(bracelet_uid) = '' then
    raise exception 'Bracelet UID is required' using errcode = '22023';
  end if;
  return exists (select 1 from public.bracelets where uid = bracelet_uid);
end;
$$;

revoke all on function public.bracelet_exists(text) from public, anon, authenticated;
grant execute on function public.bracelet_exists(text) to authenticated;

commit;
