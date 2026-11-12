# Data Model: Publicar la aplicación en Google Play

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Investigación**: [research.md](./research.md)

Esta feature **no introduce nuevas entidades de negocio ni modifica el esquema de la base de datos SQLite WASM** (FR-010). Las entidades de dominio (Ejercicio, Categoría, Planificación, ProgresoDiario) y la entidad técnica Ajustes de aplicación permanecen tal como están definidas en las features [001](../001-gestion-ejercicios-fisicos/data-model.md), [002](../002-sincronizacion-google-drive/data-model.md) y [003](../003-importar-exportar-ejercicios/data-model.md).

El modelo de datos de esta feature describe los **artefactos declarativos de identidad, verificación de origen y entrega Android** que deben mantenerse coherentes entre sí para que la aplicación se instale, verifique el dominio sin barras del navegador y pueda presentarse a Google Play.

---

## Resumen de artefactos y persistencia

| Elemento | Ubicación | Se incluye en Git | Descripción |
|---|---|---|---|
| Manifiesto Web (`WebAppManifest`) | `public/manifest.webmanifest` | Sí | Metadatos de instalación web consumidos por el navegador y por Bubblewrap |
| Vínculo Digital Asset Links (`AssetLinksDocument`) | `public/.well-known/assetlinks.json` y raíz `https://rsolerv.github.io/.well-known/assetlinks.json` | Sí (solo huellas públicas SHA-256) | Acredita la relación entre el origen web y el paquete Android firmado |
| Manifiesto TWA de Bubblewrap (`TwaManifest`) | `twa/twa-manifest.json` | Sí | Configuración declarativa de la identidad Android, versión, URLs y colores |
| Almacén de claves de firma (`SigningKeystore`) | Custodia privada del propietario (fuera del repositorio) | **No** (prohibido por FR-014) | Clave privada para firmar el APK de prueba y el AAB de subida |
| Materiales y estado de publicación (`PlayStoreChecklist`) | Documentación de entrega / guía operativa | Sí | Relación verificable de materiales, declaraciones y bloqueos (FR-007, FR-016) |

---

## 1. Identidad de la aplicación distribuida (`TwaManifest` + `WebAppManifest`)

Representa la identidad única y estable de la aplicación entre el sitio publicado en GitHub Pages y el paquete Android.

| Atributo | Valor / Tipo | Obligatorio | Reglas de validación (FR-001, FR-004, FR-008, FR-015) |
|---|---|---|---|
| `packageId` | `"io.github.rsolerv.physicalexercises"` | Sí | Identificador de paquete Android válido en notación inversa de dominio; debe ser idéntico en `twa/twa-manifest.json` y en `.well-known/assetlinks.json`. No puede cambiar entre versiones para conservar los datos y permitir actualizaciones (FR-004, FR-008). |
| `host` | `"rsolerv.github.io"` | Sí | Dominio exacto donde se aloja la web en GitHub Pages (sin protocolo ni barra final). |
| `startUrl` | `"/physical-exercises-app/"` (en `twa-manifest.json`) / `"./"` (en `manifest.webmanifest`) | Sí | Debe abrir la ruta raíz de la SPA publicada en GitHub Pages, que redirige a la pantalla de inicio vigente (`/hoy`). |
| `name` | `"Gestión de Ejercicios Físicos"` | Sí | Nombre visible en español de España (Principio I, FR-001, FR-015). |
| `launcherName` / `short_name` | `"Ejercicios"` | Sí | Nombre corto en español de España (≤ 12 caracteres recomendados para evitar truncamiento bajo el icono en el lanzador de Android). |
| `iconUrl` / `maskableIconUrl` | `"https://rsolerv.github.io/physical-exercises-app/assets/icons/icon-512x512.png"` y `"https://rsolerv.github.io/physical-exercises-app/assets/icons/icon-maskable-512x512.png"` | Sí | Derivados del icono original `public/assets/icons/MisEjerciciosFisicos.png` (768×768 px) redimensionados a `512x512` (`icon-512x512.png`, válido también para la ficha de Google Play Console) y `192x192` (`icon-192x192.png`). |
| `display` | `"standalone"` | Sí | Solicita apertura como aplicación independiente sin barra de direcciones ni pestañas cuando la verificación Digital Asset Links es válida (FR-002). |
| `fallbackType` | `"customtabs"` | Sí | En caso de fallo de verificación o ausencia de proveedor TWA compatible, abre Custom Tabs sin usar un WebView aislado (FR-012). |
| `themeColor` / `navigationColor` / `backgroundColor` | `"#00696b"` / `"#f6f3ee"` / `"#f6f3ee"` | Sí | Colores coherentes con `--color-primario` y `--color-fondo` de la aplicación para la barra de estado, pantalla de carga y barra del sistema. |
| `appVersionCode` | Entero positivo (`>= 1`) | Sí | Debe incrementarse estrictamente en cada nueva entrega (`.apk` / `.aab`) para que Android y Google Play permitan actualizar sin desinstalar (FR-004, FR-008). |
| `appVersionName` | Cadena semántica (`"1.0.0"`, etc.) | Sí | Versión legible mostrada al usuario y en Google Play Console. |
| `enableNotifications` | `false` | Sí | No se solicitan permisos de notificaciones ni capacidades no especificadas (FR-010). |

