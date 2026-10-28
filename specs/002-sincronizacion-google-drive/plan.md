# Implementation Plan: Sincronización con cuenta de Google sin credenciales técnicas

**Branch**: `002-sincronizacion-google-drive` | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-sincronizacion-google-drive/spec.md`

## Summary

Hoy sincronizar exige una cuenta de GitHub, un repositorio privado y un token con permisos exactos. Esta feature permite a personas sin conocimientos técnicos sincronizar con un par de pulsaciones ("Conectar con Google"), guardando los mismos ficheros JSON en el espacio privado de la aplicación dentro de su cuenta de Google, sin backend propio. La aplicación sigue siendo local-first, GitHub con token se conserva como opción avanzada y se añade una copia manual exportando e importando un ZIP con `datos.json` y `imagenes/`.

Enfoque técnico (detalle en [research.md](./research.md)):

- **Autorización**: modelo de tokens de Google Identity Services, sin servidor ni secreto de cliente; el token vive solo en memoria y se renueva al pulsar "Sincronizar ahora".
- **Almacenamiento**: carpeta de datos de la aplicación en Drive (permiso no sensible `drive.appdata`), con la misma estructura de `datos.json` e imágenes.
- **Arquitectura**: un puerto neutro `ProveedorSincronizacionPort` con dos adaptadores (GitHub, sin cambios funcionales, y Google), un caso de uso de sincronización sin conocimiento del proveedor y una regla pura de dominio para tratar como primera sincronización cualquier cambio de método o cuenta.
- **Copia manual**: un ZIP con `datos.json` y los archivos `imagenes/<id>.json` hermanos, validado por una función pura de dominio antes de importar; `fflate` se limita a Presentation para empaquetar y abrir el archivo.
- **Interfaz**: la pantalla de Sincronización se rediseña (varios métodos, estados de conexión, copia manual). Es un cambio grande de presentación: se prototipa en Storybook con el agente `ux-ui-expert` y requiere aprobación explícita antes de implementarse.

El alcance viene de la spec (historias 1–5, FR-001–FR-027, SC-001–SC-011). No hay entidades de negocio nuevas. La librería `fflate` se añade como dependencia de ejecución para el empaquetado ZIP de la copia manual.

**Enmienda 2026-10-27 (conexiones simultáneas, historia 5, FR-016 y FR-025 a FR-027)**: las credenciales de GitHub y la cuenta de Google pueden estar guardadas a la vez, con un único método activo seleccionable con una sola acción, y conectar uno nunca borra el otro. Para que alternar no provoque falsos conflictos, la referencia de última sincronización y la marca de cambios locales pasan a guardarse **por destino** en una tabla nueva (research.md, sección 7). Impacto: `AjustesRepositoryPort` y su adaptador SQLite, `SincronizarUseCase`, `GestionarConexionSincronizacionUseCase`, el esquema (migración) y la pantalla de Sincronización (sin bloqueos entre métodos; nuevas etiquetas y "Usar este método"). No cambian ni el puerto de proveedor ni los adaptadores de GitHub y Google.

## Technical Context

**Language/Version**: TypeScript y Angular según [la investigación de la feature 001](../001-gestion-ejercicios-fisicos/research.md) (secciones 1 a 6); sin cambios de versión.

**Primary Dependencies**: Angular standalone, Signals, Signal Forms, Angular Material 3 y `HttpClient` ya instalados; `fflate` para ZIP local en Presentation. Dependencia externa en tiempo de ejecución: el script de Google Identity Services, cargado bajo demanda desde el dominio de Google (no puede incluirse en el paquete).

**Storage**: SQLite WASM (como en la feature 001). Se amplía la entidad técnica Ajustes de aplicación con `metodo_sincronizacion` (método activo) y `cuenta_google`, y se crea la tabla `sincronizacion_destino` (versión, cambios pendientes y fecha por destino) con migración compatible que conserva las columnas antiguas sin usarlas ([data-model.md](./data-model.md)). Los datos remotos viven en la carpeta de datos de la aplicación en Google Drive de cada persona. El token de Google no se persiste; las credenciales de GitHub y la cuenta de Google se conservan simultáneamente.

**Testing**: Vitest y Angular `TestBed`, test-first, con dobles de Google (sin cuenta ni red). Cobertura mínima del 80 % global y del 100 % en los casos de uso puros de Domain, cero errores de ESLint. Validación manual en [quickstart.md](./quickstart.md), incluidas las verificaciones técnicas previas V1–V4.

**Target Platform**: Navegadores modernos en móvil, tablet y escritorio; aplicación estática en GitHub Pages. Sin conexión todo funciona salvo conectar y sincronizar.

**Project Type**: SPA web sin backend en Domain, Application, Infrastructure y Presentation.

**Performance Goals**: sincronización de una biblioteca de unos 100 ejercicios con imágenes en menos de 10 segundos con conexión normal (SC-006); se evita resubir imágenes ya presentes. Google Identity Services se carga bajo demanda; `fflate` se incluye en el bundle para las copias ZIP. La validación de build mantiene el aviso de bundle inicial de la aplicación.

**Constraints**:
- Sin backend ni secretos de cliente: solo identificadores públicos en el código (constitución, "Sincronización de datos").
- Un único método de sincronización **activo** a la vez, aunque puedan estar guardados los dos; "Sincronizar ahora" solo opera con el activo. Añadir otro destino exigiría enmendar la constitución.
- Ninguna operación sobre un método (conectar, editar, desconectar, olvidar) puede borrar o invalidar los datos de acceso del otro (FR-016, FR-017).
- Texto visible en español de España y sin jerga técnica en el flujo de Google (FR-021).
- El token de acceso solo en memoria; nunca en ajustes, documentos sincronizados ni ficheros de copia (FR-018).
- La renovación del token cuelga siempre de la pulsación de "Sincronizar ahora", un gesto de usuario.
- Drive v3 no ofrece, según la documentación consultada, escritura condicional atómica: la protección de FR-009 es una comprobación de versión inmediatamente anterior a escribir (limitación conocida, ver research.md sección 4).

**Scale/Scope**: Un usuario por cuenta y por instalación; sin datos compartidos. Un proveedor nuevo (Google) y la copia manual; otros destinos quedan fuera.

## Constitution Check

*Gate previo a la investigación y posterior al diseño. Constitución v2.5.0.*

| Principio / regla | Evaluación | Estado |
|---|---|---|
| I. Idioma y mercado | Todos los textos nuevos en español de España y sin jerga técnica; los términos del proveedor (nombre "Google", "GitHub") son nombres propios. | PASS |
| II. Cero alcance fantasma | Cada elemento del diseño se traza a un FR (tabla de trazabilidad). No se añade ningún campo, pantalla ni opción fuera de la spec; si el prototipo requiere algo nuevo se propone como enmienda a la spec. | PASS |
| III. Verificabilidad por una persona no técnica | Todos los recorridos de [quickstart.md](./quickstart.md) se comprueban desde la interfaz. Las verificaciones V1–V4 son técnicas y las hace el equipo antes de implementar, no son criterios de aceptación. | PASS |
| IV. UX multiplataforma y accesible | El contrato de interfaz fija móvil, tablet y escritorio, teclado, foco, contraste y áreas táctiles. | PASS |
| V. Prototipo y aprobación de cambios grandes | La pantalla de Sincronización es un rediseño con flujo nuevo: el agente `ux-ui-expert` crea las historias de Storybook y espera la aprobación explícita antes de la implementación de presentación. Se refleja como puerta en las tareas. | PASS (condicionado a la aprobación) |
| Arquitectura: sincronización | Google y la copia manual son destinos permitidos; un único método activo; comunicación directa desde el navegador; autorización sin secreto de cliente; local-first. | PASS |
| Arquitectura: capas | Los puertos están en Application y las implementaciones (Google, delegado, GitHub) en Infrastructure; Domain solo contiene funciones puras sin Angular. La sincronización y la copia manual comparten el caso de uso de importación. | PASS |
| Arquitectura: backend y despliegue | Sin backend, sin nuevos servicios propios; se mantiene GitHub Pages. | PASS |
| Interfaz gráfica | Solo Angular Material; confirmaciones en línea y no en diálogos modales. | PASS |
| Calidad y pruebas | Test-first con Vitest; 100 % en Domain (versión efectiva, identificación de destino, validación de la copia y decisión); lint a cero; mismas pruebas de GitHub como regresión. | PASS |

## Phase 0: Research

Resuelto en [research.md](./research.md): autorización, permiso, disposición de ficheros, control de versiones y concurrencia, subida, puerto neutro, cambio de método o cuenta, copia manual, renovación y desconexión, carga del script, prototipo en Storybook y registro de la aplicación en Google Cloud. No quedan `NEEDS CLARIFICATION`. Quedan cuatro verificaciones técnicas previas (V1–V4), cada una con su alternativa ya diseñada, que deben realizarse para confirmar los adaptadores de Google y aplicar las alternativas correspondientes.

Las decisiones transversales (puerto neutro de sincronización, carga bajo demanda de scripts de terceros y copias portables ZIP que conservan documentos JSON) se han añadido a [la investigación de la feature 001](../001-gestion-ejercicios-fisicos/research.md), secciones 22 a 24, con referencia a esta feature.

## Phase 1: Design

### Estrategia de diseño

1. **Domain (funciones puras)**: `identificarDestinoSincronizacion(metodo, cuenta, repositorio)` y `validarCopiaSeguridad`; ajuste de nombres de `decidirAccionSincronizacion` (`sha` → `version`). Se retira `versionSincronizadaEfectiva` (su papel lo asume la fila por destino). Nuevos errores: `ErrorAutorizacionGoogle`, `ErrorConexionCancelada`, `ErrorVentanaBloqueada`.
2. **Application**: puertos `ProveedorSincronizacionPort` y `GoogleAutorizacionPort`; el caso de uso `SincronizarGithubUseCase` se convierte en `SincronizarUseCase` (sin conocimiento del proveedor, bloqueando ejecuciones simultáneas, leyendo el estado del destino activo y llamando a `registrarSincronizacionCompletada`); `GestionarConexionSincronizacionUseCase` (conectar Google sin restricciones, `activarMetodo` y desconectar) y `CopiaManualUseCase`; `ExportarImportarDatosUseCase.importar` recibe un resolvedor de imágenes; `AjustesRepositoryPort` ampliado y revisado según [el contrato](./contracts/proveedor-sincronizacion.port.md) (conexiones independientes, `activarMetodo`, estado por destino).
3. **Infrastructure**: `ProveedorGoogleDriveSync` y `GoogleIdentityAutorizacion` (con carga bajo demanda del script); `ProveedorGithubSync` como capa fina sobre el adaptador actual de GitHub, que no cambia; `ProveedorSincronizacionSeleccionado` como delegado; migración de ajustes en el motor SQLite; cableado en `app.config.ts`.
4. **Presentation**: tras la aprobación de Storybook, rediseño de la pantalla de Sincronización con el bloque de Google, las opciones avanzadas (el formulario actual de GitHub extraído a su propio componente), la copia manual y los estados de [contracts/interfaz-usuario.md](./contracts/interfaz-usuario.md); descarga de fichero y selector como servicios de Presentation; la resolución de conflicto se adapta a "Usar los datos de Google".
5. **Validación**: pruebas automáticas con dobles de Google, regresión de GitHub, validación visual y los recorridos de [quickstart.md](./quickstart.md).

### Trazabilidad de requisitos

| Requisito | Dónde se resuelve |
|---|---|
| FR-001 (local-first) | Sin cambios en el arranque; la carga del script de Google es bajo demanda (research.md, sec. 10) |
| FR-002, FR-021, FR-022 | Flujo "Conectar con Google" y textos del [contrato de interfaz](./contracts/interfaz-usuario.md); `GoogleAutorizacionPort.conectar` |
| FR-003, FR-004, FR-005 | Carpeta de datos de la aplicación, permiso único `drive.appdata` y cuenta mostrada con `about.get` ([contrato de Google](./contracts/google-drive-sync.md), research.md sec. 2 y 3) |
| FR-006, FR-010 | `SincronizarUseCase` sin automatismos y con bloqueo de ejecución simultánea |
| FR-007, FR-008 | Reutiliza `decidir-accion-sincronizacion` y `ExportacionJSON` ([contrato del puerto](./contracts/proveedor-sincronizacion.port.md)) |
| FR-009 | Comprobación de versión inmediatamente antes de escribir `datos.json` (research.md sec. 4) |
| FR-011 | Estado derivado de ajustes y operación en curso ([data-model.md](./data-model.md)) |
| FR-012, FR-013, FR-014, FR-015, FR-018 | `GoogleAutorizacionPort`, errores de dominio y token solo en memoria |
| FR-016, FR-025, FR-026, FR-027 | Conexiones independientes, método activo y estado por destino ([data-model.md](./data-model.md), research.md sec. 7); `activarMetodo` y `registrarSincronizacionCompletada` ([contrato](./contracts/proveedor-sincronizacion.port.md)); etiquetas y "Usar este método" ([contrato de interfaz](./contracts/interfaz-usuario.md)) |
| FR-017 | `ProveedorGithubSync` sobre el adaptador existente, con su suite como regresión |
| FR-019, FR-020 | `CopiaManualUseCase` y [contrato del fichero](./contracts/copia-seguridad-archivo.md) |
| FR-023 | Contrato de interfaz y puerta de aprobación en Storybook |
| FR-024 | Texto informativo del contrato de interfaz; se confirma en V4 |

### Modelo de datos

Ver [data-model.md](./data-model.md). Resumen: sin entidades de negocio nuevas; Ajustes de aplicación con método activo y cuenta de Google conservada; tabla nueva `sincronizacion_destino` con la versión, las marcas de cambios pendientes y la fecha por destino, con migración que no borra datos ni columnas; la sesión de Google solo existe en memoria.

### Interfaces y contratos

- [contracts/proveedor-sincronizacion.port.md](./contracts/proveedor-sincronizacion.port.md): puerto neutro, errores, regla de destino y puertos auxiliares (`GoogleAutorizacionPort` y cambios en `AjustesRepositoryPort`).
- [contracts/google-drive-sync.md](./contracts/google-drive-sync.md): autorización, disposición de ficheros, llamadas a Drive y traducción de errores.
- [contracts/copia-seguridad-archivo.md](./contracts/copia-seguridad-archivo.md): formato del fichero, casos de uso y validación.
- [contracts/interfaz-usuario.md](./contracts/interfaz-usuario.md): pantalla de Sincronización e historias de Storybook exigidas.

### Quickstart de validación

[quickstart.md](./quickstart.md): requisitos previos (incluido el registro de la aplicación por el propietario), verificaciones técnicas V1–V4, puerta de Storybook y recorridos manuales por historia.

## Constitution Check posterior al diseño

| Principio / regla | Resultado posterior al diseño |
|---|---|
| Idioma y mercado | PASS: los textos de referencia están en español de España y evitan "token", "OAuth" y "credenciales" en el flujo de Google. |
| Cero alcance fantasma | PASS: la tabla de trazabilidad cubre FR-001 a FR-027; los estados "Conectando" y "Requiere reconectar" son transiciones necesarias para FR-013 y FR-014, y "Reintentar" implementa FR-015. La tabla por destino y "Usar este método" se trazan a FR-016 y FR-025 a FR-027; la regla "un alta activa el método" se documenta como supuesto en la spec. |
| Verificabilidad | PASS: el quickstart separa lo técnico (V1–V4) de lo verificable por una persona no técnica. |
| UX multiplataforma y accesible | PASS: el contrato fija tamaños, teclado, foco, contraste y estado no solo por color. |
| Prototipo y aprobación | PASS: queda reflejado como puerta en el plan y en la investigación; la ejecución depende de la aprobación del propietario. |
| Arquitectura y stack | PASS: sin backend, sin secreto de cliente, un único método activo, capas respetadas; el único elemento externo nuevo (script de Google) se carga bajo demanda y está justificado. |
| Calidad y pruebas | PASS: las nuevas reglas puras tienen cobertura del 100 % prevista y el adaptador y los casos de uso se prueban con dobles. |

## Project Structure

### Documentación de esta feature

```text
specs/002-sincronizacion-google-drive/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
├── contracts/
│   ├── proveedor-sincronizacion.port.md
│   ├── google-drive-sync.md
│   ├── copia-seguridad-archivo.md
│   └── interfaz-usuario.md
└── tasks.md                 # Se generará con /speckit-tasks
```

### Código

```text
src/app/
├── domain/
│   ├── sincronizacion/
│   │   ├── decidir-accion-sincronizacion.ts       # renombra sha → version
│   │   ├── version-sincronizada-efectiva.ts       # se retira (enmienda 2026-10-27)
│   │   └── identificar-destino-sincronizacion.ts  # nuevo
│   ├── copia-seguridad/
│   │   └── validar-copia-seguridad.ts             # nuevo
│   └── errores/errores-dominio.ts                 # + errores de Google
├── application/
│   ├── ports/
│   │   ├── proveedor-sincronizacion.port.ts       # nuevo
│   │   ├── google-autorizacion.port.ts            # nuevo
│   │   ├── github-sync.port.ts                    # sin cambios de contrato
│   │   └── ajustes-repository.port.ts             # ampliado
│   └── casos-uso/
│       ├── sincronizar.use-case.ts                # sustituye sincronizar-github.use-case.ts
│       ├── gestionar-conexion-sincronizacion.use-case.ts  # nuevo
│       ├── copia-manual.use-case.ts               # nuevo
│       └── exportar-importar-datos.use-case.ts    # importar con resolvedor de imágenes
├── infrastructure/
│   ├── github-sync/
│   │   ├── github-sync.adapter.ts                 # sin cambios
│   │   └── proveedor-github-sync.ts               # nuevo, capa fina
│   ├── google-drive-sync/                         # nuevo
│   │   ├── google-drive.config.ts                 # identificador de cliente (público)
│   │   ├── google-identity-autorizacion.ts
│   │   ├── proveedor-google-drive-sync.ts
│   │   └── google-identity.cargador.ts            # carga bajo demanda del script
│   ├── sincronizacion/
│   │   └── proveedor-sincronizacion-seleccionado.ts
│   └── persistencia-sqlite/                       # migración, tabla sincronizacion_destino y repositorio de ajustes
└── presentation/sincronizacion/
    ├── configuracion/                             # rediseño; extrae el formulario de GitHub
    ├── conflicto/                                 # texto según método
    └── copia-manual/                              # exportar e importar; servicio de descarga y selector

