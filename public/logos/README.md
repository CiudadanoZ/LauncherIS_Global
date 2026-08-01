# Logos de los juegos

El launcher carga estos logos por URL remota (desde este repo, rama `main`), así que
**actualizarlos NO requiere reexportar el launcher**: basta con reemplazar el PNG aquí y hacer
`git push`.

Coloca los archivos con **exactamente estos nombres** (PNG con fondo transparente):

| Archivo | Juego | Logo a usar |
|---------|-------|-------------|
| `tsw-origin.png` | The Shadow World Origin | Logo "THE SHADOW WORLD ORIGIN" |
| `tsw-shadow-world.png` | Revival y Darkness | Logo genérico "THE SHADOW WORLD" |
| `reinos-aethemoor.png` | Los Reinos de Aethemoor | Logo "REALMS OF ATHERMOOR" |

Recomendado: PNG horizontal, ~1000 px de ancho, fondo transparente. Se muestran a un máximo de
200 px de alto en el Hero.

Mientras un archivo no exista, el launcher muestra el título en texto (Cinzel) automáticamente.

Para dar a un juego su propio logo (p. ej. Darkness), sube un PNG nuevo aquí y cambia el campo
`heroLogo` de ese juego en `public/games.json`.
