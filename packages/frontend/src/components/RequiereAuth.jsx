
import { Navigate } from 'react-router-dom';
import { Alert, Button } from '@mui/material';
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingSplash from './LoadingSplash/LoadingSplash.jsx';
import { leerTipo } from '../features/registro/tipoElegido';

const RequiereAuth = ({ children, exigirPerfil = true, tipoRegistro }) => {
  const {
    isAuthenticated,
    cargando,
    sesion,
    errorSesion,
    recargarSesion,
    cerrarSesion,
  } = useAuth();

  if (cargando) {
    return <LoadingSplash message="Conectando..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (errorSesion || !sesion) {
    return (
      <div
        role="alert"
        style={{
          padding: '2rem',
          maxWidth: 520,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          No pudimos verificar tu sesión con el servidor.
        </Alert>

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          <Button variant="contained" onClick={recargarSesion}>
            Reintentar
          </Button>

          <Button variant="outlined" onClick={cerrarSesion}>
            Salir
          </Button>
        </div>
      </div>
    );
  }

  if (sesion.tienePerfil) {
    if (!exigirPerfil) {
      return <Navigate to="/perfil" replace />;
    }

    return children;
  }

  if (exigirPerfil || (tipoRegistro && leerTipo() !== tipoRegistro)) {
    return <Navigate to="/registro/tipo" replace />;
  }

  return children;
};

export default RequiereAuth;
