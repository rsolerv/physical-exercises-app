# Research: Publicar la aplicación en Google Play

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Fecha**: 2026-11-12

Este documento resuelve las decisiones técnicas necesarias para empaquetar y distribuir la aplicación web existente en Google Play mediante **Trusted Web Activity (TWA)** y **Bubblewrap**, sin alterar la arquitectura en capas ni añadir un backend propio. Los prerrequisitos técnicos generales (Angular 22 standalone, Signals, change detection zoneless, Signal Forms, Angular Material 3, SQLite WASM en Web Worker con `opfs-sahpool`, Vitest y despliegue web en GitHub Pages) se heredan de [specs/001-gestion-ejercicios-fisicos/research.md](../001-gestion-ejercicios-fisicos/research.md) y no se repiten aquí.

La especificación no tiene marcadores `NEEDS CLARIFICATION` pendientes. Cada aspecto dependiente del entorno externo de publicación o del dispositivo se clasifica como:

- **Verificado**: contrastado con el estado actual del repositorio, de GitHub Pages y de la documentación oficial de Chrome Developers / Android Developers el 2026-11-12.
- **Por validar (V1–V4)**: comprobaciones técnicas previas recogidas en [quickstart.md](./quickstart.md) que dependen de las claves del propietario, del repositorio raíz de GitHub Pages o de Google Play Console antes de declarar superada la puerta de validación de tienda (FR-005 y FR-016).

---

## 1. Empaquetado TWA con Bubblewrap y formatos de entrega (APK + AAB)

- **Decision**: Mantener un proyecto de empaquetado declarativo de Bubblewrap (`@bubblewrap/cli`) en la carpeta `twa/` del repositorio, alimentado por `twa/twa-manifest.json` y vinculado al manifiesto web publicado (`manifest.webmanifest`). El proceso de construcción genera dos artefactos diferenciados a partir de la misma identidad de aplicación (`applicationId: io.github.rsolerv.physicalexercises`) y del mismo `versionCode` / `versionName`:
  1. `app-release-signed.apk` para instalación directa y pruebas funcionales en dispositivos Android físicos o emuladores (FR-004, historia 1).
  2. `app-release-bundle.aab` (Android App Bundle) para subida a los canales de prueba y producción de Google Play Console (FR-004, historia 2).
- **Rationale**: **Verificado**: Google Play exige Android App Bundle (`.aab`) para todas las aplicaciones nuevas desde agosto de 2021, mientras que el propietario necesita además un `.apk` instalable directamente para validar en su dispositivo sin pasar por la tienda. Bubblewrap produce ambos artefactos en el mismo flujo (`bubblewrap build`) sin duplicar proyectos ni escribir código nativo a mano.
- **Alternatives considered**:
  - Capacitor o Cordova con WebView embebido — rechazado: el usuario pidió expresamente TWA con Bubblewrap para abrir Chrome sin pestañas; además, un WebView embebido no comparte el almacenamiento OPFS del navegador ni soporta del mismo modo los flujos OAuth de Google Identity Services.
  - Proyecto Android Studio manual sin Bubblewrap — rechazado: contradice la petición explícita del usuario y añade mantenimiento manual de Gradle y `android-browser-helper`.

---

## 2. Verificación del origen (`Digital Asset Links`) con despliegue en subruta de GitHub Pages

- **Decision**: Conservar la URL de producción actual de la aplicación (`https://rsolerv.github.io/physical-exercises-app/`) para no invalidar el almacenamiento local (`opfs-sahpool`) ni los orígenes OAuth ya configurados, y publicar el archivo de verificación Digital Asset Links en `https://rsolerv.github.io/.well-known/assetlinks.json` mediante el repositorio de sitio de usuario de GitHub Pages (`rsolerv/rsolerv.github.io`). Adicionalmente, el repositorio del proyecto versiona la copia canónica en `public/.well-known/assetlinks.json` para trazabilidad, validación automatizada con Vitest y sincronización con la raíz del origen.
- **Rationale**: **Verificado**: Android verifica los Digital Asset Links consultando siempre la raíz del origen (`https://rsolerv.github.io/.well-known/assetlinks.json`), incluso cuando `start_url` apunta a la subruta `/physical-exercises-app/`. En la inspección técnica del 2026-11-12 se comprobó mediante la API de GitHub que:
  1. El repositorio actual publica en `https://rsolerv.github.io/physical-exercises-app/`.
  2. El repositorio `rsolerv/rsolerv.github.io` aún no existe, por lo que `https://rsolerv.github.io/.well-known/assetlinks.json` devuelve actualmente `404`.
  3. Al pertenecer la aplicación a la misma cuenta `rsolerv`, crear y activar GitHub Pages en `rsolerv/rsolerv.github.io` permite servir `/.well-known/assetlinks.json` en la raíz exacta del origen `https://rsolerv.github.io` **sin comprar un dominio propio y sin cambiar el origen de la web**.
