# Launcher IS Global

Launcher de escritorio (Electron + React/Vite) de **Imperio de los Sueños**. Permite a los
jugadores descargar, actualizar y lanzar los videojuegos del estudio desde una sola app.

El catálogo de juegos es **dinámico**: se lee en tiempo de ejecución desde GitHub, así que se
pueden añadir juegos o cambiar versiones sin reexportar el launcher.

## Arquitectura

| Parte | Archivo | Función |
|-------|---------|---------|
| Proceso principal | `electron/main.cjs` | Descarga, extracción atómica, lanzamiento, estado |
| Puente seguro | `electron/preload.cjs` | API expuesta al frontend (`window.launcher`) |
| Catálogo (fuente) | `public/games.json` | Lista de juegos que ven los usuarios |
| Catálogo (offline) | `electron/games.json` | Copia de respaldo si falla la red |
| UI | `src/App.jsx`, `src/components/*` | React (Sidebar, Hero, Titlebar) |

El launcher lee el catálogo desde:
`https://raw.githubusercontent.com/CiudadanoZ/LauncherIS_Global/main/public/games.json`

## Desarrollo

```bash
npm install
npm run electron:dev   # Vite + Electron con recarga en caliente
```

## Exportar el instalador

```bash
npm run electron:build   # genera el instalador NSIS en dist-electron/
```

> Si el build falla con `app.asar ... being used by another process`, es el antivirus
> reteniendo el archivo de un build anterior. Solución: exportar a una carpeta limpia
> (`npx electron-builder --win nsis "-c.directories.output=release/nueva-carpeta"`) o reiniciar.

## Añadir un juego al catálogo

Edita `public/games.json` (y `electron/games.json` para el respaldo offline) y añade un objeto al
array `games`. Campos principales:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `id` | sí | Identificador único (carpeta de instalación) |
| `name`, `tag`, `description` | sí | Textos mostrados |
| `engine`, `genre`, `size`, `glyph`, `accentColor` | sí | Metadatos y estética |
| `githubRepo` | para juegos descargables | `usuario/repo` con releases |
| `version` | recomendado | Versión mostrada en el catálogo |
| `webUrl` | para juegos web | Abre la URL en el navegador (p. ej. juego en Vercel) |
| `comingSoon` | opcional | Muestra "Próximamente", no instalable |
| `directDownloadUrl` | opcional | URL directa de un `.zip` (alternativa a `githubRepo`) |

Tras editar el catálogo, haz `git push` a `main`: los launchers ya instalados lo verán al reiniciar.

## Publicar la actualización de un juego

Las actualizaciones se detectan por el **tag del release de GitHub**, no por el campo `version`.

1. Sube un **release nuevo con un tag distinto** (p. ej. `1.1.0`). Reusar el mismo tag = no se
   detecta la actualización.
2. El asset debe ser un **`.zip`** (el launcher busca el primer asset que termine en `.zip`).
3. Empaqueta el ejecutable en la **raíz del zip o un nivel de subcarpeta** como máximo.
4. Actualiza el campo `version` del catálogo para que coincida (es informativo).

El launcher descarga el zip, lo extrae a una carpeta temporal y solo reemplaza la versión
instalada si la extracción tiene éxito (actualización atómica: una actualización fallida nunca
deja el juego roto).

## Avisar de una nueva versión del launcher

Sube `launcherVersion` en `public/games.json` (y opcionalmente `launcherDownloadUrl`). Los
launchers con una versión menor mostrarán un aviso con enlace de descarga.
