import { useAuth } from '../hooks/useAuth.jsx';
import LoadingSplash from './LoadingSplash/LoadingSplash.jsx';

// roles: valores de Rol del backend ('COLECTIVO' o 'COLABORADOR')
const RequiereRol = ({ roles, fallback, children }) => {
  const { cargando, sesion } = useAuth();

  if (cargando || !sesion) {
    return <LoadingSplash message="Validando permisos..." />;
  }

  if (!roles.includes(sesion.rol)) {
    return (
      fallback || (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <h2>Acceso denegado</h2>
          <p>No tenés permisos para ver esta sección.</p>
        </div>
      )
    );
  }

  return children;
};

export default RequiereRol;
