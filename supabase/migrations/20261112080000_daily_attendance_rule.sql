-- Daily attendance rule (ADR 002): one entry/exit pair per student and school day.
-- Additional movements are accepted only when the client confirms them explicitly.
begin;
set local lock_timeout = '5s';

create function private.is_valid_timezone(tz text)
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from pg_catalog.pg_timezone_names n where n.name = tz);
$$;
revoke all on function private.is_valid_timezone(text) from public, anon;
grant execute on function private.is_valid_timezone(text) to authenticated;

-- A "school day" is the local calendar date of occurred_at in the school's timezone.
alter table public.schools add column timezone text not null default 'America/Mexico_City';
alter table public.schools add constraint schools_timezone_valid check (private.is_valid_timezone(timezone));

-- Audit trail: true only for events accepted as an exception to the daily rule.
alter table public.attendance add column confirmed_repeat boolean not null default false;
create index attendance_student_occurred_idx on public.attendance (student_id, occurred_at desc);

-- Serializes concurrent writes for the same student and local day (several devices, retries).
create function private.lock_attendance_day(school uuid, student uuid, ts timestamptz)
returns void language plpgsql security invoker set search_path = '' as $$
declare tz text;
begin
  select s.timezone into tz from public.schools s where s.id = school;
  if tz is null then
    raise exception 'School timezone unavailable' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(student::text || ':' || ((ts at time zone tz)::date)::text, 0)
  );
end $$;

create function private.validate_attendance_daily_rule()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  tz text;
  local_day date;
  day_start timestamptz;
  day_end timestamptz;
  last_type public.attendance_type;
  repeated boolean;
begin
  select s.timezone into tz from public.schools s where s.id = new.school_id;
  if tz is null then
    raise exception 'School timezone unavailable' using errcode = '22023';
  end if;
  perform private.lock_attendance_day(new.school_id, new.student_id, new.occurred_at);
  local_day := (new.occurred_at at time zone tz)::date;
  day_start := local_day::timestamp at time zone tz;
  day_end := (local_day + 1)::timestamp at time zone tz;

  select a.type into last_type from public.attendance a
  where a.student_id = new.student_id and a.occurred_at >= day_start and a.occurred_at < day_end
  order by a.occurred_at desc, a.id desc
  limit 1;

  if last_type is null then
    new.confirmed_repeat := false;
    return new;
  end if;
  if last_type = new.type then
    raise exception 'Attendance already recorded' using errcode = 'AT001', hint = 'duplicate';
  end if;
  if new.type = 'entry' then
    repeated := true; -- re-entry after an exit
  else
    repeated := exists (
      select 1 from public.attendance a
      where a.student_id = new.student_id and a.type = 'exit'
        and a.occurred_at >= day_start and a.occurred_at < day_end
    ); -- an additional exit
  end if;
  if repeated and not new.confirmed_repeat then
    raise exception 'Confirmation required' using errcode = 'AT002', hint = 'confirmation-required';
  end if;
  new.confirmed_repeat := repeated;
  return new;
end $$;
-- Fires after attendance_validate_insert (alphabetical order), so relationship errors keep precedence.
create trigger attendance_validate_rule before insert on public.attendance
for each row execute function private.validate_attendance_daily_rule();
revoke all on function private.lock_attendance_day(uuid, uuid, timestamptz),
  private.validate_attendance_daily_rule() from public, anon;
grant execute on function private.lock_attendance_day(uuid, uuid, timestamptz),
  private.validate_attendance_daily_rule() to authenticated;

-- Same contract plus an optional confirmation flag; the rule itself lives in the trigger.
drop function public.record_attendance(uuid, uuid, uuid, uuid, uuid, public.attendance_type, timestamptz);
create function public.record_attendance(
  event_id uuid, event_school_id uuid, event_student_id uuid,
  event_bracelet_id uuid, event_device_id uuid,
  event_type public.attendance_type, event_occurred_at timestamptz,
  event_confirmed boolean default false
)
returns table (id uuid, type public.attendance_type, occurred_at timestamptz)
language plpgsql security invoker set search_path = '' as $$
declare saved public.attendance%rowtype;
begin
  if not private.has_school_access(event_school_id) then
    raise exception 'School access required' using errcode = '42501';
  end if;
  -- Lock before the lookup so a concurrent retry of the same event stays idempotent.
  perform private.lock_attendance_day(event_school_id, event_student_id, event_occurred_at);
  select a.* into saved from public.attendance a where a.id = event_id;
  if not found then
    insert into public.attendance (id, school_id, student_id, bracelet_id, device_id, type, occurred_at, confirmed_repeat)
    values (event_id, event_school_id, event_student_id, event_bracelet_id, event_device_id, event_type,
            event_occurred_at, coalesce(event_confirmed, false))
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
revoke all on function public.record_attendance(uuid, uuid, uuid, uuid, uuid, public.attendance_type, timestamptz, boolean)
from public, anon, authenticated;
grant execute on function public.record_attendance(uuid, uuid, uuid, uuid, uuid, public.attendance_type, timestamptz, boolean)
to authenticated;
commit;
