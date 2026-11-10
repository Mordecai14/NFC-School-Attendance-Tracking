-- Confirmed development project only. No fixtures persist.
begin;
insert into auth.users (id)
select ('bf2f1000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
from generate_series(1, 4) n;
insert into public.schools (id, name, slug) values
 ('bf2f2000-0000-4000-8000-000000000001', 'Lookup A', 'fixture-bf2f-school-a'),
 ('bf2f2000-0000-4000-8000-000000000002', 'Lookup B', 'fixture-bf2f-school-b');
insert into public.profiles (id, full_name)
select id, 'Lookup fixture' from auth.users
where id between 'bf2f1000-0000-4000-8000-000000000001' and 'bf2f1000-0000-4000-8000-000000000004';
insert into public.school_access (profile_id, school_id) values
 ('bf2f1000-0000-4000-8000-000000000001', 'bf2f2000-0000-4000-8000-000000000001'),
 ('bf2f1000-0000-4000-8000-000000000002', 'bf2f2000-0000-4000-8000-000000000002');
insert into public.students (id, school_id, first_name, last_name, active) values
 ('bf2f3000-0000-4000-8000-000000000001', 'bf2f2000-0000-4000-8000-000000000001', 'A', 'Fixture', true),
 ('bf2f3000-0000-4000-8000-000000000002', 'bf2f2000-0000-4000-8000-000000000002', 'B', 'Fixture', true),
 ('bf2f3000-0000-4000-8000-000000000003', 'bf2f2000-0000-4000-8000-000000000001', 'Inactive', 'Fixture', false);
insert into public.student_tutors (student_id, tutor_id) values
 ('bf2f3000-0000-4000-8000-000000000001', 'bf2f1000-0000-4000-8000-000000000003');
insert into public.bracelets (school_id, student_id, uid, active) values
 ('bf2f2000-0000-4000-8000-000000000001', 'bf2f3000-0000-4000-8000-000000000001', 'fixture-bf2f-active-a', true),
 ('bf2f2000-0000-4000-8000-000000000002', 'bf2f3000-0000-4000-8000-000000000002', 'fixture-bf2f-active-b', true),
 ('bf2f2000-0000-4000-8000-000000000001', 'bf2f3000-0000-4000-8000-000000000001', 'fixture-bf2f-inactive', false),
 ('bf2f2000-0000-4000-8000-000000000001', 'bf2f3000-0000-4000-8000-000000000003', 'fixture-bf2f-inactive-student', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bf2f1000-0000-4000-8000-000000000001', true);
do $$ begin
 if (select count(*) from public.student_by_bracelet('fixture-bf2f-active-a') where first_name='A')<>1 then
   raise exception 'Own-school lookup failed';
 end if;
 if (select count(*) from public.student_by_bracelet('fixture-bf2f-active-b'))<>0
    or (select count(*) from public.student_by_bracelet('fixture-bf2f-inactive'))<>0
    or (select count(*) from public.student_by_bracelet('fixture-bf2f-inactive-student'))<>0
    or (select count(*) from public.student_by_bracelet('fixture-bf2f-unknown'))<>0 then
   raise exception 'Cross-school, inactive or unknown lookup returned a student';
 end if;
end $$;
select set_config('request.jwt.claim.sub', 'bf2f1000-0000-4000-8000-000000000002', true);
do $$ begin
 if (select count(*) from public.student_by_bracelet('fixture-bf2f-active-b') where first_name='B')<>1
    or (select count(*) from public.student_by_bracelet('fixture-bf2f-active-a'))<>0 then
   raise exception 'School B isolation failed';
 end if;
end $$;
select set_config('request.jwt.claim.sub', 'bf2f1000-0000-4000-8000-000000000003', true);
do $$ begin
 if (select count(*) from public.student_by_bracelet('fixture-bf2f-active-a'))<>0 then
   raise exception 'Tutor gained school bracelet access';
 end if;
end $$;
select set_config('request.jwt.claim.sub', 'bf2f1000-0000-4000-8000-000000000004', true);
do $$ begin
 if (select count(*) from public.student_by_bracelet('fixture-bf2f-active-a'))<>0 then
   raise exception 'Unassigned identity gained school access';
 end if;
end $$;
set local role anon;
do $$ begin
 begin
   perform * from public.student_by_bracelet('fixture-bf2f-active-a');
   raise exception 'Anonymous RPC access is enabled';
 exception when insufficient_privilege then null; end;
 if has_table_privilege('anon', 'public.students', 'select')
    or has_table_privilege('anon', 'public.bracelets', 'select') then
   raise exception 'Anonymous direct table read is enabled';
 end if;
end $$;
reset role;
do $$ begin
 if to_regprocedure('public.development_student_by_bracelet(text)') is not null then
   raise exception 'Development bypass still exists';
 end if;
 if (select prosecdef from pg_proc where oid='public.student_by_bracelet(text)'::regprocedure) then
   raise exception 'Lookup bypasses caller RLS';
 end if;
end $$;
rollback;
