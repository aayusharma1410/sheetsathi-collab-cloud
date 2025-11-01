-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create spreadsheets table
CREATE TABLE public.spreadsheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_template BOOLEAN DEFAULT FALSE,
  template_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spreadsheets ENABLE ROW LEVEL SECURITY;

-- Create policies for spreadsheets
CREATE POLICY "Users can view their own spreadsheets"
ON public.spreadsheets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spreadsheets"
ON public.spreadsheets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spreadsheets"
ON public.spreadsheets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spreadsheets"
ON public.spreadsheets
FOR DELETE
USING (auth.uid() = user_id);

-- Create cells table
CREATE TABLE public.cells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spreadsheet_id UUID NOT NULL REFERENCES public.spreadsheets(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  col_index INTEGER NOT NULL,
  value TEXT,
  formula TEXT,
  format JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(spreadsheet_id, row_index, col_index)
);

-- Enable RLS
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;

-- Create policies for cells
CREATE POLICY "Users can view cells of their spreadsheets"
ON public.cells
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.spreadsheets
    WHERE spreadsheets.id = cells.spreadsheet_id
    AND spreadsheets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create cells in their spreadsheets"
ON public.cells
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.spreadsheets
    WHERE spreadsheets.id = cells.spreadsheet_id
    AND spreadsheets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update cells in their spreadsheets"
ON public.cells
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.spreadsheets
    WHERE spreadsheets.id = cells.spreadsheet_id
    AND spreadsheets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete cells in their spreadsheets"
ON public.cells
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.spreadsheets
    WHERE spreadsheets.id = cells.spreadsheet_id
    AND spreadsheets.user_id = auth.uid()
  )
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cell_id UUID NOT NULL REFERENCES public.cells(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Users can view comments on their spreadsheet cells"
ON public.comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cells
    JOIN public.spreadsheets ON spreadsheets.id = cells.spreadsheet_id
    WHERE cells.id = comments.cell_id
    AND spreadsheets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create comments on their spreadsheet cells"
ON public.comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.cells
    JOIN public.spreadsheets ON spreadsheets.id = cells.spreadsheet_id
    WHERE cells.id = comments.cell_id
    AND spreadsheets.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create triggers
CREATE TRIGGER update_spreadsheets_updated_at
BEFORE UPDATE ON public.spreadsheets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cells_updated_at
BEFORE UPDATE ON public.cells
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.spreadsheets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cells;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;