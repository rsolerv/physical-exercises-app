# Quickstart: Validación de la sincronización con Google




**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Modelo de datos**: [data-model.md](./data-model.md) | **Contratos**: [contracts/](./contracts/)

Guía para validar la feature desde la interfaz, sin inspeccionar código, registros ni la base de datos. Las etiquetas visibles se comprueban en español de España. Las verificaciones técnicas previas (V1–V4) las hace el equipo de desarrollo para confirmar los adaptadores y aplicar las alternativas previstas; los recorridos de las historias los puede hacer una persona sin conocimientos técnicos.

## Requisitos previos

- Node.js y las dependencias del proyecto instaladas.
- **Propietario del producto** (una sola vez; ver [research.md](./research.md), sección 12): proyecto de Google Cloud con la API de Drive, pantalla de consentimiento con el permiso `drive.appdata`, identificador de cliente web con los orígenes autorizados, e identificador copiado en `google-drive.config.ts`.
- Dos cuentas de Google de prueba (añadidas como usuarios de prueba si la aplicación no está publicada) y dos navegadores o perfiles diferentes.
- Para las comprobaciones de GitHub: un repositorio privado de datos y un token fine-grained limitado a él, como en la feature 001.
- Para el diseño responsive: navegador con herramientas para cambiar el tamaño de la ventana.

## Ejecución local y validaciones automatizadas

```powershell
npm start
npm test -- --watch=false
npm run lint
npm run build
npm run build-storybook
```

Abre la URL que muestra `npm start`. Las pruebas automáticas usan dobles de Google y no requieren cuenta ni conexión.

## Verificaciones técnicas previas (equipo de desarrollo)

Hechas con una página de prueba mínima. Cada resultado se anota en [research.md](./research.md) y, si no es el esperado, se aplica la alternativa indicada allí.

| Id | Comprobación | Resultado esperado |
|---|---|---|
| V1 | Con la cuenta ya conectada y la sesión de Google abierta, pedir un token nuevo desde un clic con `prompt: ''` y `login_hint` | Se obtiene sin elegir cuenta; anotar si se ve alguna ventana |
| V2 | Subir un documento de unos 7 MB con subida reanudable desde el navegador | La subida termina y la respuesta incluye la `version` |
| V3 | Actualizar un fichero con `If-Match` y un ETag antiguo | Documentar si la escritura se rechaza |
| V4 | Abrir la pantalla de consentimiento con una cuenta de prueba | Anotar qué avisos aparecen y con qué estado de publicación |

## Prototipo en Storybook (antes de implementar la interfaz)

1. El agente `ux-ui-expert` crea las historias de [contracts/interfaz-usuario.md](./contracts/interfaz-usuario.md) y las presenta con `npm run storybook`.
2. Revisa las historias en móvil, tablet y escritorio y responde con tu aprobación o con los fallos y mejoras.
3. **Esperado**: no se implementan los componentes de la pantalla hasta recibir tu aprobación explícita.
4. Tras la enmienda del 2026-10-27, revisa también las historias de GitHub y Google conectados a la vez, el cambio de método y el estado sin método activo, y aprueba de nuevo antes de la implementación.

## US1 — Conectar con Google y sincronizar por primera vez

1. Con datos locales y ninguna sincronización configurada, abre "Sincronización". **Esperado**: "Conectar con Google" es la acción principal y GitHub aparece como opción avanzada plegada.
2. Pulsa "Conectar con Google", elige una cuenta y acepta. **Esperado**: vuelves a la aplicación con la cuenta (correo) visible y una confirmación; no has tenido que copiar ni escribir ningún dato técnico. La pantalla de Google solicita solo acceso al espacio privado de la aplicación.
3. Pulsa "Sincronizar ahora". **Esperado**: estado "Sincronizado" con fecha y hora, y confirmación.
4. En un segundo navegador con datos locales distintos, conecta la misma cuenta y pulsa "Sincronizar ahora". **Esperado**: se muestra la elección entre datos locales y de Google con "Usar los datos de Google" marcada por defecto; no se sobrescribe nada sin elegir.
5. Repite la conexión cerrando la ventana de Google y luego rechazando el permiso. **Esperado**: no queda cuenta conectada, mensaje comprensible y datos locales intactos. Con el navegador bloqueando ventanas emergentes, mensaje que explica cómo permitirla.
6. Comprueba que el texto informativo sobre un posible aviso de Google es visible y no usa jerga ("token", "OAuth", "credenciales").

