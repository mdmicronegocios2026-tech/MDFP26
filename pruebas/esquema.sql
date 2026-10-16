SET search_path TO public;
CREATE TABLE public."asignaciones" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"evaluador_id" uuid NOT NULL,
"estudiante_id" uuid NOT NULL,
"curso_id" uuid NOT NULL,
"creado_en" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."cursos" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"nombre" text NOT NULL,
"anio" integer NOT NULL,
"semestre" integer NOT NULL,
"estado" text DEFAULT 'activo'::text,
"creado_en" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."estudiantes" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"cedula" text NOT NULL,
"nombre_completo" text NOT NULL,
"curso_id" uuid NOT NULL,
"creado_en" timestamp with time zone DEFAULT now(),
"correo" text
);
CREATE TABLE public."evaluaciones" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"estudiante_id" uuid NOT NULL,
"evaluador_id" uuid NOT NULL,
"curso_id" uuid NOT NULL,
"fecha_evaluacion" timestamp with time zone DEFAULT now(),
"resumen_ejecutivo_puntaje" numeric(3,1),
"resumen_ejecutivo_descripcion" text,
"estudio_mercado_puntaje" numeric(3,1),
"estudio_mercado_descripcion" text,
"estudio_tecnico_puntaje" numeric(3,1),
"estudio_tecnico_descripcion" text,
"estudio_financiero_puntaje" numeric(3,1),
"estudio_financiero_descripcion" text,
"plan_implementacion_puntaje" numeric(3,1),
"plan_implementacion_descripcion" text,
"impactos_puntaje" numeric(3,1),
"impactos_descripcion" text,
"nota_individual" numeric(5,4),
"comentario_global" text,
"estado" text DEFAULT 'borrador'::text,
"creado_en" timestamp with time zone DEFAULT now(),
"actualizado_en" timestamp with time zone DEFAULT now(),
"puntajes" jsonb,
"rubrica_snapshot" jsonb
);
CREATE TABLE public."rubrica_criterios" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"curso_id" uuid NOT NULL,
"key" text NOT NULL,
"nombre" text NOT NULL,
"peso" numeric DEFAULT 0 NOT NULL,
"orden" integer DEFAULT 0 NOT NULL,
"niveles" jsonb DEFAULT '{}'::jsonb NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."usuarios" (
"id" uuid NOT NULL,
"email" text NOT NULL,
"nombre_completo" text NOT NULL,
"rol" text NOT NULL,
"creado_en" timestamp with time zone DEFAULT now(),
"activo" boolean DEFAULT true
);
ALTER TABLE public."usuarios" ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY (id);
ALTER TABLE public."usuarios" ADD CONSTRAINT "usuarios_rol_check" CHECK ((rol = ANY (ARRAY['admin'::text, 'evaluador'::text])));
ALTER TABLE public."cursos" ADD CONSTRAINT "cursos_pkey" PRIMARY KEY (id);
ALTER TABLE public."cursos" ADD CONSTRAINT "cursos_semestre_check" CHECK ((semestre = ANY (ARRAY[1, 2])));
ALTER TABLE public."asignaciones" ADD CONSTRAINT "asignaciones_evaluador_id_estudiante_id_curso_id_key" UNIQUE (evaluador_id, estudiante_id, curso_id);
ALTER TABLE public."asignaciones" ADD CONSTRAINT "asignaciones_pkey" PRIMARY KEY (id);
ALTER TABLE public."estudiantes" ADD CONSTRAINT "estudiantes_cedula_curso_id_key" UNIQUE (cedula, curso_id);
ALTER TABLE public."estudiantes" ADD CONSTRAINT "estudiantes_pkey" PRIMARY KEY (id);
ALTER TABLE public."evaluaciones" ADD CONSTRAINT "evaluaciones_estudiante_id_evaluador_id_curso_id_key" UNIQUE (estudiante_id, evaluador_id, curso_id);
ALTER TABLE public."evaluaciones" ADD CONSTRAINT "evaluaciones_pkey" PRIMARY KEY (id);
ALTER TABLE public."rubrica_criterios" ADD CONSTRAINT "rubrica_criterios_curso_id_key_key" UNIQUE (curso_id, key);
ALTER TABLE public."rubrica_criterios" ADD CONSTRAINT "rubrica_criterios_pkey" PRIMARY KEY (id);
ALTER TABLE public."asignaciones" ADD CONSTRAINT "asignaciones_curso_id_fkey" FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE;
ALTER TABLE public."asignaciones" ADD CONSTRAINT "asignaciones_estudiante_id_fkey" FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE;
ALTER TABLE public."asignaciones" ADD CONSTRAINT "asignaciones_evaluador_id_fkey" FOREIGN KEY (evaluador_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE public."estudiantes" ADD CONSTRAINT "estudiantes_curso_id_fkey" FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE;
ALTER TABLE public."evaluaciones" ADD CONSTRAINT "evaluaciones_curso_id_fkey" FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE;
ALTER TABLE public."evaluaciones" ADD CONSTRAINT "evaluaciones_estudiante_id_fkey" FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE;
ALTER TABLE public."evaluaciones" ADD CONSTRAINT "evaluaciones_evaluador_id_fkey" FOREIGN KEY (evaluador_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE public."rubrica_criterios" ADD CONSTRAINT "rubrica_criterios_curso_id_fkey" FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE;
CREATE OR REPLACE FUNCTION public.calcular_nota_individual()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.nota_individual := 
        COALESCE(NEW.resumen_ejecutivo_puntaje, 0) * 0.10 +
        COALESCE(NEW.estudio_mercado_puntaje, 0) * 0.25 +
        COALESCE(NEW.estudio_tecnico_puntaje, 0) * 0.20 +
        COALESCE(NEW.estudio_financiero_puntaje, 0) * 0.25 +
        COALESCE(NEW.plan_implementacion_puntaje, 0) * 0.10 +
        COALESCE(NEW.impactos_puntaje, 0) * 0.10;
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$function$
;
ALTER FUNCTION public.calcular_nota_individual() SET search_path = public;
CREATE TRIGGER trigger_calcular_nota BEFORE INSERT OR UPDATE ON public.evaluaciones FOR EACH ROW EXECUTE FUNCTION calcular_nota_individual();

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
-- SECURITY DEFINER avoids recursive RLS on usuarios; exposes only own admin status.
CREATE FUNCTION private.usuario_es_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin' AND activo IS DISTINCT FROM false);
$$;
REVOKE ALL ON FUNCTION private.usuario_es_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.usuario_es_admin() TO authenticated;
ALTER TABLE public."asignaciones" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."asignaciones" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."asignaciones" TO authenticated;
CREATE POLICY admin_all ON public."asignaciones" FOR ALL TO authenticated USING ((select private.usuario_es_admin())) WITH CHECK ((select private.usuario_es_admin()));
ALTER TABLE public."cursos" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."cursos" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."cursos" TO authenticated;
CREATE POLICY admin_all ON public."cursos" FOR ALL TO authenticated USING ((select private.usuario_es_admin())) WITH CHECK ((select private.usuario_es_admin()));
ALTER TABLE public."estudiantes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."estudiantes" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."estudiantes" TO authenticated;
CREATE POLICY admin_all ON public."estudiantes" FOR ALL TO authenticated USING ((select private.usuario_es_admin())) WITH CHECK ((select private.usuario_es_admin()));
ALTER TABLE public."evaluaciones" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."evaluaciones" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."evaluaciones" TO authenticated;
CREATE POLICY admin_all ON public."evaluaciones" FOR ALL TO authenticated USING ((select private.usuario_es_admin())) WITH CHECK ((select private.usuario_es_admin()));
ALTER TABLE public."rubrica_criterios" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."rubrica_criterios" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."rubrica_criterios" TO authenticated;
CREATE POLICY admin_all ON public."rubrica_criterios" FOR ALL TO authenticated USING ((select private.usuario_es_admin())) WITH CHECK ((select private.usuario_es_admin()));
ALTER TABLE public."usuarios" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."usuarios" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."usuarios" TO authenticated;
CREATE POLICY admin_all ON public."usuarios" FOR ALL TO authenticated USING ((select private.usuario_es_admin())) WITH CHECK ((select private.usuario_es_admin()));

CREATE POLICY usuarios_self_select ON public.usuarios FOR SELECT TO authenticated USING (id = (select auth.uid()));
CREATE POLICY usuarios_self_insert ON public.usuarios FOR INSERT TO authenticated WITH CHECK (id = (select auth.uid()) AND rol = 'evaluador' AND email = (select auth.jwt()->>'email'));
CREATE POLICY cursos_read ON public.cursos FOR SELECT TO authenticated USING (true);
CREATE POLICY rubrica_read ON public.rubrica_criterios FOR SELECT TO authenticated USING (true);
CREATE POLICY asignaciones_self_read ON public.asignaciones FOR SELECT TO authenticated USING (evaluador_id = (select auth.uid()));
CREATE POLICY estudiantes_assigned_read ON public.estudiantes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.asignaciones a WHERE a.estudiante_id = estudiantes.id AND a.curso_id = estudiantes.curso_id AND a.evaluador_id = (select auth.uid())));
CREATE POLICY evaluaciones_self_select ON public.evaluaciones FOR SELECT TO authenticated USING (evaluador_id = (select auth.uid()));
CREATE POLICY evaluaciones_self_insert ON public.evaluaciones FOR INSERT TO authenticated WITH CHECK (evaluador_id = (select auth.uid()) AND EXISTS (SELECT 1 FROM public.asignaciones a WHERE a.estudiante_id = evaluaciones.estudiante_id AND a.curso_id = evaluaciones.curso_id AND a.evaluador_id = (select auth.uid())));
CREATE POLICY evaluaciones_self_update ON public.evaluaciones FOR UPDATE TO authenticated USING (evaluador_id = (select auth.uid())) WITH CHECK (evaluador_id = (select auth.uid()) AND EXISTS (SELECT 1 FROM public.asignaciones a WHERE a.estudiante_id = evaluaciones.estudiante_id AND a.curso_id = evaluaciones.curso_id AND a.evaluador_id = (select auth.uid())));
CREATE INDEX asignaciones_curso_idx ON public.asignaciones(curso_id);
CREATE INDEX asignaciones_estudiante_idx ON public.asignaciones(estudiante_id);
CREATE INDEX estudiantes_curso_idx ON public.estudiantes(curso_id);
CREATE INDEX evaluaciones_curso_idx ON public.evaluaciones(curso_id);
CREATE INDEX evaluaciones_evaluador_idx ON public.evaluaciones(evaluador_id);

