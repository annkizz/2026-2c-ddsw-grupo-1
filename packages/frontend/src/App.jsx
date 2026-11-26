import React, { useEffect, useMemo } from "react";
import { GlobalStyles, ThemeProvider } from "@mui/material";
import { LogtoProvider } from "@logto/react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, RESOURCE } from "./hooks/useAuth.jsx";
import RequiereAuth from "./components/RequiereAuth.jsx";
import RequiereRol from "./components/RequiereRol.jsx";
import Callback from "./components/Callback.jsx";
import Layout from "./features/layout/Layout.jsx";
import Home from "./features/home/Home.jsx";
import TipoCuenta from "./features/registro/TipoCuenta.jsx";
import DatosColectivo from "./features/registro/DatosColectivo.jsx";
import RegistroColaboradora from "./features/registro/RegistroColaboradora.jsx";
import ListaProyectos from "./features/proyectos/ListaProyectos.jsx";
import DetalleProyecto from "./features/proyectos/DetalleProyecto.jsx";
import MisColaboraciones from "./features/colaboraciones/MisColaboraciones.jsx";
import MisPostulaciones from "./features/colaboraciones/MisPostulaciones.jsx";
import PerfilColaboradora from "./features/colaboradoras/PerfilColaboradora.jsx";
import PerfilColectivo from "./features/colectivos/PerfilColectivo.jsx";
import Notificaciones from "./features/notificaciones/Notificaciones.jsx";
import MiPerfil from "./features/perfil/MiPerfil.jsx";
import FormularioProyecto from "./features/proyectos/FormularioProyecto.jsx";
import PerfilesProyecto from "./features/proyectos/PerfilesProyecto.jsx";
import ProyectosDestacados from "./features/proyectos/ProyectosDestacados.jsx";
import BuscadorProyectos from "./features/busquedas/BuscadorProyectos.jsx";
import BuscadorColaboradores from "./features/busquedas/BuscadorColaboradores.jsx";
import Mapa from "./features/busquedas/Mapa.jsx";
import LinkedinCallback from "./components/LinkedinCallback.jsx";
import Webhooks from "./features/integraciones/Webhooks.jsx";
import { crearTema } from "./theme/crearTema.js";
import { tokensBase } from "./designTokens.js";
import { NotificadorProvider } from "./components/Notificador/Notificador.jsx";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.jsx";
import PaginaNoEncontrada from "./features/errores/PaginaNoEncontrada.jsx";
import PropTypes from "prop-types";
import { t, useIdioma } from "./i18n/t";

const logtoConfig = {
  endpoint: process.env.REACT_APP_LOGTO_ENDPOINT,
  appId: process.env.REACT_APP_LOGTO_APP_ID,
  scopes: ["offline_access", "email"],
  resources: RESOURCE ? [RESOURCE] : [],
};

// El tema MUI y las variables CSS salen de los mismos tokens (designTokens.js).
const TemaApp = ({ children }) => {
  const idioma = useIdioma();
  const theme = useMemo(
    () => crearTema(tokensBase, (clave) => t(clave, {}, idioma)),
    [idioma],
  );
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={{ ":root": tokensBase }} />
      {children}
    </ThemeProvider>
  );
};

// Reinicia el ErrorBoundary al navegar, para que un fallo no bloquee el resto de la app.
const LimiteDeErrores = ({ children }) => {
  const { pathname } = useLocation();
  return <ErrorBoundary claveReinicio={pathname}>{children}</ErrorBoundary>;
};

TemaApp.propTypes = { children: PropTypes.node };
LimiteDeErrores.propTypes = { children: PropTypes.node };

function App() {
  const idioma = useIdioma();
  useEffect(() => {
    document.documentElement.lang =
      idioma === "pt" ? "pt-BR" : idioma === "gr" ? "gn-PY" : "es";
  }, [idioma]);

  return (
    <LogtoProvider config={logtoConfig}>
      <AuthProvider>
        <BrowserRouter>
          <TemaApp>
            <NotificadorProvider>
              <LimiteDeErrores>
                <Routes>
                  <Route path="/callback" element={<Callback />} />
                  <Route path="/" element={<Layout />}>
                    <Route
                      path="/linkedin/callback"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["COLECTIVO"]}>
                            <LinkedinCallback />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route index element={<Home />} />
                    <Route
                      path="/administrador/destacados"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["ADMINISTRADOR"]}>
                            <ProyectosDestacados />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route path="/proyectos" element={<ListaProyectos />} />
                    <Route
                      path="/proyectos/:id"
                      element={<DetalleProyecto />}
                    />
                    <Route
                      path="/mis-colaboraciones"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["COLABORADOR"]}>
                            <MisColaboraciones />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/mis-postulaciones"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["COLABORADOR"]}>
                            <MisPostulaciones />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/buscar-proyectos"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["COLABORADOR"]}>
                            <BuscadorProyectos />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/mapa"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["COLABORADOR"]}>
                            <Mapa />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/buscar-colaboradores"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["COLECTIVO"]}>
                            <BuscadorColaboradores />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/colaboradoras/:id"
                      element={<PerfilColaboradora />}
                    />
                    <Route
                      path="/colectivos/:id"
                      element={<PerfilColectivo />}
                    />

                    {/* El tipo se elige desde el inicio antes de iniciar el alta en Logto. */}
                    <Route
                      path="/registro/tipo"
                      element={
                        <RequiereAuth exigirPerfil={false}>
                          <TipoCuenta />
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/registro/colectivo"
                      element={
                        <RequiereAuth
                          exigirPerfil={false}
                          tipoRegistro="colectivo"
                        >
                          <DatosColectivo />
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/registro/colaboradora"
                      element={
                        <RequiereAuth
                          exigirPerfil={false}
                          tipoRegistro="colaboradora"
                        >
                          <RegistroColaboradora />
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/registro/listo"
                      element={<Navigate to="/" replace />}
                    />

                    {/* con sesión y perfil */}
                    <Route
                      path="/perfil"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["COLECTIVO", "COLABORADOR"]}>
                            <MiPerfil />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/notificaciones"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["COLECTIVO", "COLABORADOR"]}>
                            <Notificaciones />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/proyectos/nuevo"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["COLECTIVO"]}>
                            <FormularioProyecto />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/proyectos/:id/editar"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["COLECTIVO"]}>
                            <FormularioProyecto />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/proyectos/:id/perfiles"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["COLECTIVO"]}>
                            <PerfilesProyecto />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route
                      path="/integraciones/webhooks"
                      element={
                        <RequiereAuth>
                          <RequiereRol roles={["COLECTIVO"]}>
                            <Webhooks />
                          </RequiereRol>
                        </RequiereAuth>
                      }
                    />
                    <Route path="*" element={<PaginaNoEncontrada />} />
                  </Route>
                </Routes>
              </LimiteDeErrores>
            </NotificadorProvider>
          </TemaApp>
        </BrowserRouter>
      </AuthProvider>
    </LogtoProvider>
  );
}

export default App;
