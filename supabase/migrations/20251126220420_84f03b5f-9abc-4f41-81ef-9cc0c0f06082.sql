-- Criar tabela de tarefas
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para acesso público (para demonstração acadêmica)
CREATE POLICY "Allow public read access" 
ON public.tasks 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert" 
ON public.tasks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update" 
ON public.tasks 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete" 
ON public.tasks 
FOR DELETE 
USING (true);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();