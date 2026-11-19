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
  const { sesion, errorSesion, recargarSesion, cerrarSesion } = useAuth();
  const { error: errorLogto } = useHandleSignInCallback(() => {});

  useEffect(() => {
    if (!sesion) return;
    navigate(
      sesion.tienePerfil
        ? '/perfil'
        : (leerTipo() ? rutaDeRegistro(leerTipo()) : '/registro/tipo'),
      { replace: true }
    );
  }, [sesion, navigate]);

  if (errorSesion || errorLogto) {
    const mensajeError = errorSesion
      ? `No pudimos verificar tu sesión con el servidor: ${errorSesion}`
      : `No pudimos completar el inicio de sesión con Logto: ${
          errorLogto?.message ?? 'Ocurrió un error inesperado.'
        }`;

    return (
      <div role="alert" style={{ padding: '2rem', textAlign: 'center' }}>
        <Alert severity="error">{mensajeError}</Alert>
        {errorSesion && <Button onClick={recargarSesion}>Reintentar</Button>}
        <Button onClick={cerrarSesion}>Salir</Button>
      </div>
    );
  }

  return <LoadingSplash message="Estamos verificando tus datos. Esperá un momento." />;
};

export default Callback;