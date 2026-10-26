# Contrato de interfaz de usuario: Sincronización


**Feature**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md) | **Contrato general**: [interfaz-usuario.md de la feature 001](../../001-gestion-ejercicios-fisicos/contracts/interfaz-usuario.md)

Define lo que la persona ve y puede hacer en la pantalla de Sincronización. Amplía el apartado "Sincronización" del contrato de la feature 001 y lo sustituye en esta pantalla. Es la entrada del agente `ux-ui-expert` para crear las historias de Storybook que deben aprobarse **antes** de implementar los componentes (principio V de la constitución).

Se aplican sin cambios el sistema visual, la navegación, los tamaños de referencia, los requisitos de accesibilidad y las normas de [ux-ui.instructions.md](../../../.github/instructions/ux-ui.instructions.md). Solo Angular Material como biblioteca de componentes; evitar ventanas modales: las confirmaciones son en línea.

## Estructura de la pantalla

Una sola ruta (`/sincronizacion`, se mantiene `/sincronizacion/conflicto`) con un título de página y tres bloques, de arriba abajo:

| Bloque | Contenido |
|---|---|
| 1. Sincronización con Google (principal) | Acción "Conectar con Google" o, si hay conexión, cuenta, estado, última sincronización y acciones |
| 2. Opciones avanzadas | Sincronización con GitHub con token, plegada por defecto salvo que GitHub sea el método activo |
| 3. Copia de seguridad en un archivo ZIP | "Exportar copia de seguridad" e "Importar copia de seguridad" |

| Dispositivo | Disposición |
|---|---|
| Móvil (≤599 px) | Una columna; el estado y "Sincronizar ahora" quedan visibles sin desplazarse; controles de al menos 48 × 48 px |
| Tablet (768–1024 px) | Una o dos columnas adaptativas; bloque 3 puede ir junto al bloque 1 |
| Escritorio (≥1280 px) | Bloque 1 como tarjeta principal y bloques 2 y 3 en columnas o secciones contiguas, sin ancho máximo fijo |

## Estados del bloque principal

Un solo método está activo (Google o GitHub). Estados comunes a ambos y casos específicos:

| Estado | Qué muestra | Acción principal | Otras acciones |
|---|---|---|---|
| Sin configurar | Invitación a conectar y texto explicativo | "Conectar con Google" | "Opciones avanzadas" desplegable |
| Conectando | Indicador de progreso | — (deshabilitada) | — |
| Conectado, listo | Cuenta (correo), estado "Conectado", última sincronización si existe | "Sincronizar ahora" | "Desconectar cuenta" |
| Sincronizando | Indicador de progreso y estado "Sincronizando…" | — (deshabilitada, evita pulsaciones repetidas) | — |
| Sincronizado | Estado "Sincronizado", fecha y hora, confirmación visible | "Sincronizar ahora" | "Desconectar cuenta" |
| Error de conexión | Mensaje claro junto a la acción, con motivo comprensible | "Reintentar" | — |
| Requiere reconectar | Aviso de que la conexión caducó o se retiró | "Volver a conectar" (al conectar con éxito, la sincronización pendiente continúa automáticamente, sin volver a pulsar "Sincronizar ahora") | — |
| Conflicto | Aviso con acceso a la pantalla de resolución | "Resolver conflicto" | — |
| Confirmar desconexión | Mensaje en línea (sin diálogo modal) | "Desconectar" | "Cancelar" |

Los estados "Sin configurar", "Sincronizando", "Sincronizado", "Error" y "Conflicto" son los de FR-011. "Conectando" y "Requiere reconectar" son estados de transición específicos de Google. La pantalla de resolución de conflicto se mantiene como en la feature 001, con "Usar los datos de Google" en lugar de "Usar los datos de GitHub" cuando el método es Google.

## Textos (español de España, sin jerga técnica)

No aparecen las palabras "token", "OAuth" ni "credenciales" en el flujo de Google ni en la copia manual (FR-021); la opción avanzada de GitHub conserva su terminología actual (FR-017). Los textos de referencia son orientativos y los define el prototipo aprobado:

