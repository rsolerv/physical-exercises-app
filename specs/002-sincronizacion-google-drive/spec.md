# Feature Specification: Sincronización con cuenta de Google sin credenciales técnicas



**Feature Branch**: `002-sincronizacion-google-drive`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Permitir que personas sin cuenta de GitHub ni conocimientos técnicos sincronicen sus datos entre dispositivos identificándose con su cuenta de Google ('Conectar con Google'), sin backend propio, guardando los mismos ficheros JSON que hoy se suben a GitHub en un espacio privado de la aplicación dentro de su cuenta. Cada persona solo ve sus propios datos (no hay datos compartidos entre personas). La aplicación sigue funcionando sin cuenta (local-first), GitHub con token se mantiene como opción avanzada, y se ofrece una copia manual mediante exportar e importar un fichero para quien no quiera conectar ninguna cuenta."

## Contexto y relación con otras especificaciones

- Esta especificación **amplía** la capacidad de sincronización definida en [specs/001-gestion-ejercicios-fisicos/spec.md](../001-gestion-ejercicios-fisicos/spec.md) (historia de usuario 5, FR-002, FR-037 y requisitos de la pantalla de sincronización). El comportamiento de GitHub con token descrito allí no cambia y sigue vigente como opción avanzada.
- Las reglas de decisión de la sincronización (subir, descargar o resolver conflicto) y el contenido sincronizado (ejercicios, imágenes, categorías, planificaciones y progreso) son los mismos que en la especificación 001; esta feature solo añade un nuevo destino de sincronización y una forma de acceso más sencilla.
- Las decisiones técnicas transversales (proveedor, tipo de autorización, detección de cambios remotos) se registrarán en `specs/001-gestion-ejercicios-fisicos/research.md` durante la fase de plan, referenciando esta feature.

## Decisiones de producto

- El método de sincronización principal pasa a ser "Conectar con Google": la persona se identifica con su cuenta de Google en la pantalla de acceso del propio Google. No crea ni copia ningún token, no necesita una cuenta de GitHub y no crea repositorios.
- Los datos se guardan en un espacio privado de la aplicación dentro del almacenamiento de la cuenta de Google de la persona. Ese espacio no se mezcla con sus ficheros personales y la aplicación no puede leer ningún otro fichero de su cuenta.
- Cada persona sincroniza únicamente sus propios datos con su propia cuenta. No existen datos compartidos entre personas, roles ni permisos entre usuarios.
- La aplicación sigue siendo utilizable por completo sin cuenta y sin conexión; conectar una cuenta es opcional.
- Solo hay un método de sincronización activo a la vez (Google o GitHub). GitHub con token se mantiene como "opción avanzada" para quien ya lo utilice.
- Quien no quiera conectar ninguna cuenta puede llevar sus datos a otro dispositivo mediante una copia manual en fichero (exportar e importar).
- La sincronización sigue siendo una acción explícita ("Sincronizar ahora"), nunca automática en segundo plano.
- Los textos del flujo de Google evitan jerga técnica (no se habla de "token", "OAuth" ni "credenciales") y están en español de España.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conectar mi cuenta de Google y sincronizar por primera vez (Priority: P1)

Como persona sin conocimientos técnicos ni cuenta de GitHub, quiero conectar mi cuenta de Google con un par de pulsaciones y sincronizar mis datos, para tenerlos guardados y poder verlos en otro dispositivo sin configurar nada complicado.

**Why this priority**: Es la razón de ser de la feature: hoy la sincronización exige una cuenta de GitHub, un repositorio privado y un token con permisos exactos, lo que impide su uso a personas no técnicas. Sin esta historia no hay valor.

**Independent Test**: Con datos locales creados y sin ninguna cuenta configurada, abrir la pantalla "Sincronización", pulsar "Conectar con Google", elegir una cuenta y aceptar; después pulsar "Sincronizar ahora" y comprobar en pantalla que aparece como sincronizado con la cuenta indicada.

**Acceptance Scenarios**:

1. **Given** que la persona no ha configurado ninguna sincronización, **When** abre la pantalla "Sincronización", **Then** ve "Conectar con Google" como acción principal y la opción de GitHub como alternativa avanzada secundaria.
2. **Given** que pulsa "Conectar con Google", **When** elige su cuenta y concede el permiso en la pantalla de Google, **Then** vuelve a la aplicación, ve la cuenta conectada (por ejemplo, su correo) y una confirmación visible, sin haber tenido que copiar ni escribir ningún dato técnico.
3. **Given** una cuenta conectada que no tiene datos de la aplicación guardados, **When** pulsa "Sincronizar ahora", **Then** sus datos locales se guardan en su cuenta, la pantalla muestra "Sincronizado" con la fecha y hora de la última sincronización y recibe una confirmación.
4. **Given** una cuenta conectada que ya contiene datos de la aplicación y un dispositivo que nunca se ha sincronizado, **When** pulsa "Sincronizar ahora" por primera vez, **Then** la aplicación no sobrescribe lo guardado, sino que muestra la elección entre datos locales y datos de Google con "Usar los datos de Google" marcada por defecto.
5. **Given** que la persona cierra la ventana de Google o rechaza el permiso, **When** vuelve a la aplicación, **Then** no queda ninguna cuenta conectada, ve un mensaje comprensible que indica que la conexión no se ha completado y sus datos locales siguen intactos.
6. **Given** que la persona conecta su cuenta, **When** revisa lo que solicita Google, **Then** el permiso se refiere únicamente al espacio privado de la aplicación y no a sus documentos, correo ni otros ficheros.

---

### User Story 2 - Seguir mis datos en varios dispositivos (Priority: P2)

Como persona con la cuenta de Google conectada, quiero sincronizar desde distintos dispositivos y que mis datos se mantengan al día, sin perder cambios ni sobrescribir nada por error.

**Why this priority**: Es el valor continuado de la sincronización una vez conectada la cuenta: acceder a los mismos datos desde móvil, tablet y escritorio con las mismas reglas de seguridad que ya existen con GitHub.

**Independent Test**: Crear un ejercicio en el dispositivo A, sincronizar; en el dispositivo B conectar la misma cuenta, sincronizar y comprobar que aparece el ejercicio; después modificar en uno y comprobar que la siguiente sincronización en el otro lo trae sin conflicto.

**Acceptance Scenarios**:

1. **Given** datos sincronizados desde el dispositivo A con una cuenta, **When** la persona conecta la misma cuenta en el dispositivo B y sincroniza, **Then** ve en B todos los datos creados en A, incluidas las imágenes, categorías, planificaciones y progreso.
2. **Given** que solo ha habido cambios en este dispositivo desde la última sincronización, **When** sincroniza, **Then** los cambios se guardan en su cuenta sin preguntar.
3. **Given** que solo ha habido cambios en la cuenta de Google desde la última sincronización, **When** sincroniza, **Then** se descargan y aplican sin mostrar ningún conflicto.
4. **Given** que ha habido cambios tanto en este dispositivo como en la cuenta de Google desde la última sincronización, **When** sincroniza, **Then** la aplicación informa del conflicto y obliga a elegir explícitamente entre conservar todos los datos locales o todos los de Google antes de completar la sincronización.
5. **Given** que los datos de la cuenta cambian desde otro dispositivo justo mientras se está sincronizando, **When** la aplicación detecta que lo guardado ya no es lo que leyó, **Then** no sobrescribe esos cambios y lo trata como un conflicto o pide repetir la sincronización, sin pérdida de datos.
6. **Given** dos personas distintas, cada una con su cuenta de Google, **When** cada una sincroniza sus datos, **Then** ninguna ve ni modifica los datos de la otra.
7. **Given** que no hay conexión a internet o el servicio de Google no está disponible, **When** la persona intenta sincronizar, **Then** recibe un mensaje claro del error, los datos locales permanecen intactos y puede volver a intentarlo.
8. **Given** una imagen de ejercicio de más de 5 MB, **When** se intenta sincronizar o importar desde una copia manual, **Then** se aplica la misma regla que en la especificación 001: se rechaza con el mensaje "Cada imagen de archivo no puede superar los 5 MB." y los datos locales no cambian.

---

### User Story 3 - Gestionar la conexión: ver cuenta, reconectar y desconectar (Priority: P3)

Como persona que usa la sincronización, quiero ver qué cuenta tengo conectada, recuperar la conexión si caduca y poder desconectarla cuando quiera, para mantener el control sobre mis datos y mi cuenta.

**Why this priority**: Completa el ciclo de vida de la conexión y evita que una sesión caducada o un cambio de cuenta dejen a la persona bloqueada. Es secundaria respecto a conectar y sincronizar.

**Independent Test**: Con una cuenta conectada, comprobar que la pantalla muestra la cuenta y el estado; pulsar "Desconectar cuenta" y comprobar que se pide confirmación, que deja de estar conectada y que los datos locales permanecen; volver a conectar y sincronizar.

