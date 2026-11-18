import { createTheme, ThemeProvider } from '@mui/material';
import { LogtoProvider } from '@logto/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, RESOURCE } from './hooks/useAuth.jsx';
import RequiereAuth from './components/RequiereAuth.jsx';
import RequiereRol from './components/RequiereRol.jsx';
import Callback from './components/Callback.jsx';
import Layout from './features/layout/Layout.jsx';
import Home from './features/home/Home.jsx';
import TipoCuenta from './features/registro/TipoCuenta.jsx';
import DatosColectivo from './features/registro/DatosColectivo.jsx';
import RegistroColaboradora from './features/registro/RegistroColaboradora.jsx';
import CuentaCreada from './features/registro/CuentaCreada.jsx';
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

const theme = createTheme({
  palette: {
    primary: {
      main: '#15324b'
    },
    secondary: {
      main: '#e69f00'
    }
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
    button: {
      textTransform: 'none',
      fontWeight: 700
    }
  },
  shape: {
    borderRadius: 6
  }
});

const logtoConfig = {
  endpoint: process.env.REACT_APP_LOGTO_ENDPOINT,
  appId: process.env.REACT_APP_LOGTO_APP_ID,
  resources: RESOURCE ? [RESOURCE] : []
};

function App() {
  return (
    <LogtoProvider config={logtoConfig}>
      <AuthProvider>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Routes>
              <Route path="/callback" element={<Callback />} />
              <Route path="/" element={<Layout />}>
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

                {/* registro: con sesión de Logto pero todavía sin perfil */}
                <Route path="/registro/tipo" element={<RequiereAuth exigirPerfil={false}><TipoCuenta /></RequiereAuth>} />
                <Route path="/registro/colectivo" element={<RequiereAuth exigirPerfil={false}><DatosColectivo /></RequiereAuth>} />
                <Route path="/registro/colaboradora" element={<RequiereAuth exigirPerfil={false}><RegistroColaboradora /></RequiereAuth>} />
                <Route path="/registro/listo" element={<RequiereAuth exigirPerfil={false}><CuentaCreada /></RequiereAuth>} />

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
