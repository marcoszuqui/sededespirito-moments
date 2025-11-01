-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela de roles de usuários
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Criar função security definer para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Atualizar tabela photos
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS faces_count integer,
ADD COLUMN IF NOT EXISTS setting text,
ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id);

-- Políticas RLS para photos (permitir admins fazerem insert/update/delete)
CREATE POLICY "Admins can insert photos"
ON public.photos
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update photos"
ON public.photos
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete photos"
ON public.photos
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para tornar o primeiro usuário admin
CREATE OR REPLACE FUNCTION public.handle_first_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se não existem usuários com role admin, torna este admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Senão, torna usuário comum
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_first_user();

-- Políticas de storage para baptism-photos bucket
-- Permitir INSERT apenas para admins
CREATE POLICY "Admins can upload photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'baptism-photos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Permitir UPDATE apenas para admins
CREATE POLICY "Admins can update photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'baptism-photos'
  AND public.has_role(auth.uid(), 'admin')
);

-- Permitir DELETE apenas para admins
CREATE POLICY "Admins can delete photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'baptism-photos'
  AND public.has_role(auth.uid(), 'admin')
);