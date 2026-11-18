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
  const { sesion, errorSesion, cargando, recargarSesion, cerrarSesion, iniciarSesion } = useAuth();
  const { error: errorLogto } = useHandleSignInCallback(() => {});

  useEffect(() => {
    if (!sesion) return;
    navigate(sesion.tienePerfil ? '/perfil' : rutaDeRegistro(leerTipo()), { replace: true });
  }, [sesion, navigate]);

  if (errorLogto) {
    return (
      <div role="alert" style={{ padding: '2rem', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          No pudimos completar el inicio de sesión. Volvé a intentarlo.
        </Alert>
        <Button variant="contained" onClick={iniciarSesion}>
          Iniciar sesión de nuevo
        </Button>
      </div>
    );
  }

  if (errorSesion && !cargando) {
    return (
      <div role="alert" style={{ padding: '2rem', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          No pudimos verificar tu sesión con el servidor. Revisá tu conexión e intentá nuevamente.
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

  return <LoadingSplash message="Estamos verificando tus datos. Esperá un momento." />;
};

export default Callback;