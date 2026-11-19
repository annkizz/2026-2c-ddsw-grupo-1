import { createTheme } from '@mui/material';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { createElement } from 'react';

// Arma el tema MUI desde los tokens del modo activo.
// La paleta usa los hex (MUI los necesita para calcular estados);
// los overrides usan var(--token) para compartir la misma fuente que el CSS propio.
const v = (nombre) => `var(--${nombre})`;

const anilloFoco = {
  outline: `${v('focus-ring-width')} solid ${v('color-focus')}`,
  outlineOffset: v('focus-ring-offset')
};

const icono = (Componente) => createElement(Componente, { 'aria-hidden': true, focusable: 'false' });

export const crearTema = (tokens) => {
  const token = (nombre) => tokens[`--${nombre}`];

  const theme = createTheme({
    breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
    spacing: Number.parseFloat(token('space-1')),
    shape: { borderRadius: Number.parseFloat(token('radius-md')) },
    palette: {
      mode: 'light',
      primary: {
        main: token('color-primary'),
        dark: token('color-primary-hover'),
        light: token('color-primary-tint-strong'),
        contrastText: token('color-on-primary')
      },
      secondary: {
        main: token('color-secondary'),
        dark: token('color-secondary-hover'),
        light: token('color-secondary-tint'),
        contrastText: token('color-on-secondary')
      },
      success: {
        main: token('color-success'),
        light: token('color-success-tint'),
        dark: token('color-success'),
        contrastText: token('color-on-success')
      },
      error: {
        main: token('color-error'),
        light: token('color-error-tint'),
        dark: token('color-error-hover'),
        contrastText: token('color-on-error')
      },
      warning: {
        main: token('color-warning'),
        light: token('color-warning-tint'),
        dark: token('color-warning'),
        contrastText: token('color-on-warning')
      },
      info: {
        main: token('color-info'),
        light: token('color-info-tint'),
        dark: token('color-info'),
        contrastText: token('color-on-info')
      },
      text: {
        primary: token('color-text'),
        secondary: token('color-muted'),
        disabled: token('color-text-disabled')
      },
      background: { default: token('color-background'), paper: token('color-surface') },
      divider: token('color-border-subtle')
    },
    typography: {
      fontFamily: token('font-family-body'),
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      h1: {
        fontSize: v('font-size-h1'),
        fontWeight: v('font-weight-bold'),
        lineHeight: v('line-height-heading'),
        letterSpacing: v('letter-spacing-heading')
      },
      h2: { fontSize: v('font-size-h2'), fontWeight: v('font-weight-bold'), lineHeight: v('line-height-heading') },
      h3: { fontSize: v('font-size-h3'), fontWeight: v('font-weight-bold'), lineHeight: v('line-height-heading') },
      h4: { fontSize: v('font-size-body'), fontWeight: v('font-weight-bold'), lineHeight: v('line-height-heading') },
      h5: { fontSize: v('font-size-body'), fontWeight: v('font-weight-bold'), lineHeight: v('line-height-heading') },
      h6: { fontSize: v('font-size-body'), fontWeight: v('font-weight-bold'), lineHeight: v('line-height-heading') },
      subtitle1: { fontSize: v('font-size-body'), lineHeight: v('line-height-body'), color: v('color-muted') },
      subtitle2: { fontSize: v('font-size-secundario'), fontWeight: v('font-weight-medium'), lineHeight: v('line-height-body') },
      body1: { fontSize: v('font-size-body'), lineHeight: v('line-height-body') },
      body2: { fontSize: v('font-size-secundario'), lineHeight: v('line-height-body') },
      caption: { fontSize: v('font-size-caption'), lineHeight: v('line-height-body') },
      overline: { fontSize: v('font-size-caption'), fontWeight: v('font-weight-medium'), letterSpacing: 0, textTransform: 'none' },
      button: { fontSize: v('font-size-body'), fontWeight: v('font-weight-medium'), textTransform: 'none', lineHeight: v('line-height-body') }
    },
    components: {
      MuiButtonBase: {
        defaultProps: { disableRipple: true },
        styleOverrides: { root: { '&.Mui-focusVisible': anilloFoco } }
      },
      MuiButton: {
        defaultProps: { disableElevation: true, loadingPosition: 'start' },
        styleOverrides: {
          root: {
            minHeight: v('control-min-height'),
            minWidth: v('control-min-height'),
            borderRadius: v('radius-md'),
            paddingInline: v('space-2'),
            paddingBlock: v('space-1'),
            gap: v('space-1'),
            fontWeight: v('font-weight-medium'),
            textTransform: 'none',
            boxShadow: 'none',
            transition: `background-color ${v('transition-fast')} ${v('transition-easing')}, border-color ${v('transition-fast')} ${v('transition-easing')}, color ${v('transition-fast')} ${v('transition-easing')}`,
            '&:hover, &:active': { boxShadow: 'none' },
            '&.Mui-disabled': { color: v('color-text-disabled') },
            '& .MuiButton-startIcon, & .MuiButton-endIcon': { margin: 0 },
            '& .MuiButton-loadingIndicator': { position: 'static', left: 'auto', margin: 0 },
            '& .MuiButton-loadingIndicatorStart': { position: 'static', left: 'auto' }
          },
          sizeSmall: { minHeight: v('control-min-height'), fontSize: v('font-size-body') },
          sizeLarge: { minHeight: v('field-min-height'), paddingInline: v('space-3') },
          contained: {
            '&.Mui-disabled': { backgroundColor: v('color-disabled-background'), color: v('color-text-disabled') }
          },
          outlined: {
            borderWidth: v('border-width'),
            '&.Mui-disabled': { borderColor: v('color-border-subtle') }
          },
          text: {
            paddingInline: v('space-1'),
            '&:hover': { textDecoration: 'underline', textUnderlineOffset: v('underline-offset'), backgroundColor: 'transparent' }
          }
        },
        variants: [
          {
            props: { variant: 'contained', color: 'primary' },
            style: {
              backgroundColor: v('color-primary'),
              color: v('color-on-primary'),
              '&:hover, &:active': { backgroundColor: v('color-primary-hover') }
            }
          },
          {
            props: { variant: 'contained', color: 'secondary' },
            style: {
              backgroundColor: v('color-secondary'),
              color: v('color-on-secondary'),
              '&:hover, &:active': { backgroundColor: v('color-secondary-hover') }
            }
          },
          {
            props: { variant: 'contained', color: 'error' },
            style: {
              backgroundColor: v('color-error'),
              color: v('color-on-error'),
              '&:hover, &:active': { backgroundColor: v('color-error-hover') }
            }
          },
          {
            props: { variant: 'outlined', color: 'primary' },
            style: {
              borderColor: v('color-primary'),
              color: v('color-primary'),
              backgroundColor: v('color-surface'),
              '&:hover': { borderColor: v('color-primary-hover'), backgroundColor: v('color-primary-tint') },
              '&:active': { backgroundColor: v('color-primary-tint'), borderColor: v('color-primary-hover'), color: v('color-primary-hover') }
            }
          },
          {
            props: { variant: 'outlined', color: 'error' },
            style: {
              borderColor: v('color-error'),
              color: v('color-error'),
              backgroundColor: v('color-surface'),
              '&:hover': { backgroundColor: v('color-error-tint') }
            }
          },
          {
            props: { variant: 'text', color: 'primary' },
            style: { color: v('color-primary'), '&:active': { color: v('color-primary-hover') } }
          },
          {
            props: { variant: 'text', color: 'error' },
            style: { color: v('color-error') }
          }
        ]
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            width: v('control-min-height'),
            height: v('control-min-height'),
            borderRadius: v('radius-md'),
            color: v('color-primary'),
            fontSize: v('icon-size-md'),
            '&:hover': { backgroundColor: v('color-primary-tint') }
          }
        }
      },
      MuiLink: {
        defaultProps: { underline: 'always' },
        styleOverrides: {
          root: {
            color: v('color-primary'),
            textUnderlineOffset: v('underline-offset'),
            '&:hover': { textDecorationThickness: v('border-width-strong') }
          }
        }
      },
      MuiTextField: { defaultProps: { variant: 'outlined' } },
      MuiFormControl: {
        styleOverrides: { root: { gap: 0 } }
      },
      MuiInputLabel: {
        defaultProps: { shrink: true },
        styleOverrides: {
          root: {
            position: 'relative',
            transform: 'none',
            maxWidth: '100%',
            whiteSpace: 'normal',
            marginBottom: v('space-1'),
            color: v('color-text'),
            fontSize: v('font-size-body'),
            fontWeight: v('font-weight-medium'),
            lineHeight: v('line-height-body'),
            '&.Mui-focused': { color: v('color-text') },
            '&.Mui-error': { color: v('color-text') },
            '&.Mui-disabled': { color: v('color-muted') },
            '&.MuiInputLabel-shrink': { transform: 'none' },
            '& .MuiFormLabel-asterisk': { display: 'none' }
          }
        }
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            color: v('color-text'),
            fontWeight: v('font-weight-medium'),
            fontSize: v('font-size-body'),
            '&.Mui-focused': { color: v('color-text') },
            '& .MuiFormLabel-asterisk': { display: 'none' }
          }
        }
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontSize: v('font-size-body'),
            lineHeight: v('line-height-body'),
            color: v('color-text')
          },
          input: {
            '&::placeholder': { color: v('color-text-subtle'), opacity: 1 }
          }
        }
      },
      MuiOutlinedInput: {
        defaultProps: { notched: false },
        styleOverrides: {
          root: {
            minHeight: v('field-min-height'),
            borderRadius: v('radius-md'),
            backgroundColor: v('color-surface'),
            '& .MuiOutlinedInput-notchedOutline': {
              top: 0,
              borderColor: v('color-border'),
              borderWidth: v('border-width'),
              '& legend': { display: 'none' }
            },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: v('color-text') },
            '&.Mui-focused': anilloFoco,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: v('color-primary'),
              borderWidth: v('border-width-strong')
            },
            '&.Mui-error .MuiOutlinedInput-notchedOutline': {
              borderColor: v('color-error'),
              borderWidth: v('border-width-strong')
            },
            '&.Mui-disabled': { backgroundColor: v('color-background') },
            '&.MuiInputBase-multiline': { padding: 0, alignItems: 'flex-start' }
          },
          input: {
            boxSizing: 'border-box',
            padding: `${v('space-1')} ${v('space-2')}`,
            minHeight: v('field-min-height'),
            '&:-webkit-autofill': { borderRadius: 'inherit' }
          },
          inputMultiline: {
            padding: v('space-2'),
            minHeight: v('textarea-min-height')
          },
          adornedStart: { paddingLeft: v('space-2') },
          adornedEnd: { paddingRight: v('space-2') }
        }
      },
      MuiInputAdornment: {
        styleOverrides: { root: { color: v('color-muted'), fontSize: v('icon-size-md') } }
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box',
            minHeight: v('field-min-height'),
            paddingTop: v('space-1'),
            paddingBottom: v('space-1'),
            paddingLeft: v('space-2'),
            '&.MuiSelect-select': { paddingRight: v('space-5') }
          },
          icon: { color: v('color-muted'), right: v('space-1') }
        }
      },
      MuiAutocomplete: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              paddingTop: v('space-1'),
              paddingBottom: v('space-1'),
              paddingLeft: v('space-2'),
              gap: v('space-1')
            },
            '& .MuiOutlinedInput-root .MuiAutocomplete-input': { padding: 0, minHeight: 'auto' }
          },
          paper: { border: `${v('border-width')} solid ${v('color-border-subtle')}`, boxShadow: v('shadow-md') },
          option: { minHeight: v('control-min-height') },
          noOptions: { color: v('color-muted') },
          loading: { color: v('color-muted') }
        }
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: v('space-1'),
            margin: `${v('space-1')} 0 0`,
            color: v('color-muted'),
            fontSize: v('font-size-secundario'),
            lineHeight: v('line-height-body'),
            '&.Mui-error': { color: v('color-error'), fontWeight: v('font-weight-medium') },
            '& svg': { flex: '0 0 auto', marginTop: v('focus-ring-width'), fontSize: v('icon-size-sm') }
          }
        }
      },
      MuiFormControlLabel: {
        styleOverrides: {
          root: { minHeight: v('control-min-height'), marginLeft: 0, gap: v('space-1') },
          label: { fontSize: v('font-size-body') }
        }
      },
      MuiCheckbox: {
        styleOverrides: { root: { padding: v('space-1'), color: v('color-border'), '&.Mui-checked': { color: v('color-primary') } } }
      },
      MuiSwitch: {
        styleOverrides: {
          root: { '& .MuiSwitch-switchBase.Mui-focusVisible + .MuiSwitch-track': anilloFoco },
          track: { backgroundColor: v('color-border'), opacity: 1 },
          switchBase: {
            '&.Mui-checked + .MuiSwitch-track': { backgroundColor: v('color-primary'), opacity: 1 },
            '&.Mui-checked': { color: v('color-surface') }
          }
        }
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            minHeight: v('control-min-height'),
            fontSize: v('font-size-body'),
            '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: v('color-primary-tint-strong') },
            '&:hover': { backgroundColor: v('color-primary-tint') },
            '&.Mui-focusVisible': { backgroundColor: v('color-primary-tint'), ...anilloFoco, outlineOffset: `calc(-1 * ${v('focus-ring-width')})` }
          }
        }
      },
      MuiPaper: {
        styleOverrides: { rounded: { borderRadius: v('radius-lg') } }
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: v('radius-lg'),
            border: `${v('border-width')} solid ${v('color-border-subtle')}`,
            backgroundColor: v('color-surface'),
            boxShadow: v('shadow-sm')
          }
        }
      },
      MuiCardContent: {
        styleOverrides: { root: { padding: v('space-3'), '&:last-child': { paddingBottom: v('space-3') } } }
      },
      MuiCardActionArea: {
        styleOverrides: { root: { '&.Mui-focusVisible': { ...anilloFoco, outlineOffset: `calc(-1 * ${v('focus-ring-width')})` } } }
      },
      MuiAlert: {
        defaultProps: {
          variant: 'standard',
          iconMapping: {
            success: icono(FiCheckCircle),
            error: icono(FiAlertCircle),
            warning: icono(FiAlertTriangle),
            info: icono(FiInfo)
          }
        },
        styleOverrides: {
          root: {
            alignItems: 'flex-start',
            gap: v('space-1'),
            borderRadius: v('radius-md'),
            border: `${v('border-width')} solid`,
            padding: `${v('space-2')} ${v('space-2')}`,
            fontSize: v('font-size-body'),
            lineHeight: v('line-height-body'),
            color: v('color-text')
          },
          icon: { padding: 0, marginRight: 0, fontSize: v('icon-size-lg'), opacity: 1 },
          message: { padding: 0, minWidth: 0, flex: 1 },
          action: { padding: 0, marginRight: 0, alignItems: 'center', gap: v('space-1') },
          standardSuccess: {
            backgroundColor: v('color-success-tint'),
            borderColor: v('color-success'),
            '& .MuiAlert-icon, & .MuiAlertTitle-root': { color: v('color-success') }
          },
          standardError: {
            backgroundColor: v('color-error-tint'),
            borderColor: v('color-error'),
            '& .MuiAlert-icon, & .MuiAlertTitle-root': { color: v('color-error') }
          },
          standardWarning: {
            backgroundColor: v('color-warning-tint'),
            borderColor: v('color-warning'),
            '& .MuiAlert-icon, & .MuiAlertTitle-root': { color: v('color-warning') }
          },
          standardInfo: {
            backgroundColor: v('color-info-tint'),
            borderColor: v('color-info'),
            '& .MuiAlert-icon, & .MuiAlertTitle-root': { color: v('color-info') }
          }
        }
      },
      MuiAlertTitle: {
        styleOverrides: {
          root: { margin: 0, fontSize: v('font-size-body'), fontWeight: v('font-weight-bold'), lineHeight: v('line-height-body') }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            height: 'auto',
            minHeight: v('space-4'),
            borderRadius: v('radius-pill'),
            fontSize: v('font-size-secundario'),
            fontWeight: v('font-weight-medium'),
            border: `${v('border-width')} solid ${v('color-border-subtle')}`,
            backgroundColor: v('color-surface'),
            color: v('color-text'),
            gap: 0
          },
          label: { paddingInline: v('space-1'), whiteSpace: 'normal' },
          icon: { marginLeft: v('space-1'), marginRight: 0, color: 'inherit', fontSize: v('icon-size-sm') },
          clickable: {
            minHeight: v('control-min-height'),
            '&:hover': { backgroundColor: v('color-primary-tint') }
          },
          deleteIcon: { color: v('color-muted'), fontSize: v('icon-size-md'), '&:hover': { color: v('color-text') } },
          colorPrimary: {
            backgroundColor: v('color-primary-tint'),
            borderColor: v('color-primary'),
            color: v('color-text')
          },
          colorSuccess: { backgroundColor: v('color-success-tint'), borderColor: v('color-success'), color: v('color-text') },
          colorError: { backgroundColor: v('color-error-tint'), borderColor: v('color-error'), color: v('color-text') },
          colorWarning: { backgroundColor: v('color-warning-tint'), borderColor: v('color-warning'), color: v('color-text') },
          colorInfo: { backgroundColor: v('color-info-tint'), borderColor: v('color-info'), color: v('color-text') },
          colorSecondary: { backgroundColor: v('color-secondary-tint'), borderColor: v('color-secondary'), color: v('color-text') }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: v('radius-lg'),
            boxShadow: v('shadow-lg')
          },
          paperFullScreen: { borderRadius: 0 }
        }
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            padding: `${v('space-3')} ${v('space-3')} ${v('space-1')}`,
            fontSize: v('font-size-h2'),
            fontWeight: v('font-weight-bold'),
            lineHeight: v('line-height-heading')
          }
        }
      },
      MuiDialogContent: {
        styleOverrides: { root: { padding: `${v('space-1')} ${v('space-3')} ${v('space-2')}` } }
      },
      MuiDialogContentText: {
        styleOverrides: { root: { color: v('color-muted'), fontSize: v('font-size-body') } }
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: `${v('space-2')} ${v('space-3')} ${v('space-3')}`,
            gap: v('space-1'),
            '& > :not(style) ~ :not(style)': { marginLeft: 0 }
          }
        }
      },
      MuiBackdrop: {
        styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: v('color-overlay') } } }
      },
      MuiDrawer: {
        styleOverrides: { paper: { backgroundColor: v('color-surface') } }
      },
      MuiSnackbar: {
        defaultProps: { anchorOrigin: { vertical: 'bottom', horizontal: 'center' } }
      },
      MuiSkeleton: {
        defaultProps: { animation: 'wave' },
        styleOverrides: {
          root: { backgroundColor: v('color-skeleton') },
          rounded: { borderRadius: v('radius-md') },
          text: { borderRadius: v('radius-sm') }
        }
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { height: v('progress-height'), borderRadius: v('radius-pill'), backgroundColor: v('color-primary-tint-strong') },
          bar: { borderRadius: v('radius-pill'), backgroundColor: v('color-primary') }
        }
      },
      MuiCircularProgress: { defaultProps: { color: 'inherit', size: v('icon-size-md') } },
      MuiTabs: {
        styleOverrides: { indicator: { height: v('border-width-strong'), backgroundColor: v('color-primary') } }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: v('control-min-height'),
            textTransform: 'none',
            fontSize: v('font-size-body'),
            fontWeight: v('font-weight-medium'),
            color: v('color-muted'),
            '&.Mui-selected': { color: v('color-primary') }
          }
        }
      },
      MuiBreadcrumbs: {
        styleOverrides: {
          root: { fontSize: v('font-size-secundario'), color: v('color-muted') },
          li: { display: 'inline-flex', alignItems: 'center' }
        }
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { fontSize: v('font-size-secundario'), backgroundColor: v('color-text') } }
      },
      MuiTypography: {
        defaultProps: {
          variantMapping: { subtitle1: 'p', subtitle2: 'p' }
        }
      }
    }
  });

  // Ajustes responsive que dependen de los breakpoints del propio tema.
  const abajoSm = theme.breakpoints.down('sm');
  theme.typography.h1 = {
    ...theme.typography.h1,
    [abajoSm]: { fontSize: v('font-size-h1-movil') }
  };
  theme.components.MuiDialogActions.styleOverrides.root[abajoSm] = {
    flexDirection: 'column-reverse',
    alignItems: 'stretch',
    '& > *': { width: '100%' }
  };

  return theme;
};

export default crearTema;
