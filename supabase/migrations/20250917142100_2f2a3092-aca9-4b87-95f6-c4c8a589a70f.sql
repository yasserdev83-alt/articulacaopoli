-- Create agents table
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leadership_roles table
CREATE TABLE public.leadership_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create productivity_records table
CREATE TABLE public.productivity_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  leadership_role_id UUID NOT NULL REFERENCES public.leadership_roles(id) ON DELETE CASCADE,
  updates_count INTEGER NOT NULL CHECK (updates_count > 0),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productivity_records ENABLE ROW LEVEL SECURITY;

-- Create policies for agents (public read access)
CREATE POLICY "Anyone can view agents" 
ON public.agents 
FOR SELECT 
USING (true);

-- Create policies for leadership_roles (public read access)
CREATE POLICY "Anyone can view leadership roles" 
ON public.leadership_roles 
FOR SELECT 
USING (true);

-- Create policies for productivity_records (public access for now)
CREATE POLICY "Anyone can view productivity records" 
ON public.productivity_records 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create productivity records" 
ON public.productivity_records 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update productivity records" 
ON public.productivity_records 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete productivity records" 
ON public.productivity_records 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_productivity_records_updated_at
BEFORE UPDATE ON public.productivity_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default agents
INSERT INTO public.agents (name) VALUES
  ('Ana Silva'),
  ('Carlos Santos'),
  ('Maria Oliveira'),
  ('João Pereira'),
  ('Fernanda Costa'),
  ('Ricardo Lima'),
  ('Juliana Moraes'),
  ('Pedro Alves');

-- Insert default leadership roles
INSERT INTO public.leadership_roles (name) VALUES
  ('Coordenador de Vendas'),
  ('Supervisor de Marketing'),
  ('Gerente de Projetos'),
  ('Líder de Equipe'),
  ('Diretor Regional'),
  ('Coordenador de RH');

-- Create indexes for better performance
CREATE INDEX idx_productivity_records_agent_id ON public.productivity_records(agent_id);
CREATE INDEX idx_productivity_records_leadership_role_id ON public.productivity_records(leadership_role_id);
CREATE INDEX idx_productivity_records_date ON public.productivity_records(date);
CREATE INDEX idx_productivity_records_created_at ON public.productivity_records(created_at);