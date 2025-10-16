-- Drop the old constraint that only allowed trip-specific notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with expanded types to support all notification scenarios
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'trip_approved',
  'trip_rejected', 
  'trip_assigned',
  'conflict_detected',
  'maintenance_due',
  'info',
  'success',
  'warning',
  'error'
));