-- Update leadership roles with new positions
DELETE FROM public.leadership_roles;

INSERT INTO public.leadership_roles (name) VALUES 
('Prefeito'),
('Vice-Prefeito'),
('Ex Prefeito'),
('Cand. Prefeito'),
('Vereador'),
('Suplente Vereador'),
('Lideranças'),
('Dep. Estadual'),
('Dep. Federal');