**Acceptance Scenarios**:

1. **Given** una cuenta conectada, **When** la persona abre la pantalla "Sincronización", **Then** ve el método activo (Google), la cuenta conectada, el estado (sin configurar, sincronizando, sincronizado, error o conflicto) y la última sincronización.
2. **Given** una cuenta conectada, **When** pulsa "Desconectar cuenta" y confirma, **Then** la aplicación olvida la conexión, vuelve a mostrar "Conectar con Google", y tanto los datos locales como los guardados en su cuenta de Google permanecen sin cambios.
3. **Given** que la conexión ha caducado, **When** la persona pulsa "Sincronizar ahora", **Then** la aplicación intenta renovarla sin molestarla; si necesita su intervención, muestra un mensaje comprensible y una acción "Volver a conectar", y, al reconectar con éxito, la sincronización pendiente se completa automáticamente sin perder datos y sin volver a pulsar "Sincronizar ahora".
4. **Given** que la persona quiere usar otra cuenta de Google o cambiar a GitHub, **When** desconecta la actual y conecta la otra, **Then** la primera sincronización con la nueva cuenta o método aplica la regla de primera sincronización (nunca sobrescribe datos existentes sin elección), y los datos guardados en la cuenta o método anterior no se modifican ni se borran.
5. **Given** que la persona ya tiene configurado GitHub con token, **When** abre la pantalla "Sincronización", **Then** ve que GitHub es el método activo y puede seguir usándolo igual que hasta ahora, o desconectarlo y conectar Google.

---

### User Story 4 - Llevar mis datos a otro dispositivo sin cuenta (copia manual) (Priority: P4)

Como persona que no quiere conectar ninguna cuenta, quiero exportar mis datos a un fichero y poder importarlos en otro dispositivo, para no depender de ningún servicio externo.

**Why this priority**: Cubre a quien rechaza o no puede usar una cuenta externa y sirve de copia de seguridad adicional. Es la opción menos cómoda, por lo que se prioriza en último lugar.

**Independent Test**: Sin ninguna cuenta conectada, pulsar "Exportar copia de seguridad", guardar el ZIP con `datos.json` y `imagenes/`, vaciar o abrir la aplicación en otro dispositivo, pulsar "Importar copia de seguridad", elegir el ZIP, confirmar y comprobar que aparecen todos los datos y las imágenes.

**Acceptance Scenarios**:

1. **Given** datos locales y ninguna cuenta conectada, **When** pulsa "Exportar copia de seguridad", **Then** se descarga un ZIP con `datos.json` y una carpeta hermana `imagenes/` que contiene un JSON por imagen, y recibe una confirmación visible.
2. **Given** un ZIP de copia válido, **When** la persona pulsa "Importar copia de seguridad", lo elige y confirma tras ver un aviso de que reemplazará los datos actuales, **Then** los datos locales y las imágenes pasan a ser los del ZIP y la aplicación muestra el resultado.
3. **Given** un fichero que no es una copia válida o está dañado, **When** intenta importarlo, **Then** la aplicación lo rechaza con un mensaje claro y sus datos locales no cambian.
4. **Given** que se cancela la importación en la confirmación, **When** vuelve a la pantalla, **Then** los datos locales no cambian.
5. **Given** un fichero exportado, **When** se revisa su contenido de forma habitual, **Then** no incluye ninguna información de la cuenta conectada ni credenciales.

---

### Edge Cases

