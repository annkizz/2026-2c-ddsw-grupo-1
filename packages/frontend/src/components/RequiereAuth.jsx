import { Navigate } from 'react-router-dom';
import { Alert, Button } from '@mui/material';
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingSplash from './LoadingSplash/LoadingSplash.jsx';
import { leerTipo } from '../features/registro/tipoElegido';

const RequiereAuth = ({ children, exigirPerfil = true, tipoRegistro }) => {
  const { isAuthenticated, cargando, sesion } = useAuth();

  if (cargando) {
    return <LoadingSplash message="Conectando..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

<<<<<<< HEAD
  if (errorSesion || !sesion) {
    return (
      <div role="alert" style={{ padding: '2rem', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          No pudimos verificar tu sesión con el servidor.
        </Alert>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
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

  if (exigirPerfil && !sesion.tienePerfil) {
    return <Navigate to="/registro/tipo" replace />;
=======
  if (sesion?.tienePerfil) {
    if (!exigirPerfil) {
      return <Navigate to="/perfil" replace />;
    }
    return children;
  }

  if (exigirPerfil || (tipoRegistro && leerTipo() !== tipoRegistro)) {
    return <Navigate to="/" replace />;
>>>>>>> a6d443a
  }

  return children;
};

export default RequiereAuth;