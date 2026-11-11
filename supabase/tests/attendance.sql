-- Development project only; fixtures, helpers and events are fully rolled back.
begin;
create function pg_temp.fixture_id(kind integer, n integer) returns uuid
language sql immutable as $$
  select ('ae' || kind::text || '00000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
$$;
create function pg_temp.record_test(
  n integer, school integer default 1, student integer default 1,
  bracelet integer default 1, device integer default 1, kind text default 'entry'
) returns void language plpgsql security invoker as $$
begin
  perform * from public.record_attendance(
    pg_temp.fixture_id(6,n), pg_temp.fixture_id(2,school), pg_temp.fixture_id(3,student),
    pg_temp.fixture_id(4,bracelet), pg_temp.fixture_id(5,device),
    kind::public.attendance_type, '2026-11-10T12:00:00Z'
  );
end $$;
create function pg_temp.expect_rejection(statement text, expected_state text)
returns void language plpgsql security invoker as $$
declare before_rows jsonb; after_rows jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(a) order by a.id),'[]'::jsonb) into before_rows from public.attendance a;
  begin
    execute statement;
    raise exception 'Forbidden operation succeeded: %', statement;
  exception when others then
    if sqlstate <> expected_state then raise; end if;
  end;
  select coalesce(jsonb_agg(to_jsonb(a) order by a.id),'[]'::jsonb) into after_rows from public.attendance a;
  if before_rows is distinct from after_rows then raise exception 'Rejected operation changed history'; end if;
end $$;

insert into auth.users(id) select pg_temp.fixture_id(1,n) from generate_series(1,4) n;
insert into public.profiles(id,full_name) select pg_temp.fixture_id(1,n),'Attendance fixture' from generate_series(1,4) n;
insert into public.schools(id,name,slug) values
 (pg_temp.fixture_id(2,1),'Attendance A','attendance-fixture-a'),
 (pg_temp.fixture_id(2,2),'Attendance B','attendance-fixture-b');
insert into public.school_access(profile_id,school_id) values
 (pg_temp.fixture_id(1,1),pg_temp.fixture_id(2,1)),
 (pg_temp.fixture_id(1,2),pg_temp.fixture_id(2,2));
insert into public.students(id,school_id,first_name,last_name,active) values
 (pg_temp.fixture_id(3,1),pg_temp.fixture_id(2,1),'A1','Fixture',true),
 (pg_temp.fixture_id(3,2),pg_temp.fixture_id(2,1),'A2','Fixture',true),
 (pg_temp.fixture_id(3,3),pg_temp.fixture_id(2,2),'B1','Fixture',true),
 (pg_temp.fixture_id(3,4),pg_temp.fixture_id(2,1),'Inactive','Fixture',false);
insert into public.student_tutors(student_id,tutor_id) values (pg_temp.fixture_id(3,1),pg_temp.fixture_id(1,3));
insert into public.bracelets(id,school_id,student_id,uid,active) values
 (pg_temp.fixture_id(4,1),pg_temp.fixture_id(2,1),pg_temp.fixture_id(3,1),'attendance-fixture-a1',true),
 (pg_temp.fixture_id(4,2),pg_temp.fixture_id(2,1),pg_temp.fixture_id(3,2),'attendance-fixture-a2',true),
 (pg_temp.fixture_id(4,3),pg_temp.fixture_id(2,2),pg_temp.fixture_id(3,3),'attendance-fixture-b1',true),
 (pg_temp.fixture_id(4,4),pg_temp.fixture_id(2,1),pg_temp.fixture_id(3,1),'attendance-fixture-old',false),
 (pg_temp.fixture_id(4,5),pg_temp.fixture_id(2,1),pg_temp.fixture_id(3,4),'attendance-fixture-inactive-student',true);
insert into public.devices(id,school_id,name,platform,active) values
 (pg_temp.fixture_id(5,1),pg_temp.fixture_id(2,1),'A','android',true),
 (pg_temp.fixture_id(5,2),pg_temp.fixture_id(2,2),'B','android',true),
 (pg_temp.fixture_id(5,3),pg_temp.fixture_id(2,1),'Inactive','android',false);

