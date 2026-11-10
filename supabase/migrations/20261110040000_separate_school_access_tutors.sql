-- Incremental migration for the existing hosted schema, not an empty database.
-- Explicit transaction: the hosted CLI runner executes statements individually.
-- Never use DROP ... CASCADE here.
begin;
set local lock_timeout = '5s';
lock table public.profiles, public.students in access exclusive mode;

create table public.school_access (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  primary key (profile_id, school_id)
);
create index school_access_school_id_idx on public.school_access(school_id);
create table public.student_tutors (
  student_id uuid not null references public.students(id) on delete cascade,
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  primary key (student_id, tutor_id)
);
create index student_tutors_tutor_id_idx on public.student_tutors(tutor_id);

insert into public.school_access (profile_id, school_id)
select id, school_id from public.profiles where role = 'school';
insert into public.student_tutors (student_id, tutor_id)
select id, tutor_id from public.students where tutor_id is not null;

-- Assert exact backfill before removing the old sources of truth.
do $$ begin
  if exists (
    (select id, school_id from public.profiles where role = 'school'
     except select profile_id, school_id from public.school_access)
    union all
    (select profile_id, school_id from public.school_access
     except select id, school_id from public.profiles where role = 'school')
  ) or exists (
    (select id, tutor_id from public.students where tutor_id is not null
     except select student_id, tutor_id from public.student_tutors)
    union all
    (select student_id, tutor_id from public.student_tutors
     except select id, tutor_id from public.students where tutor_id is not null)
  ) then
    raise exception 'School access or tutor backfill is incomplete';
  end if;
end $$;

alter table public.school_access enable row level security;
alter table public.student_tutors enable row level security;
-- Override hosted default grants: only privileged administration changes links.
revoke all on public.school_access, public.student_tutors from public, anon, authenticated;
grant select on public.school_access, public.student_tutors to authenticated;
grant all on public.school_access, public.student_tutors to service_role;

create function private.has_school_access(target_school uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.school_access
    where profile_id = (select auth.uid()) and school_id = target_school);
$$;
create function private.is_student_tutor(target_student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.student_tutors
    where tutor_id = (select auth.uid()) and student_id = target_student);
$$;
create function private.can_view_profile(target_profile uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select target_profile = (select auth.uid())
    or exists (select 1 from public.school_access mine
      join public.school_access colleague on colleague.school_id = mine.school_id
      where mine.profile_id = (select auth.uid()) and colleague.profile_id = target_profile)
    or exists (select 1 from public.student_tutors st
      join public.students s on s.id = st.student_id
      join public.school_access mine on mine.school_id = s.school_id
      where mine.profile_id = (select auth.uid()) and st.tutor_id = target_profile);
$$;
revoke all on function private.has_school_access(uuid), private.is_student_tutor(uuid),
  private.can_view_profile(uuid) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.has_school_access(uuid), private.is_student_tutor(uuid),
  private.can_view_profile(uuid) to authenticated;

create policy "Users can view their school access" on public.school_access
for select to authenticated using (profile_id = (select auth.uid()));
create policy "Users can view authorized tutor links" on public.student_tutors
for select to authenticated using (
  tutor_id = (select auth.uid()) or exists (
    select 1 from public.students s
    where s.id = student_id and private.has_school_access(s.school_id)
  )
);

alter policy "Users can view profiles in their school" on public.profiles
using (private.can_view_profile(id));
alter policy "Users can view their school" on public.schools
using (private.has_school_access(id));

-- Preserve each command's existing grants and scope; membership replaces role.
do $$ declare resource text;
begin
  foreach resource in array array['students', 'bracelets', 'devices'] loop
    execute format('alter policy %I on public.%I using (private.has_school_access(school_id))',
      'School users can view ' || resource, resource);
    execute format('alter policy %I on public.%I with check (private.has_school_access(school_id))',
      'School users can create ' || resource, resource);
    execute format('alter policy %I on public.%I using (private.has_school_access(school_id)) with check (private.has_school_access(school_id))',
      'School users can update ' || resource, resource);
    execute format('alter policy %I on public.%I using (private.has_school_access(school_id))',
      'School users can delete ' || resource, resource);
  end loop;
end $$;
alter policy "Tutors can view their students" on public.students
using (private.is_student_tutor(id));
alter policy "School users can create attendance" on public.attendance
with check (private.has_school_access(school_id));
alter policy "School users can view attendance" on public.attendance
using (private.has_school_access(school_id));
alter policy "Tutors can view their students attendance" on public.attendance
using (exists (select 1 from public.students s
  where s.id = attendance.student_id and s.school_id = attendance.school_id
    and private.is_student_tutor(s.id)));

drop function private.current_user_school_id();
drop function private.current_user_role();
alter table public.students drop column tutor_id;
alter table public.profiles drop column school_id, drop column role;
-- Retain the unused enum for compatibility; it is no longer an authorization source.
-- Own-profile UPDATE policy and UPDATE(full_name) grant remain unchanged.
commit;
