## Estrategia de persistencia de especificaciones

El proyecto utiliza el modelo Living Spec.

- El archivo spec.md de cada ámbito funcional representa el comportamiento vigente.
- Los cambios y ampliaciones dentro del mismo ámbito deben actualizar la especificación existente.
- No debe crearse una nueva feature para correcciones o ampliaciones menores de una funcionalidad existente.
- Se utilizará /speckit.specify únicamente para capacidades funcionales con un objetivo, alcance y pruebas independiente.
- Las especificaciones sustituidas se archivarán y no se consideraran requisitos vigentes.
- El código no sustituye a la intención funcional expresada en spec.md.

## Instrucciones

Aplica a todas las features las instrucciones que contenga la carpeta `.github/instructions` si es posible.

## Decisiones comunes entre specs

- Todos los specs, plan y tasks deben usar los prerequisitos técnicos indicados en el documento `specs/001-gestion-ejercicios-fisicos/research.md`
- Actualizar este documento con las decisiones de diseño transversales encontrados en las feature, referenciando la feature donde se tomó la decisión.