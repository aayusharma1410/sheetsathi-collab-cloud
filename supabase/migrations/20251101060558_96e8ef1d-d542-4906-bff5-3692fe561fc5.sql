-- Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view owned or shared spreadsheets" ON public.spreadsheets;

-- Create a security definer function to check if user can access spreadsheet
CREATE OR REPLACE FUNCTION public.can_access_spreadsheet(_spreadsheet_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.spreadsheets s
    WHERE s.id = _spreadsheet_id
    AND (
      s.user_id = _user_id
      OR s.is_public = true
      OR s.is_template = true
      OR EXISTS (
        SELECT 1
        FROM public.spreadsheet_permissions sp
        WHERE sp.spreadsheet_id = s.id
        AND sp.user_id = _user_id
      )
    )
  )
$$;

-- Create new RLS policy using the security definer function
CREATE POLICY "Users can view accessible spreadsheets" 
ON public.spreadsheets 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR is_public = true 
  OR is_template = true 
  OR EXISTS (
    SELECT 1
    FROM spreadsheet_permissions
    WHERE spreadsheet_permissions.spreadsheet_id = spreadsheets.id
    AND spreadsheet_permissions.user_id = auth.uid()
  )
);

-- Drop the problematic cells RLS policy
DROP POLICY IF EXISTS "Users can edit cells in spreadsheets they can edit" ON public.cells;

-- Create a security definer function to check edit permission
CREATE OR REPLACE FUNCTION public.can_edit_spreadsheet(_spreadsheet_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.spreadsheets s
    WHERE s.id = _spreadsheet_id
    AND (
      s.user_id = _user_id
      OR EXISTS (
        SELECT 1
        FROM public.spreadsheet_permissions sp
        WHERE sp.spreadsheet_id = s.id
        AND sp.user_id = _user_id
        AND sp.permission_level = 'edit'
      )
    )
  )
$$;

-- Create new cells edit policy using security definer function
CREATE POLICY "Users can edit accessible cells"
ON public.cells
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM spreadsheets s
    WHERE s.id = cells.spreadsheet_id
    AND (
      s.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM spreadsheet_permissions sp
        WHERE sp.spreadsheet_id = s.id
        AND sp.user_id = auth.uid()
        AND sp.permission_level = 'edit'
      )
    )
  )
);