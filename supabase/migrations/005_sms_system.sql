-- ==============================================================================
-- EDUCO LMS - 005_sms_system.sql
-- Automated SMS Reminder System: Settings, Dual-Gateway Devices, Queue & Logs
-- ==============================================================================

-- 1. Ensure father_phone and mother_phone exist on public.profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'father_phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN father_phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'mother_phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN mother_phone TEXT;
  END IF;
END $$;

-- 2. SMS_SETTINGS table (Single-row configuration for Owner)
CREATE TABLE IF NOT EXISTS public.sms_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  schedule_days JSONB NOT NULL DEFAULT '[1, 5, 10, 15, 20, 25]'::jsonb,
  schedule_time TEXT NOT NULL DEFAULT '10:00',
  target_recipient TEXT NOT NULL DEFAULT 'father_first' CHECK (target_recipient IN ('father_first', 'mother_first', 'student', 'both_parents')),
  message_template TEXT NOT NULL DEFAULT 'Hurmatli ota-ona! Farzandingiz {student_name}ning {course_name} kursi uchun {amount} so‘m to‘lov muddati yetib keldi ({due_date}). Iltimos, to‘lovni amalga oshiring. EDUCO',
  send_interval_seconds INTEGER NOT NULL DEFAULT 4 CHECK (send_interval_seconds >= 1 AND send_interval_seconds <= 60),
  max_retries INTEGER NOT NULL DEFAULT 3 CHECK (max_retries >= 1 AND max_retries <= 10),
  anti_duplicate_days INTEGER NOT NULL DEFAULT 15 CHECK (anti_duplicate_days >= 1 AND anti_duplicate_days <= 60),
  sender_name TEXT NOT NULL DEFAULT 'EDUCO',
  notify_owner_on_failure BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings row if table is empty
INSERT INTO public.sms_settings (is_enabled, schedule_time, target_recipient)
SELECT false, '10:00', 'father_first'
WHERE NOT EXISTS (SELECT 1 FROM public.sms_settings);

-- 3. SMS_DEVICES table (Dual Android Gateway: Primary and Backup)
CREATE TABLE IF NOT EXISTS public.sms_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  device_role TEXT NOT NULL CHECK (device_role IN ('primary', 'backup')),
  gateway_url TEXT NOT NULL,
  api_token TEXT,
  headers JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen_at TIMESTAMPTZ,
  last_error TEXT,
  phone_number TEXT,
  battery_level INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(device_role)
);

-- 4. SMS_QUEUE table (Job queue for automated reminders)
CREATE TABLE IF NOT EXISTS public.sms_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  recipient_type TEXT NOT NULL DEFAULT 'parent' CHECK (recipient_type IN ('father', 'mother', 'student', 'parent')),
  message_text TEXT NOT NULL,
  amount_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  course_name TEXT,
  group_name TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  device_id UUID REFERENCES public.sms_devices(id) ON DELETE SET NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  billing_period TEXT NOT NULL, -- e.g., '2026-10'
  idempotency_key TEXT UNIQUE NOT NULL, -- Prevents duplicate billing SMS for same student in same period
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SMS_LOGS table (Audit log of outgoing SMS events)
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_id UUID REFERENCES public.sms_queue(id) ON DELETE SET NULL,
  device_id UUID REFERENCES public.sms_devices(id) ON DELETE SET NULL,
  recipient_phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'retry')),
  response_payload JSONB DEFAULT '{}'::jsonb,
  error_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_queue_status ON public.sms_queue(status);
CREATE INDEX IF NOT EXISTS idx_sms_queue_scheduled ON public.sms_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sms_queue_student_period ON public.sms_queue(student_id, billing_period);
CREATE INDEX IF NOT EXISTS idx_sms_devices_role ON public.sms_devices(device_role);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON public.sms_logs(created_at DESC);

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trg_set_updated_at_sms_settings ON public.sms_settings;
CREATE TRIGGER trg_set_updated_at_sms_settings
  BEFORE UPDATE ON public.sms_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_sms_devices ON public.sms_devices;
CREATE TRIGGER trg_set_updated_at_sms_devices
  BEFORE UPDATE ON public.sms_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_sms_queue ON public.sms_queue;
CREATE TRIGGER trg_set_updated_at_sms_queue
  BEFORE UPDATE ON public.sms_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - OWNER ONLY ACCESS
-- ==============================================================================

ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- SMS_SETTINGS: Only Owner can read and write
DROP POLICY IF EXISTS "Owner full access on sms_settings" ON public.sms_settings;
CREATE POLICY "Owner full access on sms_settings"
  ON public.sms_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- SMS_DEVICES: Only Owner can read and write
DROP POLICY IF EXISTS "Owner full access on sms_devices" ON public.sms_devices;
CREATE POLICY "Owner full access on sms_devices"
  ON public.sms_devices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- SMS_QUEUE: Only Owner can read and write
DROP POLICY IF EXISTS "Owner full access on sms_queue" ON public.sms_queue;
CREATE POLICY "Owner full access on sms_queue"
  ON public.sms_queue
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- SMS_LOGS: Only Owner can read and write
DROP POLICY IF EXISTS "Owner full access on sms_logs" ON public.sms_logs;
CREATE POLICY "Owner full access on sms_logs"
  ON public.sms_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
