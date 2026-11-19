import React, { useMemo } from 'react';
import { GlobalStyles, ThemeProvider } from '@mui/material';
import { LogtoProvider } from '@logto/react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { crearTema } from './theme/crearTema.js';
import { ModoColorProvider, useModoColor } from './theme/ModoColorContext.jsx';
import { NotificadorProvider } from './components/Notificador/Notificador.jsx';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx';
import PaginaNoEncontrada from './features/errores/PaginaNoEncontrada.jsx';
import PropTypes from 'prop-types';

const logtoConfig = {
  endpoint: process.env.REACT_APP_LOGTO_ENDPOINT,
  appId: process.env.REACT_APP_LOGTO_APP_ID,
  scopes: ['offline_access', 'email'],
  resources: RESOURCE ? [RESOURCE] : []
};

// El tema MUI y las variables CSS salen de los mismos tokens del modo activo.
const TemaDelModo = ({ children }) => {
  const { tokens } = useModoColor();
  const theme = useMemo(() => crearTema(tokens), [tokens]);
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={{ ':root': tokens }} />
      {children}
    </ThemeProvider>
  );
};

// Reinicia el ErrorBoundary al navegar, para que un fallo no bloquee el resto de la app.
const LimiteDeErrores = ({ children }) => {
  const { pathname } = useLocation();
  return <ErrorBoundary claveReinicio={pathname}>{children}</ErrorBoundary>;
};

TemaDelModo.propTypes = { children: PropTypes.node };
LimiteDeErrores.propTypes = { children: PropTypes.node };

function App() {
  return (
    <LogtoProvider config={logtoConfig}>
      <AuthProvider>
        <BrowserRouter>
          <ModoColorProvider>
          <TemaDelModo>
          <NotificadorProvider>
          <LimiteDeErrores>
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
                <Route path="*" element={<PaginaNoEncontrada />} />
              </Route>
            </Routes>
          </LimiteDeErrores>
          </NotificadorProvider>
          </TemaDelModo>
          </ModoColorProvider>
        </BrowserRouter>
      </AuthProvider>
    </LogtoProvider>
  );
}

export default App;
