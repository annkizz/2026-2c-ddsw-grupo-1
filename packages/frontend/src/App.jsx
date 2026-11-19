import { createTheme, GlobalStyles, ThemeProvider } from '@mui/material';
import { LogtoProvider } from '@logto/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RESOURCE } from './hooks/useAuth.jsx';
import RequiereAuth from './components/RequiereAuth.jsx';
import RequiereRol from './components/RequiereRol.jsx';
import Callback from './components/Callback.jsx';
import Layout from './features/layout/Layout.jsx';
import Home from './features/home/Home.jsx';
import TipoCuenta from './features/registro/TipoCuenta.jsx';
import DatosColectivo from './features/registro/DatosColectivo.jsx';
import RegistroColaboradora from './features/registro/RegistroColaboradora.jsx';
import ListaProyectos from './features/proyectos/ListaProyectos.jsx';
import DetalleProyecto from './features/proyectos/DetalleProyecto.jsx';
import PerfilColaboradora from './features/colaboradoras/PerfilColaboradora.jsx';
import PerfilColectivo from './features/colectivos/PerfilColectivo.jsx';
import Notificaciones from './features/notificaciones/Notificaciones.jsx';
import MiPerfil from './features/perfil/MiPerfil.jsx';
import FormularioProyecto from './features/proyectos/FormularioProyecto.jsx';
import PerfilesProyecto from './features/proyectos/PerfilesProyecto.jsx';
import BuscadorProyectos from './features/busquedas/BuscadorProyectos.jsx';
import BuscadorColaboradores from './features/busquedas/BuscadorColaboradores.jsx';
import Mapa from './features/busquedas/Mapa.jsx';
import LinkedinCallback from './components/LinkedinCallback.jsx';
import designTokens from './designTokens.js';

