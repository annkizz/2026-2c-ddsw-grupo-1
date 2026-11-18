import { Navigate } from 'react-router-dom';
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

  if (sesion?.tienePerfil) {
    if (!exigirPerfil) {
      return <Navigate to="/perfil" replace />;
    }
    return children;
  }

  if (exigirPerfil || (tipoRegistro && leerTipo() !== tipoRegistro)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequiereAuth;