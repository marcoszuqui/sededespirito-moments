-- Create photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  ai_description TEXT,
  event_date DATE DEFAULT CURRENT_DATE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Allow public read access to photos
CREATE POLICY "Anyone can view photos"
  ON public.photos
  FOR SELECT
  USING (true);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('baptism-photos', 'baptism-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to bucket
CREATE POLICY "Anyone can view baptism photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'baptism-photos');

-- Allow authenticated users to upload (for future admin functionality)
CREATE POLICY "Authenticated users can upload baptism photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'baptism-photos' AND auth.role() = 'authenticated');