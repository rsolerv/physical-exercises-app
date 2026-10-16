# Quickstart: Mejora de la presentación (UI/UX) de la aplicación

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Esta guía permite validar manualmente, navegando la aplicación, que cada historia de usuario del spec se cumple. No requiere leer código, logs ni la base de datos (Principio III de la constitución).

## Prerrequisitos

- Node.js y npm instalados (versión compatible con Angular CLI 22, ver `package.json`).
- Dependencias instaladas: `npm install` (solo la primera vez).

## Puesta en marcha

```powershell
npm start
```

Abre `http://localhost:4200/` en el navegador. Para comprobar el comportamiento responsive, usa las herramientas de desarrollo del navegador (`F12` → icono de dispositivo) o redimensiona la ventana a los tres anchos de referencia: **375 px** (móvil), **768–1024 px** (tablet) y **1366 px o más** (escritorio) — ver [contracts/design-tokens.contract.md](./contracts/design-tokens.contract.md).

## Validación por historia de usuario

### Historia 1 — Biblioteca de ejercicios y categorías (P1)

1. Navega a "Mis ejercicios" desde el menú lateral.
2. **Sin ejercicios** (base de datos recién creada o tras borrar todos): comprueba que aparece un estado vacío con icono, mensaje orientativo y un botón para crear el primer ejercicio (FR-003).
3. **Con ejercicios**: crea 2–3 ejercicios desde "Nuevo ejercicio" y comprueba que el listado los muestra como tarjetas/filas diferenciadas, con nombre y descripción legibles sin desplazamiento horizontal (FR-002).
4. Mientras los datos cargan (recarga la página con la red limitada desde DevTools si quieres forzarlo), comprueba que se ve un indicador de carga centrado y consistente, no una pantalla en blanco (FR-004).
5. Ve a "Gestionar categorías", crea una categoría y elimínala; comprueba que el resultado (éxito o error) se comunica con una señal visual clara (FR-008).
6. Repite los pasos 2–5 en los tres anchos de pantalla de referencia y confirma que nada se solapa ni requiere scroll horizontal (SC-002, SC-005).

### Historia 2 — Formulario de ejercicio (P2)

1. Abre "Nuevo ejercicio".
2. Comprueba que los bloques (datos básicos, categorías, enlaces, imágenes, observaciones) se distinguen visualmente entre sí (FR-005).
3. Comprueba que los campos obligatorios están señalados visualmente antes de intentar guardar (FR-007).
4. Deja el nombre vacío e intenta guardar: el error debe aparecer junto al campo de nombre, con el campo resaltado (FR-006).
5. Completa el formulario correctamente y guarda: debe aparecer una confirmación visual clara (FR-008).
6. Añade un enlace y una imagen por URL; comprueba que cada uno aparece en una lista ordenada con una acción de eliminar fácil de identificar.

### Historia 3 — Navegación general (P3)

1. En ancho de escritorio, comprueba que el menú lateral se ve abierto por defecto y la sección activa se resalta al navegar (FR-012, Acceptance Scenario 4).
2. En ancho móvil, comprueba que el menú se puede abrir/cerrar con el botón de la barra superior, que cubre todo el ancho de la pantalla como una superposición (no una columna estrecha que deje el contenido comprimido), que se cierra automáticamente al tocar cualquier entrada de navegación, y que el botón tiene un tamaño cómodo para el dedo (FR-009, FR-010, FR-011).
3. Navega a "Buscar", "Planificación" y "Sincronización": cada una debe mostrar un mensaje de "próximamente" con el mismo estilo visual que el resto de la aplicación (tipografía, color, espaciado), no texto plano (FR-013).

## Validación de accesibilidad (FR-015, SC-007)

Sigue el checklist completo en [contracts/accesibilidad.contract.md](./contracts/accesibilidad.contract.md). Pasos clave:

1. Sin usar el ratón, navega con `Tab`/`Shift+Tab` por "Mis ejercicios", el formulario de nuevo ejercicio y el menú lateral; confirma que el foco siempre es visible y el orden es lógico.
2. Completa la creación de un ejercicio completo usando solo el teclado (`Tab`, `Espacio`/`Enter` para botones y chips de categoría).
3. Ejecuta el linter para confirmar que no hay infracciones de accesibilidad estática:

   ```powershell
   npm run lint
   ```

## Validación automatizada (sin regresión funcional, SC-006)

```powershell
npm test
```

Todos los specs existentes bajo `tests/component/presentation/` y los nuevos specs de `app-cabecera-pagina`/`app-estado-vacio` deben pasar, y la cobertura global debe mantenerse en 80% o más (umbral ya configurado en `angular.json`).

## Criterio de aceptación global

La feature se considera validada cuando:

- Los pasos de las tres historias de usuario se completan sin encontrar texto plano sin estilo, desplazamiento horizontal inesperado, ni pérdida de ninguna funcionalidad existente.
- El checklist de accesibilidad de `contracts/accesibilidad.contract.md` está completo.
- `npm run lint` y `npm test` terminan sin errores.
