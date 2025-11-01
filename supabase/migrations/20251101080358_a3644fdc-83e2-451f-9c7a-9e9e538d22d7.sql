-- Create activity log table
CREATE TABLE public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spreadsheet_id uuid NOT NULL REFERENCES spreadsheets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  row_index integer,
  col_index integer,
  old_value text,
  new_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view activity for spreadsheets they have access to
CREATE POLICY "Users can view activity for accessible spreadsheets"
ON public.activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM spreadsheets s
    WHERE s.id = activity_log.spreadsheet_id
    AND (
      s.user_id = auth.uid()
      OR s.is_public = true
      OR can_access_spreadsheet(s.id, auth.uid())
    )
  )
);

-- Users can create activity logs when they edit
CREATE POLICY "Users can create activity logs"
ON public.activity_log
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM spreadsheets s
    WHERE s.id = activity_log.spreadsheet_id
    AND (
      s.user_id = auth.uid()
      OR can_edit_spreadsheet(s.id, auth.uid())
    )
  )
);

-- Create index for faster queries
CREATE INDEX idx_activity_log_spreadsheet ON activity_log(spreadsheet_id, created_at DESC);