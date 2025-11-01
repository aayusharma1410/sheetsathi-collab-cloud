-- Drop the problematic SELECT policy on spreadsheets
DROP POLICY IF EXISTS "Users can view accessible spreadsheets" ON public.spreadsheets;

-- Create a simple, non-recursive SELECT policy for spreadsheets
-- This allows users to see their own spreadsheets, public ones, and templates
CREATE POLICY "Users can view accessible spreadsheets" 
ON public.spreadsheets 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR is_public = true 
  OR is_template = true
);

-- Create a separate policy for shared spreadsheets using the security definer function
CREATE POLICY "Users can view shared spreadsheets" 
ON public.spreadsheets 
FOR SELECT 
USING (
  public.can_access_spreadsheet(id, auth.uid())
);