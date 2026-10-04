# Deploy automático

Cada push a `master` publica la app en Firebase (hosting de cuack.com.ar / saldame.web.app
y las reglas de Firestore) con la GitHub Action [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).
También se puede lanzar a mano: GitHub → **Actions** → **Deploy** → **Run workflow**.

Si falta el secreto `FIREBASE_SERVICE_ACCOUNT`, la Action termina con un aviso y no publica.

## Configuración (una sola vez)

### 1. Cuenta de servicio
1. [Google Cloud Console → IAM → Cuentas de servicio](https://console.cloud.google.com/iam-admin/serviceaccounts?project=saldame), proyecto **saldame**.
2. **Crear cuenta de servicio**, por ejemplo `github-deploy`.
3. Roles: **Firebase Hosting Admin**, **Firebase Rules Admin** y **Service Account User**
   (o, más simple, **Firebase Admin**).
4. En la cuenta creada → **Claves** → **Agregar clave** → **JSON**. Se descarga un archivo.

### 2. Secretos en GitHub
Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secreto | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | El contenido completo del JSON descargado |
| `VITE_FIREBASE_API_KEY` | Igual que en tu `.env` local |
| `VITE_FIREBASE_AUTH_DOMAIN` | Igual que en tu `.env` |
| `VITE_FIREBASE_PROJECT_ID` | Igual que en tu `.env` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Igual que en tu `.env` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Igual que en tu `.env` |
| `VITE_FIREBASE_APP_ID` | Igual que en tu `.env` |
| `VITE_GEMINI_API_KEY` | Igual que en tu `.env` |
| `VITE_ALLOWED_EMAIL` | `antonellipatricio@gmail.com` |

Después de cargar los secretos, borrá el JSON de tu compu y corré la Action a mano para probar.

## Qué publica
- `npm ci && npm run build` (incluye el chequeo de tipos de TypeScript).
- `firebase deploy --only hosting,firestore:rules --project saldame`.

El lint no corre en la Action porque el repo tiene errores previos de lint.
