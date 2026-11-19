// Única fuente de verdad del sistema visual.
// - tokensBase: modo normal (todos los tokens).
// - tokensDaltonico: modo daltónico, solo sobrescribe colores.
// Los valores se inyectan como variables CSS en :root (GlobalStyles en App.jsx)
// y el tema MUI se arma con los mismos valores (theme/crearTema.js).
// Contrastes y ΔE validados con scripts/validar_paletas.py (ver CAMBIOS-UI.md).

const coloresBase = {
  // Neutros (60 %)
  '--color-background': '#F7F8F5',
  '--color-surface': '#FFFFFF',
  '--color-text': '#1F2937',
  '--color-muted': '#4B5563',
  '--color-text-subtle': '#4B5563',
  '--color-text-disabled': '#6B7280',
  '--color-border': '#6B7280',
  '--color-border-subtle': '#E5E7EB',
  '--color-disabled-background': '#E5E7EB',

  // Primario (30 %)
  '--color-primary': '#0F766E',
  '--color-primary-hover': '#115E59',
  '--color-primary-tint': '#F0FDFA',
  '--color-primary-tint-strong': '#CCFBF1',
  '--color-on-primary': '#FFFFFF',

  // Acento (10 %, solo CTA puntuales)
  '--color-secondary': '#C2410C',
  '--color-secondary-hover': '#9A3412',
  '--color-secondary-tint': '#FFF7ED',
  '--color-on-secondary': '#FFFFFF',

  // Semánticos (siempre con ícono + texto)
  '--color-success': '#166534',
  '--color-success-tint': '#F0FDF4',
  '--color-on-success': '#FFFFFF',
  '--color-error': '#9F1239',
  '--color-error-hover': '#881337',
  '--color-error-tint': '#FFF1F2',
  '--color-on-error': '#FFFFFF',
  '--color-warning': '#92400E',
  '--color-warning-tint': '#FEF3C7',
  '--color-on-warning': '#FFFFFF',
  '--color-info': '#0369A1',
  '--color-info-tint': '#F0F9FF',
  '--color-on-info': '#FFFFFF',

  // Foco
  '--color-focus': '#0F766E',
  '--color-focus-on-dark': '#FFFFFF',

  // Mapa coroplético (escala secuencial de un tono)
  '--color-map-empty': '#E5E7EB',
  '--color-map-1': '#F0FDFA',
  '--color-map-2': '#99F6E4',
  '--color-map-3': '#2DD4BF',
  '--color-map-4': '#0D9488',
  '--color-map-5': '#115E59',
  '--color-map-stroke': '#6B7280',

  // Esqueletos de carga y velos
  '--color-skeleton': '#E5E7EB',
  '--color-overlay': 'rgba(31, 41, 55, 0.5)'
};

const coloresDaltonico = {
  '--color-primary': '#0072B2',
  '--color-primary-hover': '#005A8C',
  '--color-primary-tint': '#EAF3F9',
  '--color-primary-tint-strong': '#CFE3F2',

  '--color-secondary': '#9E0E94',
  '--color-secondary-hover': '#7A0B72',
  '--color-secondary-tint': '#FBEAF9',

  '--color-success': '#0B7686',
  '--color-success-tint': '#F0F8F9',
  '--color-error': '#861427',
  '--color-error-hover': '#6B0F1F',
  '--color-error-tint': '#FBEAEC',
  '--color-warning': '#816403',
  '--color-warning-tint': '#FAF3D9',
  '--color-info': '#013C9A',
  '--color-info-tint': '#E8EEF9',

  '--color-focus': '#0072B2',

  '--color-map-1': '#EAF3F9',
  '--color-map-2': '#B7D3EC',
  '--color-map-3': '#74A9D8',
  '--color-map-4': '#2F78BA',
  '--color-map-5': '#0B4A86'
};

const resto = {
  // Tipografía: una familia, tres pesos
  '--font-family-body': "'DM Sans', system-ui, sans-serif",
  '--font-family-heading': 'var(--font-family-body)',
  '--font-weight-regular': '400',
  '--font-weight-medium': '500',
  '--font-weight-bold': '700',
  '--font-size-xs': '12px',
  '--font-size-sm': '14px',
  '--font-size-md': '16px',
  '--font-size-lg': '20px',
  '--font-size-xl': '24px',
  '--font-size-2xl': '32px',
  '--font-size-2xl-movil': '28px',
  // Escala semántica
  '--font-size-h1': 'var(--font-size-2xl)',
  '--font-size-h1-movil': 'var(--font-size-2xl-movil)',
  '--font-size-h2': 'var(--font-size-xl)',
  '--font-size-h3': 'var(--font-size-lg)',
  '--font-size-body': 'var(--font-size-md)',
  '--font-size-secundario': 'var(--font-size-sm)',
  '--font-size-caption': 'var(--font-size-xs)',
  '--line-height-body': '1.5',
  '--line-height-heading': '1.25',
  '--letter-spacing-heading': '-0.01em',

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
  // Ajuste óptico: alinea íconos de 16px con la primera línea de texto (no es espaciado).
  '--icon-alineacion': '2px',
  '--logo-size': '40px',
  '--logo-size-movil': '32px',
  '--progress-height': '8px',
  '--map-max-width': '560px',
  '--layout-max-width': '1280px',
  '--content-max-width': '1120px',
  '--form-max-width': '720px',
  '--reading-max-width': '640px',
  '--dialog-max-width': '560px',
  '--drawer-width': '360px',
  '--card-min-width': '280px',
  '--sidebar-width': '320px',

  // Bordes y radios
  '--border-width': '1px',
  '--border-width-strong': '2px',
  '--focus-ring-width': '2px',
  '--focus-ring-offset': '2px',
  '--underline-offset': '4px',
  '--radius-sm': '4px',
  '--radius-md': '8px',
  '--radius-lg': '12px',
  '--radius-pill': '9999px',

  // Sombras
  '--shadow-sm': '0 1px 3px rgba(31, 41, 55, 0.12)',
  '--shadow-md': '0 4px 12px rgba(31, 41, 55, 0.16)',
  '--shadow-lg': '0 12px 32px rgba(31, 41, 55, 0.2)',

  // Capas
  '--z-sticky': '1100',
  '--z-drawer': '1200',
  '--z-modal': '1300',
  '--z-snackbar': '1400',
  '--z-tooltip': '1500',
  '--z-skip-link': '1600',

  // Movimiento
  '--transition-fast': '180ms',
  '--transition-standard': '220ms',
  '--transition-easing': 'ease',

  // Breakpoints (referencia; en CSS se usan en @media porque var() no se admite ahí)
  '--breakpoint-sm': '600px',
  '--breakpoint-md': '900px',
  '--breakpoint-lg': '1200px',
  '--breakpoint-xl': '1536px'
};

export const tokensBase = { ...coloresBase, ...resto };

// Solo colores: el resto se hereda de tokensBase.
export const tokensDaltonico = coloresDaltonico;

export const tokensDelModo = (modo) =>
  modo === 'daltonico' ? { ...tokensBase, ...tokensDaltonico } : tokensBase;

export default tokensBase;
