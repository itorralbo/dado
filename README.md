# 🎲 Dado virtual

App web para tirar un dado de 6 caras. Un cubo 3D en CSS puro que rueda y se detiene
mostrando la cara que ha salido. Se tira pulsando el botón, haciendo clic sobre el
propio dado o con la barra espaciadora.

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

Para activarlo la primera vez hay dos pasos que solo puede hacer el dueño del repositorio:

1. **Settings → General → Default branch**: dejar `main` como rama por defecto. GitHub solo
   permite desplegar al entorno `github-pages` desde la rama por defecto.
2. **Settings → Pages → Source**: elegir **GitHub Actions**. No se puede automatizar desde el
   propio workflow, porque el `GITHUB_TOKEN` no tiene permiso para dar de alta el sitio.

Después, cualquier push a `main` (o un **Run workflow** manual desde la pestaña Actions)
publica el sitio.

La web quedará publicada en https://itorralbo.github.io/dado/

## Detalles

- El valor de cada tirada se obtiene con `crypto.getRandomValues` y descarte de valores
  sesgados, así que las seis caras son equiprobables.
- El resultado se anuncia mediante una región `aria-live` para lectores de pantalla.
- Se respeta `prefers-reduced-motion`: si está activo, el resultado aparece sin animación.
- Tema claro y oscuro automáticos según las preferencias del sistema.
