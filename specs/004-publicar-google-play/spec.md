# Feature Specification: Publicar la aplicación en Google Play


**Feature Branch**: `main` (rama actual; no hay un hook de creación de rama configurado)

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "quiero publicar esta web en Google Play Store. Para ello usa TWA con bubblewrap y lo que sea necesario. La idea es que el apk me abra el navegador chrome pero sin pestañas y eso"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir la aplicación desde Android sin barras del navegador (Priority: P1)

Como persona usuaria de Android, quiero instalar la aplicación y abrirla desde su icono, para utilizar mis ejercicios sin escribir una dirección web ni ver pestañas o la barra de direcciones.

**Why this priority**: Es el resultado principal solicitado y puede comprobarse antes de publicar en la tienda.

**Independent Test**: Instalar la versión de prueba en un teléfono con Chrome compatible, abrir su icono y recorrer Hoy, Buscar y una ficha de ejercicio, comprobando que no aparecen controles del navegador.

**Acceptance Scenarios**:

1. **Given** un teléfono con Chrome compatible, conexión y la relación entre la web y la aplicación verificada, **When** la persona abre el icono instalado, **Then** accede a la pantalla de inicio vigente de la web sin barra de direcciones ni selector de pestañas.
2. **Given** la aplicación abierta en esas condiciones, **When** la persona navega por Hoy, Buscar y la ficha de un ejercicio, **Then** permanece en la aplicación, sin controles del navegador y con la navegación vigente accesible.
3. **Given** una ficha abierta desde Buscar, **When** la persona pulsa Atrás de Android, **Then** vuelve a la pantalla anterior; al agotar el historial interno puede salir sin quedar atrapada.
4. **Given** un enlace a contenido ajeno a la aplicación, **When** la persona decide abrirlo, **Then** puede consultarlo en el navegador o aplicación correspondiente y regresar sin perder los datos guardados; no se exige ocultar los controles del navegador fuera de la web verificada.

---

### User Story 2 - Distribuir una versión comprobada desde Google Play (Priority: P1)

Como propietario, quiero disponer de una versión instalable de prueba y de una entrega preparada para Google Play, con instrucciones de publicación y actualización, para distribuir la misma aplicación web sin mantener otro producto.

**Why this priority**: La experiencia sin barras no basta si no puede distribuirse por el canal solicitado.

**Independent Test**: Una persona invitada al canal de pruebas de Google Play instala la entrega, comprueba su nombre e icono y abre la aplicación. Esta prueba no depende de aprobar la publicación en producción.

**Acceptance Scenarios**:

1. **Given** los materiales de entrega y una cuenta de desarrollador habilitada del propietario, **When** este sigue la guía de publicación, **Then** puede presentar la entrega a un canal de pruebas y consultar los pasos pendientes o los motivos de rechazo, sin darla por publicada antes de tiempo.
2. **Given** una instalación obtenida desde el canal de pruebas de Google Play, **When** la persona abre el icono, **Then** obtiene la misma experiencia sin barras de la historia 1; no basta con que funcione únicamente la instalación de prueba fuera de la tienda.
3. **Given** una versión instalada con un ejercicio propio guardado, **When** la persona actualiza a la siguiente entrega del mismo canal, **Then** conserva el ejercicio y sigue accediendo a la misma aplicación.
4. **Given** que faltan accesos, declaraciones o aprobaciones externas, **When** el propietario revisa la guía y el estado de entrega, **Then** identifica lo pendiente y quién debe completarlo; la aprobación de Google no se presenta como un resultado garantizado.

---

### User Story 3 - Conservar los flujos y los datos de la web (Priority: P2)

Como persona usuaria, quiero gestionar mis ejercicios y utilizar las opciones de copia y sincronización existentes desde la aplicación instalada, para no perder capacidades ni depender de una cuenta nueva.

**Why this priority**: El nuevo canal de distribución no debe convertir la aplicación en una versión limitada ni alterar la privacidad de los datos.

**Independent Test**: Con una instalación de prueba, crear un ejercicio sin conectar ninguna cuenta, cerrar y volver a abrir la aplicación, exportar una copia e importarla en un entorno de prueba. Comprobar también los flujos de sincronización ya especificados con las cuentas de prueba correspondientes.

**Acceptance Scenarios**:

