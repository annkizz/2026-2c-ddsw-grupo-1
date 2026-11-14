import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingSplash from './LoadingSplash/LoadingSplash.jsx';

// Sin sesión -> "/". Con sesión pero sin perfil -> registro (salvo exigirPerfil={false})
const RequiereAuth = ({ children, exigirPerfil = true }) => {
  const { isAuthenticated, cargando, sesion } = useAuth();

  if (cargando) {
    return <LoadingSplash message="Conectando..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (exigirPerfil && sesion && !sesion.tienePerfil) {
    return <Navigate to="/registro/tipo" replace />;
  }

  return children;
};

export default RequiereAuth;
