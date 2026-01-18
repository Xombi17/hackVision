-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null unique,
  full_name text not null,
  role text check (role in ('student', 'admin')) not null default 'student',
  face_encoding jsonb, -- Storing 3D face mesh landmarks or embedding
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EXAMS TABLE
create table public.exams (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  start_time timestamp with time zone,
  duration_minutes integer not null,
  is_active boolean default false,
  rubric jsonb, -- Global grading rubric/instructions for the agent
  created_by uuid references public.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- QUESTIONS TABLE
create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  exam_id uuid references public.exams(id) on delete cascade not null,
  question_text text not null,
  question_type text check (question_type in ('objective', 'subjective')) not null,
  points integer default 10,
  reference_answer text, -- For AI semantic matching
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ATTEMPTS TABLE (Session)
create table public.attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  exam_id uuid references public.exams(id) not null,
  start_time timestamp with time zone default timezone('utc'::text, now()) not null,
  end_time timestamp with time zone,
  total_score numeric,
  status text check (status in ('in_progress', 'submitted', 'flagged')) default 'in_progress'
);

-- ANSWERS TABLE
create table public.answers (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references public.attempts(id) on delete cascade not null,
  question_id uuid references public.questions(id) not null,
  student_answer text,
  ai_score numeric,
  ai_feedback text,
  is_verified boolean default false, -- Admin override
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PROCTORING LOGS TABLE (Integrity)
create table public.proctoring_logs (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references public.attempts(id) on delete cascade not null,
  violation_type text check (violation_type in ('gaze_away', 'phone_detected', 'multiple_faces', 'tab_switch', 'voice_detected', 'fullscreen_exit')) not null,
  confidence_score numeric, -- 0.0 to 1.0 from ML model
  snapshot_url text, -- URL to evidence image in R2/Storage
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INTEGRITY REPORTS TABLE (AI Analysis)
create table public.integrity_reports (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references public.attempts(id) on delete cascade not null,
  risk_level text check (risk_level in ('LOW', 'MEDIUM', 'HIGH')) not null,
  verdict text not null,
  explanation text not null,
  model_used text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Basic Setup)
alter table public.users enable row level security;
alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.answers enable row level security;
alter table public.proctoring_logs enable row level security;
alter table public.integrity_reports enable row level security;

-- Students can read exams
create policy "Students can view active exams" on public.exams
  for select using (is_active = true);

-- Students can view their own attempts
create policy "Students view own attempts" on public.attempts
  for select using (auth.uid() = user_id);

-- Students can insert attempts
create policy "Students start attempts" on public.attempts
  for insert with check (auth.uid() = user_id);

-- Admins: Real app needs admin policy
