# Historias de Usuario: Mejoras UX en ObservationsView

Este documento define el flujo de implementación para las mejoras de usabilidad identificadas, enfocadas en la norma ISO 9241-11 (Eficiencia, Eficacia, Satisfacción) y los lineamientos de accesibilidad WCAG.

## Épica: Optimización del Registro de Observaciones en Vivo

### US-01: Atajos de teclado para captura rápida (Eficiencia ISO 9241-11)
**Como** observador de una prueba de usabilidad,
**Quiero** utilizar atajos de teclado para crear nuevas observaciones,
**Para** no tener que usar el mouse y poder mantener mi atención constante en el participante.

**Criterios de Aceptación:**
- Presionar `Alt + N` (o `Ctrl + Espacio`) estando en la vista `ObservationsView` añade instantáneamente una nueva fila o tarjeta de observación.
- Al crear la nueva observación, el foco del teclado (Focus) se coloca automáticamente en el primer campo disponible (ej. "Participante" o "Tarea") listo para escribir.

### US-02: Retroalimentación visual de autoguardado (Prevención de Errores)
**Como** observador,
**Quiero** tener confirmación visual clara en el elemento que acabo de editar de que se ha guardado,
**Para** estar tranquilo de que no perderé datos durante el transcurso de la sesión.

**Criterios de Aceptación:**
- Al perder el foco (`onBlur`) de un campo y ejecutarse el autoguardado con éxito, debe mostrarse un micro-feedback visual temporal (ej. un borde verde sutil que se desvanece o un pequeño check de confirmación) en la fila específica.

### US-03: Navegación accesible y mejora de contraste (WCAG 2.1 AA)
**Como** usuario con requerimientos de accesibilidad visual o motriz,
**Quiero** poder distinguir claramente dónde está mi cursor y leer los textos sin esfuerzo,
**Para** poder navegar la tabla o las tarjetas usando exclusivamente mi teclado.

**Criterios de Aceptación:**
- El anillo de enfoque (`focus-visible`) de todos los inputs y selects debe ser cambiado de colores sutiles a un contorno de alto contraste (mínimo 3:1 de ratio según WCAG 1.4.11).
- Los colores de los badges de severidad y éxito deben ser evaluados en contraste y ajustados si no cumplen el ratio de 4.5:1 para el texto interior.

---

## Flujo de Implementación Propuesto (Sprint Backlog para este entregable)

1. **Fase de Prototipado (HTML/Figma):**
   - Bocetar el comportamiento del Focus de alto contraste.
   - Diseñar la interacción del micro-feedback de guardado por fila.
2. **Fase de Implementación Técnica:**
   - **Tarea 1:** Desarrollar hook `useKeyboardShortcuts` para escuchar el evento `Alt + N` global en la ventana y llamar a la función `onAdd`.
   - **Tarea 2:** Integrar atributo `autoFocus` o un `useRef` que enfoque el primer input al agregar un elemento nuevo al array de `data`.
   - **Tarea 3:** Actualizar clases de Tailwind CSS en `ObservationRow.tsx` y `ObservationCard.tsx` para modificar el `focus-visible:ring-*` y mejorar el contraste visual de los badges.
3. **Fase de Validación:**
   - Realizar una prueba simulada con un usuario (usando un temp-email). Pedirle que registre 3 observaciones sin tocar el mouse, midiendo el tiempo que le toma vs la versión anterior.
