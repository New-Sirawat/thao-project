-- SQL Database Migration File for Supabase
-- Paste this entire file into the Supabase SQL Editor and click 'Run'.

-- ============================================================================
-- 1. Users Table
-- Note: Supabase handles authentication in auth.users. 
-- We map our custom public.users table to auth.users using the same ID.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Student',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. LeaveRequest Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."LeaveRequest" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. Attendance Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."Attendance" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'present',
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION
);

-- ============================================================================
-- 4. TrainingProgram Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."TrainingProgram" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    image_url TEXT,
    pdf_url TEXT,
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. TrainingSyllabus Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."TrainingSyllabus" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_id UUID NOT NULL REFERENCES public."TrainingProgram"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false
);

-- ============================================================================
-- 6. Schedule Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."Schedule" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    time_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_end TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. Notification Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."Notification" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. Announcement Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."Announcement" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 9. Question Table (Q&A Board)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."Question" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public."TrainingProgram"(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 10. Reply Table (Q&A Board)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public."Reply" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public."Question"(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
