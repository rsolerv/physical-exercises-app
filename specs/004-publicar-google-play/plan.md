# Implementation Plan: Publicar la aplicación en Google Play

**Branch**: `004-publicar-google-play` (rama git actual: `main`) | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-publicar-google-play/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Esta feature prepara y valida la distribución en Android y Google Play de la aplicación web existente publicada en GitHub Pages (`https://rsolerv.github.io/physical-exercises-app/`) utilizando **Trusted Web Activity (TWA)** con **Bubblewrap** (`@bubblewrap/cli`), de modo que la persona usuaria pueda instalarla desde un icono propio y abrirla en su navegador Chrome compatible a pantalla completa, sin barra de direcciones ni selector de pestañas, conservando todos los datos locales en SQLite WASM (`opfs-sahpool`) y los flujos existentes de ejercicios, catálogo común, copia manual y sincronización con Google Drive y GitHub.

Enfoque técnico (detalle en [research.md](./research.md)):

- **Metadatos web instalables (`public/manifest.webmanifest` e iconos)**: se añade el manifiesto web estándar en español de España (`"Gestión de Ejercicios Físicos"`, nombre corto `"Ejercicios"`, `display: "standalone"`, colores `#00696b` y `#f6f3ee`) y los iconos PNG (`192x192`, `512x512`, `maskable`) en `public/assets/icons/`, enlazados desde `src/index.html` (`<html lang="es">`, `<meta name="theme-color">`, `<link rel="manifest">`). No se introduce un Service Worker de cacheo agresivo para asegurar que las actualizaciones web se reflejen al recargar con conexión (FR-008, SC-006).
- **Verificación del origen (`Digital Asset Links`) sin cambiar la URL de producción**: dado que Android consulta obligatoriamente `https://rsolerv.github.io/.well-known/assetlinks.json` en la raíz del origen (y no en la subruta `/physical-exercises-app/`), se conserva el origen actual para no perder los datos locales en OPFS y se sirve `/.well-known/assetlinks.json` en la raíz mediante el repositorio de sitio de usuario de GitHub Pages (`rsolerv/rsolerv.github.io`), manteniendo la copia canónica y validada por pruebas en `public/.well-known/assetlinks.json`. El archivo incluye las huellas públicas SHA-256 tanto del certificado de firma local/subida (para el `.apk` de prueba directa) como del certificado de *Google Play App Signing* (para la instalación distribuida desde Google Play, FR-005).
- **Proyecto declarativo TWA con Bubblewrap (`twa/`)**: configuración versionada en `twa/twa-manifest.json` (`packageId: io.github.rsolerv.physicalexercises`, `fallbackType: "customtabs"`, `enableNotifications: false`) y guía operativa reproducible para generar ambos entregables (`app-release-signed.apk` y `app-release-bundle.aab`), custodiando el keystore privado fuera del repositorio (`.gitignore`, FR-014) y registrando como bloqueos explícitos cualquier requisito externo pendiente antes de dar por cumplido FR-005 (FR-016).
- **Política de privacidad accesible en ≤ 2 acciones (FR-010, FR-011, SC-005)**: se actualiza `public/politica-privacidad.html` para cubrir todos los tratamientos vigentes (incluido el catálogo común de la feature 003 y la apertura mediante TWA en Android sin servidores propios) y se añade un enlace directo a `politica-privacidad.html` en el panel móvil `"Más opciones"`, en el pie de la navegación lateral de tablet/escritorio y en la pantalla `Sincronización`.

## Technical Context

**Language/Version**: TypeScript sobre Angular 22.x (componentes standalone), Signals y `provideZonelessChangeDetection()`, conforme a [specs/001-gestion-ejercicios-fisicos/research.md](../001-gestion-ejercicios-fisicos/research.md) §§1–6; JDK 21 (verificado en el entorno) y Node.js para la herramienta de empaquetado `@bubblewrap/cli`.

