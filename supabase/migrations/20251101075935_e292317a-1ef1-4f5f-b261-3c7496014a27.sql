-- Drop the old restrictive policy for viewing comments
DROP POLICY IF EXISTS "Users can view comments on their spreadsheet cells" ON comments;

-- Create new policy that allows viewing comments if user can access the spreadsheet
CREATE POLICY "Users can view comments on accessible spreadsheets"
ON comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM cells
    JOIN spreadsheets ON spreadsheets.id = cells.spreadsheet_id
    WHERE cells.id = comments.cell_id
    AND (
      spreadsheets.user_id = auth.uid() 
      OR spreadsheets.is_public = true
      OR can_access_spreadsheet(spreadsheets.id, auth.uid())
    )
  )
);

-- Update the insert policy to allow users with edit permission to add comments
DROP POLICY IF EXISTS "Users can create comments on their spreadsheet cells" ON comments;

CREATE POLICY "Users can create comments with edit permission"
ON comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM cells
    JOIN spreadsheets ON spreadsheets.id = cells.spreadsheet_id
    WHERE cells.id = comments.cell_id
    AND (
      spreadsheets.user_id = auth.uid()
      OR can_edit_spreadsheet(spreadsheets.id, auth.uid())
    )
  )
);