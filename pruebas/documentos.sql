-- Aplicar únicamente al proyecto de entrega wosudqaluijtmvneiehi.
ALTER TABLE public.estudiantes ADD CONSTRAINT estudiantes_id_curso_unique UNIQUE(id, curso_id);
CREATE TABLE public.documentos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 estudiante_id uuid NOT NULL,
 curso_id uuid NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
 tipo text NOT NULL CHECK(tipo IN ('plan', 'simulador')),
 nombre_original text NOT NULL CHECK(length(nombre_original) BETWEEN 1 AND 255),
 ruta text NOT NULL UNIQUE,
 tamano bigint NOT NULL CHECK(tamano > 0 AND tamano <= 52428800),
 sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
 creado_en timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(estudiante_id, curso_id) REFERENCES public.estudiantes(id, curso_id) ON DELETE CASCADE,
 UNIQUE(estudiante_id, curso_id, tipo),
 CHECK(ruta LIKE curso_id::text || '/' || estudiante_id::text || '/' || tipo || '/%'),
 CHECK((tipo='plan' AND lower(nombre_original) ~ '\.(pdf|doc|docx)$') OR (tipo='simulador' AND lower(nombre_original) ~ '\.(xlsx|xls|xlsm)$'))
);
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.documentos FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos TO authenticated;
CREATE INDEX documentos_curso_idx ON public.documentos(curso_id);
CREATE POLICY documentos_admin ON public.documentos FOR ALL TO authenticated
 USING ((select private.usuario_es_admin())) WITH CHECK ((select private.usuario_es_admin()));
CREATE POLICY documentos_asignados ON public.documentos FOR SELECT TO authenticated
 USING (EXISTS(SELECT 1 FROM public.asignaciones a WHERE a.estudiante_id=documentos.estudiante_id AND a.curso_id=documentos.curso_id AND a.evaluador_id=(select auth.uid())));

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('entregas','entregas',false,52428800,ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel.sheet.macroEnabled.12']);
CREATE POLICY entregas_admin ON storage.objects FOR ALL TO authenticated
 USING (bucket_id='entregas' AND (select private.usuario_es_admin()))
 WITH CHECK (bucket_id='entregas' AND (select private.usuario_es_admin()));
CREATE POLICY entregas_asignadas ON storage.objects FOR SELECT TO authenticated
 USING (bucket_id='entregas' AND EXISTS(
  SELECT 1 FROM public.documentos d JOIN public.asignaciones a
   ON a.estudiante_id=d.estudiante_id AND a.curso_id=d.curso_id
  WHERE d.ruta=storage.objects.name AND a.evaluador_id=(select auth.uid())
 ));
