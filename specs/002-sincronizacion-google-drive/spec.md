# Feature Specification: Sincronización con cuenta de Google sin credenciales técnicas



**Feature Branch**: `002-sincronizacion-google-drive`

**Created**: 2026-10-26

**Last Amended**: 2026-10-27 (conexiones de GitHub y Google guardadas a la vez; ver "Historial de cambios")

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
- Solo hay un método de sincronización **activo** a la vez (Google o GitHub): es el que usa "Sincronizar ahora". Sin embargo, la persona puede tener **guardadas a la vez** la conexión de Google y los datos de acceso de GitHub, y cambiar el método activo con una sola acción, sin desconectar ni volver a introducir nada. GitHub con token se mantiene como "opción avanzada" para quien ya lo utilice.
- Desconectar un método solo olvida los datos de acceso de ese método; el otro, si estaba guardado, permanece intacto.
- Quien no quiera conectar ninguna cuenta puede llevar sus datos a otro dispositivo mediante una copia manual en fichero (exportar e importar).
- La sincronización se puede iniciar manualmente con "Sincronizar ahora" y, además, se intenta automáticamente al entrar en la aplicación cuando hay un método activo. Esta sincronización de inicio no sustituye ni modifica la acción manual.
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
9. **Given** que hay un método de sincronización activo, **When** la persona entra en la aplicación, **Then** se inicia una sincronización después de cargar los datos locales y se aplican las mismas reglas de decisión. Si no hay conflicto, se suben o descargan los cambios que correspondan; si hay conflicto entre cambios locales y remotos, no se modifica ningún dato, no se muestra la pantalla de resolución ni un aviso de conflicto y la aplicación continúa en la pantalla actual.
10. **Given** que no hay un método activo, **When** la persona entra en la aplicación, **Then** no se inicia ninguna sincronización y el resto de la aplicación funciona con normalidad.

---

### User Story 3 - Gestionar la conexión: ver cuenta, reconectar y desconectar (Priority: P3)

Como persona que usa la sincronización, quiero ver qué cuenta tengo conectada, recuperar la conexión si caduca y poder desconectarla cuando quiera, para mantener el control sobre mis datos y mi cuenta.

**Why this priority**: Completa el ciclo de vida de la conexión y evita que una sesión caducada o un cambio de cuenta dejen a la persona bloqueada. Es secundaria respecto a conectar y sincronizar.

**Independent Test**: Con una cuenta conectada, comprobar que la pantalla muestra la cuenta y el estado; pulsar "Desconectar cuenta" y comprobar que se pide confirmación, que deja de estar conectada y que los datos locales permanecen; volver a conectar y sincronizar.

**Acceptance Scenarios**:

1. **Given** una cuenta conectada, **When** la persona abre la pantalla "Sincronización", **Then** ve el método activo (Google), la cuenta conectada, el estado (sin configurar, sincronizando, sincronizado, error o conflicto) y la última sincronización.
2. **Given** una cuenta conectada, **When** pulsa "Desconectar cuenta" y confirma, **Then** la aplicación olvida la conexión, vuelve a mostrar "Conectar con Google", y tanto los datos locales como los guardados en su cuenta de Google permanecen sin cambios.
3. **Given** que la conexión ha caducado, **When** la persona pulsa "Sincronizar ahora", **Then** la aplicación intenta renovarla sin molestarla; si necesita su intervención, muestra un mensaje comprensible y una acción "Volver a conectar", y, al reconectar con éxito, la sincronización pendiente se completa automáticamente sin perder datos y sin volver a pulsar "Sincronizar ahora".
4. **Given** que la persona quiere usar otra cuenta de Google, **When** desconecta la actual y conecta la otra, **Then** la primera sincronización con la nueva cuenta aplica la regla de primera sincronización (nunca sobrescribe datos existentes sin elección), y los datos guardados en la cuenta anterior no se modifican ni se borran.
5. **Given** que la persona ya tiene configurado GitHub con token, **When** abre la pantalla "Sincronización", **Then** ve que GitHub es el método activo y puede seguir usándolo igual que hasta ahora, y conectar Google sin tener que olvidar el token (ver historia 5).

---

### User Story 5 - Tener guardados GitHub y Google a la vez y cambiar de uno a otro (Priority: P3)

Como persona que usa o ha usado GitHub con token y también quiere conectar su cuenta de Google, quiero que ambas conexiones permanezcan guardadas y poder elegir cuál usa "Sincronizar ahora", para no tener que desconectar y volver a introducir mis datos de acceso cada vez que cambio.

