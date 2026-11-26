# Informe Anual de Gestión · plantilla de prueba

Sitio estático para recorrer un año de gobierno: resumen, mes a mes, ejes, compromisos e indicadores.
Sin frameworks ni instalación. **Todas las cifras son de ejemplo.**

## Estructura

```
index.html          Carcasa: cabecera, menú, barra de meses y contenedor de vistas
css/estilos.css     Diseño. Los colores y tipografías están al inicio (:root)
js/app.js           Lógica: carga los datos, enrutador por # y funciones que dibujan cada vista
datos/datos.json    TODO el contenido del informe
.nojekyll           Indica a GitHub Pages que publique los archivos tal cual
```

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `informe-anual`), público.
2. Pulsa **Add file → Upload files** y arrastra el **contenido** de esta carpeta
   (index.html, css, js, datos y .nojekyll), no la carpeta en sí.
3. Ve a **Settings → Pages**. En *Source* elige **Deploy from a branch**,
   rama `main`, carpeta `/ (root)`, y guarda.
4. En uno o dos minutos el sitio estará en
   `https://TU-USUARIO.github.io/informe-anual/`

> En macOS, `.nojekyll` es un archivo oculto: pulsa Cmd + Shift + . en el Finder para verlo. Si no se sube, el sitio funciona igual.

## Editar el contenido

Todo está en `datos/datos.json`. Se puede editar directamente en GitHub (icono del lápiz).

- `meta`: título, institución, período, mes de inicio `[año, mes]` y fecha de corte.
- `ejes`: `id` (minúsculas, sin espacios ni tildes), nombre `n`, color `c` y objetivo `obj`.
- `compromisos`: `id`, `eje`, título `t`, `estado` (`cumplido`, `ejecucion`, `retrasado` o `sin`),
  avance `av` (0–100), `plazo`, responsable `resp` y `meta`.
- `hitos`: `mes` (1 a 12, contado desde el mes de inicio), `dia`, `eje`, `tipo`, título `t`,
  texto `x` y compromiso relacionado `c`.
- `indicadores`: nombre `n`, unidad `u`, `mejor` (`sube` o `baja`), `meta`, decimales `dec`
  y `serie` con exactamente 12 valores mensuales.

Si el JSON tiene un error de formato (una coma de más o una comilla sin cerrar), la página lo avisa.
Puedes validarlo en https://jsonlint.com

## Probar en tu computadora

Al abrir `index.html` con doble clic, el navegador bloquea la lectura de `datos.json`.
Usa un servidor local desde esta carpeta:

```
python3 -m http.server 8000
```

y abre http://localhost:8000

## Cambiar colores y tipografías

Al inicio de `css/estilos.css`, en el bloque `:root`, están los colores (`--accent`, `--ink`, `--paper`…)
y las fuentes. Los bloques siguientes definen el modo oscuro.
Las fuentes se cargan desde Google Fonts en `index.html`.

## Direcciones de cada vista

`#resumen` · `#mes-1` a `#mes-12` · `#ejes` · `#eje-ID` · `#compromisos` · `#indicadores` · `#metodologia`