## US2 — Varios dispositivos

1. En el navegador A crea un ejercicio con imagen y sincroniza. En el navegador B conecta la misma cuenta y sincroniza. **Esperado**: en B aparecen todos los datos, incluidas imágenes, categorías, planificaciones y progreso.
2. Cambia algo solo en A y sincroniza; después sincroniza en B. **Esperado**: B lo recibe sin conflicto. Repite al revés.
3. Cambia algo en A y en B sin sincronizar entre medias; sincroniza en A y después en B. **Esperado**: en B aparece el conflicto y debes elegir entre datos locales o de Google antes de continuar.
4. Pulsa varias veces seguidas "Sincronizar ahora". **Esperado**: solo se ejecuta una sincronización.
5. Corta la conexión y sincroniza. **Esperado**: mensaje claro, datos locales intactos y posibilidad de reintentar.
6. Con otra cuenta de Google en otro perfil, sincroniza. **Esperado**: no ves ni modificas los datos de la primera cuenta.
7. Intenta sincronizar o importar una copia que contenga una imagen de más de 5 MB. **Esperado**: se rechaza con el mensaje "Cada imagen de archivo no puede superar los 5 MB." y tus datos locales no cambian.

## US3 — Gestionar la conexión

1. Con una cuenta conectada, revisa la pantalla. **Esperado**: método (Google), cuenta, estado y última sincronización.
2. Pulsa "Desconectar cuenta". **Esperado**: confirmación en línea; al confirmar vuelve a verse "Conectar con Google", los datos locales siguen y, al reconectar la misma cuenta, los datos guardados en Google siguen ahí.
3. Retira el acceso de la aplicación desde la configuración de tu cuenta de Google y pulsa "Sincronizar ahora". **Esperado**: aviso comprensible y "Volver a conectar"; tras reconectar (como máximo 2 acciones desde el mensaje), la sincronización se completa sola sin perder datos. Repite dejando que caduque la conexión (más de una hora abierta).
4. Desconecta y conecta una segunda cuenta de Google. **Esperado**: la primera sincronización con la nueva cuenta aplica la regla de primera sincronización y los datos de la primera cuenta no cambian.
5. Con GitHub configurado y funcionando, abre la pantalla. **Esperado**: GitHub es el método activo y sigue funcionando como antes; "Sincronizar ahora" aparece en la acción común, fuera de la tarjeta de Google, e indica GitHub como método activo. "Conectar con Google" está disponible sin olvidar el token (ver US5).

## US5 — GitHub y Google guardados a la vez

1. Con GitHub configurado y sincronizado, pulsa "Conectar con Google" y completa la conexión. **Esperado**: ambos métodos aparecen conectados, Google con "Método activo" y aviso "Ahora sincronizas con Google.", y los datos de GitHub (repositorio y token oculto) siguen guardados al desplegar las opciones avanzadas.
2. Pulsa "Usar este método" en GitHub. **Esperado**: GitHub pasa a ser el activo de inmediato, sin pedir token ni confirmación; la barra común indica GitHub. Repite hacia Google.
3. Con Google activo, pulsa "Sincronizar ahora". **Esperado**: se sincroniza solo con Google; el repositorio de GitHub no cambia.
4. Sin cambios entre medias, alterna entre ambos métodos y sincroniza en cada uno. **Esperado**: sin conflictos ni preguntas (los dos ya se habían sincronizado). Cambia un ejercicio, sincroniza con Google, cambia a GitHub y sincroniza. **Esperado**: se sube el cambio a GitHub sin conflicto.
5. Con Google activo, edita la configuración de GitHub y guarda. **Esperado**: Google sigue activo. Pulsa "Olvidar token" en GitHub. **Esperado**: Google sigue conectado y activo.
6. Vuelve a configurar GitHub y actívalo; pulsa "Desconectar cuenta" de Google y confirma. **Esperado**: GitHub sigue guardado y activo, y Google muestra "Conectar con Google". Desconecta ahora el método activo y comprueba **Esperado**: sin método activo, no hay "Sincronizar ahora" y el otro método ofrece "Usar este método" (si sigue conectado).
7. Con GitHub activo y la sesión de Google caducada (más de una hora abierta), sincroniza con GitHub. **Esperado**: sin avisos de Google. Actívalo y sincroniza. **Esperado**: "Volver a conectar" solo ahora.
8. Exporta una copia y revisa el ZIP. **Esperado**: sin token ni correo.