**Why this priority**: Hoy cambiar de método obliga a desconectar el activo, lo que borra los datos de acceso de GitHub y obliga a repetir el proceso técnico para volver. Es una mejora de comodidad sobre la historia 3 y no bloquea el valor principal.

**Independent Test**: Con GitHub configurado y sincronizado, conectar Google desde la pantalla "Sincronización" y comprobar que los datos de GitHub siguen guardados; pulsar "Usar este método" en cada uno y comprobar que cambia el método activo, que "Sincronizar ahora" sincroniza con el activo y que no se ha pedido ningún dato de acceso de nuevo.

**Acceptance Scenarios**:

1. **Given** que GitHub está configurado y es el método activo, **When** la persona conecta su cuenta de Google, **Then** los datos de acceso de GitHub permanecen guardados, ambos métodos aparecen como conectados y la persona ve qué método está activo.
2. **Given** que Google y GitHub están ambos guardados, **When** la persona pulsa "Usar este método" en el que no está activo, **Then** ese pasa a ser el método activo de inmediato, sin pedir datos de acceso ni confirmaciones técnicas, y recibe una confirmación visible indicando el nuevo método activo.
3. **Given** que Google y GitHub están ambos guardados, **When** pulsa "Sincronizar ahora", **Then** se sincroniza únicamente con el método activo y el otro destino no se lee ni se modifica.
4. **Given** que un método guardado se activa por primera vez (o por primera vez desde que se conectó), **When** la persona sincroniza, **Then** se aplica la regla de primera sincronización con ese destino; y si ya lo había usado antes, la decisión (subir, descargar o conflicto) se basa solo en la última sincronización realizada con ese mismo destino, sin falsos conflictos por haber sincronizado con el otro.
5. **Given** que el método activo es GitHub y la persona ha guardado además Google, **When** edita la configuración de GitHub o pulsa "Olvidar token", **Then** solo cambia GitHub: la conexión de Google permanece guardada y, si se olvidó el token del método activo, no queda ningún método activo hasta que la persona elija uno.
6. **Given** que Google está conectado y GitHub guardado, **When** pulsa "Desconectar cuenta" y confirma, **Then** se olvida solo la conexión de Google, los datos de acceso de GitHub permanecen guardados y, si Google era el método activo, no queda ningún método activo hasta que elija uno.
7. **Given** que la sesión de Google ha caducado y GitHub es el método activo, **When** la persona sigue sincronizando con GitHub, **Then** no se le pide reconectar Google; la reconexión solo se solicita al activar Google o al sincronizar con él (FR-013).
8. **Given** que ambos métodos están guardados, **When** la persona exporta una copia de seguridad o sincroniza, **Then** ni los datos de acceso de GitHub ni la información de la cuenta de Google aparecen en el fichero ni en los datos sincronizados.

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
- ¿Qué ocurre si la persona cambia de método (Google a GitHub o viceversa)? Si ambos están guardados, cambia el método activo con "Usar este método" sin desconectar nada; si el otro método no está guardado, lo conecta y lo activa sin perder el guardado del primero. Los datos de ambos destinos se conservan por separado y cada destino recuerda su propia última sincronización; la primera sincronización con un destino nuevo aplica la regla de primera sincronización.
- ¿Qué ocurre si ambos destinos contienen datos distintos? Solo se sincroniza con el activo; la aplicación no mezcla ni copia datos entre destinos. Al activar el otro, la primera sincronización ofrece la elección explícita entre datos locales y remotos.
- ¿Qué ocurre si se olvida o desconecta el método activo y queda el otro guardado? No queda ningún método activo ni se activa el otro automáticamente; la pantalla ofrece "Usar este método" en el que sigue guardado y "Sincronizar ahora" no se ofrece hasta elegir uno.
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
- **FR-006**: La persona DEBE poder iniciar la sincronización manualmente mediante "Sincronizar ahora", cuyo comportamiento se mantiene. Además, cuando exista un método activo, la aplicación DEBE intentar sincronizar al entrar, una vez cargados los datos locales; no DEBE iniciar la sincronización de inicio si no hay método activo. Si se detecta un conflicto, el intento de inicio NO DEBE modificar datos, mostrar la pantalla ni emitir un aviso de conflicto. Un error de sincronización de inicio NO DEBE impedir el uso de la aplicación y DEBE informarse visiblemente. Ambos disparadores DEBEN utilizar las mismas reglas de sincronización y evitar sincronizaciones simultáneas.
- **FR-007**: Con Google, la decisión de la sincronización DEBE seguir las mismas reglas que en la especificación 001: si solo hay cambios locales, se suben; si solo hay cambios remotos, se descargan; si hay cambios en ambos lados, la persona DEBE elegir explícitamente entre conservar todos los datos locales o todos los de Google; en la primera sincronización con datos remotos, DEBE ofrecerse esa elección con "Usar los datos de Google" marcada por defecto.
- **FR-008**: La sincronización DEBE incluir los mismos datos que con GitHub: ejercicios, imágenes locales (máximo 5 MB cada una), categorías, planificaciones y progreso diario.
- **FR-009**: La aplicación DEBE detectar, antes de escribir, que la cuenta de Google ha cambiado desde otro dispositivo desde la última lectura y, en ese caso, NO DEBE sobrescribir: DEBE tratarlo como conflicto o pedir repetir la sincronización, sin pérdida de datos. Si el servicio no ofrece escritura condicional, se acepta que quede una ventana de milisegundos entre la comprobación y la escritura, dado que cada cuenta es de una sola persona y la sincronización es manual.
- **FR-010**: La aplicación DEBE ejecutar una única sincronización a la vez e ignorar o bloquear pulsaciones repetidas de "Sincronizar ahora" mientras una está en curso.
- **FR-011**: La pantalla "Sincronización" DEBE mostrar, para cada método (Google y GitHub), si está conectado o sin configurar y, en Google, la cuenta conectada; DEBE indicar de forma inequívoca cuál es el método activo y mostrar el estado (sin configurar, sincronizando, sincronizado, error o conflicto) y la última sincronización del método activo cuando exista. "Sincronizar ahora" DEBE ser la acción principal cuando haya un método activo.
- **FR-012**: La persona DEBE poder desconectar la cuenta de Google con una acción "Desconectar cuenta" que pida confirmación. Al desconectar, la aplicación DEBE olvidar la conexión de Google y NO DEBE borrar ni modificar los datos locales ni los guardados en la cuenta de Google, ni los datos de acceso de GitHub guardados.
- **FR-013**: Si la conexión caduca o es revocada, la aplicación DEBE intentar recuperarla sin molestar a la persona; si necesita su intervención, DEBE mostrar un mensaje comprensible y una acción "Volver a conectar", sin perder datos locales ni dejar la sincronización en un estado inconsistente.
- **FR-014**: Si la persona cancela el inicio de sesión, rechaza el permiso o el navegador bloquea la ventana de acceso, la aplicación DEBE volver a la pantalla sin cuenta conectada, mostrar un mensaje comprensible y conservar los datos locales.
- **FR-015**: Ante fallos de conexión o indisponibilidad del servicio, la aplicación DEBE conservar íntegros los datos locales, informar del error junto a la acción de sincronizar y permitir reintentar.
- **FR-016**: Solo DEBE haber un método de sincronización activo a la vez (Google o GitHub), y "Sincronizar ahora" DEBE operar únicamente con el activo. La aplicación DEBE permitir tener guardadas a la vez la conexión de Google y los datos de acceso de GitHub, y DEBE permitir cambiar el método activo con una única acción ("Usar este método") sin desconectar el otro ni volver a introducir datos de acceso. Conectar o configurar un método NO DEBE borrar ni invalidar el otro. Al activar un método, la aplicación DEBE avisar visiblemente del cambio.
- **FR-025**: Cada método DEBE conservar de forma independiente su referencia de última sincronización, de modo que la decisión de sincronizar (subir, descargar, conflicto o primera sincronización) se base solo en lo sincronizado previamente con ese mismo destino. Un método que nunca se ha sincronizado desde este dispositivo DEBE aplicar la regla de primera sincronización, y los datos de los destinos no activos NO DEBEN leerse, modificarse ni borrarse al sincronizar.
- **FR-026**: Si se olvida o desconecta el método activo, NO DEBE activarse automáticamente el otro: la aplicación DEBE quedar sin método activo, ofrecer "Usar este método" en el que siga guardado y no ofrecer "Sincronizar ahora" hasta que la persona elija uno.
- **FR-027**: Si la sesión de un método guardado no activo caduca o es revocada, la aplicación NO DEBE molestar a la persona; solo DEBE pedir reconexión al activar ese método o al sincronizar con él (FR-013).
- **FR-017**: La sincronización con GitHub mediante token DEBE conservarse sin cambios de comportamiento como opción avanzada, presentada de forma secundaria respecto a Google. Los datos de acceso de GitHub DEBEN seguir guardados mientras la persona no use "Olvidar token", incluso si Google está conectado o es el método activo, y NO DEBEN incluirse en los datos sincronizados ni en las copias manuales (FR-037 de la especificación 001).
- **FR-018**: Las credenciales o la información de sesión de la cuenta de Google NO DEBEN incluirse en los datos sincronizados ni en los ficheros de copia manual, y DEBEN eliminarse de la aplicación al desconectar la cuenta.
- **FR-019**: La aplicación DEBE permitir "Exportar copia de seguridad", que descarga sin necesidad de cuenta un archivo ZIP con `datos.json` y la carpeta hermana `imagenes/`; el JSON de datos DEBE conservar las rutas lógicas `imagenes/<id>.json`, y cada imagen DEBE ser un archivo JSON separado con su `ImagenArchivoJSON`.
- **FR-020**: La aplicación DEBE permitir "Importar copia de seguridad" desde un ZIP con `datos.json` e imágenes bajo `imagenes/`, mostrando antes de aplicarlo un aviso de que reemplazará los datos actuales y exigiendo confirmación. Si el archivo, el JSON o la estructura de directorios no son válidos o son incompatibles, DEBE rechazarlo con un mensaje claro y sin modificar los datos locales.
- **FR-021**: Los textos del flujo de Google y de la copia manual DEBEN estar en español de España, con lenguaje sencillo y sin jerga técnica (por ejemplo, sin "token", "OAuth" ni "credenciales"). La opción avanzada de GitHub conserva su terminología actual (FR-017), ya que es para quien conoce GitHub.
- **FR-022**: Conectar la cuenta y completar la primera sincronización DEBE poder hacerse sin ayuda y con un número reducido de pasos, y cada acción (conectar, sincronizar, desconectar, exportar, importar) DEBE dar una confirmación o un error visible y contextual.
- **FR-023**: Las pantallas y controles nuevos o modificados DEBEN cumplir los requisitos de experiencia de usuario, accesibilidad (WCAG 2.1 AA), responsive y Angular Material definidos en la especificación 001 y en los estándares de UI/UX del proyecto, incluidas áreas táctiles de al menos 48 × 48 px en móvil.
- **FR-024**: La aplicación DEBE informar en la pantalla de sincronización, en lenguaje sencillo, de que Google puede mostrar avisos de seguridad mientras la aplicación no esté verificada, indicando cómo continuar (por ejemplo, pulsando «Configuración avanzada» y después «Ir a la aplicación»; los nombres exactos de los botones de Google se confirman durante la validación técnica y en el prototipo de Storybook).

