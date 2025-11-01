-- Add notes column to spreadsheets table
ALTER TABLE public.spreadsheets
ADD COLUMN notes text;