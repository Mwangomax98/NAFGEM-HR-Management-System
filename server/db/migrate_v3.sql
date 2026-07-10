-- Drop employee documents (replaced by staff_requests)
DROP TABLE IF EXISTS public.employee_documents CASCADE;
DROP TYPE IF EXISTS public.document_type;

CREATE TABLE IF NOT EXISTS public.staff_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ref_number TEXT NOT NULL,
  request_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  requester_name TEXT,
  hr_comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  admin_comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  hr_approved_date TIMESTAMPTZ,
  final_decision_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_requests_requester ON public.staff_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_staff_requests_status ON public.staff_requests(status);