### Key Entities *(include if feature involves data)*

- **Conexión de sincronización**: una por método (Google y GitHub). Cada una representa si está conectada o sin configurar, la cuenta identificada (en Google), el estado de su autorización y su propia referencia de última sincronización. Pueden estar guardadas las dos a la vez; solo una es el **método activo** (o ninguna) y esa es la que usa "Sincronizar ahora". Las conexiones nunca se incluyen en los datos sincronizados ni en las copias manuales.
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
- **SC-010**: Con GitHub y Google guardados, la persona cambia de método activo con una sola acción y sin introducir ningún dato de acceso, en el 100% de las pruebas; y tras conectar Google, el 100% de los datos de acceso de GitHub previamente guardados siguen disponibles.
- **SC-011**: Al alternar entre métodos ya usados, no aparece ningún falso conflicto cuando no ha habido cambios en el destino ni en el dispositivo desde la última sincronización con ese mismo destino (0 conflictos erróneos en las pruebas).
- **SC-012**: Al entrar en la aplicación con un método activo se inicia una sincronización después de cargar los datos locales; sin método activo no se inicia. Si hay conflicto, no se escriben ni descargan datos ni se muestra la pantalla de resolución; un fallo de red tampoco impide acceder a la aplicación ni altera los datos locales.

## Assumptions