src/stories/                                       # historias aprobadas de Sincronización
tests/
├── unit/{domain,application,infrastructure}/     # incluye regresión de GitHub
└── component/presentation/                       # pantallas y flujos
```

**Structure Decision**: Mantener el proyecto Angular SPA y las cuatro capas. Los nuevos puertos están en Application, los adaptadores en Infrastructure y las reglas sin E/S en Domain. La presentación se organiza en la carpeta de sincronización ya existente. No se crea una capa nueva ni un servicio global.

## Complexity Tracking

No hay violaciones de la constitución. Se documenta una excepción de diseño:

| Elemento | Por qué es necesario | Alternativa más simple rechazada porque |
|---|---|---|
| Script de Google Identity Services cargado dinámicamente desde el dominio de Google | Es el único modo de obtener un token de Google sin servidor ni secreto de cliente; Google no permite empaquetarlo | Cargarlo siempre desde `index.html` haría solicitudes a terceros en cada arranque, incluso sin usar la sincronización (ver research.md, sec. 10) |
| Puerto neutro más delegado, con dos adaptadores | La spec exige dos métodos de sincronización conmutables (FR-016, FR-017) con las mismas reglas | Duplicar el caso de uso por proveedor repetiría la orquestación y las marcas de ajustes (ver research.md, sec. 6) |
| Tabla `sincronizacion_destino` (estado por destino) | Con dos conexiones guardadas, la versión y los cambios pendientes deben ser por destino (FR-025); con valores únicos alternar de método produciría conflictos erróneos o subidas y descargas equivocadas | Una versión y un indicador únicos más la regla "destino distinto = primera sincronización" obligan a elegir datos cada vez que se alterna (ver research.md, sec. 7) |
