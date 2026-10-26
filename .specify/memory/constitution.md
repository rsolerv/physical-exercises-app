<!--
Sync Impact Report
==================
Version change: 2.3.0 → 2.4.1
Rationale: Se añade un principio obligatorio para que los cambios grandes
de presentación se prototipen y revisen en Storybook antes de implementarlos
(2.4.0, MINOR). La aprobación explícita del propietario actúa como puerta de
calidad; las modificaciones visuales pequeñas quedan excluidas. En 2.4.1
(PATCH) se aclara que el responsable de crear y presentar las historias es el
agente `ux-ui-expert`, sin cambiar el alcance del principio.

Added principles:
- V. Prototipo y aprobación de cambios grandes de presentación.

Modified principles: ninguno
Added sections: ninguna
Removed sections: ninguna

Documentación alineada fuera de la constitución:
- `.github/instructions/ux-ui.instructions.md` (procedimiento y responsable).
- `.specify/templates/tasks-template.md` (bloque de tareas con aprobación).
- `.github/agents/ux-ui-expert.agent.md` (puerta de aprobación y documentos SDD).

TODO(RATIFICATION_DATE): la fecha de adopción original no consta y requiere
confirmación del propietario.
-->

# PhysicalExercises Constitution

## Core Principles

### I. Idioma y Mercado (Español de España)

Todo el producto -interfaz de usuario, textos, mensajes de validación y error,
notificaciones, documentación orientada al usuario y nombres mostrados en
pantalla- DEBE estar redactado en español de España. No se permite contenido
en otros idiomas ni variantes dialectales distintas (por ejemplo, español
latinoamericano) ni anglicismos de interfaz evitables. Los únicos términos en
otro idioma permitidos son identificadores técnicos sin traducción estándar
(nombres de librerías, siglas de estándares, etc.) que no sean visibles para
el usuario final.
**Rationale**: El producto tiene un único mercado objetivo (personas
hispanohablantes de España, sin conocimientos técnicos necesarios); la consistencia
lingüística evita confusión y mantiene coherencia de marca y experiencia.

### II. Cero Alcance Fantasma (NON-NEGOTIABLE)

NO se implementa ninguna funcionalidad, pantalla, campo, regla de negocio o
integración que no esté explícitamente descrita en una spec aprobada. Toda
idea nueva que surja durante el diseño o el desarrollo DEBE proponerse (como
enmienda a la spec existente o como entrada para una nueva spec) antes de
escribir código; nunca se construye directamente a partir de una idea no
documentada. Revisiones de código y pull requests que añadan comportamiento
no especificado DEBEN rechazarse hasta que la spec se actualice.
**Rationale**: Controla el alcance del proyecto, evita deuda técnica y
mantiene la aplicación centrada en su propósito único: gestionar los
ejercicios físicos semanales de una persona.

### III. Verificabilidad por una Persona No Técnica

Cada criterio de éxito (acceptance criteria) de una spec DEBE poder
comprobarse usando la aplicación -navegando, rellenando formularios,
pulsando botones y observando el resultado en pantalla- por una persona sin
conocimientos de programación. Queda prohibido redactar criterios que
requieran leer código fuente, consultar logs, inspeccionar la base de datos
SQLite o el repositorio de GitHub directamente. Un criterio que no se pueda
demostrar así DEBE reescribirse antes de aprobarse.
**Rationale**: Garantiza que las specs están centradas en el usuario final y
permite que el propio dueño del producto valide y acepte el trabajo sin
depender de conocimiento técnico.

### IV. Experiencia de Usuario Multiplataforma y Accesible

La aplicación DEBE funcionar correctamente tanto en escritorio como en
dispositivos móviles. El diseño responsive es obligatorio en todas las
pantallas: ningún layout fijo puede romperse o quedar inutilizable en
tamaños de pantalla reducidos. Toda interfaz DEBE orientarse a usuarios no
técnicos: lenguaje sencillo sin jerga técnica, flujos de alta, modificación
y borrado de ejercicios cortos y claros, y confirmación/feedback visible de
cada acción realizada.
**Rationale**: El usuario final gestiona sus ejercicios de rehabilitación o
entrenamiento desde cualquier dispositivo disponible en el momento, sin
soporte técnico de terceros.

### V. Prototipo y Aprobación de Cambios Grandes de Presentación

Antes de implementar en la aplicación un cambio grande de presentación,
DEBEN prepararse historias navegables en Storybook que reflejen las pantallas,
estados y tamaños de pantalla afectados. El agente `ux-ui-expert` (definido en
`.github/agents/ux-ui-expert.agent.md`) DEBE crear esas historias a partir del
diseño SDD de la feature (spec, plan, research y contratos) y de las normas de
`.github/instructions/ux-ui.instructions.md`, presentar el prototipo al
propietario y pedirle explícitamente aprobación o indicaciones de fallos y
mejoras. No DEBE comenzar la implementación de presentación hasta recibir
aprobación explícita. Si se indican cambios, DEBE actualizarse el prototipo y
solicitarse aprobación de nuevo.

