-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Dossier status enum
CREATE TYPE public.dossier_status AS ENUM ('em_analise', 'pendente', 'completo', 'arquivado');

-- Dossiers table
CREATE TABLE public.dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    client_name TEXT,
    reference_code TEXT,
    status public.dossier_status NOT NULL DEFAULT 'em_analise',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dossiers"
ON public.dossiers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create dossiers"
ON public.dossiers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dossiers"
ON public.dossiers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dossiers"
ON public.dossiers FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_dossiers_updated_at
BEFORE UPDATE ON public.dossiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Document type enum
CREATE TYPE public.document_type AS ENUM ('pdf', 'imagem', 'texto', 'outro');

-- Documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES public.dossiers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    document_type public.document_type NOT NULL DEFAULT 'outro',
    file_path TEXT,
    file_name TEXT,
    entity TEXT,
    document_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
ON public.documents FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create documents"
ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.documents FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.documents FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Chronology entries table
CREATE TABLE public.chronology_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES public.dossiers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    event_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    source_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chronology_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chronology entries"
ON public.chronology_entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create chronology entries"
ON public.chronology_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chronology entries"
ON public.chronology_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chronology entries"
ON public.chronology_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_chronology_entries_updated_at
BEFORE UPDATE ON public.chronology_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Treasury entry type enum
CREATE TYPE public.treasury_type AS ENUM ('receita', 'despesa');

-- Treasury entries table (personal finances)
CREATE TABLE public.treasury_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    entry_type public.treasury_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.treasury_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own treasury entries"
ON public.treasury_entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create treasury entries"
ON public.treasury_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own treasury entries"
ON public.treasury_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own treasury entries"
ON public.treasury_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_treasury_entries_updated_at
BEFORE UPDATE ON public.treasury_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Contact form messages (public, no auth required for insert)
CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit contact form
CREATE POLICY "Anyone can submit contact form"
ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Only authenticated users can read messages
CREATE POLICY "Authenticated users can read messages"
ON public.contact_messages FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update messages"
ON public.contact_messages FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);