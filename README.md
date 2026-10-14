# EDUCO LMS — Enterprise Learning Management System

> Production-ready, secure, multilingual, role-governed Learning Management System built for the **EDUCO** Educational Center.

---

## 🎨 Branding & Identity

- **Navy Blue (Primary)**: `#123D78`
- **Brand Red (Accent & Alerts)**: `#F12D3A`
- **White**: `#FFFFFF`
- **Light Surface**: `#F5F7FA`
- **Dark Surface**: `#101827`

Logo assets: `public/educo-logo.svg`, `public/educo-logo.png`.

---

## 🚀 Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3
- **Routing**: React Router DOM 6
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & Realtime
- **State Management**: Zustand
- **Forms & Validation**: React Hook Form, Zod
- **Internationalization**: i18next, react-i18next (4 Languages: O'zbek, Русский, English, العربية with RTL)
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library, JSDOM
- **Hosting**: Vercel (Single Page Application configuration)

---

## 👥 Role-Based Architecture & Permissions

| Role | Responsibilities | Key Permissions |
|---|---|---|
| **Owner** | Highest executive authority | Full system control, User management (all roles), **Exclusive Payroll access** (salary rules, calculations, payments, CSV export), Audit log, Center settings. |
| **Administrator** | Academic operations manager | Create & manage Teachers & Students, Courses, Groups, Schedules, Rooms, Attendance reports, Tuition tracking. *Strictly blocked from Payroll and Audit log.* |
| **Teacher** | Faculty & Group educator | Timetable, Assigned Groups roster, Student Attendance marking, Grade entry (Scale 1–5), Homework creation, Materials upload, Group Chat. |
| **Student** | Learner | Profile, Active Group schedule, Personal Attendance records, Grades (1–5), Homework submission, Group Chat, Learning materials. *Cannot view other students' records.* |

---

## 🔐 Database Security & Row Level Security (RLS)

All 24 database tables are protected with strict PostgreSQL RLS policies in `supabase/migrations/`:

1. `001_initial_schema.sql`: Core tables, UUID keys, foreign key cascades, constraints (e.g. `CHECK (grade >= 1 AND grade <= 5)`).
2. `002_rls_policies.sql`: Role-based security policies. **Payroll tables are Owner-only at the database engine level.**
3. `003_functions_triggers.sql`: Triggers for `updated_at`, self-promotion prevention, automatic audit logging, and group capacity enforcement.
4. `004_storage.sql`: Private buckets for `chat-media`, `homework-files`, and `materials`, with public `avatars`.

---

## ⚡ Secure First Owner Account Bootstrap

To initialize the primary Owner account securely without opening public registration:

1. In your **Supabase Dashboard**, navigate to **Authentication -> Users** and create an account (e.g. `owner@educo.uz`).
2. Run the following SQL query in the **SQL Editor**:

```sql
-- Replace <USER_UUID> with the newly created Auth user ID:
INSERT INTO public.profiles (id, username, first_name, last_name, language, theme)
VALUES ('<USER_UUID>', 'owner', 'EDUCO', 'Director', 'uz', 'light')
ON CONFLICT (id) DO UPDATE SET username = 'owner';

INSERT INTO public.user_roles (user_id, role)
VALUES ('<USER_UUID>', 'owner')
ON CONFLICT (user_id, role) DO NOTHING;
```

3. Sign in through the `/login` portal with the Owner credentials.

---

## 🌍 Multilingual & RTL Support

EDUCO LMS supports 4 complete languages:
- **O'zbek** (`uz`) — Latin script
- **Русский** (`ru`) — Russian
- **English** (`en`) — English
- **العربية** (`ar`) — Arabic with full Right-to-Left (RTL) layout switching via `dir="rtl"`

Switch languages anytime using the header selector or profile settings.

---

## 🎥 Telegram-Style Group Chat & Rectangular Video Recorder

- **Independent Cohort Chats**: Each group has a isolated real-time chat channel.
- **Media Messaging**: Send text, emojis, photos, voice notes, and video notes.
- **Rectangular Video Camera**:
  - Maximum 60 seconds duration timer.
  - Rectangular preview and playback (`aspect-video`). Strictly non-circular.
  - Camera switching (Front / Rear).
  - Browser detection with graceful file-upload fallback for unsupported devices.

---

## 💰 Owner-Only Payroll System

- **3 Salary Methods**:
  1. Fixed Monthly salary.
  2. Hourly salary.
  3. Per-lesson salary (calculated from approved, completed lessons).
- Attendance-based adjustments, bonuses, and deductions.
- Disbursement tracking and CSV export.
- **Enforced at the PostgreSQL engine level via RLS.**

---

## 🧪 Testing & Verification

Run the automated test suites:

```bash
npm test
```

Verification covers:
- Core constants, brand colors, and status codes.
- 100% key parity across all 4 translations.
- Role-based authorization & self-promotion prevention.
- Scale 1–5 grade validation.
- Payroll calculation formulas.
- Video recorder specs and fallback handling.

Run production build:

```bash
npm run build
```

---

## 🌐 Deployment to Vercel

1. Push this repository to GitHub or GitLab.
2. Import project into [Vercel](https://vercel.com).
3. Set Environment Variables in Project Settings:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
4. Deploy! `vercel.json` provides rewrite rules for SPA client routing.