Se consideran cambios grandes la creación de una pantalla o flujo nuevo, el
rediseño de una pantalla existente o un cambio que altere de forma sustancial
la estructura visual o navegación. No requieren esta aprobación los ajustes
pequeños de espaciado, color, texto, accesibilidad ni correcciones puntuales
que no alteren la estructura o el flujo.

**Rationale**: Permite validar la dirección visual con el propietario antes
de invertir en implementación, sin ralentizar correcciones y mejoras menores.

## Arquitectura y Stack Tecnológico

- **Framework de frontend**: Angular 21 o superior, obligatorio.
- **Persistencia**: SQLite WASM ejecutándose íntegramente en el navegador del

  cliente. No se permite ninguna base de datos ni almacenamiento gestionado
  fuera del navegador.
- **Sincronización de datos**: los datos generados por el usuario en SQLite

  DEBEN poder exportarse e importarse en formato JSON, y la aplicación DEBE
  seguir siendo plenamente utilizable sin ninguna cuenta (local-first). Los
  únicos mecanismos permitidos de copia de seguridad y sincronización entre
  dispositivos son:
  - la API de GitHub (repositorio de datos del usuario);
  - el espacio privado de la aplicación en la cuenta de Google de la persona;
  - la copia manual mediante exportación e importación de un fichero JSON.

  Solo PUEDE haber un destino de sincronización activo a la vez. Toda
  comunicación con un proveedor DEBE hacerse directamente desde el navegador,
  sin servidor intermediario. La autorización DEBE usar flujos que no
  requieran secretos de cliente; en el código solo pueden existir
  identificadores públicos de aplicación, nunca secretos. Cada persona
  sincroniza únicamente sus propios datos, sin datos compartidos entre
  personas. Añadir un destino nuevo exige enmendar esta constitución.
- **Despliegue**: la aplicación se publica exclusivamente en GitHub Pages.
- **Backend**: no existe backend ni servidor de aplicación propio; toda la

  lógica de negocio se ejecuta en el navegador.
- **Interfaz gráfica**: Angular Material es la única librería de componentes

  visuales permitida para construir la interfaz de usuario.
- **Arquitectura en capas**: el código DEBE organizarse en las siguientes

  capas, con las dependencias fluyendo siempre hacia el dominio (Presentation
  e Infrastructure dependen de Application/Domain, nunca al revés):
  - **Domain**: entidades, reglas de negocio y casos de uso puros, sin
    dependencias de Angular ni de infraestructura.
  - **Application**: orquestación de casos de uso y puertos (interfaces) de
    entrada/salida hacia infraestructura.
  - **Infrastructure**: implementaciones concretas (acceso a SQLite WASM,
    clientes de los proveedores de sincronización autorizados, adaptadores
    de almacenamiento).
  - **Presentation**: componentes Angular, Angular Material, enrutamiento y
    estado de interfaz de usuario.

## Calidad de Código y Pruebas

- El diseño de clases y módulos DEBE cumplir los principios SOLID.
- No se permite ningún fallo de ESLint de severidad "error" en el código

  integrado; el proyecto DEBE mantenerse en cero errores de lint.
- Las pruebas automatizadas DEBEN escribirse con Vitest.
- La cobertura mínima de pruebas unitarias para todo el proyecto es del 80%.
- La cobertura de pruebas unitarias para los casos de uso de la capa de

  dominio (Domain) es obligatoriamente del 100%.
- Test-first obligatorio: ninguna funcionalidad se implementa sin que exista

  previamente al menos un test que la cubra.

## Governance

Esta constitución prevalece sobre cualquier otra práctica, guía o convención
del proyecto. Toda spec, plan, tarea o pull request DEBE ser coherente con
los principios aquí definidos; en caso de conflicto, prevalece la
constitución.

**Procedimiento de enmienda**: cualquier cambio a esta constitución se
propone mediante el comando `/speckit-constitution`, documentando el motivo
del cambio. La enmienda se considera aprobada cuando el propietario del
repositorio (único usuario del proyecto) la acepta explícitamente.

**Política de versionado**: esta constitución usa versionado semántico
(MAJOR.MINOR.PATCH):
- MAJOR: eliminación o redefinición incompatible de principios existentes.
- MINOR: adición de un nuevo principio o ampliación material de una guía
  existente.
- PATCH: aclaraciones de redacción, correcciones y refinamientos no
  semánticos.

**Revisión de cumplimiento**: toda spec y todo plan generados por los
comandos de Spec Kit DEBEN verificar explícitamente su alineación con estos
principios antes de pasar a la fase de implementación. Cualquier
complejidad añadida a la arquitectura de capas definida DEBE justificarse
por escrito en el plan correspondiente.

**Version**: 2.4.1 | **Last Amended**: 2026-10-26
