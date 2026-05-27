# Evaluación Heurística: Módulo ObservationsView

## Contexto
El módulo `ObservationsView` es utilizado por los moderadores/observadores durante las pruebas de usabilidad en vivo. Dado que la captura de datos ocurre en tiempo real, el sistema debe minimizar la carga cognitiva del observador, maximizando la eficiencia y eficacia del registro, cumpliendo así con la norma ISO 9241-11.

## Evaluación según Principios de Nielsen y Criterios WCAG

### 1. Flexibilidad y eficiencia de uso (Heurística #7 de Nielsen) - **CRÍTICO**
- **Problema Actual:** El registro de observaciones requiere múltiples interacciones con el mouse (clics en comboboxes para Éxito, Severidad, Perfil, etc.). Durante una sesión en vivo, apartar la vista del participante para buscar en la pantalla y hacer clic en un dropdown rompe el flujo del observador y causa pérdida de información valiosa.
- **Propuesta de Mejora:** 
  - Implementar **atajos de teclado** globales dentro de la vista (ej. `Alt + N` para agregar una nueva observación rápidamente).
  - Permitir navegación completa y fluida por teclado (Tab) entre campos sin que el layout rompa el orden natural del DOM.
- **Justificación ISO 9241-11:** 
  - **Eficiencia:** Al permitir que el observador realice las tareas usando atajos de teclado sin depender del mouse, se reduce drásticamente el tiempo y el esfuerzo físico requeridos. El sistema permite alcanzar el objetivo utilizando menos recursos (tiempo de captura).
  - **Eficacia:** Al no desviar la mirada del participante hacia los controles del ratón, el moderador logra registrar de forma completa y exacta los problemas sin omitir detalles.

### 2. Visibilidad del estado del sistema (Heurística #1 de Nielsen) y Prevención de Errores (Heurística #5)
- **Problema Actual:** El sistema utiliza autoguardado (`onBlur`), lo cual es bueno, pero la retroalimentación visual suele ser global o mínima. Si el autoguardado falla (ej. pérdida de conexión), el observador podría no darse cuenta inmediatamente.
- **Propuesta de Mejora:**
  - Mejorar el feedback visual de guardado *específico por fila o tarjeta* (ej. un micro-feedback que indique "Guardado" al lado del campo modificado).
  - Añadir advertencia de "Cambios sin guardar" si el usuario intenta abandonar la página mientras hay una petición pendiente.
- **Justificación ISO 9241-11:**
  - **Eficacia:** Se evita la pérdida accidental de datos. El usuario tiene la certeza de que su registro fue completado exitosamente en la base de datos (exactitud y plenitud de los objetivos alcanzados).
  - **Satisfacción:** Minimiza la frustración y la ansiedad ("¿Se guardó lo que acabo de escribir?"). Una retroalimentación clara genera confianza y confort en el uso del sistema.

### 3. Accesibilidad y Diseño Visual (WCAG 2.1 y Heurística #8)
- **Problema Actual:** Hay un uso intensivo de colores para denotar Severidad y Éxito. Esto puede ser un problema para usuarios con daltonismo (WCAG 1.4.1 Uso del color) si el contraste no es alto. Además, el anillo de foco (`focus-visible`) es muy tenue (`ring-navy/20`), dificultando saber dónde está el cursor al navegar con Tabulador.
- **Propuesta de Mejora:** 
  - Ajustar y verificar el contraste de los badges para cumplir con WCAG AA (Contraste mínimo de 4.5:1).
  - Asegurar que el indicador de foco (`focus-visible`) tenga un color de alto contraste.
- **Justificación ISO 9241-11:** 
  - **Eficiencia:** Un foco de alto contraste permite al usuario localizar rápidamente dónde está posicionado su teclado, evitando errores y acelerando la navegación.
  - **Satisfacción:** Garantiza que los usuarios (con o sin discapacidades visuales o fatiga) se sientan cómodos trabajando en un entorno inclusivo, mitigando el cansancio visual derivado de leer textos de bajo contraste en tiempos prolongados.

---
**Conclusión:** 
La prioridad para el rediseño y prototipado será la **Eficiencia de uso** y la **Accesibilidad por teclado**. El objetivo es que el observador pueda mantener los ojos en el usuario y sus manos en el teclado, justificando de manera integral la aplicación de la norma ISO 9241-11 (Eficacia, Eficiencia y Satisfacción) en este módulo crítico.