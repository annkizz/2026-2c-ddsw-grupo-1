import { useEffect } from 'react';
import { useHandleSignInCallback } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button } from '@mui/material';
import { useAuth } from '../hooks/useAuth.jsx';
import { leerTipo, rutaDeRegistro } from '../features/registro/tipoElegido';
import LoadingSplash from './LoadingSplash/LoadingSplash.jsx';

// Logto vuelve acá después del login/registro. Cuando el AuthProvider ya
// pidió GET /me, decidimos a dónde mandar a la persona.
const Callback = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    sesion,
    errorSesion,
    cargando,
    recargarSesion,
    cerrarSesion
  } = useAuth();
  const { error: errorLogto } = useHandleSignInCallback(() => {});

  useEffect(() => {
    if (!sesion) return;
    navigate(
      sesion.tienePerfil
        ? sesion.rol === 'COLECTIVO' || sesion.rol === 'COLABORADOR'
          ? '/'
          : '/perfil'
        : (leerTipo() ? rutaDeRegistro(leerTipo()) : '/registro/tipo'),
      { replace: true }
    );
  }, [sesion, navigate]);

  if (errorSesion || errorLogto) {
    return (
      <div role="alert" style={{ padding: '2rem', textAlign: 'center' }}>
        <Alert severity="error">
          {errorSesion || 'No pudimos completar el inicio de sesión.'}
        </Alert>
        {errorSesion && <Button onClick={recargarSesion}>Reintentar</Button>}
        <Button onClick={cerrarSesion}>Salir</Button>
      </div>
    );
  }

  if (cargando) {
    return <LoadingSplash message="Estamos verificando tus datos. Esperá un momento." />;
  }

  if (!isAuthenticated) {
    return (
      <div role="alert" style={{ padding: '2rem', textAlign: 'center' }}>
        <Alert severity="error">No se pudo completar el inicio de sesión. Volvé a intentarlo.</Alert>
        <Button onClick={() => navigate('/', { replace: true })}>Volver al inicio</Button>
      </div>
    );
  }

  return <LoadingSplash message="Estamos verificando tus datos. Esperá un momento." />;
};

export default Callback;