# Quickstart: Validación de la distribución Android y publicación en Google Play

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Modelo de datos**: [data-model.md](./data-model.md) | **Contratos**: [contracts/](./contracts/)

Guía operativa y de validación para comprobar de extremo a extremo la distribución Android mediante **Trusted Web Activity (TWA)** con **Bubblewrap** y la entrega para **Google Play**. Separa explícitamente lo que se ejecuta y verifica en este repositorio de las acciones externas que dependen del propietario y de Google Play Console (FR-006, FR-007, FR-016).

Los recorridos de aceptación de las historias (US1–US4) están redactados para ser comprobados desde la pantalla del dispositivo y la ficha de la tienda por una persona sin conocimientos de programación (Principio III de la constitución).

---

## Requisitos previos

- **En el equipo de trabajo**:
  - Node.js y dependencias del repositorio instaladas (`npm ci` o `npm install`).
  - JDK 17+ instalado (`java -version`; verificado OpenJDK 21 en el entorno actual) y `@bubblewrap/cli` (`npx @bubblewrap/cli --version`).
  - Un móvil y una tablet Android con Google Chrome actualizado y conexión a Internet.
- **Acciones del propietario (prerrequisitos externos de publicación, FR-007 y FR-016)**:
  1. **Control de la raíz del origen `https://rsolerv.github.io`**: crear/publicar el repositorio público `rsolerv/rsolerv.github.io` con el archivo `.well-known/assetlinks.json` generado en este proyecto para que `https://rsolerv.github.io/.well-known/assetlinks.json` responda HTTP 200.
  2. **Almacén de claves privado (`keystore`)**: conservar fuera del repositorio el archivo `.keystore` y sus contraseñas en un lugar seguro con copia de seguridad (FR-014).
  3. **Cuenta de desarrollador de Google Play Console**: cuenta activa del propietario, aceptación de términos y alta de la aplicación `Gestión de Ejercicios Físicos` (`io.github.rsolerv.physicalexercises`).

---

## Ejecución local y validaciones automatizadas del repositorio

```powershell
npm test -- --no-watch
npm run lint
npm run build
npm run build-storybook
```

Las pruebas automatizadas con Vitest comprueban:
- Que los enlaces a `politica-privacidad.html` son accesibles en móvil (`Más opciones`), tablet/escritorio (navegación lateral) y `Sincronización`.
- Que `public/manifest.webmanifest`, `public/.well-known/assetlinks.json`, `twa/twa-manifest.json` y `public/politica-privacidad.html` cumplen los contratos de [distribucion-android-twa.md](./contracts/distribucion-android-twa.md) e [interfaz-usuario-privacidad.md](./contracts/interfaz-usuario-privacidad.md), y que ningún secreto o keystore queda versionado.

En el estado versionado inicial, las huellas de firma de `assetlinks.json` permanecen como
marcadores `PENDIENTE_*`. Por tanto, el validador debe mantener el estado
`BLOQUEADO_POR_PRERREQUISITO_EXTERNO` hasta que el propietario publique las dos huellas reales
en la raíz de `rsolerv.github.io`; este bloqueo es intencionado y no impide validar el resto del
paquete localmente.

---

## Construcción de las entregas Android (APK de prueba + AAB de tienda)

Desde la carpeta `twa/` con el keystore privado del propietario fuera del repositorio:

```powershell
# 1. Inicializar o actualizar el proyecto Android desde twa/twa-manifest.json
npx @bubblewrap/cli update --manifest=twa/twa-manifest.json

# 2. Construir el APK firmado para prueba directa y el AAB para Google Play
npx @bubblewrap/cli build

# 3. (Opcional) Comprobar huellas SHA-256 y estado de Digital Asset Links
npx @bubblewrap/cli fingerprint
```

Salidas esperadas en `twa/` (excluidas de Git por `.gitignore`):
- `app-release-signed.apk`: versión instalable de prueba directa (FR-004).
- `app-release-bundle.aab`: entrega Android App Bundle para subir a Google Play Console (FR-004).

---

## Verificaciones técnicas previas (equipo / preparación antes de FR-005)

| Id | Comprobación | Resultado esperado | Estado inicial |
|---|---|---|---|
| **V1** | Consultar `https://rsolerv.github.io/.well-known/assetlinks.json` tras publicar en `rsolerv/rsolerv.github.io` | Devuelve HTTP 200, JSON válido con `io.github.rsolerv.physicalexercises` y sin redirecciones | Pendiente de publicar repositorio raíz `rsolerv.github.io` (bloqueo FR-016 si falta) |
| **V2** | Añadir en `assetlinks.json` tanto la huella SHA-256 del keystore local como la de *Google Play App Signing* | El array `sha256_cert_fingerprints` contiene ambas huellas públicas SHA-256 reales | Pendiente de alta en Play Console (bloqueo FR-016 para FR-005 si falta) |
| **V3** | Probar en dispositivo Android la conexión con Google (`Conectar con Google`) dentro de la TWA | Se abre la selección de cuenta de Google y al aceptar regresa a la aplicación con la cuenta conectada | Por validar con el APK instalado |
| **V4** | Exportar e importar un archivo ZIP de copia manual desde la aplicación instalada en Android | El navegador descarga el `.zip` y permite seleccionarlo e importarlo en la pantalla `Sincronización` | Por validar con el APK instalado |

