-- Add category column to dossiers table
ALTER TABLE public.dossiers 
ADD COLUMN category text DEFAULT 'outros';

-- Add a check constraint for valid categories
ALTER TABLE public.dossiers 
ADD CONSTRAINT dossiers_category_check 
CHECK (category IN ('consumo', 'telecomunicacoes', 'transito', 'fiscal', 'trabalho', 'outros'));