- ¿Qué ocurre si la persona tiene datos locales y los datos de su cuenta de Google son distintos en la primera sincronización? Se muestra la elección entre datos locales y de Google, con "Usar los datos de Google" marcada por defecto, y no se sobrescribe nada sin elección.
- ¿Qué ocurre si la persona revoca el acceso de la aplicación desde su cuenta de Google? La siguiente sincronización informa de que la conexión ya no es válida y ofrece "Volver a conectar"; los datos locales se conservan.
- ¿Qué ocurre si la persona elimina o vacía el almacenamiento de datos de la aplicación en su cuenta de Google? Se trata como una cuenta sin datos remotos y, al sincronizar, se aplican las reglas habituales de decisión sin perder los datos locales.
- ¿Qué ocurre si la persona pulsa "Sincronizar ahora" varias veces seguidas? Solo se ejecuta una sincronización a la vez y se evita duplicar o corromper datos.
- ¿Qué ocurre si la sincronización se interrumpe a mitad (cierre del navegador o pérdida de conexión)? Los datos locales permanecen intactos, no se marca como sincronizado y la siguiente sincronización puede completarse con normalidad.
- ¿Qué ocurre si la persona tiene dos cuentas de Google? Elige cuál conectar en la pantalla de Google; la cuenta conectada se muestra siempre en la aplicación para evitar confusiones.
- ¿Qué ocurre si la persona cambia de método (Google a GitHub o viceversa)? Se desconecta el método activo antes de configurar el otro; los datos de ambos destinos se conservan por separado y el primer sincronizado con el nuevo destino aplica la regla de primera sincronización.
- ¿Qué ocurre si Google muestra un aviso de aplicación no verificada o pide confirmaciones adicionales? La aplicación no lo controla; la pantalla de sincronización informa en lenguaje sencillo de que el aviso es normal y qué pulsar para continuar mientras la aplicación no esté verificada por Google.
- ¿Qué ocurre si el navegador bloquea la ventana de inicio de sesión? Se muestra un mensaje que explica cómo permitirla y la persona puede reintentarlo sin perder datos.
- ¿Qué ocurre si el fichero de importación pertenece a una versión distinta de la aplicación? Se importa si es compatible; si no, se rechaza con un mensaje claro y sin cambios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La aplicación DEBE seguir funcionando íntegramente sin cuenta y sin conexión; conectar una cuenta de sincronización DEBE ser opcional.
- **FR-002**: La pantalla "Sincronización" DEBE ofrecer "Conectar con Google" como método principal de sincronización. La persona DEBE identificarse con su cuenta de Google mediante la pantalla de acceso de Google, sin crear, copiar ni escribir tokens, repositorios, claves ni ningún otro dato técnico en la aplicación.
- **FR-003**: Los datos sincronizados DEBEN guardarse en un espacio privado de la aplicación dentro del almacenamiento de la propia cuenta de Google de la persona. Ese espacio NO DEBE mezclarse con los ficheros personales de la persona.
- **FR-004**: La aplicación DEBE solicitar únicamente el permiso mínimo necesario para leer y escribir en su propio espacio privado y NO DEBE acceder a ningún otro fichero ni dato de la cuenta de Google, salvo el dato necesario para mostrar qué cuenta está conectada.
- **FR-005**: Cada persona DEBE sincronizar únicamente con su propia cuenta; NO DEBEN existir datos compartidos entre personas, roles ni permisos entre usuarios.
- **FR-006**: La sincronización DEBE ejecutarse únicamente mediante una acción explícita ("Sincronizar ahora") y NO DEBE ejecutarse automáticamente en segundo plano.
- **FR-007**: Con Google, la decisión de la sincronización DEBE seguir las mismas reglas que en la especificación 001: si solo hay cambios locales, se suben; si solo hay cambios remotos, se descargan; si hay cambios en ambos lados, la persona DEBE elegir explícitamente entre conservar todos los datos locales o todos los de Google; en la primera sincronización con datos remotos, DEBE ofrecerse esa elección con "Usar los datos de Google" marcada por defecto.
- **FR-008**: La sincronización DEBE incluir los mismos datos que con GitHub: ejercicios, imágenes locales (máximo 5 MB cada una), categorías, planificaciones y progreso diario.
- **FR-009**: La aplicación DEBE detectar, antes de escribir, que la cuenta de Google ha cambiado desde otro dispositivo desde la última lectura y, en ese caso, NO DEBE sobrescribir: DEBE tratarlo como conflicto o pedir repetir la sincronización, sin pérdida de datos. Si el servicio no ofrece escritura condicional, se acepta que quede una ventana de milisegundos entre la comprobación y la escritura, dado que cada cuenta es de una sola persona y la sincronización es manual.
- **FR-010**: La aplicación DEBE ejecutar una única sincronización a la vez e ignorar o bloquear pulsaciones repetidas de "Sincronizar ahora" mientras una está en curso.
- **FR-011**: La pantalla "Sincronización" DEBE mostrar el método activo, la cuenta conectada, el estado (sin configurar, sincronizando, sincronizado, error o conflicto) y la última sincronización cuando exista. "Sincronizar ahora" DEBE ser la acción principal cuando haya una conexión.
- **FR-012**: La persona DEBE poder desconectar la cuenta con una acción "Desconectar cuenta" que pida confirmación. Al desconectar, la aplicación DEBE olvidar la conexión y NO DEBE borrar ni modificar los datos locales ni los guardados en la cuenta de Google.
- **FR-013**: Si la conexión caduca o es revocada, la aplicación DEBE intentar recuperarla sin molestar a la persona; si necesita su intervención, DEBE mostrar un mensaje comprensible y una acción "Volver a conectar", sin perder datos locales ni dejar la sincronización en un estado inconsistente.
- **FR-014**: Si la persona cancela el inicio de sesión, rechaza el permiso o el navegador bloquea la ventana de acceso, la aplicación DEBE volver a la pantalla sin cuenta conectada, mostrar un mensaje comprensible y conservar los datos locales.
- **FR-015**: Ante fallos de conexión o indisponibilidad del servicio, la aplicación DEBE conservar íntegros los datos locales, informar del error junto a la acción de sincronizar y permitir reintentar.
- **FR-016**: Solo DEBE haber un método de sincronización activo a la vez (Google o GitHub). Para cambiar de método o de cuenta, la persona DEBE desconectar primero el activo. La primera sincronización con el nuevo destino DEBE aplicar la regla de primera sincronización, y los datos del destino anterior NO DEBEN modificarse ni borrarse.
- **FR-017**: La sincronización con GitHub mediante token DEBE conservarse sin cambios de comportamiento como opción avanzada, presentada de forma secundaria respecto a Google.
- **FR-018**: Las credenciales o la información de sesión de la cuenta de Google NO DEBEN incluirse en los datos sincronizados ni en los ficheros de copia manual, y DEBEN eliminarse de la aplicación al desconectar la cuenta.
- **FR-019**: La aplicación DEBE permitir "Exportar copia de seguridad", que descarga sin necesidad de cuenta un archivo ZIP con `datos.json` y la carpeta hermana `imagenes/`; el JSON de datos DEBE conservar las rutas lógicas `imagenes/<id>.json`, y cada imagen DEBE ser un archivo JSON separado con su `ImagenArchivoJSON`.
- **FR-020**: La aplicación DEBE permitir "Importar copia de seguridad" desde un ZIP con `datos.json` e imágenes bajo `imagenes/`, mostrando antes de aplicarlo un aviso de que reemplazará los datos actuales y exigiendo confirmación. Si el archivo, el JSON o la estructura de directorios no son válidos o son incompatibles, DEBE rechazarlo con un mensaje claro y sin modificar los datos locales.
- **FR-021**: Los textos del flujo de Google y de la copia manual DEBEN estar en español de España, con lenguaje sencillo y sin jerga técnica (por ejemplo, sin "token", "OAuth" ni "credenciales"). La opción avanzada de GitHub conserva su terminología actual (FR-017), ya que es para quien conoce GitHub.
- **FR-022**: Conectar la cuenta y completar la primera sincronización DEBE poder hacerse sin ayuda y con un número reducido de pasos, y cada acción (conectar, sincronizar, desconectar, exportar, importar) DEBE dar una confirmación o un error visible y contextual.
- **FR-023**: Las pantallas y controles nuevos o modificados DEBEN cumplir los requisitos de experiencia de usuario, accesibilidad (WCAG 2.1 AA), responsive y Angular Material definidos en la especificación 001 y en los estándares de UI/UX del proyecto, incluidas áreas táctiles de al menos 48 × 48 px en móvil.
- **FR-024**: La aplicación DEBE informar en la pantalla de sincronización, en lenguaje sencillo, de que Google puede mostrar avisos de seguridad mientras la aplicación no esté verificada, indicando cómo continuar (por ejemplo, pulsando «Configuración avanzada» y después «Ir a la aplicación»; los nombres exactos de los botones de Google se confirman durante la validación técnica y en el prototipo de Storybook).