**Primary Dependencies**: Angular y Angular Material 3 ya instalados para la SPA; `@bubblewrap/cli` (ejecutado mediante `npx @bubblewrap/cli` o script de proyecto) para inicializar y construir el contenedor Android TWA (`app-release-signed.apk` y `app-release-bundle.aab`). No se añaden dependencias de ejecución al bundle web de Angular.

**Storage**: Sin cambios. SQLite WASM ejecutándose en el navegador dentro del Web Worker dedicado con VFS `opfs-sahpool` sobre el mismo origen `https://rsolerv.github.io`. La TWA reutiliza el almacenamiento del navegador compatible del dispositivo sin base de datos nativa paralela ni migraciones (FR-008, FR-010).

**Testing**: Vitest + Angular `TestBed` (`npm test -- --no-watch`), test-first obligatorio, cobertura ≥ 80 % global y 100 % en casos de uso puros de Domain, 0 errores de ESLint (`npm run lint`), compilación de producción (`npm run build`) y Storybook (`npm run build-storybook`). Se añaden pruebas automatizadas en Vitest para los enlaces de privacidad en `ShellComponent` y `ConfiguracionSincronizacionComponent` y para validar la integridad y coherencia de `public/manifest.webmanifest`, `public/.well-known/assetlinks.json`, `twa/twa-manifest.json` y `public/politica-privacidad.html`. Validación manual en dispositivo y tienda según [quickstart.md](./quickstart.md).

**Target Platform**: Dispositivos Android (móvil y tablet) con navegador compatible con TWA (Google Chrome como referencia de aceptación) que cargan la SPA alojada en GitHub Pages (`https://rsolerv.github.io/physical-exercises-app/`), además de los navegadores web ya soportados.

**Project Type**: SPA web Angular sin backend + configuración de empaquetado Android TWA con Bubblewrap (`twa/`).

**Performance Goals**: Apertura directa de la pantalla de inicio vigente sin pasos intermedios ni barras del navegador en el 100 % de los recorridos verificados (SC-001), acceso a la información de privacidad en un máximo de 2 acciones desde cualquier punto de entrada (SC-005), y preservación de los presupuestos de tamaño del bundle inicial de Angular (`maximumWarning: 700kB`, `maximumError: 1.5MB`).

**Constraints**:
- El alojamiento de la aplicación web permanece exclusivamente en GitHub Pages y sin backend propio (constitución, sección "Arquitectura y Stack Tecnológico").
- Prohibido versionar claves privadas, archivos `.keystore` / `.jks` o contraseñas en el repositorio o en el sitio público (FR-014).
- La verificación Digital Asset Links debe servirse en la raíz del origen (`https://rsolerv.github.io/.well-known/assetlinks.json`) e incluir las huellas SHA-256 tanto de la firma de prueba directa como de *Google Play App Signing*; su ausencia bloquea declarar cumplido FR-005 (FR-016).
- Cero permisos Android adicionales no justificados (`enableNotifications: false`, sin analítica, sin publicidad, sin SDKs de rastreo, FR-010).
- Español de España en todos los metadatos visibles (nombre de la aplicación, accesos, política de privacidad, guía y materiales de tienda, Principio I y FR-015).

**Scale/Scope**: 4 historias de usuario (US1–US4), 16 requisitos funcionales (FR-001–FR-016), 6 criterios de éxito medibles (SC-001–SC-006), metadatos PWA/TWA (`manifest.webmanifest`, iconos, `.well-known/assetlinks.json`), configuración Bubblewrap (`twa/twa-manifest.json`), actualización y enlace de `politica-privacidad.html`, y documentación operativa de entrega y publicación en Google Play.

## Constitution Check

*GATE: Evaluado antes de la Fase 0 (investigación) y reevaluado tras el diseño de Fase 1. Constitución v2.6.0.*

