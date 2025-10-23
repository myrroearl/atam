-- =========================
-- ACCOUNTS
-- =========================
CREATE TABLE accounts (
    account_id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('student','professor','admin')) NOT NULL,
    status TEXT CHECK (status IN ('active','inactive','suspended')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);



-- =========================
-- DEPARTMENTS
-- =========================
CREATE TABLE departments (
    department_id BIGSERIAL PRIMARY KEY,
    department_name TEXT NOT NULL,
    description TEXT,
    dean_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- COURSES
-- =========================
CREATE TABLE courses (
    course_id BIGSERIAL PRIMARY KEY,
    department_id BIGINT REFERENCES departments(department_id),
    course_code TEXT UNIQUE NOT NULL,
    course_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- YEAR LEVEL
-- =========================
CREATE TABLE year_level (
    year_level_id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    course_id BIGINT REFERENCES courses(course_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- SEMESTER
-- =========================
CREATE TABLE semester (
    semester_id BIGSERIAL PRIMARY KEY,
    semester_name TEXT NOT NULL,
    year_level_id BIGINT REFERENCES year_level(year_level_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- SUBJECTS
-- =========================
CREATE TABLE subjects (
    subject_id BIGSERIAL PRIMARY KEY,
    course_id BIGINT REFERENCES courses(course_id),
    year_level_id BIGINT REFERENCES year_level(year_level_id),
    semester_id BIGINT REFERENCES semester(semester_id),
    subject_code TEXT UNIQUE NOT NULL,
    subject_name TEXT NOT NULL,
    units INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- SECTIONS
-- =========================
CREATE TABLE sections (
    section_id BIGSERIAL PRIMARY KEY,
    section_name TEXT NOT NULL,
    year_level_id BIGINT REFERENCES year_level(year_level_id),
    course_id BIGINT REFERENCES courses(course_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- STUDENTS
-- =========================
CREATE TABLE students (
    student_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT REFERENCES accounts(account_id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    birthday DATE,
    address TEXT,
    contact_number TEXT,
    section_id BIGINT REFERENCES sections(section_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- PROFESSORS
-- =========================
CREATE TABLE professors (
    prof_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT REFERENCES accounts(account_id) ON DELETE CASCADE,
    department_id BIGINT REFERENCES departments(department_id),
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    birthday DATE,
    address TEXT,
    contact_number TEXT,
    faculty_type TEXT,
    preferred_time TEXT,
    preferred_days TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- CLASSES
-- =========================
CREATE TABLE classes (
    class_id BIGSERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    subject_id BIGINT REFERENCES subjects(subject_id),
    section_id BIGINT REFERENCES sections(section_id),
    professor_id BIGINT REFERENCES professors(prof_id),
    schedule_start TIMESTAMPTZ,
    schedule_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- GRADE COMPONENTS
-- =========================
CREATE TABLE grade_components (
    component_id BIGSERIAL PRIMARY KEY,
    department_id BIGINT REFERENCES departments(department_id),
    component_name TEXT NOT NULL,
    weight_percentage NUMERIC(5,2) CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- LEARNING OUTCOMES
-- =========================
CREATE TABLE learning_outcomes (
    outcome_id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT REFERENCES subjects(subject_id),
    outcome_code TEXT NOT NULL, 
    outcome_description TEXT,
    proficiency_level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

create table public.grade_entries (
  grade_id bigserial not null,
  class_id bigint null,
  component_id bigint null,
  outcome_id bigint null,
  student_id bigint null,
  score numeric null,
  attendance text null,
  max_score numeric null,
  entry_type text null,
  date_recorded timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  grade_period text null,
  topics text[] null,
  name text null,
  status text null default 'active'::text,
  constraint grade_entries_pkey primary key (grade_id),
  constraint grade_entries_class_id_fkey foreign KEY (class_id) references classes (class_id),
  constraint grade_entries_component_id_fkey foreign KEY (component_id) references grade_components (component_id),
  constraint grade_entries_outcome_id_fkey foreign KEY (outcome_id) references learning_outcomes (outcome_id),
  constraint grade_entries_student_id_fkey foreign KEY (student_id) references students (student_id),
  constraint grade_entries_entry_type_check check (
    (
      entry_type = any (
        array[
          'manual entry'::text,
          'imported from gclass'::text
        ]
      )
    )
  ),
  constraint grade_entries_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'inactive'::text,
          'suspended'::text
        ]
      )
    )
  ),
  constraint grade_entries_attendance_check check (
    (
      attendance = any (
        array[
          'present'::text,
          'absent'::text,
          'late'::text,
          'excused'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- =========================
-- FINAL GRADES
-- =========================
CREATE TABLE final_grades (
    student_id BIGINT REFERENCES students(student_id),
    subject_id BIGINT REFERENCES subjects(subject_id),
    grade NUMERIC(5,2),
    completion TEXT,
    taken BOOLEAN DEFAULT TRUE,
    credited BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    year_taken INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(student_id, subject_id)
);

-- =========================
-- AI TOOLS USAGE
-- =========================
CREATE TABLE ai_tools_usage (
    usage_id BIGSERIAL PRIMARY KEY,
    professor_id BIGINT REFERENCES professors(prof_id),
    tool_type TEXT,
    request_text TEXT,
    generated_output TEXT,
    success BOOLEAN DEFAULT TRUE,
    date_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);



-- =========================
-- SCHOLARSHIPS
-- =========================
CREATE TABLE scholarships (
    scholarship_id BIGSERIAL PRIMARY KEY,
    scholarship_name TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    application_link TEXT,
    eligibility_criteria TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT REFERENCES accounts(account_id),
    message TEXT NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'unread',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- SYSTEM SETTINGS
-- =========================
CREATE TABLE system_settings (
    setting_id BIGSERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- ACTIVITY LOGS
-- =========================
CREATE TABLE activity_logs (
    log_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT REFERENCES accounts(account_id),
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Table: learning_resources
create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(),          -- unique identifier for each resource
  title text not null,                                    -- title of the learning resource
  description text,                                       -- short description or summary
  type varchar(50) not null,                              -- e.g., 'video', 'book', 'article', 'course'
  source varchar(100) not null,                           -- source API (YouTube, Google Books, Wikipedia, etc.)
  url text not null,                                      -- direct link to the resource
  author text,                                            -- author, creator, or publisher
  topics text[],                                          -- array of main topics (e.g. ['Math', 'Algebra'])
  tags text[],                                            -- array of tags or keywords
  likes int default 0,                                    -- number of user likes
  dislikes int default 0,                                 -- number of user dislikes
  is_active boolean default true                          -- soft delete or active toggle
);