const token = (name) => designTokens[`--${name}`];

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536
    }
  },
  palette: {
    mode: 'light',
    primary: {
      main: token('color-primary'),
      light: token('color-primary-light'),
      dark: token('color-primary-dark'),
      contrastText: token('color-on-primary')
    },
    secondary: {
      main: token('color-secondary'),
      light: token('color-secondary-light'),
      dark: token('color-secondary-dark'),
      contrastText: token('color-on-secondary')
    },
    success: {
      main: token('color-success'),
      light: token('color-success-light'),
      dark: token('color-success-dark'),
      contrastText: token('color-on-success')
    },
    error: {
      main: token('color-error'),
      light: token('color-error-light'),
      dark: token('color-error-dark'),
      contrastText: token('color-on-error')
    },
    warning: {
      main: token('color-warning'),
      light: token('color-warning-light'),
      dark: token('color-warning-dark'),
      contrastText: token('color-on-warning')
    },
    info: {
      main: token('color-info'),
      light: token('color-info-light'),
      dark: token('color-info-dark'),
      contrastText: token('color-on-info')
    },
    text: {
      primary: token('color-text'),
      secondary: token('color-muted'),
      disabled: token('color-text-disabled')
    },
    background: {
      default: token('color-background'),
      paper: token('color-surface')
    },
    divider: token('color-border-subtle'),
    action: {
      active: token('color-action-active'),
      hover: token('color-action-hover'),
      selected: token('color-action-selected'),
      disabled: token('color-action-disabled'),
      disabledBackground: token('color-action-disabled-background'),
      focus: token('color-action-focus'),
      hoverOpacity: 0.04,
      selectedOpacity: 0.08,
      disabledOpacity: 0.38,
      focusOpacity: 0.12
    }
  },
  typography: {
    fontFamily: token('font-family-body'),
    h1: {
      fontFamily: token('font-family-heading'),
      fontSize: token('font-size-3xl'),
      lineHeight: token('line-height-heading')
    },
    h2: {
      fontFamily: token('font-family-heading'),
      fontSize: token('font-size-2xl'),
      lineHeight: token('line-height-heading')
    },
    h3: {
      fontFamily: token('font-family-heading'),
      fontSize: token('font-size-xl'),
      lineHeight: token('line-height-heading')
    },
    h4: {
      fontFamily: token('font-family-heading'),
      fontSize: token('font-size-lg'),
      lineHeight: token('line-height-heading')
    },
    h5: {
      fontFamily: token('font-family-heading'),
      fontSize: token('font-size-md'),
      lineHeight: token('line-height-heading')
    },
    h6: {
      fontFamily: token('font-family-heading'),
      fontSize: token('font-size-sm'),
      lineHeight: token('line-height-heading')
    },
    body1: {
      fontSize: token('font-size-md'),
      lineHeight: token('line-height-body')
    },
    body2: {
      fontSize: token('font-size-sm'),
      lineHeight: token('line-height-body')
    },
    caption: {
      fontSize: token('font-size-xs'),
      lineHeight: token('line-height-body')
    },
    button: {
      fontSize: token('font-size-sm'),
      textTransform: 'none',
      fontWeight: 700
    }
  },
  shape: {
    borderRadius: Number.parseFloat(token('radius-md'))
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          minHeight: token('control-min-height'),
          borderRadius: token('radius-md'),
          paddingInline: token('space-2'),
          fontFamily: token('font-family-body'),
          fontWeight: 700,
          textTransform: 'none',
          transition: `background-color ${token('transition-fast')} ${token('transition-easing')}, color ${token('transition-fast')} ${token('transition-easing')}`
        },
        sizeSmall: {
          minHeight: token('control-min-height'),
          paddingInline: token('space-2'),
          fontSize: token('font-size-sm')
        },
        sizeMedium: {
          minHeight: token('control-min-height'),
          paddingInline: token('space-2')
        },
        sizeLarge: {
          minHeight: token('control-min-height'),
          paddingInline: token('space-3')
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none'
          }
        }
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            backgroundColor: token('color-primary'),
            color: token('color-on-primary'),
            '&:hover': { backgroundColor: token('color-primary-dark') }
          }
        },
        {
          props: { variant: 'contained', color: 'secondary' },
          style: {
            backgroundColor: token('color-secondary'),
            color: token('color-on-secondary'),
            '&:hover': { backgroundColor: token('color-secondary-light') }
          }
        },
        {
          props: { variant: 'outlined', color: 'primary' },
          style: {
            borderColor: token('color-primary'),
            color: token('color-primary'),
            '&:hover': {
              borderColor: token('color-primary-dark'),
              backgroundColor: token('color-action-hover')
            }
          }
        },
        {
          props: { variant: 'outlined', color: 'secondary' },
          style: {
            borderColor: token('color-secondary-dark'),
            color: token('color-secondary-dark'),
            '&:hover': {
              borderColor: token('color-secondary-dark'),
              backgroundColor: token('color-action-hover')
            }
          }
        },
        {
          props: { variant: 'text', color: 'primary' },
          style: {
            color: token('color-primary'),
            '&:hover': { backgroundColor: token('color-action-hover') }
          }
        },
        {
          props: { variant: 'text', color: 'secondary' },
          style: {
            color: token('color-secondary-dark'),
            '&:hover': { backgroundColor: token('color-action-hover') }
          }
        }
      ]
    },
    MuiTextField: {
      defaultProps: {
        size: 'medium',
        variant: 'outlined'
      },
      styleOverrides: {
        root: {
          fontFamily: token('font-family-body')
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: token('font-family-body'),
          fontSize: token('font-size-md'),
          lineHeight: token('line-height-body'),
          color: token('color-text')
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: token('field-min-height'),
          borderRadius: token('radius-md'),
          backgroundColor: token('color-surface'),
          fontFamily: token('font-family-body'),
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: token('color-border-subtle')
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: token('color-border')
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: token('color-primary'),
            borderWidth: 2
          }
        },
        input: {
          padding: `${token('space-1')} ${token('space-2')}`,
          color: token('color-text'),
          fontSize: token('font-size-md'),
          lineHeight: token('line-height-body')
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: token('color-muted'),
          '&.Mui-focused': { color: token('color-primary') }
        },
        outlined: {
          transform: 'translate(14px, 12px) scale(1)',
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.75)'
          },
          '&.MuiInputLabel-sizeSmall:not(.MuiInputLabel-shrink)': {
            transform: 'translate(14px, 12px) scale(1)'
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          minHeight: 'auto',
          padding: `${token('space-1')} ${token('space-4')} ${token('space-1')} ${token('space-2')}`,
          fontSize: token('font-size-md'),
          lineHeight: token('line-height-body')
        }
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiAutocomplete-inputRoot': {
            minHeight: token('field-min-height'),
            paddingTop: token('space-1'),
            paddingBottom: token('space-1'),
            paddingLeft: token('space-2')
          },
          '& .MuiAutocomplete-inputRoot .MuiAutocomplete-input': {
            paddingTop: 0,
            paddingBottom: 0,
            fontSize: token('font-size-md'),
            lineHeight: token('line-height-body')
          }
        }
      }
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginInline: 0,
          fontFamily: token('font-family-body'),
          fontSize: token('font-size-xs')
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: token('radius-lg'),
          backgroundColor: token('color-surface'),
          boxShadow: token('shadow-sm')
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          alignItems: 'center',
          borderRadius: token('radius-md'),
          padding: `${token('space-1')} ${token('space-2')}`,
          fontFamily: token('font-family-body'),
          fontSize: token('font-size-sm')
        },
        message: {
          padding: 0
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          minHeight: token('space-4'),
          borderRadius: token('radius-pill'),
          fontFamily: token('font-family-body'),
          fontSize: token('font-size-sm'),
          fontWeight: 500
        },
        clickable: {
          minHeight: token('control-min-height')
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: token('font-family-body')
        },
        h1: {
          fontFamily: token('font-family-heading')
        },
        h2: {
          fontFamily: token('font-family-heading')
        },
        h3: {
          fontFamily: token('font-family-heading')
        },
        h4: {
          fontFamily: token('font-family-heading')
        },
        h5: {
          fontFamily: token('font-family-heading')
        },
        h6: {
          fontFamily: token('font-family-heading')
        }
      }
    }
  }
});

