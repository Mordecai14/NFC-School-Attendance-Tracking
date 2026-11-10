-- Independent regression probes; all fixtures and helpers roll back.
begin;
create function pg_temp.state_hash() returns text language sql security definer
set search_path = '' as $$
 select md5(coalesce(string_agg(resource || data::text, '' order by resource, data::text), ''))
 from (
 select 'schools' resource, to_jsonb(t) data from public.schools t
 union all select 'profiles', to_jsonb(t) from public.profiles t
 union all select 'school_access', to_jsonb(t) from public.school_access t
 union all select 'student_tutors', to_jsonb(t) from public.student_tutors t
 union all select 'students', to_jsonb(t) from public.students t
 union all select 'attendance', to_jsonb(t) from public.attendance t
 union all select 'bracelets', to_jsonb(t) from public.bracelets t
 union all select 'devices', to_jsonb(t) from public.devices t
 ) rows;
$$;
insert into auth.users(id) values
 ('de010000-0000-4000-8000-000000000001'),
 ('de010000-0000-4000-8000-000000000002');
insert into public.profiles(id, full_name)
values ('de010000-0000-4000-8000-000000000001','Independent dual'),
 ('de010000-0000-4000-8000-000000000002','Independent tutor');
insert into public.schools(id,name,slug) values
 ('de020000-0000-4000-8000-000000000001','Independent A','independent-access-a'),
 ('de020000-0000-4000-8000-000000000002','Independent B','independent-access-b');
insert into public.students(id,school_id,first_name,last_name) values
 ('de030000-0000-4000-8000-000000000001','de020000-0000-4000-8000-000000000001','Independent','A'),
 ('de030000-0000-4000-8000-000000000002','de020000-0000-4000-8000-000000000002','Independent','B');
insert into public.school_access values
 ('de010000-0000-4000-8000-000000000001','de020000-0000-4000-8000-000000000001');
insert into public.student_tutors values
 ('de030000-0000-4000-8000-000000000001','de010000-0000-4000-8000-000000000002'),
 ('de030000-0000-4000-8000-000000000002','de010000-0000-4000-8000-000000000002'),
 ('de030000-0000-4000-8000-000000000002','de010000-0000-4000-8000-000000000001');
insert into public.attendance(school_id,student_id,type,occurred_at)
select school_id,id,'entry',now() from public.students
where id in ('de030000-0000-4000-8000-000000000001','de030000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','de010000-0000-4000-8000-000000000002',true);
do $$ declare before_hash text := pg_temp.state_hash(); cmd text;
begin
 if (select count(*) from public.students) <> 2
 or (select count(*) from public.attendance) <> 2
 or (select count(*) from public.student_tutors) <> 2
 or (select count(*) from public.schools) <> 0 then
   raise exception 'Independent tutor scope failed'; end if;
 foreach cmd in array array[
 'insert into public.school_access values (''de010000-0000-4000-8000-000000000002'',''de020000-0000-4000-8000-000000000001'')',
 'update public.school_access set school_id=school_id',
 'delete from public.school_access',
 'insert into public.student_tutors values (''de030000-0000-4000-8000-000000000001'',''de010000-0000-4000-8000-000000000001'')',
 'update public.student_tutors set tutor_id=tutor_id',
 'delete from public.student_tutors',
 'insert into public.attendance(school_id,student_id,type,occurred_at) values (''de020000-0000-4000-8000-000000000001'',''de030000-0000-4000-8000-000000000001'',''entry'',now())'
 ] loop
   begin execute cmd; raise exception 'Forbidden command succeeded: %',cmd;
   exception when sqlstate '42501' then null; end;
   if before_hash is distinct from pg_temp.state_hash() then
     raise exception 'Rejected command changed stored rows: %',cmd; end if;
 end loop;
 update public.students set first_name='Forbidden';
 if found then raise exception 'Tutor updated students'; end if;
 delete from public.students;
 if found then raise exception 'Tutor deleted students'; end if;
 if before_hash is distinct from pg_temp.state_hash() then
   raise exception 'Tutor writes changed stored rows'; end if;
end $$;
select set_config('request.jwt.claim.sub','de010000-0000-4000-8000-000000000001',true);
do $$ declare before_hash text := pg_temp.state_hash();
begin
 if (select count(*) from public.students) <> 2
 or (select count(*) from public.attendance) <> 2 then
   raise exception 'Dual identity lost linked reads'; end if;
 update public.students set first_name='Forbidden'
 where id='de030000-0000-4000-8000-000000000002';
 if found then raise exception 'Dual identity wrote through tutor access'; end if;
 if before_hash is distinct from pg_temp.state_hash() then
   raise exception 'Foreign write changed stored rows'; end if;
 update public.students set first_name='Allowed'
 where id='de030000-0000-4000-8000-000000000001';
 if not found then raise exception 'Staff lost own-school write'; end if;
end $$;
reset role;
do $$ declare before_hash text := pg_temp.state_hash();
begin
 begin
 insert into public.student_tutors values
 ('de030000-0000-4000-8000-000000000001','de010000-0000-4000-8000-000000000002');
 raise exception 'Duplicate link accepted';
 exception when sqlstate '23505' then null; end;
 if before_hash is distinct from pg_temp.state_hash() then
   raise exception 'Duplicate rejection changed stored rows'; end if;
 begin
 insert into public.student_tutors values
 ('de030000-0000-4000-8000-000000000099','de010000-0000-4000-8000-000000000002');
 raise exception 'Dangling link accepted';
 exception when sqlstate '23503' then null; end;
 if before_hash is distinct from pg_temp.state_hash() then
   raise exception 'FK rejection changed stored rows'; end if;
 if exists(select 1 from information_schema.columns where table_schema='public'
 and ((table_name='profiles' and column_name in ('role','school_id'))
 or (table_name='students' and column_name='tutor_id'))) then
   raise exception 'Old authorization columns remain'; end if;
end $$;
select 'Independent S1/S2/S3 probes passed' as result;
rollback;
