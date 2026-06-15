-- ============================================================================
-- EDUZAH — Multi-Course LMS schema
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('admin', 'instructor', 'student');
create type course_status as enum ('draft', 'active', 'archived');
create type submission_status as enum ('not_submitted', 'submitted', 'late', 'reviewed', 'approved');
create type attendance_status as enum ('present', 'absent', 'late');
create type material_type as enum ('pdf', 'zip', 'ppt', 'doc', 'video', 'link');

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  role user_role not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user is created.
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------
create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'General',
  banner_url text,
  duration_text text,
  status course_status not null default 'draft',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- course_instructors (many-to-many)
create table course_instructors (
  course_id uuid not null references courses (id) on delete cascade,
  instructor_id uuid not null references profiles (id) on delete cascade,
  primary key (course_id, instructor_id)
);

-- enrollments (student <-> course)
create table enrollments (
  course_id uuid not null references courses (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (course_id, student_id)
);

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------
create table sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  order_index int not null default 1,
  title text not null,
  description text not null default '',
  session_date timestamptz,
  recording_url text,
  assignment_title text,
  assignment_description text,
  deadline timestamptz,
  created_at timestamptz not null default now()
);

-- materials
create table materials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  title text not null,
  type material_type not null,
  url text not null,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- submissions
-- ---------------------------------------------------------------------------
create table submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  file_url text,
  file_name text,
  link_url text,
  submitted_at timestamptz,
  status submission_status not null default 'not_submitted',
  grade numeric,
  feedback text,
  reviewed_at timestamptz,
  is_late boolean not null default false,
  unique (session_id, student_id)
);

-- ---------------------------------------------------------------------------
-- attendance
-- ---------------------------------------------------------------------------
create table attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  status attendance_status not null default 'absent',
  recorded_at timestamptz not null default now(),
  recorded_by uuid references profiles (id) on delete set null,
  unique (session_id, student_id)
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper functions for RLS (avoid recursive policy lookups)
-- ---------------------------------------------------------------------------
create function is_staff(uid uuid)
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = uid and role in ('admin', 'instructor')
  );
$$ language sql security definer stable set search_path = public;

create function is_admin(uid uuid)
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = uid and role = 'admin'
  );
$$ language sql security definer stable set search_path = public;

create function teaches_course(uid uuid, cid uuid)
returns boolean as $$
  select exists (
    select 1 from course_instructors
    where instructor_id = uid and course_id = cid
  );
$$ language sql security definer stable set search_path = public;

create function enrolled_in_course(uid uuid, cid uuid)
returns boolean as $$
  select exists (
    select 1 from enrollments
    where student_id = uid and course_id = cid
  );
$$ language sql security definer stable set search_path = public;

create function teaches_session(uid uuid, sid uuid)
returns boolean as $$
  select exists (
    select 1 from sessions s
    join course_instructors ci on ci.course_id = s.course_id
    where s.id = sid and ci.instructor_id = uid
  );
$$ language sql security definer stable set search_path = public;

create function enrolled_in_session(uid uuid, sid uuid)
returns boolean as $$
  select exists (
    select 1 from sessions s
    join enrollments e on e.course_id = s.course_id
    where s.id = sid and e.student_id = uid
  );
$$ language sql security definer stable set search_path = public;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table courses enable row level security;
alter table course_instructors enable row level security;
alter table enrollments enable row level security;
alter table sessions enable row level security;
alter table materials enable row level security;
alter table submissions enable row level security;
alter table attendance enable row level security;
alter table notifications enable row level security;

-- profiles
create policy "profiles_select_own_or_staff" on profiles for select
  using (id = auth.uid() or is_staff(auth.uid()));
create policy "profiles_update_own_or_admin" on profiles for update
  using (id = auth.uid() or is_admin(auth.uid()));
create policy "profiles_insert_admin" on profiles for insert
  with check (is_admin(auth.uid()));
create policy "profiles_delete_admin" on profiles for delete
  using (is_admin(auth.uid()));

-- courses
create policy "courses_select" on courses for select
  using (
    is_admin(auth.uid())
    or teaches_course(auth.uid(), id)
    or enrolled_in_course(auth.uid(), id)
    or status = 'active'
  );
