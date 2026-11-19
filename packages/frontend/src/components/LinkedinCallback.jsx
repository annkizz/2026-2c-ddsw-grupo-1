import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button } from '@mui/material';
import { useAuth } from '../hooks/useAuth.jsx';
import { completarConexionLinkedin, CLAVE_VOLVER_A } from '../service/linkedinService';
import { mensajeDeError } from '../service/api';
import { t } from '../i18n/t';
import LoadingSplash from './LoadingSplash/LoadingSplash.jsx';


const LinkedinCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { getAccessToken } = useAuth();
  const [error, setError] = useState('');
  const yaEnviado = useRef(false); 

  const volverA = sessionStorage.getItem(CLAVE_VOLVER_A) ?? '/perfil';

  useEffect(() => {
    if (yaEnviado.current) return;
    yaEnviado.current = true;

    const code = params.get('code');
    const state = params.get('state');
    if (params.get('error') || !code || !state) {
      setError(t('linkedin.callbackError'));
      return;
    }

    (async () => {
      try {
        const token = await getAccessToken();
        await completarConexionLinkedin(token, code, state);
        sessionStorage.removeItem(CLAVE_VOLVER_A);
        navigate(volverA, { replace: true });
      } catch (err) {
        setError(mensajeDeError(err));
      }
    })();
  }, [params, getAccessToken, navigate, volverA]);

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: '2rem auto', display: 'grid', gap: 16 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={() => navigate(volverA, { replace: true })}>
          {t('linkedin.volver')}
        </Button>
      </div>
    );
  }

  return <LoadingSplash message={t('linkedin.callbackConectando')} />;
};

export default LinkedinCallback;