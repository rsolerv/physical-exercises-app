---

description: "Task list for feature 004-publicar-google-play implementation"
---

# Tasks: Publicar la aplicación en Google Play

**Input**: Design documents from `/specs/004-publicar-google-play/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Obligatorios por la Constitución del proyecto (test-first con Vitest, ≥ 80 % de cobertura global, 100 % en Domain y 0 errores de ESLint).

**Organization**: Las tareas están agrupadas por historia de usuario (US1 a US4) para permitir implementar y validar cada incremento de forma independiente. Conforme al Principio V de la constitución y a [contracts/interfaz-usuario-privacidad.md](./contracts/interfaz-usuario-privacidad.md), no se crean pantallas nuevas ni se rediseña la navegación existente, por lo que no aplica bloque de prototipado de pantalla nueva en Storybook.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencia de tareas incompletas)
- **[Story]**: Historia de usuario a la que pertenece la tarea (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Todas las tareas incluyen rutas exactas de archivo

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparación de directorios de activos y exclusiones de seguridad obligatorias antes de crear artefactos de empaquetado.

- [X] T001 Actualizar `.gitignore` para excluir almacenes de claves privados, propiedades locales y binarios generados (`*.keystore`, `*.jks`, `keystore.properties`, `twa/local.properties`, `twa/*.apk`, `twa/*.aab`, `twa/build/`, `twa/app/build/`, `twa/.gradle/`) conforme a FR-014 en `.gitignore`
- [X] T002 [P] Crear la estructura de carpetas para los iconos instalables, Digital Asset Links y configuración de Bubblewrap en `public/assets/icons/`, `public/.well-known/` y `twa/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Metadatos web instalables (`WebAppManifest` e iconos) y pruebas base de contrato que bloquean tanto la apertura sin barras en Android (US1) como la entrega para Google Play (US2).

**⚠️ CRITICAL**: Ninguna historia de usuario puede completarse antes de finalizar esta fase.

- [X] T003 Escribir pruebas Vitest (test-first, deben fallar antes de implementar) que verifiquen la presencia, estructura y restricciones de `public/manifest.webmanifest`, los iconos redimensionados en `public/assets/icons/` y `src/index.html` conforme a `specs/004-publicar-google-play/contracts/distribucion-android-twa.md` en `tests/unit/twa/distribucion-twa-contratos.spec.ts`
- [x] T004 [P] Incorporar el icono maestro aportado por el propietario (`768x768`) y generar a partir de él los tres iconos PNG redimensionados (`192x192` y `512x512` con `purpose: "any"`, y `512x512` con `purpose: "maskable"` y zona segura del 84 %) en `public/assets/icons/MisEjerciciosFisicos.png`, `public/assets/icons/icon-192x192.png`, `public/assets/icons/icon-512x512.png` y `public/assets/icons/icon-maskable-512x512.png`
- [X] T005 Crear el manifiesto web en `public/manifest.webmanifest` cumpliendo exactamente las restricciones de `specs/004-publicar-google-play/data-model.md`: `name` = `"Gestión de Ejercicios Físicos"` ("Nombre visible en español de España (Principio I, FR-001, FR-015)"), `short_name` = `"Ejercicios"` ("Nombre corto en español de España (≤ 12 caracteres recomendados para evitar truncamiento bajo el icono en el lanzador de Android)"), `lang` = `"es-ES"`, `start_url` = `"./"` y `scope` = `"./"` ("Debe abrir la ruta raíz de la SPA publicada en GitHub Pages, que redirige a la pantalla de inicio vigente (`/hoy`)"), `display` = `"standalone"` ("Solicita apertura como aplicación independiente sin barra de direcciones ni pestañas cuando la verificación Digital Asset Links es válida (FR-002)"), `background_color` = `"#f6f3ee"` y `theme_color` = `"#00696b"` ("Colores coherentes con `--color-primario` y `--color-fondo` de la aplicación para la barra de estado, pantalla de carga y barra del sistema")
- [X] T006 Actualizar `src/index.html` para fijar `<html lang="es">`, `<title>Gestión de Ejercicios Físicos</title>`, `<meta name="theme-color" content="#00696b" />`, `<link rel="manifest" href="manifest.webmanifest" />` y `<link rel="apple-touch-icon" href="assets/icons/icon-192x192.png" />` en `src/index.html`

**Checkpoint**: La SPA publica su manifiesto web e iconos en español de España y está lista para ser empaquetada con Bubblewrap.

---

## Phase 3: User Story 1 - Abrir la aplicación desde Android sin barras del navegador (Priority: P1) 🎯 MVP

**Goal**: Permitir instalar la aplicación en Android con nombre e icono propios y abrirla desde su icono directamente en la pantalla de inicio vigente (`Hoy`) sobre Chrome compatible sin barra de direcciones ni selector de pestañas, respetando el historial del botón Atrás y los enlaces externos.

**Independent Test**: Instalar la versión de prueba en un teléfono con Chrome compatible, abrir su icono y recorrer Hoy, Buscar y una ficha de ejercicio, comprobando que no aparecen controles del navegador, que Atrás regresa a la pantalla anterior o sale al agotar el historial, y que los enlaces externos se abren sin perder datos.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [US1] Ampliar `tests/unit/twa/distribucion-twa-contratos.spec.ts` con pruebas Vitest que validen la coherencia entre `twa/twa-manifest.json`, `public/.well-known/assetlinks.json` y `public/manifest.webmanifest` (identidad de paquete, dominio, `startUrl`, `display: "standalone"`, `fallbackType: "customtabs"`, `enableNotifications: false` y relación Digital Asset Links) en `tests/unit/twa/distribucion-twa-contratos.spec.ts`

### Implementation for User Story 1

- [X] T008 [P] [US1] Crear el manifiesto declarativo de Bubblewrap en `twa/twa-manifest.json` cumpliendo las restricciones de `specs/004-publicar-google-play/data-model.md`: `packageId` = `"io.github.rsolerv.physicalexercises"` ("Identificador de paquete Android válido en notación inversa de dominio; debe ser idéntico en `twa/twa-manifest.json` y en `.well-known/assetlinks.json`. No puede cambiar entre versiones para conservar los datos y permitir actualizaciones (FR-004, FR-008)"), `host` = `"rsolerv.github.io"` ("Dominio exacto donde se aloja la web en GitHub Pages (sin protocolo ni barra final)"), `startUrl` = `"/physical-exercises-app/"` ("Debe abrir la ruta raíz de la SPA publicada en GitHub Pages, que redirige a la pantalla de inicio vigente (`/hoy`)"), `name` = `"Gestión de Ejercicios Físicos"`, `launcherName` = `"Ejercicios"`, `display` = `"standalone"`, `fallbackType` = `"customtabs"` ("En caso de fallo de verificación o ausencia de proveedor TWA compatible, abre Custom Tabs sin usar un WebView aislado (FR-012)"), `themeColor` = `"#00696b"`, `navigationColor` = `"#f6f3ee"`, `backgroundColor` = `"#f6f3ee"`, `enableNotifications` = `false` ("No se solicitan permisos de notificaciones ni capacidades no especificadas (FR-010)"), `enableSiteSettingsShortcut` = `true`, `isChromeOSOnly` = `false`, `appVersionCode` = `1` ("Entero positivo (`>= 1`)") y `appVersionName` = `"1.0.0"` ("Cadena semántica (`\"1.0.0\"`, etc.)") en `twa/twa-manifest.json`
- [X] T009 [P] [US1] Crear el documento Digital Asset Links en `public/.well-known/assetlinks.json` cumpliendo las restricciones de `specs/004-publicar-google-play/data-model.md`: `relation` = `["delegate_permission/common.handle_all_urls"]` ("Relación obligatoria para que Chrome en Android acepte abrir el origen en modo TWA sin barra de direcciones"), `target.namespace` = `"android_app"` ("Espacio de nombres fijo exigido por el estándar Digital Asset Links"), `target.package_name` = `"io.github.rsolerv.physicalexercises"` ("Debe coincidir exactamente con `packageId` de `twa/twa-manifest.json`") y `target.sha256_cert_fingerprints` ("Debe contener la huella SHA-256 del certificado de firma del APK local y, para la validación en tienda (FR-005), la huella SHA-256 del certificado de *Google Play App Signing*. Solo contiene huellas públicas, nunca claves privadas (FR-014)") en `public/.well-known/assetlinks.json`
- [X] T010 [US1] Configurar en `angular.json` y `.github/workflows/deploy.yml` que la carpeta oculta `public/.well-known/assetlinks.json` y `public/manifest.webmanifest` se copien íntegramente en la salida de compilación `dist/physical-exercises-app/browser/.well-known/assetlinks.json` en `angular.json` y `.github/workflows/deploy.yml`

**Checkpoint**: User Story 1 lista y verificada por pruebas de contrato; permite generar el APK con Bubblewrap y comprobar la apertura sin barras tras publicar `assetlinks.json` en la raíz del origen.

---

## Phase 4: User Story 2 - Distribuir una versión comprobada desde Google Play (Priority: P1)

**Goal**: Disponer del flujo reproducible para generar tanto el APK de prueba directa como el AAB para Google Play, la validación automática de bloqueos de entrega (FR-016) y la guía completa en español con la relación de materiales, custodia de claves, publicación de huellas y actualización de versiones (FR-004 a FR-008, FR-014, FR-016).

**Independent Test**: Seguir la guía y el validador de entrega para comprobar el estado de prerrequisitos, presentar la entrega AAB al canal de pruebas de Google Play, instalarla en un dispositivo invitado, verificar que abre sin barras con la firma de Google Play y que una actualización con `appVersionCode` superior conserva los ejercicios guardados.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T011 [US2] Añadir pruebas Vitest en `tests/unit/twa/distribucion-twa-contratos.spec.ts` que verifiquen: (a) que ningún archivo `.keystore` o `.jks` está versionado ni referenciado dentro de `public/`, (b) que el validador de estado de entrega detecta como `BLOQUEADO_POR_PRERREQUISITO_EXTERNO` cualquier huella SHA-256 pendiente o no conforme con `^([0-9A-F]{2}:){31}[0-9A-F]{2}$` conforme a FR-016, y (c) que `twa/README-PUBLICACION-PLAY.md` incluye todas las secciones obligatorias de FR-006, FR-007, FR-013, FR-014 y FR-016 en `tests/unit/twa/distribucion-twa-contratos.spec.ts`

### Implementation for User Story 2

- [X] T012 [US2] Crear la guía operativa de empaquetado, verificación de bloqueos y publicación en Google Play en `twa/README-PUBLICACION-PLAY.md` que documente en español de España: (1) preparación del entorno JDK + `@bubblewrap/cli`, (2) generación y custodia fuera de Git del keystore privado y copia de seguridad (FR-014), (3) generación de `app-release-signed.apk` y `app-release-bundle.aab` (FR-004), (4) publicación de `.well-known/assetlinks.json` en el repositorio raíz `rsolerv/rsolerv.github.io` con las dos huellas SHA-256 (clave local y *Google Play App Signing*, FR-005 y FR-016), (5) tabla de materiales y declaraciones exigibles de Google Play Console con estado `Completo` / `Pendiente` (FR-007), y (6) procedimiento de actualización incrementando `appVersionCode` y preservación/traslado de datos (FR-006, FR-008, FR-013) en `twa/README-PUBLICACION-PLAY.md`
- [X] T013 [US2] Añadir scripts npm de apoyo en `package.json` (`twa:init`, `twa:update`, `twa:build`, `twa:fingerprint`) que ejecuten `@bubblewrap/cli` sobre `twa/twa-manifest.json` sin introducir dependencias en el bundle de producción en `package.json`

**Checkpoint**: User Stories 1 y 2 completas; el propietario dispone de los contratos, scripts y guía verificada con control explícito de bloqueos para instalar el APK y distribuir el AAB en Google Play.

---

## Phase 5: User Story 3 - Conservar los flujos y los datos de la web (Priority: P2)

**Goal**: Garantizar que la distribución Android mantiene intactos el almacenamiento local SQLite WASM (`opfs-sahpool`) sin cuenta obligatoria, la copia manual ZIP, el catálogo común y la sincronización opcional con Google Drive y GitHub, y documentar cómo recuperar los datos ante un cambio de origen o navegador (FR-008, FR-009, FR-010, FR-013).

**Independent Test**: Crear un ejercicio sin cuenta, cerrar y reabrir la aplicación, exportar e importar una copia manual ZIP y verificar que los flujos de sincronización con Google y GitHub y las instrucciones de traslado funcionan sin exigir cuentas nuevas ni perder datos.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T014 [US3] Añadir pruebas Vitest en `tests/unit/twa/distribucion-twa-contratos.spec.ts` que verifiquen que la configuración TWA (`twa/twa-manifest.json` y `public/manifest.webmanifest`) conserva el mismo origen `https://rsolerv.github.io` y ruta `/physical-exercises-app/` que usa SQLite WASM, mantiene `fallbackType: "customtabs"` para no aislar el almacenamiento en un WebView ni romper la ventana de Google Identity Services, y no declara permisos ni orígenes adicionales en `tests/unit/twa/distribucion-twa-contratos.spec.ts`

### Implementation for User Story 3

- [X] T015 [US3] Documentar y verificar en `twa/README-PUBLICACION-PLAY.md` y `specs/004-publicar-google-play/quickstart.md` el procedimiento de continuidad de datos locales (`opfs-sahpool`), el comportamiento del retorno de autorización OAuth de Google y GitHub hacia la TWA y los pasos de traslado mediante copia manual ZIP o sincronización cuando la persona cambia de navegador o de dirección web (FR-008, FR-009, FR-013) en `twa/README-PUBLICACION-PLAY.md` y `specs/004-publicar-google-play/quickstart.md`

**Checkpoint**: User Story 3 verificada; se garantiza por contrato y pruebas que la TWA comparte el mismo origen y motor de almacenamiento del navegador sin pérdida de capacidades.

---

## Phase 6: User Story 4 - Entender las limitaciones de acceso y privacidad (Priority: P2)

**Goal**: Ofrecer acceso sin identificación y en un máximo de 2 acciones a la política de privacidad en español de España desde cualquier vista de la aplicación (móvil, tablet, escritorio y pantalla de Sincronización) y desde la ficha de Google Play, describiendo todos los tratamientos reales vigentes y las limitaciones de conexión o navegador compatible (FR-010, FR-011, FR-012, FR-015, SC-004, SC-005).

**Independent Test**: En móvil pulsar `Más` → `Política de privacidad` (2 acciones), en tablet/escritorio pulsar `Política de privacidad` en el pie de navegación (1 acción) y en `Sincronización` pulsar `Consultar la política de privacidad` (1 acción), comprobando que abre `politica-privacidad.html` sin identificarse y que el texto detalla el almacenamiento local, Google Drive, GitHub, el catálogo común, la aplicación Android y cómo retirar accesos o borrar datos.

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T016 [P] [US4] Añadir pruebas de componente en `tests/component/presentation/shell.component.spec.ts` que verifiquen que el enlace a `politica-privacidad.html` con etiqueta `"Política de privacidad"` se muestra en el menú lateral de escritorio (≥ 1280 px), en el riel lateral de tablet (600–1279 px) y dentro del panel inferior `"Más opciones"` en móvil (≤ 599 px) en un máximo de 2 acciones en `tests/component/presentation/shell.component.spec.ts`
- [X] T017 [P] [US4] Añadir prueba de componente en `tests/component/presentation/configuracion-sincronizacion.component.spec.ts` que verifique la presencia del enlace accesible `"Consultar la política de privacidad"` apuntando a `politica-privacidad.html` en la sección de privacidad de la pantalla Sincronización en `tests/component/presentation/configuracion-sincronizacion.component.spec.ts`
- [X] T018 [P] [US4] Añadir pruebas Vitest en `tests/unit/twa/distribucion-twa-contratos.spec.ts` que verifiquen que `public/politica-privacidad.html` está redactada en español (`lang="es"`), incluye información sobre el almacenamiento local en navegador y aplicación Android, Google Drive (`drive.appdata`), GitHub privado, el catálogo común público de ejercicios (`rsolerv/common-data-physical-exercises`), cómo retirar accesos y cómo eliminar los datos, y tiene enlace de retorno `./` en `tests/unit/twa/distribucion-twa-contratos.spec.ts`

### Implementation for User Story 4

- [X] T019 [P] [US4] Actualizar `public/politica-privacidad.html` conforme a `specs/004-publicar-google-play/contracts/interfaz-usuario-privacidad.md` para describir también la consulta y subida opcional al catálogo público común de ejercicios (`rsolerv/common-data-physical-exercises`, feature 003) y el funcionamiento de la aplicación Android instalada (que abre la misma aplicación web en el navegador compatible del dispositivo sin servidores propios, analítica ni recopilación adicional) en `public/politica-privacidad.html`
- [X] T020 [US4] Añadir el enlace accesible `"Política de privacidad"` (`href="politica-privacidad.html"`) en el panel móvil `"Más opciones"` (`PanelMasComponent`), en el pie del riel lateral de tablet y en el pie del menú lateral de escritorio, manteniendo un área táctil mínima de 48 × 48 px y respetando `env(safe-area-inset-bottom)` en `src/app/presentation/compartido/shell/shell.component.ts`, `src/app/presentation/compartido/shell/shell.component.html` y `src/app/presentation/compartido/shell/shell.component.scss`
- [X] T021 [US4] Añadir el enlace `"Consultar la política de privacidad"` (`href="politica-privacidad.html"`) junto al aviso de privacidad del bloque principal en `src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component.html` y ajustar su espaciado en `src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component.scss`

**Checkpoint**: Todas las historias de usuario (US1 a US4) están implementadas y son verificables de forma independiente.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validación integral de calidad, cobertura, lint, compilación de producción, Storybook y guía rápida.

- [X] T022 Ejecutar `npm run lint`, `npm test -- --no-watch`, `npm run build` y `npm run build-storybook`, verificando 0 errores de ESLint, cobertura ≥ 80 % global y 100 % en Domain, y que `dist/physical-exercises-app/browser/` contiene `manifest.webmanifest`, `politica-privacidad.html`, `assets/icons/` y `.well-known/assetlinks.json` a partir de `angular.json` y `package.json`
- [X] T023 Revisar la consistencia final entre `specs/004-publicar-google-play/quickstart.md`, `twa/README-PUBLICACION-PLAY.md` y `specs/001-gestion-ejercicios-fisicos/research.md` (§31) para asegurar que todos los pasos de validación y bloqueos externos están actualizados en `specs/004-publicar-google-play/quickstart.md` y `specs/001-gestion-ejercicios-fisicos/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1: T001–T002)**: Sin dependencias — puede comenzar de inmediato.
- **Foundational (Phase 2: T003–T006)**: Depende de Phase 1 — **BLOQUEA** todas las historias de usuario porque crea el `manifest.webmanifest` y los iconos requeridos por Bubblewrap.
- **User Story 1 (Phase 3: T007–T010, P1 🎯 MVP)**: Depende de Phase 2.
- **User Story 2 (Phase 4: T011–T013, P1)**: Depende de Phase 2 y de los manifiestos de US1 (`twa/twa-manifest.json` y `public/.well-known/assetlinks.json`).
- **User Story 3 (Phase 5: T014–T015, P2)**: Depende de US1 y US2 para validar la continuidad del origen y los flujos sobre la configuración TWA.
- **User Story 4 (Phase 6: T016–T021, P2)**: Depende únicamente de Phase 2; puede ejecutarse **en paralelo** con US1/US2/US3 al tocar archivos distintos (`public/politica-privacidad.html`, `shell.component.*`, `configuracion-sincronizacion.component.*`).
- **Polish (Phase 7: T022–T023)**: Depende de completar todas las historias de usuario (Phases 3 a 6).

### User Story Completion Graph

```text
Phase 1 (Setup: T001-T002)
   │
   ▼
Phase 2 (Foundational: T003-T006)
   ├──► Phase 3: US1 (P1 MVP - Apertura Android sin barras: T007-T010)
   │       │
   │       ▼
   │    Phase 4: US2 (P1 - Entrega Google Play y bloqueos: T011-T013)
   │       │
   │       ▼
   │    Phase 5: US3 (P2 - Continuidad de datos y flujos: T014-T015)
   │
   └──► Phase 6: US4 (P2 - Acceso a privacidad ≤ 2 acciones y límites: T016-T021) [Paralelizable con US1-US3]
           │
           ▼
Phase 7 (Polish & Validación integral: T022-T023)
```

### Parallel Opportunities

- **Phase 1**: `T001` (`.gitignore`) y `T002` (creación de directorios) pueden ejecutarse en paralelo.
- **Phase 2**: `T004` (generación de iconos PNG en `public/assets/icons/`) puede ejecutarse en paralelo con `T003` / `T005`.
- **Phase 3 (US1)**: `T008` (`twa/twa-manifest.json`) y `T009` (`public/.well-known/assetlinks.json`) pueden ejecutarse en paralelo tras escribir `T007`.
- **Phase 6 (US4)**: Las pruebas `T016`, `T017` y `T018` afectan a archivos de test distintos y pueden escribirse en paralelo; asimismo, `T019` (`public/politica-privacidad.html`), `T020` (`shell.component.*`) y `T021` (`configuracion-sincronizacion.component.*`) tocan archivos distintos.

---

## Parallel Example: User Story 1 & User Story 4

```text
# En User Story 1 (tras T007):
Task T008: Crear el manifiesto declarativo de Bubblewrap en twa/twa-manifest.json
Task T009: Crear el documento Digital Asset Links en public/.well-known/assetlinks.json

# En User Story 4 (pruebas en paralelo):
Task T016: Añadir pruebas de componente en tests/component/presentation/shell.component.spec.ts
Task T017: Añadir prueba de componente en tests/component/presentation/configuracion-sincronizacion.component.spec.ts
Task T018: Añadir pruebas Vitest sobre public/politica-privacidad.html en tests/unit/twa/distribucion-twa-contratos.spec.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar **Phase 1: Setup** (`T001–T002`) y **Phase 2: Foundational** (`T003–T006`).
2. Completar **Phase 3: User Story 1** (`T007–T010`).
3. **STOP & VALIDATE**: Verificar que las pruebas de contrato pasan, que el build de Angular exporta `manifest.webmanifest`, los iconos y `.well-known/assetlinks.json`, y que el proyecto Bubblewrap puede construir el APK instalable para abrir la aplicación sin barras del navegador.

### Incremental Delivery

1. **Incremento 1 (US1 - P1)**: Metadatos PWA/TWA, `assetlinks.json` y `twa-manifest.json` para apertura sin barras en Android.
2. **Incremento 2 (US2 - P1)**: Scripts de empaquetado APK/AAB, validación de bloqueos FR-016 y guía completa de publicación y actualización en Google Play.
3. **Incremento 3 (US3 - P2)**: Validación de conservación del origen `opfs-sahpool`, OAuth y guía de traslado de datos.
4. **Incremento 4 (US4 - P2)**: Actualización de `public/politica-privacidad.html` y enlaces accesibles en ≤ 2 acciones en móvil, tablet, escritorio y Sincronización.
5. **Fase Final (Polish)**: Lint, suite completa de Vitest con cobertura, build de producción y build de Storybook.
