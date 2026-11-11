-- All fixtures are fictional and rolled back on the confirmed development project.
begin;
insert into auth.users (id) values
 ('ce8e1000-0000-4000-8000-000000000001'),
 ('ce8e1000-0000-4000-8000-000000000002');
insert into public.profiles (id, full_name) values
 ('ce8e1000-0000-4000-8000-000000000001', 'Existence school fixture'),
 ('ce8e1000-0000-4000-8000-000000000002', 'Existence no-access fixture');
insert into public.schools (id, name, slug) values
 ('ce8e2000-0000-4000-8000-000000000001', 'Existence A', 'fixture-ce8e-a'),
 ('ce8e2000-0000-4000-8000-000000000002', 'Existence B', 'fixture-ce8e-b');
insert into public.school_access (profile_id, school_id) values
 ('ce8e1000-0000-4000-8000-000000000001', 'ce8e2000-0000-4000-8000-000000000001');
insert into public.bracelets (school_id, uid, active) values
 ('ce8e2000-0000-4000-8000-000000000001', 'fixture-ce8e-active', true),
 ('ce8e2000-0000-4000-8000-000000000001', 'fixture-ce8e-inactive', false),
 ('ce8e2000-0000-4000-8000-000000000002', 'fixture-ce8e-other-school', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'ce8e1000-0000-4000-8000-000000000001', true);
do $$ begin
 if not public.bracelet_exists('fixture-ce8e-active')
    or not public.bracelet_exists('fixture-ce8e-inactive')
    or not public.bracelet_exists('fixture-ce8e-other-school')
    or public.bracelet_exists('fixture-ce8e-unknown') then
   raise exception 'Existence lookup returned an incorrect result';
 end if;
 if (select count(*) from public.bracelets where uid = 'fixture-ce8e-other-school') <> 0 then
   raise exception 'Other-school bracelet details leaked through RLS';
 end if;
 begin
   perform public.bracelet_exists('  ');
   raise exception 'Blank UID was accepted';
 exception when invalid_parameter_value then null; end;
 begin
   perform public.bracelet_exists(null);
   raise exception 'Null UID was accepted';
 exception when invalid_parameter_value then null; end;
end $$;
select set_config('request.jwt.claim.sub', 'ce8e1000-0000-4000-8000-000000000002', true);
do $$ begin
 begin
   perform public.bracelet_exists('fixture-ce8e-active');
   raise exception 'Identity without school access was accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
 begin
   perform public.bracelet_exists('fixture-ce8e-active');
   raise exception 'Missing JWT identity was accepted';
 exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
 begin
   perform public.bracelet_exists('fixture-ce8e-active');
   raise exception 'Anonymous RPC execution was accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
