# Web compraventa de coches + panel de gestión (CMS)

- **Web pública**: `/`, `/stock`, `/coche?id=…`
- **Panel para el cliente**: `/admin` (Decap CMS). Desde ahí se añaden, editan, reservan o marcan como vendidos los coches, se suben fotos y se cambian los datos de contacto.
- Los datos se guardan en `content/coches.json` y `content/negocio.json`; las fotos en `img/coches/`.
- Cada vez que se guarda en el panel, se hace un commit en GitHub y Vercel publica la web sola en ~30 segundos.

## Puesta en marcha (una sola vez, ~15 min)

### 1. Subir el proyecto a GitHub
Crea un repositorio (puede ser privado) y sube el contenido de esta carpeta a la rama `main`.

### 2. Importarlo en Vercel
vercel.com → **Add New → Project** → elige el repositorio → Framework Preset: **Other** → Deploy.
Apunta el dominio que te da (p. ej. `concesionario.vercel.app`) o conecta el dominio propio.

### 3. Crear la app de login en GitHub
GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
- Application name: `Panel web concesionario`
- Homepage URL: `https://TU-DOMINIO`
- Authorization callback URL: `https://TU-DOMINIO/api/callback`

Guarda el **Client ID** y genera un **Client Secret**.

### 4. Variables de entorno en Vercel
Proyecto → **Settings → Environment Variables**:
- `GITHUB_CLIENT_ID` = el Client ID
- `GITHUB_CLIENT_SECRET` = el Client Secret

Después: **Deployments → … → Redeploy**.

### 5. Configurar el panel
En `admin/config.yml` cambia:
- `repo: TU-USUARIO/TU-REPO`
- `base_url`, `site_url` y `display_url` → `https://TU-DOMINIO`

Haz commit. Entra en `https://TU-DOMINIO/admin` y pulsa **Login with GitHub**.

### 6. Dar acceso al cliente
El cliente necesita una cuenta gratuita de GitHub. En el repositorio:
**Settings → Collaborators → Add people** → su usuario. Acepta la invitación y ya puede entrar en `/admin`.

## Uso diario (para el cliente)
1. Entrar en `tudominio/admin`.
2. **Stock → Coches en venta**.
3. **Añadir coche** (aparece arriba de la lista), rellenar los datos y subir las fotos (la primera es la portada).
4. Para quitar uno: cambiar **Estado** a *Vendido* (desaparece de la web) o *Reservado* (sale con la etiqueta RESERVADO).
5. **Publicar**. En menos de un minuto está en la web.

## Diseño
- Colores de la franja de marca: `css/styles.css` → `--stripe-1`, `--stripe-2`, `--stripe-3`.
- La foto grande de la portada es la del primer coche destacado; la de "Vende tu coche", la del segundo.