1. **Given** una instalación sin cuentas conectadas, **When** la persona crea un ejercicio y vuelve a abrir la aplicación tras cerrarla, **Then** el ejercicio permanece disponible sin exigir un registro.
2. **Given** datos locales, **When** la persona exporta una copia y la importa en un entorno de prueba, **Then** recupera los mismos datos y medios conforme a las reglas vigentes.
3. **Given** una conexión de Google o GitHub configurada conforme a la especificación vigente, **When** la persona autoriza el acceso, vuelve a la aplicación y sincroniza, **Then** ve el resultado o un error comprensible, sin quedar atrapada fuera de la aplicación.
4. **Given** un cambio a otra dirección web o a otro navegador que no conserva los datos anteriores, **When** la persona sigue las instrucciones de traslado, **Then** puede recuperar los datos con los mecanismos existentes; no se promete un traslado automático ni se elimina el almacenamiento anterior.

---

### User Story 4 - Entender las limitaciones de acceso y privacidad (Priority: P2)

Como persona usuaria, quiero saber cuándo no puede abrirse la aplicación y qué ocurre con mis datos, para poder recuperarme de un problema sin confundirlo con una pérdida de información.

**Why this priority**: La apertura depende de servicios y componentes del dispositivo y no debe ocultar sus limitaciones.

**Independent Test**: Consultar la información pública de privacidad y comprobar la apertura en un teléfono sin conexión y en otro sin navegador compatible.

**Acceptance Scenarios**:

1. **Given** que el teléfono no tiene conexión y no dispone de una copia utilizable de la aplicación, **When** la persona abre el icono, **Then** ve una indicación de que no se ha podido cargar y puede volver a intentarlo al recuperar la conexión, sin borrar datos guardados.
2. **Given** que no puede verificarse la web o no hay un navegador compatible disponible, **When** la persona abre la aplicación, **Then** se permite una apertura con controles visibles o se informa de la imposibilidad y de la acción necesaria; nunca se presenta ese caso como una verificación correcta.
3. **Given** la ficha de la tienda o la aplicación abierta, **When** la persona accede a la información de privacidad, **Then** puede leer en español dónde se conservan sus datos, qué envíos realiza cada función existente, cómo retirar accesos y cómo eliminar los datos.

### Edge Cases