- **Alternatives considered**:
  - Servir `assetlinks.json` únicamente en `https://rsolerv.github.io/physical-exercises-app/.well-known/assetlinks.json` — rechazado: Android ignora las subrutas para Digital Asset Links y degradaría la apertura a Custom Tabs con barra de direcciones visible (incumpliendo FR-002 y FR-016).
  - Migrar la aplicación a un dominio personalizado nuevo — rechazado como opción por defecto: cambiaría el origen web (`origin`), haciendo inaccesible la base de datos SQLite OPFS existente en los navegadores de quienes ya usan la web y obligando a reconfigurar los orígenes autorizados de Google Cloud.
- **Por validar (V1)**: tras publicar `.well-known/assetlinks.json` en `rsolerv/rsolerv.github.io`, comprobar que `https://rsolerv.github.io/.well-known/assetlinks.json` responde HTTP 200 con `Content-Type: application/json` y sin redirecciones. Mientras esta comprobación no esté completada, se registra como bloqueo explícito conforme a FR-016.

---

## 3. Doble huella SHA-256 de firma (instalación directa frente a Google Play App Signing)

- **Decision**: El archivo `.well-known/assetlinks.json` incluirá en `target.sha256_cert_fingerprints` un array con las huellas SHA-256 de **ambos** certificados:
  1. La clave de firma local / clave de subida (*upload key*) generada con el almacén de claves del propietario para firmar el APK de prueba directa y el AAB subido a Play Console.
  2. El certificado de firma de la aplicación gestionado por Google Play (*Google Play App Signing certificate*), obtenido en Google Play Console (`Configuración → Integridad de la aplicación → Firma de aplicaciones de Play`).
  El almacén de claves privado (`*.keystore` / `*.jks`) y sus contraseñas nunca se guardan en el repositorio ni en `public/` (FR-014); se excluyen en `.gitignore` y se documenta su custodia y copia de seguridad.
- **Rationale**: **Verificado**: cuando se sube un AAB a Google Play, Google vuelve a firmar los APK distribuidos a los usuarios con la clave de *Play App Signing*. Si `assetlinks.json` solo contiene la huella del keystore local, el APK instalado por cable funciona sin barras, pero la aplicación instalada desde Google Play muestra la barra superior de Custom Tabs (escenario prohibido por historia 2, escenario 2 y FR-005). Digital Asset Links admite múltiples huellas SHA-256 para el mismo `package_name`.
- **Alternatives considered**:
  - Incluir una única huella SHA-256 — rechazado: impide que funcionen simultáneamente la entrega de prueba directa (APK) y la entrega distribuida por Google Play.
  - Guardar el keystore de producción dentro del repositorio — rechazado: vulnera FR-014 y las normas de seguridad.
- **Por validar (V2)**: tras crear la aplicación en Google Play Console y habilitar Play App Signing, copiar la huella SHA-256 de Play App Signing junto a la huella de la clave local en `assetlinks.json` y verificar en un dispositivo la instalación procedente del canal de pruebas de Google Play.

---

## 4. Manifiesto Web (`manifest.webmanifest`) e integración con la SPA en GitHub Pages

- **Decision**: Incorporar `public/manifest.webmanifest` y enlazarlo desde `src/index.html` junto con `<html lang="es">` y `<meta name="theme-color" content="#00696b">`. Configurar:
  - `name`: `"Gestión de Ejercicios Físicos"`
  - `short_name`: `"Ejercicios"`
  - `lang`: `"es-ES"`
  - `start_url`: `"./"` y `scope`: `"./"` (relativos a `<base href="/physical-exercises-app/">` en producción)
  - `display`: `"standalone"`
  - `background_color`: `"#f6f3ee"` y `theme_color`: `"#00696b"` (alineados con las variables `--color-fondo` y `--color-primario` de `src/styles.scss`)
  - Iconos PNG en `public/assets/icons/` generados a partir del icono maestro aportado por el propietario (`public/assets/icons/MisEjerciciosFisicos.png`, 768×768 px):
    - `public/assets/icons/icon-192x192.png` (192×192 px, `purpose: "any"`, 52,7 KB)
    - `public/assets/icons/icon-512x512.png` (512×512 px, `purpose: "any"`, 306,4 KB; sirve también como icono de alta resolución 512×512 px < 1 MB para la ficha de Google Play Console)
    - `public/assets/icons/icon-maskable-512x512.png` (512×512 px, `purpose: "maskable"`, 228,2 KB, con margen de seguridad del 84 % para iconos adaptativos de Android).
  No se añade un Service Worker de cacheo agresivo ni un modo offline nuevo: la aplicación conserva su comportamiento actual (FR-008, FR-010 y supuestos de conectividad de la spec).
- **Rationale**: Bubblewrap necesita leer un Web App Manifest válido con iconos de al menos 512×512 px para generar el proyecto Android, la pantalla de arranque (*splash screen*) y el icono adaptativo. Usar colores idénticos a `--color-fondo` y `--color-primario` evita parpadeos visuales al abrir la TWA y respeta la identidad visual de Angular Material 3. No añadir un Service Worker nuevo garantiza que los despliegues web en GitHub Pages se reflejen al recargar con conexión sin quedar retenidos por una caché intermedia (FR-008, SC-006).
- **Alternatives considered**:
  - Añadir `@angular/service-worker` con precacheo completo — rechazado: la especificación establece expresamente en sus supuestos que no se añade un modo sin conexión completo ni garantías nuevas de primera apertura sin red, y que las actualizaciones web deben observarse al recargar con conexión (SC-006).

