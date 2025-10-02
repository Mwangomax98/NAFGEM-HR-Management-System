-- Phase 1: Fix Critical RLS Issue - Allow users to update their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Phase 2: Enable Real-Time Notifications
-- Add notifications table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Set REPLICA IDENTITY FULL to capture complete row data during updates
ALTER TABLE notifications REPLICA IDENTITY FULL;