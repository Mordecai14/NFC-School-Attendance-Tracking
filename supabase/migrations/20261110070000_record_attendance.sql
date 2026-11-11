begin;
set local lock_timeout = '5s';

-- Historical events must not disappear or lose their source references.
alter table public.attendance
  drop constraint attendance_school_id_fkey,
  drop constraint attendance_bracelet_id_fkey,
  drop constraint attendance_device_id_fkey;
alter table public.attendance
  add constraint attendance_school_id_fkey foreign key (school_id) references public.schools(id) on delete restrict,
  add constraint attendance_bracelet_id_fkey foreign key (bracelet_id) references public.bracelets(id) on delete restrict,
  add constraint attendance_device_id_fkey foreign key (device_id) references public.devices(id) on delete restrict;
alter table public.bracelets add constraint bracelets_id_school_id_key unique (id, school_id);
alter table public.devices add constraint devices_id_school_id_key unique (id, school_id);
alter table public.attendance
  add constraint attendance_student_school_fkey foreign key (student_id, school_id) references public.students(id, school_id) on delete restrict,
  add constraint attendance_bracelet_school_fkey foreign key (bracelet_id, school_id) references public.bracelets(id, school_id) on delete restrict,
  add constraint attendance_device_school_fkey foreign key (device_id, school_id) references public.devices(id, school_id) on delete restrict;

create function private.validate_attendance_insert()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user = 'authenticated' and not private.has_school_access(new.school_id) then
    raise exception 'School access required' using errcode = '42501';
  end if;
  if new.bracelet_id is null or new.device_id is null then
    raise exception 'Bracelet and device are required' using errcode = '23514';
  end if;
  perform 1 from public.students s
    join public.bracelets b on b.student_id = s.id and b.school_id = s.school_id
    join public.devices d on d.school_id = s.school_id
    where s.id = new.student_id and s.school_id = new.school_id and s.active
      and b.id = new.bracelet_id and b.active and d.id = new.device_id and d.active
    for share of s, b, d;
  if not found then
    raise exception 'Invalid or inactive attendance relationships' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger attendance_validate_insert before insert on public.attendance
for each row execute function private.validate_attendance_insert();

create function private.preserve_attendance_history()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'Attendance events are immutable' using errcode = '42501';
end $$;
create trigger attendance_preserve_history before update or delete on public.attendance
for each row execute function private.preserve_attendance_history();
revoke all on function private.validate_attendance_insert(), private.preserve_attendance_history() from public, anon;
grant execute on function private.validate_attendance_insert(), private.preserve_attendance_history() to authenticated;

create function public.record_attendance(
  event_id uuid, event_school_id uuid, event_student_id uuid,
  event_bracelet_id uuid, event_device_id uuid,
  event_type public.attendance_type, event_occurred_at timestamptz
)
returns table (id uuid, type public.attendance_type, occurred_at timestamptz)
language plpgsql security invoker set search_path = '' as $$
declare saved public.attendance%rowtype;
begin
  if not private.has_school_access(event_school_id) then
    raise exception 'School access required' using errcode = '42501';
  end if;
  select a.* into saved from public.attendance a where a.id = event_id;
  if not found then
    insert into public.attendance (id, school_id, student_id, bracelet_id, device_id, type, occurred_at)
    values (event_id, event_school_id, event_student_id, event_bracelet_id, event_device_id, event_type, event_occurred_at)
    on conflict on constraint attendance_pkey do nothing;
    select a.* into saved from public.attendance a where a.id = event_id;
    if not found then
      raise exception 'Event is not accessible' using errcode = '42501';
    end if;
  end if;
  if (saved.school_id, saved.student_id, saved.bracelet_id, saved.device_id, saved.type, saved.occurred_at)
     is distinct from
     (event_school_id, event_student_id, event_bracelet_id, event_device_id, event_type, event_occurred_at) then
    raise exception 'Event ID already used with another payload' using errcode = '22023';
  end if;
  return query select saved.id, saved.type, saved.occurred_at;
end $$;
revoke all on function public.record_attendance(uuid, uuid, uuid, uuid, uuid, public.attendance_type, timestamptz)
from public, anon, authenticated;
grant execute on function public.record_attendance(uuid, uuid, uuid, uuid, uuid, public.attendance_type, timestamptz)
to authenticated;

-- Stable identifiers let the client freeze the exact event before sending it.
drop function public.student_by_bracelet(text);
create function public.student_by_bracelet(bracelet_uid text)
returns table (id uuid, school_id uuid, bracelet_id uuid, first_name text, last_name text, grade text, group_name text)
language sql stable security invoker set search_path = '' as $$
  select s.id, s.school_id, b.id, s.first_name, s.last_name, s.grade, s.group_name
  from public.bracelets b
  join public.students s on s.id = b.student_id and s.school_id = b.school_id
  where b.uid = bracelet_uid and b.active and s.active
    and private.has_school_access(s.school_id)
  limit 1;
$$;
revoke all on function public.student_by_bracelet(text) from public, anon, authenticated;
grant execute on function public.student_by_bracelet(text) to authenticated;
commit;