### Key Entities *(include if feature involves data)*

- **Conexión de sincronización**: representa el método activo (Google, GitHub o ninguno), la cuenta identificada, su estado (sin configurar, sincronizando, sincronizado, error o conflicto), la última sincronización y el estado de la autorización. Solo existe una activa a la vez y nunca se incluye en los datos sincronizados.
- **Copia remota**: conjunto de datos de la persona guardado en su espacio privado de la cuenta de Google (datos principales e imágenes), con la información de versión necesaria para detectar cambios de otro dispositivo.
- **Copia de seguridad en fichero**: documento descargable que contiene todos los datos de la persona, utilizable para importarlos en otro dispositivo sin cuenta.
- **Datos de la persona**: ejercicios, categorías, imágenes, planificaciones y progreso diario ya definidos en la especificación 001; no cambian.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona sin conocimientos técnicos y sin cuenta de GitHub puede conectar su cuenta de Google y completar su primera sincronización en menos de 2 minutos y sin ayuda, con éxito al primer intento en al menos el 90% de las pruebas.
- **SC-002**: Para conectar y sincronizar, la persona no tiene que copiar, escribir ni guardar ningún dato técnico (0 campos de credenciales en el flujo).
- **SC-003**: Tras sincronizar en un dispositivo y después en otro con la misma cuenta, el 100% de los datos del primero (ejercicios, imágenes, categorías, planificaciones y progreso) se ve en el segundo.
- **SC-004**: Dos personas con cuentas distintas no ven nunca datos de la otra (0 incidencias en las pruebas de aislamiento).
- **SC-005**: En los casos de cancelación, permiso rechazado, caducidad de la conexión, fallo de red e interrupción, se pierde el 0% de los datos locales.
- **SC-006**: Una sincronización con una biblioteca habitual (hasta 100 ejercicios con imágenes dentro del límite) termina en menos de 10 segundos con una conexión normal.
- **SC-007**: Una copia exportada e importada en otro dispositivo restaura el 100% de los datos, y un fichero inválido se rechaza en el 100% de los casos sin cambiar los datos locales.
- **SC-008**: Tras una caducidad de la conexión, la persona recupera la sincronización en como máximo 2 acciones desde el mensaje mostrado.
- **SC-009**: Los flujos de sincronización con GitHub y sus escenarios de aceptación de la especificación 001 conservan sus resultados tras añadir Google.

