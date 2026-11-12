# Publicación de Gestión de Ejercicios Físicos en Google Play


Esta guía prepara una entrega Android mediante Trusted Web Activity (TWA). La aplicación
continúa alojada en GitHub Pages y conserva el almacenamiento del navegador; no se añade un
servidor ni una base de datos Android paralela.

## Preparación

1. Instala Node.js, las dependencias del repositorio y JDK 17 o posterior.
2. Comprueba `java -version` y `npx @bubblewrap/cli --version`.
3. Ejecuta `npm run twa:init` la primera vez y `npm run twa:update` cuando cambie
   `twa/twa-manifest.json`.

## Firma y custodia

Genera el keystore privado siguiendo el asistente de Bubblewrap y guárdalo fuera del repositorio,
junto con sus contraseñas y una copia de seguridad cifrada. No guardes esos datos en GitHub, en
`public/` ni en el sitio publicado. `.gitignore` excluye `*.keystore`, `*.jks`,
`keystore.properties` y las propiedades locales de TWA.

## Entregas

Desde la raíz del repositorio:

```powershell
npm run twa:update
npm run twa:build
npm run twa:fingerprint
```

La construcción genera `app-release-signed.apk` para pruebas directas y
`app-release-bundle.aab` para Google Play. Ambos archivos están excluidos de Git.

## Digital Asset Links y bloqueo externo

Publica una copia de `public/.well-known/assetlinks.json` en el repositorio raíz
`rsolerv/rsolerv.github.io`, para que la URL
`https://rsolerv.github.io/.well-known/assetlinks.json` responda HTTP 200 sin redirecciones.
Sustituye las dos entradas `PENDIENTE_*` por las huellas SHA-256 reales:

| Huella | Origen | Estado |
|---|---|---|
| Firma local o de subida | `bubblewrap fingerprint` | Pendiente |
| Google Play App Signing | Play Console | Pendiente |

Hasta completar ambas huellas y publicar el archivo en la raíz del dominio, la entrega queda
**BLOQUEADO_POR_PRERREQUISITO_EXTERNO** y no debe declararse verificada para Google Play.

## Materiales de Google Play Console

| Material o declaración | Estado inicial |
|---|---|
| `app-release-bundle.aab` firmado | Pendiente |
| Icono de ficha `icon-512x512.png` | Completo |
| Nombre y descripción en español | Pendiente |
| URL de privacidad | Pendiente |
| Huella de Google Play App Signing publicada | Pendiente |
| Declaración de permisos y datos | Pendiente |
| Capturas de móvil y tablet | Pendiente |

La URL de privacidad es
`https://rsolerv.github.io/physical-exercises-app/politica-privacidad.html`. La aplicación no
solicita notificaciones, analítica, publicidad ni otros permisos no justificados.

## Actualizaciones y continuidad de datos

Para publicar una actualización incrementa `appVersionCode` y, si procede, `appVersionName` en
`twa/twa-manifest.json`; no cambies `packageId`, dominio ni ruta. La TWA abre la misma aplicación
web en `https://rsolerv.github.io/physical-exercises-app/` y usa el almacenamiento local
`opfs-sahpool` del navegador. La actualización debe conservar los ejercicios existentes.

La autorización de Google y GitHub se inicia desde el navegador y su retorno debe volver a la
misma TWA. Si cambia el navegador, el dispositivo o la dirección web, usa la copia manual ZIP
para trasladar ejercicios, categorías, planificaciones, progreso e imágenes; también puedes usar
la sincronización opcional configurada por la persona.
