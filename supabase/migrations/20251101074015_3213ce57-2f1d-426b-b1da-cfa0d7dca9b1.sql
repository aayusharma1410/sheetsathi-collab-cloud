-- Drop the existing restrictive policy for editing cells
DROP POLICY IF EXISTS "Users can edit accessible cells" ON public.cells;

-- Create a new policy that allows owners and users with edit permission to modify cells
CREATE POLICY "Users can edit cells with permission" 
ON public.cells 
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.spreadsheets s
    WHERE s.id = cells.spreadsheet_id
    AND (
      -- User is the owner
      s.user_id = auth.uid()
      OR
      -- User has edit permission
      public.can_edit_spreadsheet(s.id, auth.uid())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.spreadsheets s
    WHERE s.id = cells.spreadsheet_id
    AND (
      -- User is the owner
      s.user_id = auth.uid()
      OR
      -- User has edit permission
      public.can_edit_spreadsheet(s.id, auth.uid())
    )
  )
);