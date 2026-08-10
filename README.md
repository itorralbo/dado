# 🎲 Dado virtual

App web para tirar un dado de 6 caras. Un cubo 3D en CSS puro que rueda y se detiene
mostrando la cara que ha salido.

Sin dependencias, sin build, sin instalación: son tres archivos estáticos
(`index.html`, `styles.css`, `app.js`).

## Cómo usarlo en local

Basta con abrir `index.html` en el navegador. Si prefieres servirlo:

```bash
python3 -m http.server 8000
# y abrir http://localhost:8000
```

## Publicar en GitHub Pages

El repositorio incluye el workflow `.github/workflows/deploy-pages.yml`, que despliega
el sitio en cada push a `main`.

Para activarlo la primera vez:

1. Ve a **Settings → Pages**.
2. En **Source**, elige **GitHub Actions**.
3. Asegúrate de que el código está en la rama `main` (GitHub solo permite desplegar al
   entorno `github-pages` desde la rama por defecto).

La web quedará publicada en https://itorralbo.github.io/dado/

## Detalles

- El valor de cada tirada se obtiene con `crypto.getRandomValues` y descarte de valores
  sesgados, así que las seis caras son equiprobables.
- El resultado se anuncia mediante una región `aria-live` para lectores de pantalla.
- Se respeta `prefers-reduced-motion`: si está activo, el resultado aparece sin animación.
- Tema claro y oscuro automáticos según las preferencias del sistema.