const logtoConfig = {
  endpoint: process.env.REACT_APP_LOGTO_ENDPOINT,
  appId: process.env.REACT_APP_LOGTO_APP_ID,
  scopes: ['offline_access', 'email'],
  resources: RESOURCE ? [RESOURCE] : []
};

function App() {
  return (
    <LogtoProvider config={logtoConfig}>
      <AuthProvider>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <GlobalStyles styles={{ ':root': designTokens }} />
            <Routes>
              <Route path="/callback" element={<Callback />} />
              <Route path="/" element={<Layout />}>
              <Route
                    path="/linkedin/callback"
                    element={
                      <RequiereAuth>
                        <RequiereRol roles={['COLECTIVO']}>
                          <LinkedinCallback />
                        </RequiereRol>
                      </RequiereAuth>
                    }
                  />
                <Route index element={<Home />} />
                <Route path="/proyectos" element={<ListaProyectos />} />
                <Route path="/proyectos/:id" element={<DetalleProyecto />} />
                <Route
                  path="/buscar-proyectos"
                  element={
                    <RequiereAuth>
                      <RequiereRol roles={['COLABORADOR']}>
                        <BuscadorProyectos />
                      </RequiereRol>
                    </RequiereAuth>
                  }
                />
                <Route
                  path="/mapa"
                  element={
                    <RequiereAuth>
                      <RequiereRol roles={['COLABORADOR']}>
                        <Mapa />
                      </RequiereRol>
                    </RequiereAuth>
                  }
                />
                <Route
                  path="/buscar-colaboradores"
                  element={
                    <RequiereAuth>
                      <RequiereRol roles={['COLECTIVO']}>
                        <BuscadorColaboradores />
                      </RequiereRol>
                    </RequiereAuth>
                  }
                />
                <Route path="/colaboradoras/:id" element={<PerfilColaboradora />} />
                <Route path="/colectivos/:id" element={<PerfilColectivo />} />

                {/* El tipo se elige desde el inicio antes de iniciar el alta en Logto. */}
                <Route path="/registro/tipo" element={<RequiereAuth exigirPerfil={false}><TipoCuenta /></RequiereAuth>} />
                <Route path="/registro/colectivo" element={<RequiereAuth exigirPerfil={false} tipoRegistro="colectivo"><DatosColectivo /></RequiereAuth>} />
                <Route path="/registro/colaboradora" element={<RequiereAuth exigirPerfil={false} tipoRegistro="colaboradora"><RegistroColaboradora /></RequiereAuth>} />
                <Route path="/registro/listo" element={<Navigate to="/perfil" replace />} />

                {/* con sesión y perfil */}
                <Route path="/perfil" element={<RequiereAuth><MiPerfil /></RequiereAuth>} />
                <Route path="/notificaciones" element={<RequiereAuth><Notificaciones /></RequiereAuth>} />
                <Route
                    path="/proyectos/nuevo"
                    element={
                      <RequiereAuth>
                        <RequiereRol roles={['COLECTIVO']}>
                          <FormularioProyecto />
                        </RequiereRol>
                      </RequiereAuth>
                    }
                  />
                  <Route
                    path="/proyectos/:id/editar"
                    element={
                      <RequiereAuth>
                        <RequiereRol roles={['COLECTIVO']}>
                          <FormularioProyecto />
                        </RequiereRol>
                      </RequiereAuth>
                    }
                  />
                  <Route
                    path="/proyectos/:id/perfiles"
                    element={
                      <RequiereAuth>
                        <RequiereRol roles={['COLECTIVO']}>
                          <PerfilesProyecto />
                        </RequiereRol>
                      </RequiereAuth>
                    }
                  />
              </Route>
            </Routes>
          </ThemeProvider>
        </BrowserRouter>
      </AuthProvider>
    </LogtoProvider>
  );
}

export default App;
