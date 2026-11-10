-- Run against the confirmed development project only. All fixtures roll back.
begin;

insert into auth.users (id) values
  ('bf1f1000-0000-4000-8000-000000000001'),
  ('bf1f1000-0000-4000-8000-000000000002'),
  ('bf1f1000-0000-4000-8000-000000000003');

insert into public.schools (id, name, slug) values
  ('bf1f2000-0000-4000-8000-000000000001', 'Fixture A', 'fixture-bf1f-school-a'),
  ('bf1f2000-0000-4000-8000-000000000002', 'Fixture B', 'fixture-bf1f-school-b');

insert into public.profiles (id, school_id, full_name, role) values
  ('bf1f1000-0000-4000-8000-000000000001', 'bf1f2000-0000-4000-8000-000000000001', 'Fixture A', 'school'),
  ('bf1f1000-0000-4000-8000-000000000002', 'bf1f2000-0000-4000-8000-000000000002', 'Fixture B', 'school');

insert into public.students (id, school_id, first_name, last_name) values
  ('bf1f3000-0000-4000-8000-000000000001', 'bf1f2000-0000-4000-8000-000000000001', 'Fixture', 'A'),
  ('bf1f3000-0000-4000-8000-000000000002', 'bf1f2000-0000-4000-8000-000000000002', 'Fixture', 'B');

insert into public.bracelets (school_id, student_id, uid, active) values
  ('bf1f2000-0000-4000-8000-000000000001', 'bf1f3000-0000-4000-8000-000000000001', 'fixture-bf1f-old', false),
  ('bf1f2000-0000-4000-8000-000000000001', 'bf1f3000-0000-4000-8000-000000000001', 'fixture-bf1f-active', true),
  ('bf1f2000-0000-4000-8000-000000000002', 'bf1f3000-0000-4000-8000-000000000002', 'fixture-bf1f-other', true);

do $$
begin
  begin
    insert into public.bracelets (school_id, student_id, uid, active)
    values ('bf1f2000-0000-4000-8000-000000000001', 'bf1f3000-0000-4000-8000-000000000001', 'fixture-bf1f-duplicate', true);
    raise exception 'A second active bracelet was accepted';
  exception when unique_violation then null;
  end;

  begin
    insert into public.bracelets (school_id, student_id, uid, active)
    values ('bf1f2000-0000-4000-8000-000000000002', 'bf1f3000-0000-4000-8000-000000000001', 'fixture-bf1f-mismatch', false);
    raise exception 'A bracelet was assigned across schools';
  exception when foreign_key_violation then null;
  end;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bf1f1000-0000-4000-8000-000000000001', true);

do $$
begin
  if (select count(*) from public.students where id in ('bf1f3000-0000-4000-8000-000000000001', 'bf1f3000-0000-4000-8000-000000000002')) <> 1 then
    raise exception 'Student school isolation failed';
  end if;
  if (select count(*) from public.bracelets where uid like 'fixture-bf1f-%') <> 2 then
    raise exception 'Bracelet school isolation failed';
  end if;

  update public.profiles set full_name = 'Updated fixture' where id = 'bf1f1000-0000-4000-8000-000000000001';
  if not found then raise exception 'Own profile name update failed'; end if;

  begin
    update public.profiles set school_id = 'bf1f2000-0000-4000-8000-000000000002' where id = 'bf1f1000-0000-4000-8000-000000000001';
    raise exception 'School change was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set role = 'tutor' where id = 'bf1f1000-0000-4000-8000-000000000001';
    raise exception 'Role change was accepted';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', 'bf1f1000-0000-4000-8000-000000000002', true);
do $$
begin
  if (select count(*) from public.students where id = 'bf1f3000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'Reverse student school isolation failed';
  end if;
end $$;

select set_config('request.jwt.claim.sub', 'bf1f1000-0000-4000-8000-000000000003', true);
do $$
begin
  if (select count(*) from public.students) <> 0 or (select count(*) from public.bracelets) <> 0 then
    raise exception 'User without a school can access school data';
  end if;
end $$;

reset role;

do $$
begin
  if has_table_privilege('anon', 'public.students', 'select') or has_table_privilege('anon', 'public.bracelets', 'select') then
    raise exception 'Anonymous role has table select access';
  end if;
end $$;

rollback;
