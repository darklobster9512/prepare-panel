ALTER TABLE public.vics ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
CREATE INDEX vics_project_id_idx ON public.vics(project_id);