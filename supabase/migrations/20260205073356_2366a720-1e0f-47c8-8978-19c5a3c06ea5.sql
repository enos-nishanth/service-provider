-- Fix the overly permissive INSERT policy by restricting to authenticated users
DROP POLICY "Service role can insert notifications" ON public.notifications;

-- Allow authenticated users to insert notifications (for triggering from client-side)
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);