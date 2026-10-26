# Estándares de UI/UX

La aplicación debe tener una apariencia lista para producción.

## Estilo de diseño

- SaaS empresarial moderno.
- Nivel de calidad similar a Microsoft 365, Linear, Stripe Dashboard, GitHub y Notion.
- Limpio, minimalista y profesional.
- Seguir patrones de interfaz de usuario ampliamente establecidos.

## Experiencia de Usuario

- Priorizar la eficiencia sobre los efectos visuales.
- Reducir el número de clics siempre que sea posible.
- La información importante debe ser visible sin necesidad de hacer scroll.
- Proporcionar una retroalimentación visual clara.
- Evitar el uso excesivo de ventanas modales.

## Diseño Visual

- Utilizar un sistema de espaciado basado en múltiplos de 8 px.
- Mantener espacios en blanco adecuados.
- Definir una jerarquía tipográfica clara.
- Maximizar la legibilidad.
- Utilizar una paleta de colores profesional.
- Aplicar los principios de Material Design cuando sea apropiado.

## Diseño Responsive

- Enfoque Mobile First.
- Controles optimizados para pantallas táctiles.
- Diseños adaptativos.

### Móvil

- Preferiblemente diseños de una sola columna.
- Controles optimizados para interacción táctil.

### Tablet

- Diseños adaptativos.

### Escritorio

- Optimizar la densidad de información mostrada.

## Formularios

- Mostrar los errores de validación cerca del campo correspondiente.
- Utilizar validación en línea siempre que sea posible.
- Indicar claramente los campos obligatorios.
- Minimizar el esfuerzo requerido para introducir datos.

## Implementación

- Priorizar el uso de componentes Angular Material.
- Utilizar componentes reutilizables.
- Evitar crear componentes personalizados cuando exista una alternativa equivalente en Angular Material.
- Tener un espaciado mínimo entre botones.

## Prototipo y aprobación en Storybook

Aplica a los cambios grandes de presentación: pantalla o flujo nuevo, rediseño de una pantalla existente o cambio sustancial de estructura visual o navegación. No aplica a ajustes pequeños de espaciado, color, texto, accesibilidad ni a correcciones puntuales que no alteren la estructura o el flujo.

### Responsable

El agente `ux-ui-expert` (`.github/agents/ux-ui-expert.agent.md`) es el responsable de crear las historias de Storybook, presentarlas al propietario y pedir su aprobación. Debe trabajar a partir del diseño SDD de la feature en curso (carpeta indicada en `.specify/feature.json`) y de estas normas:

- `spec.md`: historias de usuario, escenarios de aceptación, requisitos funcionales y casos límite que determinan las pantallas y sus estados.
- `plan.md`, `research.md` y `contracts/` (en especial `contracts/interfaz-usuario.md` si existe): decisiones de diseño y contratos de interfaz. Las decisiones transversales están en `specs/001-gestion-ejercicios-fisicos/research.md`.
- `data-model.md`: datos y entidades para componer ejemplos realistas.
- `.specify/memory/constitution.md`: principios obligatorios (español de España, verificabilidad por una persona no técnica, experiencia multiplataforma y accesible).
- Este documento de estándares de UI/UX.

Las historias no pueden añadir funcionalidad, pantallas o campos que no estén en la especificación aprobada. Si el prototipo requiere algo no especificado, el agente debe proponerlo como enmienda a la spec antes de incluirlo.

### Procedimiento

1. Antes de implementar la presentación, el agente `ux-ui-expert` crea o actualiza las historias de Storybook de las pantallas afectadas a partir del diseño SDD de la feature.
2. El agente arranca Storybook (`npm run storybook`) y presenta el prototipo al propietario, indicando qué historias revisar. Aporta capturas por tamaño de pantalla y las URL de vista previa.
3. El agente pide explícitamente aprobación o que el propietario indique fallos y mejoras. No se empieza la implementación de presentación sin aprobación explícita.
4. Si hay cambios, el agente actualiza las historias y vuelve a pedir aprobación. Se repite hasta obtenerla.
5. Con la aprobación registrada, se implementa la presentación real tomando las historias aprobadas como referencia visual y manteniéndolas actualizadas.

### Contenido mínimo de las historias

- Una historia por pantalla dentro del marco real de la aplicación (menú, márgenes y navegación), con las rutas reales y datos de ejemplo realistas en español de España.
- Los tamaños de referencia: móvil (390 px), tablet (834 px) y escritorio (1280 px).
- Los estados relevantes: con datos, vacío, cargando, error y, cuando exista, conflicto o éxito.
- Componentes de Angular Material y los mismos estilos globales que la aplicación.
- Las historias se guardan en `src/stories/` y deben compilar sin errores (`npm run build-storybook`).