# Fondo Progresa 2026

Versión de entrega de la plataforma de evaluación. Aplicación estática HTML, CSS y JavaScript conectada a la base de entrega de Supabase.

## Subir a GitHub y publicar

1. Crea un repositorio y sube **el contenido de esta carpeta**. `index.html` debe quedar en la raíz del repositorio.
2. En GitHub abre **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**, la rama `main` y la carpeta **/ (root)**.
4. Guarda y espera a que GitHub muestre la URL publicada.

No necesita instalación de paquetes, comando de compilación ni servidor propio. Requiere conexión a internet para Supabase y las bibliotecas CDN.

## Configuración

`config.js` apunta al proyecto de entrega `wosudqaluijtmvneiehi`. Su clave es pública (publishable); los permisos se controlan mediante autenticación, RLS y almacenamiento privado. No añadas claves secretas ni service_role al repositorio.

Los participantes, asignaciones, calificaciones y documentos permanecen en Supabase. No es necesario subir los planes PDF, simuladores Excel, carpetas FINAL, copias de bases ni archivos SQL a GitHub. Esta carpeta no los incluye.

## Uso

Los usuarios ingresan con sus cuentas existentes. Los evaluadores consultan únicamente los documentos de sus participantes asignados. El plan PDF se visualiza en la plataforma; Word y simuladores se descargan. El caso autorizado de Vanessa ofrece el simulador en PDF.

## Abrir localmente

Desde esta carpeta:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Abre http://127.0.0.1:8765/. Esta dirección local solo funciona en el computador donde se ejecuta el servidor; para compartir utiliza la URL de GitHub Pages.
