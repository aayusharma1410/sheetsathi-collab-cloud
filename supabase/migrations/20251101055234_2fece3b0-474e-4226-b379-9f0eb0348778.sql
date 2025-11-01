-- Create profiles table for user names
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone (for sharing features)
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add access_code to spreadsheets
ALTER TABLE public.spreadsheets
ADD COLUMN access_code text,
ADD COLUMN is_public boolean DEFAULT false;

-- Create spreadsheet_permissions table
CREATE TABLE public.spreadsheet_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spreadsheet_id uuid REFERENCES public.spreadsheets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level text NOT NULL CHECK (permission_level IN ('view', 'edit')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(spreadsheet_id, user_id)
);

-- Enable RLS on permissions
ALTER TABLE public.spreadsheet_permissions ENABLE ROW LEVEL SECURITY;

-- Users can view permissions for spreadsheets they own or have access to
CREATE POLICY "Users can view permissions they have access to"
ON public.spreadsheet_permissions
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.spreadsheets
    WHERE id = spreadsheet_id AND user_id = auth.uid()
  )
);

-- Owners can manage permissions
CREATE POLICY "Owners can manage permissions"
ON public.spreadsheet_permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.spreadsheets
    WHERE id = spreadsheet_id AND user_id = auth.uid()
  )
);

-- Update spreadsheets RLS policies to include shared spreadsheets
DROP POLICY IF EXISTS "Users can view their own spreadsheets" ON public.spreadsheets;

CREATE POLICY "Users can view owned or shared spreadsheets"
ON public.spreadsheets
FOR SELECT
USING (
  auth.uid() = user_id OR
  is_public = true OR
  is_template = true OR
  EXISTS (
    SELECT 1 FROM public.spreadsheet_permissions
    WHERE spreadsheet_id = spreadsheets.id AND user_id = auth.uid()
  )
);

-- Update cells RLS to include shared spreadsheets
DROP POLICY IF EXISTS "Users can view cells of their spreadsheets" ON public.cells;
DROP POLICY IF EXISTS "Users can update cells in their spreadsheets" ON public.cells;
DROP POLICY IF EXISTS "Users can create cells in their spreadsheets" ON public.cells;
DROP POLICY IF EXISTS "Users can delete cells in their spreadsheets" ON public.cells;

CREATE POLICY "Users can view cells of accessible spreadsheets"
ON public.cells
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.spreadsheets s
    WHERE s.id = cells.spreadsheet_id AND (
      s.user_id = auth.uid() OR
      s.is_public = true OR
      s.is_template = true OR
      EXISTS (
        SELECT 1 FROM public.spreadsheet_permissions sp
        WHERE sp.spreadsheet_id = s.id AND sp.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can edit cells in spreadsheets they can edit"
ON public.cells
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.spreadsheets s
    WHERE s.id = cells.spreadsheet_id AND (
      s.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.spreadsheet_permissions sp
        WHERE sp.spreadsheet_id = s.id 
        AND sp.user_id = auth.uid() 
        AND sp.permission_level = 'edit'
      )
    )
  )
);