-- Aplicado únicamente en la base de entrega wosudqaluijtmvneiehi.
-- Excepción autorizada: el simulador de Vanessa se recibió en PDF.
BEGIN;
ALTER TABLE public.documentos DROP CONSTRAINT documentos_check1;
ALTER TABLE public.documentos ADD CONSTRAINT documentos_check1 CHECK (
 (tipo='plan' AND lower(nombre_original) ~ '[.](pdf|doc|docx)$') OR
 (tipo='simulador' AND (
  lower(nombre_original) ~ '[.](xlsx|xls|xlsm)$' OR
  (estudiante_id='18cea746-6366-41bb-855d-594dd84a3294'::uuid
   AND nombre_original='Simulador 2026 plan de negocio (1).pdf')
 ))
);
COMMIT;