---

## 2. Acreditación pública del origen (`AssetLinksDocument`)

Archivo JSON estático servido en `/.well-known/assetlinks.json` en la raíz del origen `https://rsolerv.github.io`.

| Campo | Tipo | Obligatorio | Reglas de validación (FR-002, FR-005, FR-014, FR-016) |
|---|---|---|---|
| `relation` | `["delegate_permission/common.handle_all_urls"]` | Sí | Relación obligatoria para que Chrome en Android acepte abrir el origen en modo TWA sin barra de direcciones. |
| `target.namespace` | `"android_app"` | Sí | Espacio de nombres fijo exigido por el estándar Digital Asset Links. |
| `target.package_name` | `"io.github.rsolerv.physicalexercises"` | Sí | Debe coincidir exactamente con `packageId` de `twa/twa-manifest.json`. |
| `target.sha256_cert_fingerprints` | `string[]` (1 o más huellas SHA-256 en formato `AA:BB:...` de 32 bytes hexadecimales separados por `:`) | Sí | Debe contener la huella SHA-256 del certificado de firma del APK local y, para la validación en tienda (FR-005), la huella SHA-256 del certificado de *Google Play App Signing*. Solo contiene huellas públicas, nunca claves privadas (FR-014). |

---

## 3. Materiales y estados de entrega (`PlayStoreReleaseState`)

Modelo operativo documentado para evitar declarar publicada o verificada una entrega cuando faltan pasos externos del propietario o de Google (FR-006, FR-007, FR-016).

### Estados del ciclo de entrega

1. **`CONFIGURADO_EN_REPOSITORIO`**: `manifest.webmanifest`, iconos, enlaces a `politica-privacidad.html`, plantilla/configuración `twa/twa-manifest.json` y pruebas automatizadas en verde.
2. **`BLOQUEADO_POR_PRERREQUISITO_EXTERNO`**: falta al menos uno de los requisitos que solo el propietario puede aportar o activar:
   - Publicación de `/.well-known/assetlinks.json` en la raíz `https://rsolerv.github.io/.well-known/assetlinks.json` (repositorio `rsolerv/rsolerv.github.io`).
   - Generación del keystore privado local e inserción de su huella SHA-256 pública.
   - Alta de la aplicación en Google Play Console y obtención de la huella SHA-256 de *Google Play App Signing*.
3. **`VALIDADO_EN_INSTALACION_DIRECTA`**: el APK firmado (`app-release-signed.apk`) abre la aplicación desde su icono en un dispositivo con Chrome compatible sin barra de direcciones ni pestañas, con `assetlinks.json` publicado en la raíz del origen.
4. **`VALIDADO_EN_CANAL_PRUEBAS_PLAY`**: el AAB (`app-release-bundle.aab`) se ha subido a un canal de pruebas de Google Play, su huella de *Play App Signing* está publicada en `https://rsolerv.github.io/.well-known/assetlinks.json`, y la instalación descargada desde Google Play abre sin barras y conserva los datos tras una actualización (FR-005, SC-001, SC-002).
5. **`LISTO_PARA_ENVIO_A_PRODUCCION`**: todos los materiales y declaraciones de FR-007 están en estado `Completo` y la entrega superó el canal de pruebas; la publicación final en producción depende exclusivamente del envío del propietario y de la revisión de Google.