| Principio / regla                                                                 | Evaluación pre-investigación y post-diseño                                                                                                                                                                                                                                                                                                                                                                                                                                        | Estado   |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **I. Idioma y Mercado (Español de España)**                                       | Nombre del paquete visible (`"Gestión de Ejercicios Físicos"` / `"Ejercicios"`), `lang="es"` en `src/index.html`, `manifest.webmanifest`, enlaces y contenido de `politica-privacidad.html`, y guía/materiales de Google Play redactados íntegramente en español de España.                                                                                                                                                                                                       | **PASS** |
| **II. Cero Alcance Fantasma**                                                     | Cada artefacto y cambio del plan traza directamente a FR-001–FR-016. No se añaden pantallas de negocio, notificaciones push, modo offline nuevo, analítica ni permisos extra.                                                                                                                                                                                                                                                                                                     | **PASS** |
| **III. Verificabilidad por una Persona No Técnica**                               | Los escenarios de [quickstart.md](./quickstart.md) para US1–US4 comprueban los criterios SC-001–SC-006 desde el icono instalado en Android, la interfaz de la aplicación y la ficha visible de Google Play, sin leer código ni inspeccionar SQLite. Las verificaciones previas V1–V4 están separadas para el equipo/preparación técnica.                                                                                                                                          | **PASS** |
| **IV. Experiencia de Usuario Multiplataforma y Accesible**                        | Se conservan los layouts responsive de móvil, tablet y escritorio, las zonas seguras (`env(safe-area-inset-bottom)`), áreas táctiles mínimas de 48 × 48 px y foco visible en los nuevos enlaces a la política de privacidad.                                                                                                                                                                                                                                                      | **PASS** |
| **V. Prototipo y Aprobación en Storybook**                                        | No se crea ninguna pantalla nueva ni se rediseña la estructura visual o el flujo de navegación: se enlaza el documento estático existente `public/politica-privacidad.html` desde el pie del menú/panel `"Más opciones"` y desde `Sincronización`. Conforme al Principio V y a `ux-ui.instructions.md`, los ajustes puntuales de enlace y texto informativo no requieren prototipo de pantalla nueva en Storybook; se verifica que `npm run build-storybook` compile sin errores. | **PASS** |
| **Arquitectura: Despliegue en GitHub Pages y sin backend**                        | La aplicación web sigue desplegándose exclusivamente en GitHub Pages y ejecutándose 100 % en el navegador sin servidor propio. La TWA es únicamente un contenedor Android que abre esa misma URL en el navegador del dispositivo.                                                                                                                                                                                                                                                 | **PASS** |
| **Arquitectura: Persistencia SQLite WASM y Sincronización**                       | No se introduce almacenamiento nativo alternativo ni nuevos destinos de sincronización; la TWA opera sobre la misma base de datos SQLite WASM (`opfs-sahpool`) y los mismos proveedores autorizados (Google Drive `drive.appdata`, GitHub y copia manual ZIP).                                                                                                                                                                                                                    | **PASS** |
| **Arquitectura en capas (Domain / Application / Infrastructure / Presentation)**  | Los enlaces a la política de privacidad viven únicamente en Presentation (`ShellComponent` y `ConfiguracionSincronizacionComponent`). Si se añade validación pura de coherencia de manifiestos/huellas, se ubica como función pura sin dependencias en Domain/tests, respetando el flujo de dependencias.                                                                                                                                                                         | **PASS** |
| **Calidad de Código y Pruebas (SOLID, ESLint 0 errores, Vitest, TDD, cobertura)** | Todas las modificaciones en `src/` e integridad de manifiestos se cubren primero con pruebas en Vitest (`tests/`), manteniendo ≥ 80 % de cobertura global, 100 % en Domain y 0 errores de ESLint.                                                                                                                                                                                                                                                                                 | **PASS** |

No existen violaciones de la constitución.

## Project Structure

### Documentation (this feature)

```text
specs/004-publicar-google-play/
├── plan.md              # Este archivo (salida de /speckit-plan)
├── research.md          # Salida de Fase 0 (/speckit-plan)
├── data-model.md        # Salida de Fase 1 (/speckit-plan)
├── quickstart.md        # Salida de Fase 1 (/speckit-plan)
├── contracts/           # Salida de Fase 1 (/speckit-plan)
│   ├── distribucion-android-twa.md
│   └── interfaz-usuario-privacidad.md
└── tasks.md             # Salida de Fase 2 (/speckit-tasks - NO creado por /speckit-plan)
```

