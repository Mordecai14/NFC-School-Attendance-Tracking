-- Run only against the confirmed development project; all fixtures roll back.
begin;
select count(*) from public.school_access where false;
select count(*) from public.student_tutors where false;

insert into auth.users (id)
select ('af010000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
from generate_series(1, 5) n;
insert into public.schools (id, name, slug) values
 ('af020000-0000-4000-8000-000000000001', 'Access A', 'fixture-access-a'),
 ('af020000-0000-4000-8000-000000000002', 'Access B', 'fixture-access-b');
insert into public.profiles (id, full_name)
select id, 'Access fixture' from auth.users
where id between 'af010000-0000-4000-8000-000000000001' and 'af010000-0000-4000-8000-000000000005';
insert into public.school_access (profile_id, school_id) values
 ('af010000-0000-4000-8000-000000000001', 'af020000-0000-4000-8000-000000000001'),
 ('af010000-0000-4000-8000-000000000002', 'af020000-0000-4000-8000-000000000002');
insert into public.students (id, school_id, first_name, last_name) values
 ('af030000-0000-4000-8000-000000000001', 'af020000-0000-4000-8000-000000000001', 'A1', 'Fixture'),
 ('af030000-0000-4000-8000-000000000002', 'af020000-0000-4000-8000-000000000001', 'A2', 'Fixture'),
 ('af030000-0000-4000-8000-000000000003', 'af020000-0000-4000-8000-000000000002', 'B1', 'Fixture'),
 ('af030000-0000-4000-8000-000000000004', 'af020000-0000-4000-8000-000000000002', 'B2', 'Fixture');
-- A shared tutor has children in both schools; A's staff is also B1's tutor.
insert into public.student_tutors (student_id, tutor_id) values
 ('af030000-0000-4000-8000-000000000001', 'af010000-0000-4000-8000-000000000003'),
 ('af030000-0000-4000-8000-000000000004', 'af010000-0000-4000-8000-000000000003'),
 ('af030000-0000-4000-8000-000000000001', 'af010000-0000-4000-8000-000000000004'),
 ('af030000-0000-4000-8000-000000000003', 'af010000-0000-4000-8000-000000000001');
insert into public.devices (school_id, name, platform) values
 ('af020000-0000-4000-8000-000000000001', 'Fixture A device', 'android'),
 ('af020000-0000-4000-8000-000000000002', 'Fixture B device', 'android');
insert into public.bracelets (school_id, student_id, uid) values
 ('af020000-0000-4000-8000-000000000001', 'af030000-0000-4000-8000-000000000001', 'fixture-access-a'),
 ('af020000-0000-4000-8000-000000000002', 'af030000-0000-4000-8000-000000000003', 'fixture-access-b');
insert into public.attendance (school_id, student_id, type, occurred_at)
select school_id, id, 'entry', now() from public.students
where id between 'af030000-0000-4000-8000-000000000001' and 'af030000-0000-4000-8000-000000000004';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'af010000-0000-4000-8000-000000000003', true);
do $$ begin
 if (select count(*) from public.students) <> 2
    or (select count(*) from public.attendance) <> 2
    or (select count(*) from public.student_tutors) <> 2
    or (select count(*) from public.school_access) <> 0
    or (select count(*) from public.bracelets) <> 0
    or (select count(*) from public.devices) <> 0
    or (select count(*) from public.profiles) <> 1 then
   raise exception 'Shared tutor can see unrelated data or lost a linked child';
 end if;
 begin
   insert into public.school_access values ('af010000-0000-4000-8000-000000000003', 'af020000-0000-4000-8000-000000000001');
   raise exception 'Tutor granted school access';
 exception when insufficient_privilege then null; end;
 begin
   insert into public.student_tutors values ('af030000-0000-4000-8000-000000000002', 'af010000-0000-4000-8000-000000000003');
   raise exception 'Tutor self-linked another child';
 exception when insufficient_privilege then null; end;
 begin
   insert into public.students (school_id, first_name, last_name)
   values ('af020000-0000-4000-8000-000000000001', 'Forbidden', 'Fixture');
   raise exception 'Tutor created a student';
 exception when insufficient_privilege then null; end;
 update public.students set first_name='Forbidden' where id='af030000-0000-4000-8000-000000000001';
 if found then raise exception 'Tutor updated a linked child'; end if;
 delete from public.students where id='af030000-0000-4000-8000-000000000001';
 if found then raise exception 'Tutor deleted a linked child'; end if;
