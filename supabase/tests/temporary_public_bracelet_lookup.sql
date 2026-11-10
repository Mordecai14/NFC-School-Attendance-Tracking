-- Run only on the confirmed development project. All fixtures roll back.
begin;
insert into public.schools (id, name, slug)
values ('bf2f2000-0000-4000-8000-000000000001', 'Fixture', 'fixture-bf2f-school');
insert into public.students (id, school_id, first_name, last_name, grade, group_name)
values ('bf2f3000-0000-4000-8000-000000000001', 'bf2f2000-0000-4000-8000-000000000001', 'Fixture', 'Student', '3', 'A');
insert into public.bracelets (school_id, student_id, uid, active) values
  ('bf2f2000-0000-4000-8000-000000000001', 'bf2f3000-0000-4000-8000-000000000001', 'fixture-bf2f-active', true),
  ('bf2f2000-0000-4000-8000-000000000001', 'bf2f3000-0000-4000-8000-000000000001', 'fixture-bf2f-inactive', false);

set local role anon;
do $$
begin
  if (select count(*) from public.development_student_by_bracelet('fixture-bf2f-active') where first_name = 'Fixture' and grade = '3') <> 1 then
    raise exception 'Known bracelet lookup failed';
  end if;
  if (select count(*) from public.development_student_by_bracelet('fixture-bf2f-inactive')) <> 0
     or (select count(*) from public.development_student_by_bracelet('fixture-bf2f-unknown')) <> 0 then
    raise exception 'Inactive or unknown bracelet returned a student';
  end if;
  if has_table_privilege('anon', 'public.students', 'select') or has_table_privilege('anon', 'public.bracelets', 'select') then
    raise exception 'Anonymous direct table read is enabled';
  end if;
end $$;
reset role;
rollback;