### Source Code (repository root)

```text
public/
├── .well-known/
│   └── assetlinks.json                                  # Nuevo: vínculo Digital Asset Links (copia canónica)
├── assets/
│   ├── fonts/
│   └── icons/                                           # Nuevo: MisEjerciciosFisicos.png (768x768) + icon-192x192.png, icon-512x512.png e icon-maskable-512x512.png
├── manifest.webmanifest                                 # Nuevo: Web App Manifest en español para PWA/TWA
└── politica-privacidad.html                             # Modificado: incluye catálogo común (003) y uso desde Android TWA

src/
├── index.html                                           # Modificado: lang="es", meta theme-color y link manifest.webmanifest
└── app/
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── presentation/
        ├── compartido/
        │   └── shell/
        │       ├── shell.component.ts                   # Modificado: enlace a Política de privacidad en PanelMasComponent (móvil)
        │       ├── shell.component.html                 # Modificado: enlace a Política de privacidad en riel/menú lateral
        │       └── shell.component.scss                 # Modificado: estilos de pie de navegación para enlace de privacidad
        └── sincronizacion/
            └── configuracion/
                └── configuracion-sincronizacion.component.html # Modificado: enlace directo a Política de privacidad

twa/
├── twa-manifest.json                                    # Nuevo: configuración declarativa de Bubblewrap para APK y AAB
└── README-PUBLICACION-PLAY.md                           # Nuevo: guía paso a paso en español, materiales FR-007 y control de bloqueos FR-016

tests/
├── presentation/
│   └── privacidad-enlaces.spec.ts                       # Nuevo: pruebas Vitest de acceso en ≤ 2 acciones a politica-privacidad.html
└── twa/
    └── distribucion-twa-contratos.spec.ts               # Nuevo: pruebas Vitest de manifest.webmanifest, assetlinks.json, twa-manifest.json y exclusión de secretos
```

**Structure Decision**: Se mantiene la estructura de proyecto único Angular (`src/`, `public/`, `tests/`) y se añade una carpeta declarativa `twa/` en la raíz para la configuración de Bubblewrap y la guía operativa de entrega a Google Play, manteniendo excluidos en `.gitignore` los binarios generados (`*.apk`, `*.aab`), carpetas temporales de compilación Android y cualquier almacén de claves privado (`*.keystore`, `*.jks`).

## Tabla de trazabilidad (Requisitos → Artefactos del diseño)

| Requisitos                         | Artefacto / Componente del diseño                                                                                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-001, FR-002, FR-003, FR-015** | `public/manifest.webmanifest`, `public/assets/icons/*`, `src/index.html`, `twa/twa-manifest.json` ([contracts/distribucion-android-twa.md](./contracts/distribucion-android-twa.md))                                    |
| **FR-004, FR-005, FR-008, FR-016** | `public/.well-known/assetlinks.json`, despliegue en raíz `rsolerv/rsolerv.github.io`, doble huella SHA-256 y flujo `bubblewrap build` ([research.md](./research.md) §§1–3, [data-model.md](./data-model.md))            |
| **FR-006, FR-007, FR-013, FR-014** | `twa/README-PUBLICACION-PLAY.md`, exclusiones en `.gitignore` y verificaciones de [quickstart.md](./quickstart.md)                                                                                                      |
| **FR-009, FR-010, FR-012**         | Mismo origen en GitHub Pages (`opfs-sahpool`), `fallbackType: "customtabs"`, `enableNotifications: false` ([research.md](./research.md) §§4–5)                                                                          |
| **FR-010, FR-011, SC-005**         | `public/politica-privacidad.html`, `shell.component.ts`, `shell.component.html`, `configuracion-sincronizacion.component.html` ([contracts/interfaz-usuario-privacidad.md](./contracts/interfaz-usuario-privacidad.md)) |

## Complexity Tracking

> Sin violaciones de la constitución que requieran justificación.