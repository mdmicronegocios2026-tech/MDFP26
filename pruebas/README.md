# Fondo Progresa — versión de entrega

Copia independiente creada el 15 de octubre de 2026.

- Proyecto Supabase: `wosudqaluijtmvneiehi` (FONDO PROGRESA - PRUEBAS).
- Organización: MICRONEGOCIOS2026, cuenta Neider859.
- Se copiaron 8 cuentas y sus identidades de correo, con los mismos IDs y contraseñas cifradas: 2 administradores y 6 evaluadores.
- Se copiaron el curso y los 6 criterios de rúbrica. Participantes, asignaciones y evaluaciones quedan vacíos para la importación por Excel.
- No se copiaron sesiones ni tokens de recuperación: cada usuario debe iniciar sesión en esta copia con su correo y contraseña habituales.
- Las tablas y la fórmula de notas conservan el esquema original. Las políticas de esta copia restringen el acceso por rol y asignación; no replican las políticas públicas Allow all.
- `esquema.sql` reproduce la estructura y permisos de esta copia vacía; no incluye cuentas, credenciales ni datos personales.

## Abrir localmente

Desde esta carpeta:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Abrir http://127.0.0.1:8765. Requiere internet para Supabase y las bibliotecas CDN. El nombre técnico de la carpeta y el del proyecto Supabase conservan su denominación inicial; esta aplicación es la versión destinada a entrega.

## Documentos integrados

1. Iniciar sesión como administrador e importar participantes y asignaciones desde el Excel final.
2. Entrar en **Documentos** y seleccionar la carpeta descomprimida de las entregas. No seleccionar el ZIP.
3. Revisar las asociaciones propuestas por nombre. Los números de las carpetas del sistema de entregas no se interpretan como cédulas. Resolver manualmente nombres duplicados, desconocidos o múltiples archivos.
4. Cada carpeta admite un plan PDF/Word y un simulador Excel. Puede subirse una entrega incompleta y completarse posteriormente.
5. Usar **Vista previa y descarga** para revisar el plan localmente, y **Descargar simulador Excel** para abrir el simulador original, antes de subirlos. Confirmar las filas correctas y pulsar **Subir filas confirmadas / reintentar pendientes**.
6. Los profesores verán la rúbrica centrada en una sola columna. Junto al nombre del participante encontrarán únicamente **Ver plan de negocio**, habilitado si existe plan o simulador. El visor ocupa la pantalla con una cabecera compacta que contiene las descargas disponibles (**Descargar PDF** o **Descargar Word**, **Descargar Excel**) y **Volver a calificar**. El PDF se carga automáticamente y ocupa todo el espacio bajo la cabecera; conserva los controles del lector del navegador. Si solo existe Excel, el visor indica que falta el plan y permite descargar el simulador. Word se abre o descarga sin visor integrado.

El botón **Volver a calificar** o Escape cierra el visor y devuelve el foco y la posición de lectura sin modificar puntajes ni comentarios. La cabecera con el participante y el botón de retorno permanece visible. Los archivos consultados se conservan en memoria mientras se evalúa al mismo participante y se liberan al cambiar de participante, volver a la lista o cerrar sesión.

El simulador se descarga con su nombre y bytes originales para abrirlo en Excel. No se muestra una tabla de celdas en la plataforma. El navegador decide dónde guardar el archivo y si inicia Excel automáticamente. La validación de archivos antes de subirlos sigue utilizando la biblioteca de lectura Excel, sin modificar el simulador.

El contenedor `entregas` es privado y limita cada archivo a 50 MiB. La aplicación muestra el tamaño del lote y lo compara con un presupuesto conservador de 1 GB sumando los registros del curso; la cuota efectiva del plan y su transferencia deben revisarse en Supabase, especialmente si hay otros cursos o archivos sin registro.

Las subidas y los metadatos se confirman por separado: el archivo anterior solo se retira después de confirmar el nuevo registro. Si falla el registro, reintentar desde el mismo lote reutiliza la subida pendiente. Al volver a seleccionar la carpeta se reconocen documentos ya registrados por su huella SHA-256 y nombre. Si se abandona una subida sin registro, o falla la eliminación de un archivo reemplazado, puede ser necesaria una limpieza administrativa en Storage; no se elimina un archivo cuya confirmación es incierta.

`documentos.sql` contiene la migración adicional ya aplicada en la base de entrega. Para reconstruir una base vacía, aplicar primero `esquema.sql` y después `documentos.sql`; estos archivos no migran cuentas ni datos.

## Pruebas automatizadas de documentos

Las dependencias se pueden instalar fuera del proyecto para no alterar la aplicación estática:

```sh
npm install --prefix /tmp/mdfp-documentos-tests --no-audit --no-fund --ignore-scripts jsdom@26.1.0 xlsx@0.18.5
NODE_PATH=/tmp/mdfp-documentos-tests/node_modules node --test tests/documentos.test.cjs
```

Se verificaron 24 escenarios: asociaciones y duplicados, formatos y tamaños, Excel corrupto, cancelación, errores de conexión y registro, reemplazos, reintentos, doble clic, descarga desde el visor y antes de subir, simulador original con nombre y bytes intactos en las tres ubicaciones, PDF/Word, navegación por rol, visor bajo demanda con conservación de puntajes/comentario/desplazamiento, foco por teclado, caché, doble clic en descarga, reintentos, descargas tardías al cambiar de participante, cabecera única con PDF/Excel y recuperación de errores del PDF.

Se revisó además la distribución del visor a 600 × 800: sin desbordamiento exterior y con el área restante dedicada al PDF. La lectura de un PDF ficticio se comprobó en Microsoft Edge. El navegador integrado de Codex no mostró ese PDF durante la comprobación; la visualización depende del lector del navegador y las descargas permanecen disponibles.

## Verificación realizada

- Sintaxis JavaScript válida.
- Coincidencia de IDs, correos y hashes de contraseñas entre origen y destino mediante huella agregada, sin guardar los hashes en archivos.
- Pruebas SQL con rollback: creación y actualización de notas, lectura de participantes asignados, aislamiento entre evaluadores, acceso de administrador y bloqueo de cambio de rol/autor por evaluadores.
- RLS habilitado en las siete tablas; sin privilegios para el rol anónimo.
- Políticas de documentos y Storage verificadas con registros ficticios dentro de una transacción revertida: administrador gestiona, evaluador asignado lee y otros evaluadores/visitantes no acceden. No se cargó información del año pasado.
- Pendiente: prueba de subida real mediante la API con una sesión de administrador. La revisión automática rechazó crear cuentas temporales privilegiadas para esta prueba, por lo que no se crearon.
- Pendiente: inicio de sesión real por un usuario con su contraseña y comprobación visual de la importación y reportes tras cargar el Excel.
- El asesor de Supabase solo indicó protección contra contraseñas filtradas deshabilitada (ajuste de Auth del proyecto).

El proyecto original y su configuración permanecen separados. Para futuras implementaciones trabajar dentro de esta carpeta. No reemplazar ni publicar la configuración del original.
