-- Criar tabela de eventos
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  location text,
  thumbnail_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Políticas: Todos podem ver, apenas admins gerenciam
CREATE POLICY "Anyone can view events"
ON public.events
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert events"
ON public.events
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update events"
ON public.events
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete events"
ON public.events
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Atualizar tabela photos para suportar eventos e vídeos
ALTER TABLE public.photos 
  ADD COLUMN event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN media_type text DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
  ADD COLUMN duration integer,
  ADD COLUMN thumbnail_url text,
  ADD COLUMN file_size bigint,
  ADD COLUMN order_index integer DEFAULT 0;

-- Criar índices para performance
CREATE INDEX idx_photos_event_id ON public.photos(event_id);
CREATE INDEX idx_photos_media_type ON public.photos(media_type);
CREATE INDEX idx_photos_order_index ON public.photos(order_index);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para vídeos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'baptism-videos',
  'baptism-videos',
  true,
  524288000,
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm']
);

-- Políticas de storage para vídeos
CREATE POLICY "Anyone can view videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'baptism-videos');

CREATE POLICY "Admins can upload videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'baptism-videos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update videos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'baptism-videos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'baptism-videos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);