- La web está publicada en una subruta y el propietario no puede verificar el dominio: la distribución sin barras queda bloqueada hasta resolver ese acceso; publicar un archivo solo dentro de la subruta no se considera suficiente.
- La versión instalada desde Google Play tiene una identidad de firma distinta de la prueba local: ambas entregas deben comprobarse por separado.
- Chrome no está instalado, está deshabilitado o no es el navegador predeterminado: no se presupone que Android siempre elegirá Chrome; el objetivo sin barras se verifica con Chrome compatible y se documentan las alternativas del dispositivo.
- Una redirección lleva a otro dominio, se abre el acceso de Google o se consulta un vídeo externo: los controles de seguridad del navegador pueden aparecer fuera del ámbito verificado.
- La primera apertura se realiza sin conexión, la web está caída o una actualización web no termina de cargarse: no se promete una primera ejecución sin red ni se añaden garantías nuevas de disponibilidad sin conexión.
- Borrar los datos del navegador, cambiar de origen o desinstalar componentes puede afectar al almacenamiento: no se promete conservarlo en esos casos y se remite a las copias existentes.
- Una nueva versión web debe seguir funcionando en la instalación Android anterior mientras no cambien sus requisitos de compatibilidad; los cambios de identidad o dirección requieren un plan de transición.
- La instalación debe respetar las zonas del sistema, el teclado y el tamaño de texto: ningún control esencial puede quedar oculto por la navegación de Android.
- Un requisito de la tienda cambia antes del envío: se revalida la entrega; ni un paquete generado ni una prueba local equivalen a aprobación de publicación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La aplicación DEBE poder instalarse en Android con nombre e icono propios y abrir desde ese icono la misma web de producción, en su pantalla de inicio vigente (historia 1).
- **FR-002**: Con Chrome compatible y la web verificada, la apertura y la navegación interna DEBEN realizarse sin barra de direcciones ni selector de pestañas. No se exige ocultar las barras de estado y navegación de Android (historia 1, escenarios 1–2).
- **FR-003**: La navegación interna, Atrás de Android y los enlaces externos DEBEN comportarse conforme a la historia 1, escenarios 2–4, sin encerrar a la persona ni presentar contenido ajeno como propio.
- **FR-004**: La entrega DEBE incluir una versión instalable para pruebas directas y otra apta para presentar a Google Play, con identidad estable y versiones diferenciadas para permitir actualizaciones (historia 2).
- **FR-005**: La experiencia sin barras DEBE validarse tanto en la instalación directa como en una instalación distribuida por un canal de pruebas de Google Play (historia 2, escenario 2).
- **FR-006**: La entrega DEBE incluir instrucciones en español para preparar el entorno, obtener ambas entregas, instalarlas, comprobarlas, enviarlas a revisión y publicar actualizaciones; DEBE separar los pasos realizables en el proyecto de las acciones del propietario y las decisiones de Google (historia 2, escenarios 1 y 4).
- **FR-007**: El propietario DEBE disponer de una relación de los materiales y declaraciones exigibles en la fecha del envío: identidad, iconos, capturas, descripción en español, contacto, privacidad, seguridad de los datos, público objetivo, clasificación de contenido y requisitos de pruebas y compatibilidad aplicables. Lo no completado DEBE figurar como pendiente, nunca como aprobado (historia 2).
- **FR-008**: Las actualizaciones del paquete DEBEN conservar los datos guardados cuando se mantienen el origen web y el navegador que los almacena; las actualizaciones de la web DEBEN reflejarse sin reinstalar el paquete, tras recargar con conexión y una vez disponible la versión publicada (historias 2–3).
- **FR-009**: La distribución Android DEBE preservar los flujos vigentes de ejercicios, planificación, progreso, medios, catálogo común, copia manual y sincronización opcional con Google y GitHub, sin añadir un registro obligatorio (historia 3).
- **FR-010**: La distribución NO DEBE introducir un almacenamiento privado alternativo, un nuevo destino de sincronización, un servidor propio, publicidad, analítica ni permisos ajenos a las capacidades especificadas. La información pública de privacidad DEBE describir los tratamientos reales, incluidos los servicios externos existentes (historias 3–4).
- **FR-011**: La información de privacidad DEBE ser accesible desde la ficha de Google Play y desde la aplicación, sin exigir identificación, con el contenido verificable de la historia 4, escenario 3.
- **FR-012**: Ante una carga fallida o un entorno incompatible, la persona DEBE recibir una indicación comprensible y una vía de recuperación; se admiten los avisos del navegador o del sistema. No se DEBEN borrar datos ni comunicar éxito cuando la apertura sin barras no está disponible (historia 4).
- **FR-013**: La guía DEBE advertir de que cambiar de dirección o de navegador no garantiza compartir los datos locales y DEBE explicar el traslado con copia manual o sincronización ya existentes antes de cualquier cambio de dirección (historia 3, escenario 4).
- **FR-014**: Las credenciales de publicación y los elementos privados que permiten firmar entregas NO DEBEN incluirse en el código público ni en el sitio web. La guía DEBE explicar su custodia, copia de seguridad y uso para actualizar la misma aplicación (historia 2).
- **FR-015**: La experiencia instalada DEBE conservar el español de España, la accesibilidad y la adaptación a móvil y tablet, sin controles esenciales tapados por elementos de Android ni desplazamiento horizontal de la estructura de pantalla (historias 1 y 3).
- **FR-016**: La preparación de la entrega DEBE registrar como bloqueos la falta de control sobre la dirección pública o de verificación de las identidades de prueba y de tienda. Esos bloqueos DEBEN resolverse antes de declarar cumplido FR-005 (historias 1–2 y casos límite).

### Key Entities *(include if feature involves data)*