create policy "courses_insert_admin" on courses for insert
  with check (is_admin(auth.uid()));
create policy "courses_update" on courses for update
  using (is_admin(auth.uid()) or teaches_course(auth.uid(), id));
create policy "courses_delete_admin" on courses for delete
  using (is_admin(auth.uid()));

-- course_instructors
create policy "course_instructors_select" on course_instructors for select
  using (is_admin(auth.uid()) or instructor_id = auth.uid());
create policy "course_instructors_admin_write" on course_instructors for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- enrollments
create policy "enrollments_select" on enrollments for select
  using (
    is_admin(auth.uid())
    or student_id = auth.uid()
    or teaches_course(auth.uid(), course_id)
  );
create policy "enrollments_admin_write" on enrollments for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- sessions
create policy "sessions_select" on sessions for select
  using (
    is_admin(auth.uid())
    or teaches_course(auth.uid(), course_id)
    or enrolled_in_course(auth.uid(), course_id)
  );
create policy "sessions_write_staff" on sessions for all
  using (is_admin(auth.uid()) or teaches_course(auth.uid(), course_id))
  with check (is_admin(auth.uid()) or teaches_course(auth.uid(), course_id));

-- materials
create policy "materials_select" on materials for select
  using (
    is_admin(auth.uid())
    or teaches_session(auth.uid(), session_id)
    or enrolled_in_session(auth.uid(), session_id)
  );
create policy "materials_write_staff" on materials for all
  using (is_admin(auth.uid()) or teaches_session(auth.uid(), session_id))
  with check (is_admin(auth.uid()) or teaches_session(auth.uid(), session_id));

-- submissions
create policy "submissions_select" on submissions for select
  using (
    is_admin(auth.uid())
    or student_id = auth.uid()
    or teaches_session(auth.uid(), session_id)
  );
create policy "submissions_insert_own" on submissions for insert
  with check (student_id = auth.uid() or is_admin(auth.uid()));
create policy "submissions_update" on submissions for update
  using (
    is_admin(auth.uid())
    or student_id = auth.uid()
    or teaches_session(auth.uid(), session_id)
  );
create policy "submissions_delete_staff" on submissions for delete
  using (is_admin(auth.uid()) or teaches_session(auth.uid(), session_id));

-- attendance
create policy "attendance_select" on attendance for select
  using (
    is_admin(auth.uid())
    or student_id = auth.uid()
    or teaches_session(auth.uid(), session_id)
  );
create policy "attendance_write_staff" on attendance for all
  using (is_admin(auth.uid()) or teaches_session(auth.uid(), session_id))
  with check (is_admin(auth.uid()) or teaches_session(auth.uid(), session_id));

-- notifications
create policy "notifications_select_own" on notifications for select
  using (user_id = auth.uid());
create policy "notifications_update_own" on notifications for update
  using (user_id = auth.uid());
create policy "notifications_insert_staff" on notifications for insert
  with check (is_staff(auth.uid()) or user_id = auth.uid());
create policy "notifications_delete_own" on notifications for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('course-media', 'course-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

-- course-media: readable by anyone, writable by staff
create policy "course_media_read" on storage.objects for select
  using (bucket_id = 'course-media');
create policy "course_media_write_staff" on storage.objects for insert
  with check (bucket_id = 'course-media' and is_staff(auth.uid()));
create policy "course_media_update_staff" on storage.objects for update
  using (bucket_id = 'course-media' and is_staff(auth.uid()));
create policy "course_media_delete_staff" on storage.objects for delete
  using (bucket_id = 'course-media' and is_staff(auth.uid()));

-- submissions: students manage their own folder (named by their uid), staff can read all
create policy "submissions_read" on storage.objects for select
  using (
    bucket_id = 'submissions'
    and (is_staff(auth.uid()) or (storage.foldername(name))[1] = auth.uid()::text)
  );
create policy "submissions_write_own" on storage.objects for insert
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "submissions_update_own" on storage.objects for update
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "submissions_delete_own" on storage.objects for delete
  using (
    bucket_id = 'submissions'
    and (is_staff(auth.uid()) or (storage.foldername(name))[1] = auth.uid()::text)
  );