## Assumptions

- **Usuarios objetivo**: personas sin conocimientos técnicos que ya disponen de una cuenta de Google (o la crean ellas mismas fuera de la aplicación). La creación de la cuenta de Google queda fuera del alcance.
- **Sin backend**: la sincronización se realiza íntegramente desde el navegador, sin servidor propio, de acuerdo con la constitución del proyecto.
- **Registro de la aplicación**: el propietario del producto registra una única vez la aplicación en el proveedor para poder ofrecer el acceso con Google; ese registro no es un secreto ni tiene que hacerlo ninguna persona usuaria. Mientras la aplicación no esté publicada y verificada, solo podrán conectar las cuentas autorizadas por el propietario o aparecerán avisos de seguridad.
- **Un único proveedor nuevo**: el alcance incluye solo Google. La arquitectura deberá poder incorporar otros proveedores en el futuro, pero otros destinos quedan fuera de esta feature.
- **Datos por persona**: cada cuenta contiene un único conjunto de datos de una sola persona; no se contempla compartirlos ni varios perfiles dentro de una misma cuenta.
- **Varios usuarios en un dispositivo compartido**: fuera de alcance; cada navegador conserva los datos locales de una única persona.
- **Sin migración automática entre destinos**: la aplicación no copia datos de GitHub a Google ni viceversa por sí sola; la persona puede desconectar un método, conectar el otro y elegir qué datos conservar en la primera sincronización.
- **Sincronización manual**: igual que en la especificación 001, solo se sincroniza bajo acción explícita.
- **Conexión de la sesión**: la sesión con Google puede caducar; la recuperación puede requerir una interacción breve de la persona (ver FR-013). Los detalles de renovación se decidieron en el plan.
- **Detección de cambios remotos (FR-009)**: la comprobación de versión antes de escribir es el mecanismo previsto; si el servicio no admite escritura condicional queda una ventana muy breve, aceptada por tratarse de una cuenta de una sola persona (ver `research.md`, sección 4, y la verificación V3).
- **Disponibilidad**: la sincronización requiere conexión a internet; el resto de la aplicación no.
- **Tamaño de datos**: se mantiene el límite de 5 MB por imagen de la especificación 001.
- **Gobernanza (resuelta)**: la constitución v2.3.0 (2026-10-26) ya permite Google como destino de sincronización y una copia manual portable (ZIP con documentos JSON), además de GitHub, siempre sin backend, con un único destino activo y sin secretos de cliente en el código. Esta feature es coherente con ese texto; cualquier destino adicional exigiría una nueva enmienda.
- **Dependencia de especificación 001**: se reutilizan sin cambios las reglas de decisión de sincronización, el contenido sincronizado, la pantalla "Sincronización" y los estándares de experiencia de usuario de [la especificación 001](../001-gestion-ejercicios-fisicos/spec.md); al planificar se actualizarán las secciones afectadas de `research.md` y de los contratos de sincronización.
