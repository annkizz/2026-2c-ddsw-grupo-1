// Destinos de navegación de la interfaz (no son rutas nuevas: usan rutas existentes).
export const RUTA_AYUDA = "/#como-funciona";
export const ID_AYUDA = "como-funciona";

// Lleva a la sección de ayuda de Inicio (también cuando ya estás en Inicio: pushState no dispara scroll).
export const irAAyuda = () => {
  window.setTimeout(() => {
    const seccion = document.getElementById(ID_AYUDA);
    seccion?.scrollIntoView?.({ block: "start" });
    seccion?.focus?.({ preventScroll: true });
  }, 0);
};