- **Usuarios objetivo**: personas sin conocimientos técnicos que ya disponen de una cuenta de Google (o la crean ellas mismas fuera de la aplicación). La creación de la cuenta de Google queda fuera del alcance.
- **Sin backend**: la sincronización se realiza íntegramente desde el navegador, sin servidor propio, de acuerdo con la constitución del proyecto.
- **Registro de la aplicación**: el propietario del producto registra una única vez la aplicación en el proveedor para poder ofrecer el acceso con Google; ese registro no es un secreto ni tiene que hacerlo ninguna persona usuaria. Mientras la aplicación no esté publicada y verificada, solo podrán conectar las cuentas autorizadas por el propietario o aparecerán avisos de seguridad.
- **Un único proveedor nuevo**: el alcance incluye solo Google. La arquitectura deberá poder incorporar otros proveedores en el futuro, pero otros destinos quedan fuera de esta feature.
- **Datos por persona**: cada cuenta contiene un único conjunto de datos de una sola persona; no se contempla compartirlos ni varios perfiles dentro de una misma cuenta.
- **Varios usuarios en un dispositivo compartido**: fuera de alcance; cada navegador conserva los datos locales de una única persona.
- **Sin migración automática entre destinos**: la aplicación no copia datos de GitHub a Google ni viceversa por sí sola; la persona activa el otro método y elige qué datos conservar en la primera sincronización con él.
- **Qué activa un método**: conectar un método por primera vez (alta o reconexión) lo convierte en el método activo y se avisa de ello; editar la configuración de GitHub ya guardada no cambia el método activo. Cambiar entre métodos ya guardados se hace solo con "Usar este método".
- **Credenciales de GitHub guardadas junto a Google**: se mantiene lo aceptado en la especificación 001 (token guardado sin cifrar en el almacenamiento local del navegador, un único usuario por navegador). La sesión de Google sigue sujeta a caducidad (FR-013), por lo que "estar conectado a Google" significa tener la cuenta vinculada y visible, aunque pueda pedirse una reconexión breve al sincronizar.
- **Sincronización al iniciar**: además de mantener "Sincronizar ahora" sin cambios, se inicia un intento de sincronización al entrar cuando hay un método activo. El intento se realiza después de cargar los datos locales; los errores se muestran sin bloquear el uso local y, si se detecta un conflicto, se omite la sincronización silenciosamente sin modificar datos ni abrir la pantalla de resolución.
- **Conexión de la sesión**: la sesión con Google puede caducar; la recuperación puede requerir una interacción breve de la persona (ver FR-013). Los detalles de renovación se decidieron en el plan.
- **Detección de cambios remotos (FR-009)**: la comprobación de versión antes de escribir es el mecanismo previsto; si el servicio no admite escritura condicional queda una ventana muy breve, aceptada por tratarse de una cuenta de una sola persona (ver `research.md`, sección 4, y la verificación V3).
- **Disponibilidad**: la sincronización requiere conexión a internet; el resto de la aplicación no.
- **Tamaño de datos**: se mantiene el límite de 5 MB por imagen de la especificación 001.
- **Gobernanza (resuelta)**: la constitución v2.5.0 permite Google como destino de sincronización y una copia manual portable (ZIP con documentos JSON), además de GitHub, siempre sin backend, con un único destino **activo** y sin secretos de cliente en el código. Guardar a la vez las conexiones de ambos métodos es coherente con ese texto, porque solo uno sincroniza a la vez; cualquier destino adicional exigiría una nueva enmienda.
- **Dependencia de especificación 001**: se reutilizan sin cambios las reglas de decisión de sincronización, el contenido sincronizado, la pantalla "Sincronización" y los estándares de experiencia de usuario de [la especificación 001](../001-gestion-ejercicios-fisicos/spec.md); al planificar se actualizarán las secciones afectadas de `research.md` y de los contratos de sincronización.

## Historial de cambios

- **2026-10-30**: ampliación dentro del mismo ámbito (Living Spec, sin feature nueva). Se añade el intento de sincronización al entrar cuando existe un método activo, manteniendo intacta la acción manual "Sincronizar ahora". Los errores de inicio no bloquean la aplicación y los conflictos se omiten sin mostrar la pantalla de resolución ni modificar datos. Modifica: decisión de producto, historia de usuario 2, FR-006, SC-012 y supuestos.
- **2026-10-27**: ampliación dentro del mismo ámbito (Living Spec, sin feature nueva). Se permite tener guardadas a la vez la conexión de Google y los datos de acceso de GitHub, con un único método activo y cambio con una acción. Modifica: Decisiones de producto, historia 3 (escenarios 4 y 5), nueva historia 5, casos límite de cambio de método, FR-011, FR-012, FR-016, FR-017, nuevos FR-025 a FR-027, entidad Conexión de sincronización, SC-010 y SC-011, y supuestos. Los documentos plan.md, data-model.md, contracts/, quickstart.md y 	asks.md quedan pendientes de actualizar con /speckit-plan y /speckit-tasks.
