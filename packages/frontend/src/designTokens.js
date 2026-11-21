// Única fuente de verdad del sistema visual.
// Los valores se inyectan como variables CSS en :root (GlobalStyles en App.jsx)
// y el tema MUI se arma con los mismos valores (theme/crearTema.js).
//
// Paleta: azul (primario) + naranja (complementario). Es el par que recomiendan las guías de
// diseño para daltonismo (Okabe & Ito, "Color Universal Design"; Datawrapper; data.europa.eu):
// se distingue con protanopia, deuteranopia y tritanopia, así que no hace falta un "modo daltónico".
// Igual, el color NUNCA es la única señal (WCAG 1.4.1): estados con ícono + texto,
// enlaces subrayados, foco con anillo, sección actual con barra, errores con ícono.
// Contrastes (WCAG 2.x, sobre blanco): primario 6.7:1, complementario 5.4:1, texto 15:1,
// texto secundario 7.5:1, borde de controles 4.8:1.

const colores = {
  // Neutros
  '--color-background': '#F6F7FB',
  '--color-surface': '#FFFFFF',
  '--color-surface-alt': '#EEF1F7',
  '--color-text': '#172033',
  '--color-muted': '#4A5568',
  '--color-text-subtle': '#4A5568',
  '--color-text-disabled': '#6B7280',
  '--color-border': '#6B7280',
  '--color-border-subtle': '#DDE2EC',
  '--color-disabled-background': '#E5E7EB',

  // Superficie de marca (header, portada): azul noche
  '--color-brand': '#0B2545',
  '--color-brand-2': '#13315C',
  '--color-on-brand': '#FFFFFF',
  '--color-on-brand-muted': '#C7D3E6',

  // Primario: azul (acciones, enlaces, foco)
  '--color-primary': '#0B5CAD',
  '--color-primary-hover': '#084A8C',
  '--color-primary-tint': '#EAF2FB',
  '--color-primary-tint-strong': '#CFE2F6',
  '--color-on-primary': '#FFFFFF',

  // Complementario: naranja (CTA principal, sección activa, insignias, destacados)
  '--color-secondary': '#B54708',
  '--color-secondary-hover': '#93370D',
  '--color-secondary-tint': '#FFF1E6',
  '--color-secondary-tint-strong': '#FFD8B5',
  '--color-on-secondary': '#FFFFFF',
  // Naranja claro de relleno: siempre con texto oscuro (7.6:1) o sobre azul noche (7.2:1)
  '--color-accent': '#F59E0B',
  '--color-on-accent': '#172033',

  // Semánticos (siempre con ícono + texto)
  '--color-success': '#146C43',
  '--color-success-tint': '#ECF8F1',
  '--color-on-success': '#FFFFFF',
  '--color-error': '#B42318',
  '--color-error-hover': '#912018',
  '--color-error-tint': '#FEF0EE',
  '--color-on-error': '#FFFFFF',
  '--color-warning': '#8A4B00',
  '--color-warning-tint': '#FFF6E0',
  '--color-on-warning': '#FFFFFF',
  '--color-info': '#0B5CAD',
  '--color-info-tint': '#EAF2FB',
  '--color-on-info': '#FFFFFF',

  // Foco
  '--color-focus': '#0B5CAD',
  '--color-focus-on-dark': '#F59E0B',

  // Mapa coroplético (escala secuencial de un tono: se lee por claridad, no por matiz)
  '--color-map-empty': '#E5E7EB',
  '--color-map-1': '#EAF2FB',
  '--color-map-2': '#B7D3EC',
  '--color-map-3': '#74A9D8',
  '--color-map-4': '#2F78BA',
  '--color-map-5': '#0B4A86',
  '--color-map-stroke': '#6B7280',

  // Esqueletos de carga y velos
  '--color-skeleton': '#E5E7EB',
  '--color-overlay': 'rgba(11, 37, 69, 0.55)'
};

const resto = {
  // Tipografía: títulos con personalidad, cuerpo legible
  '--font-family-body': "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  '--font-family-heading': "'Space Grotesk', 'Inter', system-ui, sans-serif",
  '--font-weight-regular': '400',
  '--font-weight-medium': '600',
  '--font-weight-bold': '700',
  '--font-size-xs': '13px',
  '--font-size-sm': '14px',
  '--font-size-md': '16px',
  '--font-size-lg': '20px',
  '--font-size-xl': '24px',
  '--font-size-2xl': '34px',
  '--font-size-2xl-movil': '28px',
  // Escala semántica
  '--font-size-h1': 'var(--font-size-2xl)',
  '--font-size-h1-movil': 'var(--font-size-2xl-movil)',
  '--font-size-h2': 'var(--font-size-xl)',
  '--font-size-h3': 'var(--font-size-lg)',
  '--font-size-body': 'var(--font-size-md)',
  '--font-size-secundario': 'var(--font-size-sm)',
  '--font-size-caption': 'var(--font-size-xs)',
  '--line-height-body': '1.55',
  '--line-height-heading': '1.2',
  '--letter-spacing-heading': '-0.02em',

  // Espaciado: múltiplos de 8
  '--space-1': '8px',
  '--space-2': '16px',
  '--space-3': '24px',
  '--space-4': '32px',
  '--space-5': '40px',
  '--space-6': '48px',
  '--space-8': '64px',
  '--space-10': '80px',

  // Tamaños
  '--control-min-height': '44px',
  '--field-min-height': '48px',
  '--textarea-min-height': '120px',
  '--icon-size-sm': '16px',
  '--icon-size-md': '20px',
  '--icon-size-lg': '24px',
  '--icon-size-xl': '48px',
  '--avatar-size': '64px',
  '--icon-alineacion': '2px',
  '--logo-size': '40px',
  '--logo-size-movil': '32px',
  '--progress-height': '10px',
  '--map-max-width': '560px',
  '--layout-max-width': '1240px',
  '--content-max-width': '1120px',
  '--form-max-width': '760px',
  '--reading-max-width': '680px',
  '--dialog-max-width': '600px',
  '--drawer-width': '360px',
  '--card-min-width': '280px',
  '--sidebar-width': '280px',
  '--header-height': '68px',

  // Bordes y radios
  '--border-width': '1px',
  '--border-width-strong': '2px',
  '--focus-ring-width': '3px',
  '--focus-ring-offset': '2px',
  '--underline-offset': '4px',
  '--indicator-height': '4px',
  '--radius-sm': '6px',
  '--radius-md': '10px',
  '--radius-lg': '16px',
  '--radius-pill': '9999px',

  // Sombras
  '--shadow-sm': '0 1px 2px rgba(11, 37, 69, 0.08), 0 1px 3px rgba(11, 37, 69, 0.06)',
  '--shadow-md': '0 6px 16px rgba(11, 37, 69, 0.12)',
  '--shadow-lg': '0 16px 40px rgba(11, 37, 69, 0.18)',

  // Capas
  '--z-sticky': '1100',
  '--z-drawer': '1200',
  '--z-modal': '1300',
  '--z-snackbar': '1400',
  '--z-tooltip': '1500',
  '--z-skip-link': '1600',

  // Movimiento
  '--transition-fast': '160ms',
  '--transition-standard': '220ms',
  '--transition-easing': 'ease',

  // Breakpoints (referencia; en CSS se usan en @media porque var() no se admite ahí)
  '--breakpoint-sm': '600px',
  '--breakpoint-md': '900px',
  '--breakpoint-lg': '1200px',
  '--breakpoint-xl': '1536px'
};

export const tokensBase = { ...colores, ...resto };

export default tokensBase;
