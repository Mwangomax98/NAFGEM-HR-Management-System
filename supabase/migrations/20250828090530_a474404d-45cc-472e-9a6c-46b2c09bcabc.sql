-- Fix the security events check constraint to include 'role_assignment' event type
ALTER TABLE public.security_events 
DROP CONSTRAINT security_events_event_type_check;

ALTER TABLE public.security_events 
ADD CONSTRAINT security_events_event_type_check 
CHECK (event_type = ANY (ARRAY[
  'login_success'::text, 
  'login_failed'::text, 
  'logout'::text, 
  'permission_denied'::text, 
  'data_access'::text, 
  'role_change'::text,
  'role_assignment'::text,
  'role_modification'::text,
  'role_revocation'::text,
  'security_anomaly_detected'::text,
  'sensitive_data_modification'::text
]));