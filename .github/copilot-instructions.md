## Estrategia de persistencia de especificaciones

El proyecto utiliza el modelo Living Spec.

- El archivo spec.md de cada ámbito funcional representa el comportamiento vigente.
- Los cambios y ampliaciones dentro del mismo ámbito deben actualizar la especificación existente.
- No debe crearse una nueva feature para correcciones o ampliaciones menores de una funcionalidad existente.
- Se utilizará /speckit.specify únicamente para capacidades funcionales con un objetivo, alcance y pruebas independiente.
- Las especificaciones sustituidas se archivarán y no se consideraran requisitos vigentes.
- El código no sustituye a la intención funcional expresada en spec.md.