---

## 5. Comportamiento del navegador, enlaces externos, OAuth y almacenamiento (`opfs-sahpool`)

- **Decision**: Configurar `fallbackType: "customtabs"` en Bubblewrap (`twa-manifest.json`). Dentro del ámbito verificado (`https://rsolerv.github.io/physical-exercises-app/...`), la navegación de Angular Router y el botón Atrás de Android recorren el historial de la SPA y salen de la actividad al agotar el historial (FR-003). Los enlaces y flujos que apuntan a otros orígenes (`accounts.google.com` para conectar Google, `youtube.com` / `youtu.be` o enlaces externos en fichas, `aepd.es`) son gestionados fuera del ámbito verificado por el propio navegador (con su barra de seguridad de Custom Tab o aplicación externa) y regresan a la actividad al cerrarse.
- **Rationale**: **Verificado**: una TWA ejecuta la web en el proceso del navegador compatible del usuario (Chrome en la configuración de referencia), compartiendo su motor de almacenamiento del origen `https://rsolerv.github.io`. Por tanto:
  - El Web Worker de SQLite WASM y el VFS `opfs-sahpool` funcionan sobre el mismo origen sin migraciones ni almacenamiento nativo paralelo (FR-008, FR-009, FR-010).
  - La exportación e importación del archivo ZIP manual y la sincronización con Google Drive (`drive.appdata`) y GitHub operan igual que en el navegador móvil (historia 3).
  - Si en un dispositivo no existe navegador compatible con TWA o falla la verificación de Digital Asset Links, `customtabs` actúa como mecanismo de respaldo mostrando los controles del navegador en lugar de bloquear o cerrar abruptamente la aplicación (historia 4, escenario 2 y FR-012).
- **Alternatives considered**:
  - `fallbackType: "webview"` — rechazado: Android WebView tiene un almacenamiento aislado del navegador Chrome, restricciones de ventanas emergentes OAuth con Google Identity Services y soporte diferente de OPFS, lo que rompería la continuidad de datos y el inicio de sesión con Google.
- **Por validar (V3 y V4)**: comprobar en dispositivo Android real con la TWA instalada el flujo de autorización de Google Identity Services ("Conectar con Google" y regreso a la TWA) y la descarga/selección de archivo ZIP en "Copia de seguridad manual".

---

## 6. Accesibilidad y actualización de la Política de Privacidad desde la aplicación y Google Play

- **Decision**: Reutilizar y actualizar el documento estático existente `public/politica-privacidad.html` (publicado en `https://rsolerv.github.io/physical-exercises-app/politica-privacidad.html`) y exponer un enlace directo `"Política de privacidad"` dentro de la aplicación en puntos alcanzables en un máximo de dos acciones sin identificación (FR-011, SC-005):
  1. En móvil: dentro del panel inferior `"Más opciones"` (`PanelMasComponent` en `shell.component.ts`), alcanzable en **2 pulsaciones** (`Más` → `Política de privacidad`).
  2. En tablet (riel lateral) y escritorio (menú lateral): enlace directo a `politica-privacidad.html` en el pie de la navegación principal (`shell.component.html`), alcanzable en **1 pulsación** desde cualquier pantalla.
  3. En la pantalla `Sincronización` (`configuracion-sincronizacion.component.html`): enlace directo junto al texto informativo de privacidad, alcanzable en **1 pulsación** dentro de la pantalla (2 desde cualquier otra vista).
  Además, actualizar el texto de `public/politica-privacidad.html` para reflejar todos los tratamientos vigentes (FR-010): almacenamiento local en SQLite, sincronización opcional con Google Drive (`drive.appdata`) y GitHub, copia manual en archivo, consulta y subida opcional al catálogo público común de ejercicios en GitHub (feature 003), carga de recursos tipográficos/iconos y apertura desde la aplicación Android instalada (TWA) sobre el navegador del dispositivo sin recopilación adicional ni servidores propios.
- **Rationale**: **Verificado**: `public/politica-privacidad.html` ya existe en el repositorio y se despliega como HTML estático independiente (accesible sin autenticación desde Google Play Console y desde la ficha de la tienda). Añadir únicamente el enlace de navegación hacia ese documento estático cumple FR-011 y SC-005 sin crear una pantalla Angular nueva ni alterar la estructura visual o los flujos existentes; por tanto, conforme al Principio V de la constitución y a `ux-ui.instructions.md`, se trata de un ajuste menor de enlace/texto y no requiere un ciclo de prototipado de pantalla nueva en Storybook.
- **Alternatives considered**:
  - Crear una ruta Angular nueva `/privacidad` con componente propio — rechazado: duplica el contenido que ya vive en `public/politica-privacidad.html`, obligaría a cargar toda la SPA cuando un usuario consulta la política desde la ficha externa de Google Play y constituiría una pantalla nueva innecesaria.