---

## US1 — Abrir la aplicación desde Android sin barras del navegador (P1)

1. Instala el archivo `app-release-signed.apk` en un teléfono Android y en una tablet Android con Chrome compatible y conexión a Internet.
2. En la pantalla de aplicaciones de Android, localiza el icono **Ejercicios** y púlsalo.
   - **Esperado**: se abre directamente la pantalla **Hoy** de `Gestión de Ejercicios Físicos`, en español de España, **sin barra de direcciones URL ni selector de pestañas de Chrome** (solo las barras normales de hora/batería y navegación de Android).
3. Navega a **Buscar**, abre la ficha de un ejercicio y comprueba que los botones inferiores o laterales no quedan tapados por la barra de Android ni aparece desplazamiento horizontal.
4. Pulsa el botón o gesto **Atrás** de Android desde la ficha del ejercicio.
   - **Esperado**: regresas a la pantalla **Buscar**; si vuelves a pulsar **Atrás** hasta agotar el historial, sales al escritorio de Android sin quedar atrapado.
5. Desde una ficha con enlace externo o vídeo de YouTube, abre el enlace externo.
   - **Esperado**: puedes consultarlo y, al volver atrás, regresas a la aplicación con tus datos intactos.

---

## US2 — Distribuir una versión comprobada desde Google Play (P1)

1. Sigue la relación de materiales y pasos de publicación (FR-006, FR-007) para subir `app-release-bundle.aab` a un canal de pruebas de Google Play Console, adjuntar el icono de la ficha de tienda `public/assets/icons/icon-512x512.png` (512×512 px, generado desde `MisEjerciciosFisicos.png`), registrar la URL de privacidad (`https://rsolerv.github.io/physical-exercises-app/politica-privacidad.html`) y publicar en `https://rsolerv.github.io/.well-known/assetlinks.json` la huella de firma de Google Play.
2. En un móvil y una tablet de una persona invitada al canal de pruebas, instala la aplicación desde **Google Play** y ábrela desde su icono.
   - **Esperado (SC-001, FR-005)**: se abre sin barra de direcciones ni pestañas visibles y completa el recorrido **Hoy → Buscar → ficha → Atrás** igual que en la instalación directa.
3. Crea un ejercicio propio en esa instalación. Después, publica una entrega con el número de versión incrementado (`appVersionCode` superior) en el mismo canal y actualiza la aplicación desde Google Play.
   - **Esperado (SC-002, FR-008)**: el ejercicio propio sigue disponible tras actualizar.
4. Publica un cambio visible en la web en GitHub Pages, abre la aplicación Android ya instalada con conexión y recárgala.
   - **Esperado (SC-006, FR-008)**: el cambio web se observa sin reinstalar el paquete Android y el ejercicio propio se conserva.

---

## US3 — Conservar los flujos y los datos de la web (P2)

1. Con la aplicación instalada y sin ninguna cuenta conectada, crea un ejercicio nuevo, cierra la aplicación por completo y vuelve a abrirla desde su icono.
   - **Esperado (SC-002)**: el ejercicio permanece guardado sin pedir registro.
2. Abre **Sincronización**, pulsa **Exportar copia de seguridad**, guarda el archivo `.zip` y usa **Importar copia de seguridad** en un entorno de prueba limpio.
   - **Esperado (SC-003)**: se recuperan los ejercicios, categorías, planificaciones, progreso e imágenes.
3. Prueba **Conectar con Google** y **Sincronizar ahora** con una cuenta de prueba, y comprueba también la opción avanzada de **GitHub** con el repositorio de prueba.
   - **Esperado (SC-003)**: tras autorizar el acceso vuelves a la aplicación y ves el resultado sincronizado sin quedar atrapado fuera.

---

## US4 — Entender las limitaciones de acceso y privacidad (P2)

1. Desde la aplicación abierta:
   - En móvil, pulsa **Más** → **Política de privacidad** (2 acciones).
   - En tablet o escritorio, pulsa **Política de privacidad** en la navegación lateral (1 acción).
   - En la ficha de Google Play, pulsa el enlace **Política de privacidad** (1–2 acciones).
   - **Esperado (SC-005, FR-011)**: se abre la política en español de España sin pedir identificación, explicando dónde se guardan los datos, qué envíos hace cada función (Google, GitHub, catálogo común, fuentes), cómo retirar permisos y cómo borrar los datos.
2. En un dispositivo sin conexión y sin datos en caché de la web, abre el icono de la aplicación.
   - **Esperado (SC-004, FR-012)**: se muestra un aviso comprensible de que no se ha podido cargar y permite salir o reintentar al recuperar la conexión; al volver la conexión, los datos que ya estaban guardados siguen intactos.
3. En un dispositivo sin Chrome ni navegador compatible con TWA (o con la verificación aún pendiente), abre el icono.
   - **Esperado (SC-004, FR-012)**: se abre con controles visibles del navegador (Custom Tab) o informa de la limitación sin borrar datos ni presentarlo como verificación sin barras completada.
