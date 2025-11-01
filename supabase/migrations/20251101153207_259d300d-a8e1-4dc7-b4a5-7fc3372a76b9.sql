-- Atualizar configuração do bucket para permitir arquivos maiores e tipos específicos
UPDATE storage.buckets
SET 
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
WHERE id = 'baptism-photos';