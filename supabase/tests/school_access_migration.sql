-- The harness replaces this marker with the pending migration in one transaction.
-- Strip the migration's outer BEGIN/COMMIT before inserting its body here.
-- Run only before applying that migration, against confirmed development data.
begin;
create temporary table original_rows as
select 'schools' as resource, to_jsonb(t) as data from public.schools t
union all select 'profiles', to_jsonb(t) - 'school_id' - 'role' from public.profiles t
union all select 'students', to_jsonb(t) - 'tutor_id' from public.students t
union all select 'bracelets', to_jsonb(t) from public.bracelets t
union all select 'devices', to_jsonb(t) from public.devices t
union all select 'attendance', to_jsonb(t) from public.attendance t
union all select 'users', to_jsonb(t) from auth.users t;
create temporary table original_access as
select id as profile_id, school_id from public.profiles where role='school';
create temporary table original_links as
select id as student_id, tutor_id from public.students where tutor_id is not null;
create temporary table original_rpc as
select pg_get_functiondef(oid) as definition, proacl as acl from pg_proc
where oid='public.development_student_by_bracelet(text)'::regprocedure;
create temporary table original_nfc_results as
select b.uid, to_jsonb(result) as data from public.bracelets b
cross join lateral public.development_student_by_bracelet(b.uid) result;

-- MIGRATION_UNDER_TEST

do $$ begin
 if exists (
   (select * from original_access except select profile_id, school_id from public.school_access)
   union all
   (select profile_id, school_id from public.school_access except select * from original_access)
 ) or exists (
   (select * from original_links except select student_id, tutor_id from public.student_tutors)
   union all
   (select student_id, tutor_id from public.student_tutors except select * from original_links)
 ) then raise exception 'Migrated relationships differ from baseline'; end if;
 if exists (
   select 1 from original_rpc old join pg_proc p
     on p.oid='public.development_student_by_bracelet(text)'::regprocedure
   where old.definition is distinct from pg_get_functiondef(p.oid) or old.acl is distinct from p.proacl
 ) then raise exception 'NFC RPC changed'; end if;
end $$;
create temporary table migrated_rows as
select 'schools' as resource, to_jsonb(t) as data from public.schools t
union all select 'profiles', to_jsonb(t) from public.profiles t
union all select 'students', to_jsonb(t) from public.students t
union all select 'bracelets', to_jsonb(t) from public.bracelets t
union all select 'devices', to_jsonb(t) from public.devices t
union all select 'attendance', to_jsonb(t) from public.attendance t
union all select 'users', to_jsonb(t) from auth.users t;
create temporary table migrated_nfc_results as
select b.uid, to_jsonb(result) as data from public.bracelets b
cross join lateral public.development_student_by_bracelet(b.uid) result;
do $$ begin
 if exists (
   (select * from original_rows except all select * from migrated_rows)
   union all
   (select * from migrated_rows except all select * from original_rows)
 ) then raise exception 'Existing data changed beyond migrated columns'; end if;
 if exists (
   (select * from original_nfc_results except all select * from migrated_nfc_results)
   union all
   (select * from migrated_nfc_results except all select * from original_nfc_results)
 ) then raise exception 'Existing NFC results changed'; end if;
end $$;
select 'Migration preserves data, relationships and NFC function' as result;
rollback;
