-- This incremental migration targets the existing hosted schema; it is not a baseline.
-- Profile ownership must not permit changing the school or role used by RLS.
revoke update on public.profiles from public, anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Keep old bracelets assigned while allowing only one active bracelet per student.
alter table public.bracelets drop constraint bracelets_student_id_key;
create unique index bracelets_one_active_per_student
  on public.bracelets (student_id)
  where active and student_id is not null;

-- A bracelet and its assigned student must belong to the same school.
alter table public.students
  add constraint students_id_school_id_key unique (id, school_id);

alter table public.bracelets
  add constraint bracelets_student_school_fkey
  foreign key (student_id, school_id)
  references public.students (id, school_id);