- **Identidad de la aplicación distribuida**: nombre, icono, identificador estable, dirección web de producción y propietario responsable.
- **Entrega Android**: versión distribuible de esa identidad, canal de prueba o publicación, información pública de verificación y estado de validación.
- **Materiales de publicación**: ficha en español, imágenes, contacto, información de privacidad y declaraciones requeridas por la tienda; cada elemento tiene un estado completo o pendiente.
- No se añaden entidades de negocio ni un almacenamiento nuevo para ejercicios, cuentas o progreso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En un móvil y una tablet compatibles con conexión, tanto la instalación directa como la obtenida desde Google Play permiten abrir desde el icono y completar Hoy → Buscar → ficha → Atrás en el 100 % de los cuatro recorridos, sin barra de direcciones ni pestañas visibles.
- **SC-002**: En móvil y tablet, una persona puede crear un ejercicio sin cuenta, cerrar y reabrir la aplicación y actualizarla una vez desde el mismo canal, conservando el ejercicio en el 100 % de los casos comprobados.
- **SC-003**: El propietario completa desde la aplicación instalada los tres recorridos existentes de copia o sincronización (copia manual, Google y GitHub) con cuentas de prueba cuando proceda, recupera los datos esperados y puede regresar a la aplicación tras la autorización.
- **SC-004**: En los dos casos de fallo ensayados (sin red ni copia utilizable, y sin navegador compatible), el 100 % de las aperturas muestran una indicación visible del problema y permiten salir o recuperarse; al restablecer las condiciones, los datos previamente guardados siguen disponibles.
- **SC-005**: Una persona sin conocimientos técnicos puede abrir la información de privacidad desde la aplicación y desde su ficha de tienda en un máximo de dos acciones desde cada punto de entrada, sin identificarse.
- **SC-006**: Tras publicar una modificación visible de contenido de la web y recargar con conexión, el propietario la observa en una instalación Android ya existente sin reinstalarla y conserva un ejercicio propio guardado.

## Assumptions

- **Capacidad independiente**: esta feature añade distribución Android, con objetivo y pruebas propios. Las especificaciones vigentes [001](../001-gestion-ejercicios-fisicos/spec.md), [002](../002-sincronizacion-google-drive/spec.md) y [003](../003-importar-exportar-ejercicios/spec.md) siguen siendo la fuente del comportamiento funcional; no se sustituyen ni se duplican sus reglas.
- **Restricción técnica solicitada**: se utilizará TWA con Bubblewrap. Los detalles de implementación pertenecen al plan y a la investigación; no se plantea una reescritura nativa. Chrome es el navegador de referencia para la aceptación, pero el dispositivo puede seleccionar otro navegador compatible.
- **Formatos de entrega**: se entiende APK para instalación directa y Android App Bundle (AAB) para presentar una aplicación nueva a Google Play. Generar los archivos no equivale a publicarlos ni a superar una revisión.
- **Alojamiento y prerrequisitos**: la web permanece exclusivamente en GitHub Pages, sin backend propio, conforme a la [constitución](../../.specify/memory/constitution.md). El plan reutilizará los prerrequisitos de la [investigación transversal](../001-gestion-ejercicios-fisicos/research.md).
- **Control de la dirección pública**: el despliegue actual bajo una subruta no demuestra acceso a la raíz del dominio. Antes de distribuir se comprobará la posibilidad de servir la acreditación pública en esa raíz; si no existe acceso, el propietario deberá autorizar una solución compatible con GitHub Pages. No se presupone la compra de un dominio ni un traslado automático de datos.
- **Responsabilidades externas**: el propietario aporta la cuenta de desarrollador, acepta los términos, cubre los costes externos que procedan y confirma identidad, contacto, público y declaraciones. Los requisitos vigentes se comprobarán al planificar y antes del envío; no se fija de antemano una versión mínima de Android ni un número universal de personas de prueba.
- **Publicación**: se incluye preparar y comprobar la distribución en un canal de pruebas y documentar el paso a producción. La publicación efectiva requiere las acciones y aprobaciones externas indicadas; no se realizarán pagos ni se aceptarán declaraciones en nombre del propietario.
- **Conectividad**: no se añade un modo sin conexión completo ni sincronización automática avanzada. Se preserva el comportamiento local existente una vez cargada la web, sin garantizar una primera apertura o una recarga sin red.
- **Límites de persistencia**: no se garantiza traslado automático entre orígenes, navegadores o dispositivos, ni recuperación tras borrar el almacenamiento. No se incorpora un procedimiento de migración distinto de las copias y sincronización existentes.
- **Presentación**: no se rediseñan las pantallas de ejercicios ni la navegación. Cualquier pantalla nueva de privacidad o cambio sustancial de presentación que determine el plan requerirá prototipo y aprobación mediante el procedimiento de Storybook antes de implementarse.
- **Fuera de alcance**: iOS y otras tiendas, nuevas funciones de entrenamiento, notificaciones, pagos, anuncios, analítica, autenticación nativa y publicación automática en producción sin intervención del propietario.
