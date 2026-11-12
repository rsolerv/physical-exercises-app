# Contrato de empaquetado y verificación: Distribución Android TWA



**Feature**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md) | **Investigación**: [research.md](../research.md) | **Modelo de datos**: [data-model.md](../data-model.md)

Define el contrato técnico de los artefactos web y Android que permiten instalar y abrir la aplicación mediante **Trusted Web Activity (TWA)** con **Bubblewrap** y verificar el dominio frente a Chrome en Android.

---

## 1. Contrato del Manifiesto Web (`public/manifest.webmanifest`)

Se sirve en `https://rsolerv.github.io/physical-exercises-app/manifest.webmanifest` y se enlaza desde `src/index.html` con `<link rel="manifest" href="manifest.webmanifest" />`.

### Estructura obligatoria

```json
{
  "name": "Gestión de Ejercicios Físicos",
  "short_name": "Ejercicios",
  "description": "Organiza tus ejercicios físicos, planificaciones semanales y progreso diario en tu dispositivo.",
  "lang": "es-ES",
  "dir": "ltr",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#f6f3ee",
  "theme_color": "#00696b",
  "icons": [
    {
      "src": "assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "assets/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Reglas de cumplimiento

- Todos los textos visibles están en español de España (Principio I, FR-001, FR-015).
- `start_url` y `scope` usan `"./"` para resolverse respecto a `<base href="/physical-exercises-app/">` en producción y `"/"` en desarrollo local.
- Los iconos PNG en `public/assets/icons/` proceden del icono maestro aportado por el propietario (`public/assets/icons/MisEjerciciosFisicos.png`, 768×768 px):

  ![Icono oficial de la aplicación](../../../public/assets/icons/icon-192x192.png)

  | Archivo en `public/assets/icons/` | Dimensiones | Propósito |
  |---|---|---|
  | `MisEjerciciosFisicos.png` | `768×768 px` (639,4 KB) | Icono maestro original aportado por el propietario |
  | `icon-512x512.png` | `512×512 px` (306,4 KB) | Manifiesto web (`purpose: "any"`), Bubblewrap (`iconUrl`) e icono de alta resolución para la ficha de Google Play Console (requisito 512×512 PNG < 1 MB) |
  | `icon-maskable-512x512.png` | `512×512 px` (228,2 KB) | Manifiesto web (`purpose: "maskable"`) y Bubblewrap (`maskableIconUrl`) con zona segura del 84 % para iconos adaptativos de Android |
  | `icon-192x192.png` | `192×192 px` (52,7 KB) | Manifiesto web (`purpose: "any"`) y `apple-touch-icon` en `src/index.html` |

---

## 2. Contrato de Digital Asset Links (`public/.well-known/assetlinks.json`)

Debe estar publicado y accesible sin redirecciones en la raíz del origen:
- **URL de verificación de Android (obligatoria)**: `https://rsolerv.github.io/.well-known/assetlinks.json` (servida desde el repositorio de sitio de usuario `rsolerv/rsolerv.github.io`).
- **Copia versionada en este repositorio**: `public/.well-known/assetlinks.json` (incluida también en el despliegue de la aplicación).

### Estructura obligatoria

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "io.github.rsolerv.physicalexercises",
      "sha256_cert_fingerprints": [
        "<SHA256_CERTIFICADO_FIRMA_LOCAL_O_SUBIDA>",
        "<SHA256_CERTIFICADO_GOOGLE_PLAY_APP_SIGNING>"
      ]
    }
  }
]
```

### Reglas de validación y bloqueos (FR-002, FR-005, FR-014, FR-016)

1. `package_name` debe ser exactamente `"io.github.rsolerv.physicalexercises"`.
2. Cada huella en `sha256_cert_fingerprints` debe cumplir el formato `^([0-9A-F]{2}:){31}[0-9A-F]{2}$`.
3. Mientras `sha256_cert_fingerprints` contenga valores de marcador o `https://rsolerv.github.io/.well-known/assetlinks.json` no devuelva HTTP 200 con las huellas reales de ambos certificados, el script de verificación y la lista de control deben reportar estado **`BLOQUEADO`** para FR-005 (FR-016).
4. Nunca debe incluirse en el repositorio ningún archivo `.keystore`, `.jks`, contraseña ni clave privada (FR-014).

---

## 3. Contrato de Configuración Bubblewrap (`twa/twa-manifest.json`)

Define la configuración reproducible con la que `@bubblewrap/cli` genera y actualiza el proyecto Android en `twa/`.

### Campos clave obligatorios

| Campo | Valor requerido | Trazabilidad |
|---|---|---|
| `packageId` | `"io.github.rsolerv.physicalexercises"` | FR-001, FR-004 |
| `host` | `"rsolerv.github.io"` | FR-001, FR-002 |
| `name` | `"Gestión de Ejercicios Físicos"` | FR-001, FR-015 |
| `launcherName` | `"Ejercicios"` | FR-001, FR-015 |
| `startUrl` | `"/physical-exercises-app/"` | FR-001, FR-008 |
| `webManifestUrl` | `"https://rsolerv.github.io/physical-exercises-app/manifest.webmanifest"` | FR-001 |
| `iconUrl` | `"https://rsolerv.github.io/physical-exercises-app/assets/icons/icon-512x512.png"` | FR-001, FR-007 |
| `maskableIconUrl` | `"https://rsolerv.github.io/physical-exercises-app/assets/icons/icon-maskable-512x512.png"` | FR-001, FR-015 |
| `display` | `"standalone"` | FR-002 |
| `fallbackType` | `"customtabs"` | FR-012 |
| `themeColor` | `"#00696b"` | FR-015 |
| `navigationColor` | `"#f6f3ee"` | FR-015 |
| `backgroundColor` | `"#f6f3ee"` | FR-015 |
| `enableNotifications` | `false` | FR-010 |
| `enableSiteSettingsShortcut` | `true` | FR-011, FR-012 |
| `isChromeOSOnly` | `false` | FR-001 |
| `appVersionCode` | Entero positivo incrementado por entrega (`1` en la entrega inicial) | FR-004, FR-008 |
| `appVersionName` | `"1.0.0"` (o versión semántica vigente) | FR-004 |

---

## 4. Artefactos de salida y exclusiones de seguridad (`.gitignore`)

- **Salidas generadas por `bubblewrap build` en `twa/`**:
  - `app-release-signed.apk`: instalable en dispositivo mediante `adb install` o `bubblewrap install` (FR-004).
  - `app-release-bundle.aab`: archivo Android App Bundle listo para subir a Google Play Console (FR-004).
- **Exclusiones obligatorias en `.gitignore` (FR-014)**:
  - `*.keystore`, `*.jks`, `keystore.properties`, `twa/local.properties`
  - `twa/*.apk`, `twa/*.aab`, `twa/build/`, `twa/app/build/`, `twa/.gradle/`
