-- ================================================================
-- Phase 5 Safety Systems
-- ================================================================

-- Add safety columns to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS strikes        int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until   timestamptz,
  ADD COLUMN IF NOT EXISTS parent_email   text;

-- Reports table (one report per reporter per drawing)
CREATE TABLE IF NOT EXISTS public.reports (
  id                uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_user_id  uuid         REFERENCES public.users(id),
  reported_user_id  uuid         REFERENCES public.users(id),
  drawing_id        uuid         REFERENCES public.drawings(id),
  match_id          uuid         REFERENCES public.matches(id),
  created_at        timestamptz  DEFAULT now(),
  UNIQUE(reporter_user_id, drawing_id)
);

-- RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert reports"
  ON public.reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read reports"
  ON public.reports FOR SELECT
  USING (true);

-- Allow updating strikes/locked_until on users
CREATE POLICY "Anyone can update user safety fields"
  ON public.users FOR UPDATE
  USING (true)
  WITH CHECK (true);