set local role authenticated;
select set_config('request.jwt.claim.sub',pg_temp.fixture_id(1,1)::text,true);
select pg_temp.record_test(1);
select pg_temp.record_test(1);
select pg_temp.record_test(2,1,1,1,1,'exit');
do $$ begin
 if (select count(*) from public.attendance)<>2 then raise exception 'Entry/exit or idempotency failed'; end if;
 if not exists(select 1 from public.student_by_bracelet('attendance-fixture-a1')
   where id=pg_temp.fixture_id(3,1) and school_id=pg_temp.fixture_id(2,1) and bracelet_id=pg_temp.fixture_id(4,1)) then
   raise exception 'Lookup did not provide stable identifiers';
 end if;
end $$;
select pg_temp.expect_rejection('select pg_temp.record_test(1,1,1,1,1,''exit'')','22023');
select pg_temp.expect_rejection('select pg_temp.record_test(10,2,3,3,2)','42501');
select pg_temp.expect_rejection('select pg_temp.record_test(11,1,3)','23514');
select pg_temp.expect_rejection('select pg_temp.record_test(12,1,1,2)','23514');
select pg_temp.expect_rejection('select pg_temp.record_test(13,1,1,1,2)','23514');
select pg_temp.expect_rejection('select pg_temp.record_test(14,1,1,4)','23514');
select pg_temp.expect_rejection('select pg_temp.record_test(15,1,4,5)','23514');
select pg_temp.expect_rejection('select pg_temp.record_test(16,1,1,1,3)','23514');
select pg_temp.expect_rejection('select pg_temp.record_test(17,1,1,1,1,''invalid'')','22P02');
-- Direct table writes cannot bypass relationship validation.
select pg_temp.expect_rejection(format(
 'insert into public.attendance(school_id,student_id,bracelet_id,device_id,type,occurred_at) values (%L,%L,%L,%L,''entry'',now())',
 pg_temp.fixture_id(2,1),pg_temp.fixture_id(3,1),pg_temp.fixture_id(4,2),pg_temp.fixture_id(5,1)),'23514');
select pg_temp.expect_rejection(format(
 'insert into public.attendance(school_id,student_id,type,occurred_at) values (%L,%L,''entry'',now())',
 pg_temp.fixture_id(2,1),pg_temp.fixture_id(3,1)),'23514');

select set_config('request.jwt.claim.sub',pg_temp.fixture_id(1,2)::text,true);
select pg_temp.record_test(3,2,3,3,2);
select pg_temp.expect_rejection('select pg_temp.record_test(20)','42501');
select set_config('request.jwt.claim.sub',pg_temp.fixture_id(1,3)::text,true);
select pg_temp.expect_rejection('select pg_temp.record_test(21)','42501');
select set_config('request.jwt.claim.sub',pg_temp.fixture_id(1,4)::text,true);
select pg_temp.expect_rejection('select pg_temp.record_test(22)','42501');
set local role anon;
do $$ begin
  begin
    perform pg_temp.record_test(23);
    raise exception 'Anonymous attendance write succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Even privileged maintenance cannot overwrite events through normal DML.
select pg_temp.expect_rejection(format('update public.attendance set type=''exit'' where id=%L',pg_temp.fixture_id(6,1)),'42501');
select pg_temp.expect_rejection(format('delete from public.attendance where id=%L',pg_temp.fixture_id(6,1)),'42501');
select pg_temp.expect_rejection(format('delete from public.bracelets where id=%L',pg_temp.fixture_id(4,1)),'23503');
select pg_temp.expect_rejection(format('delete from public.devices where id=%L',pg_temp.fixture_id(5,1)),'23503');
select pg_temp.expect_rejection(format('delete from public.schools where id=%L',pg_temp.fixture_id(2,1)),'23503');

-- A retry acknowledges an existing event even after its device was deactivated.
update public.devices set active=false where id=pg_temp.fixture_id(5,1);
set local role authenticated;
select set_config('request.jwt.claim.sub',pg_temp.fixture_id(1,1)::text,true);
select pg_temp.record_test(1);
select pg_temp.expect_rejection('select pg_temp.record_test(24)','23514');
reset role;
select 'Attendance integrity, isolation, immutable history and idempotency passed' as result;
rollback;
