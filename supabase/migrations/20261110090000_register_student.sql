begin;

-- Durable receipts keep retries independent of later edits to student records.
create table private.student_registrations (
  id uuid primary key,
  profile_id uuid not null references public.profiles(id),
  school_id uuid not null references public.schools(id),
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table private.student_registrations enable row level security;
revoke all on private.student_registrations from public, anon, authenticated;

create function public.register_student(
  p_registration_id uuid,
  p_school_id uuid,
  p_bracelet_uid text,
  p_first_name text,
  p_last_name text,
  p_student_number text,
  p_grade text,
  p_group_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  input jsonb;
  receipt private.student_registrations%rowtype;
  student_id uuid := gen_random_uuid();
  bracelet_id uuid := gen_random_uuid();
  result jsonb;
begin
  if caller is null then
    raise exception 'School access is required' using errcode = '42501';
  end if;
  -- Prevent membership revocation racing an authorized write.
  perform 1 from public.school_access
    where profile_id = caller and school_id = p_school_id for key share;
  if not found then
    raise exception 'School access is required' using errcode = '42501';
  end if;
  if p_registration_id is null or p_bracelet_uid is null
     or length(btrim(p_bracelet_uid)) not between 1 and 128
     or p_first_name is null or length(btrim(p_first_name)) not between 1 and 100
     or p_last_name is null or length(btrim(p_last_name)) not between 1 and 100
     or coalesce(length(btrim(p_student_number)), 0) > 60
     or coalesce(length(btrim(p_grade)), 0) > 40
     or coalesce(length(btrim(p_group_name)), 0) > 40 then
    raise exception 'Invalid student registration' using errcode = '22023';
  end if;
  input := jsonb_build_object(
    'school_id', p_school_id, 'bracelet_uid', btrim(p_bracelet_uid),
    'first_name', btrim(p_first_name), 'last_name', btrim(p_last_name),
    'student_number', nullif(btrim(p_student_number), ''),
    'grade', nullif(btrim(p_grade), ''), 'group_name', nullif(btrim(p_group_name), '')
  );

  -- Concurrent retries of the same request must observe the first result.
  perform pg_advisory_xact_lock(hashtextextended(p_registration_id::text, 0));
  select * into receipt from private.student_registrations where id = p_registration_id;
  if found then
    if receipt.profile_id <> caller or receipt.school_id <> p_school_id then
      raise exception 'Registration is not accessible' using errcode = '42501';
    end if;
    if receipt.payload <> input then
      raise exception 'Registration ID has different content' using errcode = '23505';
    end if;
    return receipt.result;
  end if;

  insert into public.students (id, school_id, first_name, last_name, student_number, grade, group_name, active)
  values (student_id, p_school_id, input->>'first_name', input->>'last_name',
    input->>'student_number', input->>'grade', input->>'group_name', true);
  -- Global UNIQUE(uid) also rejects a race after the pre-scan existence check.
  insert into public.bracelets (id, school_id, student_id, uid, active, assigned_at)
  values (bracelet_id, p_school_id, student_id, input->>'bracelet_uid', true, now());
  result := jsonb_build_object('registration_id', p_registration_id,
    'school_id', p_school_id, 'student_id', student_id,
    'bracelet_id', bracelet_id, 'bracelet_uid', input->>'bracelet_uid');
  insert into private.student_registrations (id, profile_id, school_id, payload, result)
  values (p_registration_id, caller, p_school_id, input, result);
  return result;
exception when unique_violation then
  -- The function's transaction rolls back the student as well as the bracelet.
  raise exception 'Registration conflicts with an existing record' using errcode = '23505';
end;
$$;

revoke all on function public.register_student(uuid, uuid, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_student(uuid, uuid, text, text, text, text, text, text)
  to authenticated;

commit;