## US4 — Copia manual

1. Sin ninguna cuenta conectada, pulsa "Exportar copia de seguridad". **Esperado**: se descarga `copia-ejercicios-AAAA-MM-DD.zip` y aparece una confirmación. El ZIP contiene `datos.json` y una carpeta hermana `imagenes/` con un JSON por imagen de archivo.
2. En otro navegador o con datos vaciados, pulsa "Importar copia de seguridad" y elige el ZIP. **Esperado**: aviso de que se reemplazarán los datos actuales; al confirmar aparecen todos los datos, incluidas las imágenes.
3. Cancela en la confirmación. **Esperado**: sin cambios.
4. Importa un fichero cualquiera que no sea un ZIP de copia válido (por ejemplo, una imagen, un texto o un ZIP sin `datos.json`). **Esperado**: mensaje claro y datos locales intactos.
5. Inspecciona los contenidos del ZIP. **Esperado**: contiene únicamente datos de la aplicación e imágenes; no incluye correo, token ni credenciales.

## Sin conexión y compatibilidad

Las comprobaciones de red (por ejemplo, que no haya solicitudes a Google al arrancar) son técnicas y están en la validación automática (T051 de [tasks.md](./tasks.md)), no en esta guía.

1. Con la aplicación cargada y sin internet, consulta, crea y marca ejercicios. **Esperado**: todo funciona; solo sincronizar y conectar muestran un error de conexión.
2. Repite los recorridos de GitHub de la feature 001 (historia 5). **Esperado**: mismos resultados.

## Criterios medibles

| Criterio | Cómo se comprueba |
|---|---|
| SC-001 | Una persona sin conocimientos técnicos conecta y sincroniza en menos de 2 minutos, sin ayuda, con éxito al primer intento en al menos 9 de 10 pruebas |
| SC-002 | Contar los campos de credenciales del flujo de Google: 0 |
| SC-003 | Comparar los datos de A y B tras sincronizar: 100 % |
| SC-004 | Pruebas de aislamiento entre dos cuentas: 0 incidencias |
| SC-005 | Tras cancelar, denegar, caducar, cortar la red e interrumpir: 0 % de pérdida de datos locales |
| SC-006 | Importa el ZIP `tests/fixtures/copia-100-ejercicios.zip` (unos 100 ejercicios con imágenes, tarea T055), sincroniza y cronometra: menos de 10 segundos |
| SC-007 | Exportar e importar: 100 % de los datos; fichero inválido rechazado siempre sin cambios |
| SC-008 | Tras la caducidad, recuperar la sincronización en 2 acciones como máximo desde el mensaje |
| SC-009 | Los escenarios de GitHub de la feature 001 conservan sus resultados |
| SC-010 | Con ambos métodos guardados, cambiar de método con una acción y sin datos de acceso: 100 %; tras conectar Google, los datos de GitHub siguen guardados: 100 % |
| SC-011 | Alternar entre métodos ya sincronizados y sin cambios: 0 conflictos erróneos |

## Resultados de validación (27-10-2026)

Resultados comunicados por el propietario tras pruebas manuales en varios dispositivos:

- Conexión con varias cuentas de Google, subida y descarga de datos: completadas correctamente.
- Se volvió a mostrar la ventana de confianza de Google; se aceptó y el flujo continuó correctamente.
- Interfaz comprobada en varias resoluciones y accesibilidad probada.
- Rendimiento: probada una biblioteca de 50 ejercicios; el propietario confirma que respondió muy rápido y acepta esta prueba como suficiente. No se midió un tiempo exacto ni se probó el conjunto de 100 ejercicios previsto para SC-006.
- No se registraron tiempos exactos para SC-001 ni SC-008.
