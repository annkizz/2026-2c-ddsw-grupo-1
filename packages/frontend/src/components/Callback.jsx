import { useEffect } from 'react';
import { useHandleSignInCallback } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { leerTipo, rutaDeRegistro } from '../features/registro/tipoElegido';
import LoadingSplash from './LoadingSplash/LoadingSplash.jsx';

// Logto vuelve acá después del login/registro. Cuando el AuthProvider ya
// pidió GET /me, decidimos a dónde mandar a la persona.
const Callback = () => {
  const navigate = useNavigate();
  const { sesion } = useAuth();
  useHandleSignInCallback(() => {});

  useEffect(() => {
    if (!sesion) return;
    navigate(sesion.tienePerfil ? '/perfil' : rutaDeRegistro(leerTipo()), { replace: true });
  }, [sesion, navigate]);

  return <LoadingSplash message="Estamos verificando tus datos. Esperá un momento." />;
};

export default Callback;
