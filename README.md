# MDFP26 · Fondo Progresa 2026

Plataforma web para la **gestión y evaluación de planes de negocio** del programa Fondo Progresa 2026, en articulación con la Alcaldía de Zipaquirá, UNIMINUTO y la Secretaría de Desarrollo Económico y Turismo.

Digitaliza el proceso de evaluación de emprendimientos: los administradores asignan estudiantes a formadores y los evaluadores califican cada proyecto con rúbricas dinámicas cuya nota se calcula automáticamente.

## Funcionalidades

- **Roles**: administrador y evaluador (cada uno ve solo lo que le corresponde).
- **Dashboard** con estadísticas, notas finales, búsqueda por nombre/cédula y detalle por estudiante.
- **Evaluación** con rúbrica por criterios, borradores y envío final.
- **Estudiantes** y **asignaciones** (manual o por importación de Excel, máximo 2 formadores por estudiante).
- **Exportación a Excel**: reporte de notas, respuestas por formador y formadores pendientes.
- **Interfaz**: notificaciones tipo toast, diálogos de confirmación propios, pantalla de carga y sesión persistente.
- Bloqueo en dispositivos móviles (uso solo en escritorio).

## Estructura

```
index.html          Interfaz (login + vistas)
style.css           Estilos
config.js           Configuración (Supabase y modo demo)
app.js              Lógica de la aplicación
demo-data.js        Datos ficticios para el modo demo (opcional)
tools/              Utilidades (conversión de la matriz de distribución)
```

No requiere compilación: es HTML/CSS/JS estático.

## Puesta en marcha

1. Clona el repositorio y abre `index.html` con un servidor estático (por ejemplo `python3 -m http.server` o la extensión *Live Server* de VS Code).
2. En `config.js` configura `SUPABASE_URL` y `SUPABASE_ANON_KEY` de tu proyecto.
3. Para publicar: **GitHub Pages** (Settings → Pages → rama `main`, carpeta raíz).

### Base de datos (Supabase)

El código usa estas tablas (esquema inferido de las consultas de `app.js`):

| Tabla | Campos usados |
|---|---|
| `cursos` | `id`, `nombre`, `anio`, `semestre`, `estado` |
| `usuarios` | `id` (= id de Auth), `email`, `nombre_completo`, `rol` (`admin` / `evaluador`) |
| `estudiantes` | `id`, `cedula`, `nombre_completo`, `correo`, `curso_id` |
| `asignaciones` | `curso_id`, `estudiante_id`, `evaluador_id` |
| `evaluaciones` | `id`, `curso_id`, `estudiante_id`, `evaluador_id`, `<criterio>_puntaje`, `nota_individual`, `comentario_global`, `estado` (`borrador` / `completada`) |

### Seguridad (importante)

La `anon key` es pública por diseño; **la protección real son las políticas RLS** de Supabase. Verifica que:

- Un evaluador solo pueda leer/escribir **sus propias** evaluaciones y asignaciones.
- Solo un `admin` pueda modificar `usuarios.rol`, `estudiantes` y `asignaciones`.
- Un usuario no pueda cambiarse a sí mismo el rol a `admin`. Al primer ingreso, la app crea el perfil con rol `evaluador`.

## Modo demo

Para probar sin Supabase: en `config.js` pon `DEMO_MODE = true` y descomenta `<script src="demo-data.js">` en `index.html`. Usuarios de prueba (ficticios): `admin@demo.local` / `demo1234`, `ana@demo.local` / `demo1234`.

## Herramienta de conversión

`tools/convertir_distribucion.py` transforma la matriz "Distribución Formadores" al formato de importación:

```bash
pip install openpyxl
python tools/convertir_distribucion.py "Distribución Formadores.xlsx" -o Asignaciones_Convertidas.xlsx
```

Los nombres de formadores en `EVALUATOR_MAP` deben coincidir con el nombre registrado de cada usuario en la plataforma, porque la importación empareja por nombre.

## Datos personales

Los archivos `.xlsx`/`.csv` están en `.gitignore`: no subas listados de estudiantes (cédulas, correos) al repositorio.