end $$;

select set_config('request.jwt.claim.sub', 'af010000-0000-4000-8000-000000000001', true);
do $$ begin
 if (select count(*) from public.students) <> 3
    or (select count(*) from public.attendance) <> 3
    or (select count(*) from public.student_tutors) <> 3
    or (select count(*) from public.schools) <> 1
    or (select count(*) from public.devices) <> 1
    or (select count(*) from public.bracelets) <> 1
    or (select count(*) from public.profiles) <> 3 then
   raise exception 'Staff/tutor identity lost access or gained unrelated access';
 end if;
 update public.profiles set full_name='Updated fixture' where id='af010000-0000-4000-8000-000000000001';
 if not found then raise exception 'Own name update failed'; end if;
 update public.profiles set full_name='Forbidden' where id='af010000-0000-4000-8000-000000000003';
 if found then raise exception 'School changed a shared tutor identity'; end if;
 update public.students set first_name='Updated A2' where id='af030000-0000-4000-8000-000000000002';
 if not found then raise exception 'School cannot update own student'; end if;
 update public.students set first_name='Forbidden' where id='af030000-0000-4000-8000-000000000003';
 if found then raise exception 'Staff used tutor relationship to update another school'; end if;
 begin
   insert into public.students (school_id, first_name, last_name)
   values ('af020000-0000-4000-8000-000000000002', 'Forbidden', 'Fixture');
   raise exception 'School created another school student';
 exception when insufficient_privilege then null; end;
 insert into public.students (id, school_id, first_name, last_name)
 values ('af030000-0000-4000-8000-000000000005', 'af020000-0000-4000-8000-000000000001', 'Temporary', 'Fixture');
 delete from public.students where id='af030000-0000-4000-8000-000000000005';
 if not found then raise exception 'School cannot delete own unreferenced student'; end if;
 begin
   update public.students set school_id='af020000-0000-4000-8000-000000000002'
   where id='af030000-0000-4000-8000-000000000002';
   raise exception 'School moved a student across schools';
 exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', 'af010000-0000-4000-8000-000000000002', true);
do $$ begin
 if (select count(*) from public.students) <> 2 or (select count(*) from public.attendance) <> 2
    or (select count(*) from public.student_tutors) <> 2
    or (select count(*) from public.devices) <> 1 or (select count(*) from public.bracelets) <> 1 then
   raise exception 'School B isolation failed';
 end if;
end $$;
select set_config('request.jwt.claim.sub', 'af010000-0000-4000-8000-000000000005', true);
do $$ begin
 if (select count(*) from public.students) <> 0 or (select count(*) from public.school_access) <> 0
    or (select count(*) from public.student_tutors) <> 0 or (select count(*) from public.attendance) <> 0 then
   raise exception 'Unassigned identity can access school data';
 end if;
end $$;
reset role;
do $$ begin
 if has_table_privilege('anon','public.school_access','select')
    or has_table_privilege('anon','public.student_tutors','select')
    or has_table_privilege('authenticated','public.school_access','insert')
    or has_table_privilege('authenticated','public.school_access','update')
    or has_table_privilege('authenticated','public.school_access','delete')
    or has_table_privilege('authenticated','public.student_tutors','insert')
    or has_table_privilege('authenticated','public.student_tutors','update')
    or has_table_privilege('authenticated','public.student_tutors','delete') then
   raise exception 'Relationship grants allow escalation';
 end if;
 begin
   insert into public.student_tutors values ('af030000-0000-4000-8000-000000000001','af010000-0000-4000-8000-000000000003');
   raise exception 'Duplicate tutor relationship accepted';
 exception when unique_violation then null; end;
end $$;
rollback;
