# Cambios del frontend (devolución de la corrección)

Solo se tocó `packages/frontend`. El backend quedó igual.

## Qué se cambió

| Pedido | Qué se hizo |
| --- | --- |
| Frontend desde cero (base) | Nueva base visual en `designTokens.js`: azul (primario) + naranja (complementario), header azul noche con franja naranja, tipografías Inter + Space Grotesk, tarjetas y portada nuevas. Todo sale de los tokens, así que se cambia en un solo lugar. |
| Color complementario | El naranja se usa en las acciones principales (Ingresar, Publicar proyecto, Postularme, Crear proyecto, Administrar), la pestaña activa, la sección activa del header, las insignias y los destacados. |
| Sin botón de modo daltónico | Se eliminaron `BotonModoDaltonico` y `ModoColorContext`. La paleta única ya se distingue con daltonismo (ver abajo). |
| Daltonismo: "no es solo color" | Azul + naranja (par seguro para protanopia, deuteranopia y tritanopia). Además, el color nunca es la única señal: estados con ícono + texto, habilidades con ✓/✕ + "Cumple"/"Falta", sección actual con barra + negrita, enlaces subrayados, foco con anillo de 3 px, notificaciones nuevas con la etiqueta "Nueva", mapa por claridad (un solo tono) y con números. |
| Inicio y "Código a Voluntad" redundantes | Se sacó el botón "Inicio": el logo es el único acceso al inicio. |
| Salir / Mi perfil en un menú | Menú de usuario (avatar + nombre + rol) con Mi perfil, Notificaciones, Ayuda y Salir. En móvil, todo va en el menú lateral. |
| "No autorizado" → 4xx | Página `PaginaError` con el código grande ("Error 403", "Error 404"). Las alertas de error muestran el código HTTP, por ejemplo "(Error 403)". |
| Pantalla de proyecto muy larga | `DetalleProyecto` ahora tiene pestañas: Resumen · Perfiles · Postulaciones · Equipo · Logros (las de gestión solo para el colectivo dueño). Las acciones de administración van en el botón "Administrar". |
| Otras páginas largas | Mi perfil: una sección a la vez con panel lateral (también para colectivos). Buscar proyectos: filtros en un panel lateral. |
| Formulario largo y difícil | Crear proyecto en 3 pasos (Lo básico → Etiquetas y ubicación → Fechas y búsqueda). Solo el primero es obligatorio. Al editar, se puede saltar a cualquier paso y guardar desde cualquiera. |
| Postulación: habilidades que cumple | La colaboradora ve en cada perfil y al postularse cuáles tiene y cuáles le faltan. El colectivo ve en cada postulación las habilidades del perfil y, al aceptarla, cuáles cumple la persona. |
| Símbolo de notificación | La campana muestra un número con las notificaciones sin ver; al abrir la bandeja vuelve a 0 y las nuevas quedan marcadas. |
| Medio de contacto confuso | Texto más grande, explicación de para qué sirve, cada medio numerado ("Medio de contacto 1") y "Tipo de medio" en vez de "Tipo". |
| Login → inicio | Después de iniciar sesión o terminar el registro se va al Inicio, no a Mi perfil. |
| "Tus datos bajo tu control" y texto innecesario | Eliminado, junto con subtítulos que repetían el título. |

## Pendiente: necesita cambios en el backend

- **Descripción al postularse.** `crearPostulacionSchema` es `.strict()` y solo acepta `esAnonima`, así que un campo `mensaje` da 400. Hay que agregarlo al schema y al modelo.
- **Habilidades de una postulación pendiente.** El DTO de una postulación pendiente no trae la persona (`colaborador` aparece recién al aceptar), así que el front no puede comparar sus habilidades antes de aceptar. Una opción es agregar `habilidades` al DTO sin datos personales.
- **Marcar notificaciones como leídas.** No hay un endpoint para hacerlo. El contador se resuelve en el front: guarda en `localStorage` el total visto por usuario. Con un `PATCH /notificaciones/:id/leida` se podría usar el campo `leida`.

## Fuentes sobre daltonismo

- W3C, Understanding WCAG 1.4.1 Use of Color: https://www.w3.org/WAI/WCAG21/Understanding/use-of-color
- MDN, Use of color: https://developer.mozilla.org/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Use_of_color
- Okabe & Ito, Color Universal Design: https://jfly.uni-koeln.de/color/
- Datawrapper, What to consider when visualizing data for colorblind readers: https://www.datawrapper.de/blog/colorblindness-part2
- data.europa.eu, Accessible colour palettes: https://data.europa.eu/apps/data-visualisation-guide/accessible-colour-palettes
- Smashing Magazine, Designing for colorblindness: https://smashingmagazine.com/2024/02/designing-for-colorblindness