| Elemento | Texto de referencia |
|---|---|
| Título | Sincronización |
| Descripción | Guarda tus datos en tu cuenta de Google. |
| Acción principal sin conexión | Conectar con Google |
| Privacidad | Solo se guarda en un espacio privado de esta aplicación; no se accede a tus documentos ni a tu correo. |
| Aviso de Google (FR-024) | Si Google muestra un aviso de seguridad sobre esta aplicación, es normal mientras no esté verificada: pulsa «Configuración avanzada» y después «Ir a la aplicación». (Los nombres exactos de los botones se confirman en V4 y en el prototipo.) |
| Confirmar desconexión | ¿Desconectar tu cuenta? Tus datos en este dispositivo y los guardados en Google no se borran. |
| Cancelación de la conexión | La conexión no se ha completado. Tus datos no han cambiado. Puedes volver a intentarlo. |
| Ventana bloqueada | Tu navegador ha bloqueado la ventana de Google. Permítela e inténtalo de nuevo. |
| Reconexión | La conexión con Google ha caducado. Vuelve a conectar para sincronizar. |
| Opciones avanzadas | Sincronizar con GitHub (avanzado) |
| Copia de seguridad | Copia de seguridad en un archivo ZIP |

## Opciones avanzadas: GitHub

Conserva el comportamiento de la feature 001 (repositorio de datos, token oculto, "Olvidar token", configuración plegada si ya está configurada, errores junto a cada campo). Reglas nuevas:

- Si Google está conectado, la sección indica que hay que desconectar la cuenta antes y no permite guardar credenciales (FR-016).
- Si GitHub es el método activo, el bloque 1 informa de que se sincroniza con GitHub y ofrece "Conectar con Google" deshabilitado hasta olvidar el token, con la misma explicación.

## Copia de seguridad en un archivo ZIP

- "Exportar copia de seguridad" descarga un ZIP con `datos.json` e `imagenes/` y muestra una confirmación.
- "Importar copia de seguridad" abre el selector de archivos ZIP. Tras elegir uno válido muestra una confirmación en línea con el aviso de que se reemplazarán los datos actuales, "Importar" y "Cancelar". Si el ZIP no es válido muestra el error junto al control y no cambia nada.
- Ambas acciones están disponibles con o sin método de sincronización activo.

## Feedback y accesibilidad

- Cada acción (conectar, sincronizar, desconectar, exportar, importar) da una confirmación o un error visible y contextual, con un anuncio accesible equivalente.
- El estado de la conexión no se transmite solo con el color: siempre hay texto e icono.
- Todo el flujo se puede hacer con teclado, con foco visible y orden lógico; contraste de al menos 4,5:1 en texto normal y 3:1 en texto grande e iconos funcionales.
- Los estados de carga no dejan áreas vacías que parezcan un fallo.

## Historias de Storybook exigidas para la aprobación

Cada historia se muestra dentro del marco real de la aplicación (como las de `src/stories/pantallas.stories.ts`), con datos de ejemplo en español de España y, salvo indicación, en móvil (390 px), tablet (834 px) y escritorio (1280 px):

| Historia | Estado que representa |
|---|---|
| Sincronización: sin configurar | Invitación a conectar, opciones avanzadas plegadas |
| Sincronización: conectando | Indicador de progreso |
| Sincronización: Google conectado | Cuenta, estado "Conectado" y acciones |
| Sincronización: sincronizando | Estado en curso con acciones deshabilitadas |
| Sincronización: sincronizado | Fecha, hora y confirmación |
| Sincronización: error de conexión | Mensaje claro y "Reintentar" |
| Sincronización: volver a conectar | Conexión caducada |
| Sincronización: confirmar desconexión | Confirmación en línea |
| Sincronización: conexión cancelada y ventana bloqueada | Mensajes de FR-014 |
| Sincronización: GitHub como método activo | Opciones avanzadas desplegadas y Google deshabilitado |
| Sincronización: conflicto | Resolución con "Usar los datos de Google" |
| Copia de seguridad: confirmar importación | Aviso de reemplazo |
| Copia de seguridad: fichero no válido | Error junto al control |

Las historias se aprueban en conjunto antes de crear los componentes; el resultado aprobado fija la composición, los textos y los estados.
