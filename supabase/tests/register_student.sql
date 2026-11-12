-- Fictional fixtures only. No data from this suite persists.
begin;
insert into auth.users (id)
select ('da9a1000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid from generate_series(1, 4) n;
insert into public.profiles (id, full_name)
select id, 'Registration fixture' from auth.users
where id between 'da9a1000-0000-4000-8000-000000000001' and 'da9a1000-0000-4000-8000-000000000004';
insert into public.schools (id, name, slug) values
 ('da9a2000-0000-4000-8000-000000000001', 'Registration A', 'fixture-da9a-a'),
 ('da9a2000-0000-4000-8000-000000000002', 'Registration B', 'fixture-da9a-b');
insert into public.school_access (profile_id, school_id) values
 ('da9a1000-0000-4000-8000-000000000001', 'da9a2000-0000-4000-8000-000000000001'),
 ('da9a1000-0000-4000-8000-000000000002', 'da9a2000-0000-4000-8000-000000000002'),
 ('da9a1000-0000-4000-8000-000000000003', 'da9a2000-0000-4000-8000-000000000001');
insert into public.bracelets (school_id, uid, active) values
 ('da9a2000-0000-4000-8000-000000000002', 'fixture-da9a-inactive', false);

create function pg_temp.register_fixture(req integer, school integer, uid text, first_name text default ' New ')
returns jsonb language sql as $$
 select public.register_student(
   ('da9a4000-0000-4000-8000-' || lpad(req::text,12,'0'))::uuid,
   ('da9a2000-0000-4000-8000-' || lpad(school::text,12,'0'))::uuid,
   uid, first_name, ' Fixture ', '', '3', 'A');
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'da9a1000-0000-4000-8000-000000000001', true);
do $$ declare first_result jsonb; repeated jsonb; before_count bigint;
begin
 first_result := pg_temp.register_fixture(1, 1, 'fixture-da9a-new');
 repeated := pg_temp.register_fixture(1, 1, 'fixture-da9a-new');
 if first_result <> repeated then raise exception 'Idempotent retry changed IDs'; end if;
 if (select count(*) from public.students where school_id='da9a2000-0000-4000-8000-000000000001') <> 1
    or (select count(*) from public.bracelets where uid='fixture-da9a-new') <> 1 then
   raise exception 'Retry duplicated student or bracelet';
 end if;
 if (select count(*) from public.student_by_bracelet('fixture-da9a-new')
     where first_name='New' and last_name='Fixture' and grade='3' and group_name='A') <> 1 then
   raise exception 'New student is not discoverable by attendance';
 end if;
 begin
   perform pg_temp.register_fixture(1, 1, 'fixture-da9a-new', 'Changed');
   raise exception 'Changed payload was accepted for the same ID';
 exception when unique_violation then null; end;
 select count(*) into before_count from public.students;
 begin
   perform pg_temp.register_fixture(2, 1, 'fixture-da9a-new');
   raise exception 'Existing bracelet was reassigned';
 exception when unique_violation then null; end;
 begin
   perform pg_temp.register_fixture(3, 1, 'fixture-da9a-inactive');
   raise exception 'Inactive other-school bracelet was reused';
 exception when unique_violation then null; end;
 if (select count(*) from public.students) <> before_count then
   raise exception 'Bracelet failure left an orphan student';
 end if;
 begin
   perform pg_temp.register_fixture(4, 2, 'fixture-da9a-cross-school');
   raise exception 'Cross-school registration succeeded';
 exception when insufficient_privilege then null; end;
 begin
   perform pg_temp.register_fixture(5, 1, 'fixture-da9a-invalid', ' ');
   raise exception 'Blank name was accepted';
 exception when invalid_parameter_value then null; end;
 begin
   perform pg_temp.register_fixture(6, 1, ' ', 'Valid');
   raise exception 'Blank UID was accepted';
 exception when invalid_parameter_value then null; end;
 begin
   perform pg_temp.register_fixture(7, 1, 'fixture-da9a-long', repeat('x',101));
   raise exception 'Oversized input was accepted';
 exception when invalid_parameter_value then null; end;
 if has_table_privilege('authenticated', 'private.student_registrations', 'select')
    or has_table_privilege('authenticated', 'private.student_registrations', 'insert')
    or has_table_privilege('authenticated', 'private.student_registrations', 'update')
    or has_table_privilege('authenticated', 'private.student_registrations', 'delete') then
   raise exception 'Client can access private receipts';
 end if;
end $$;

-- Even a colleague cannot replay another identity's request.
select set_config('request.jwt.claim.sub', 'da9a1000-0000-4000-8000-000000000003', true);
do $$ begin
 begin
   perform pg_temp.register_fixture(1, 1, 'fixture-da9a-new');
   raise exception 'Another actor accessed the receipt';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', 'da9a1000-0000-4000-8000-000000000002', true);
do $$ begin
 if (select count(*) from public.student_by_bracelet('fixture-da9a-new')) <> 0 then
   raise exception 'Student leaked across schools';
 end if;
 perform pg_temp.register_fixture(8, 2, 'fixture-da9a-school-b');
end $$;
select set_config('request.jwt.claim.sub', 'da9a1000-0000-4000-8000-000000000004', true);
do $$ begin
 begin
   perform pg_temp.register_fixture(9, 1, 'fixture-da9a-no-access');
   raise exception 'Identity without school access created a student';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
 begin
   perform pg_temp.register_fixture(10, 1, 'fixture-da9a-missing-identity');
   raise exception 'Missing JWT identity created a student';
 exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
 begin
   perform pg_temp.register_fixture(11, 1, 'fixture-da9a-anonymous');
   raise exception 'Anonymous registration was accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 if (select count(*) from private.student_registrations where id::text like 'da9a4000-%') <> 2 then
   raise exception 'Rejected operations persisted receipts';
 end if;
end $$;
rollback;
