import React, { useEffect } from 'react';
import { useHandleSignInCallback } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, Button } from '@mui/material';
import { FiHome, FiLogOut, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth.jsx';
import { leerTipo, rutaDeRegistro } from '../features/registro/tipoElegido';
import { t } from '../i18n/t';
import LoadingSplash from './LoadingSplash/LoadingSplash.jsx';
import './Acceso.css';

// Logto vuelve acá después del login/registro. Cuando el AuthProvider ya
// pidió GET /me, decidimos a dónde mandar a la persona.
const Callback = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    sesion,
    errorSesion,
    tipoErrorSesion,
    cargando,
    recargarSesion,
    cerrarSesion
  } = useAuth();
  const { error: errorLogto } = useHandleSignInCallback(() => {});

  useEffect(() => {
    if (!sesion) return;
    // Con perfil, siempre al Inicio (panel del colectivo o de la colaboradora), nunca a Mi perfil.
    navigate(
      sesion.rol === 'ADMINISTRADOR'
        ? '/administrador/destacados'
        : sesion.tienePerfil ? '/' : leerTipo() ? rutaDeRegistro(leerTipo()) : '/registro/tipo',
      { replace: true }
    );
  }, [sesion, navigate]);

  if (errorSesion || errorLogto) {
    // Texto humano según el tipo de error. errorSesion (detalle técnico) solo se usa si el
    // proveedor no informó el tipo (por ejemplo, en tests aislados con un mock de useAuth).
    const detalle = tipoErrorSesion ? t(`errores.${tipoErrorSesion}`) : errorSesion || t('acceso.errorInicioDescripcion');
    return (
      <main className="acceso-estado" id="contenido-principal" tabIndex={-1}>
        <h1 className="visualmente-oculto">{t('acceso.errorInicioTitulo')}</h1>
        <Alert severity="error" role="alert">
          <AlertTitle>{errorSesion ? t('acceso.errorSesionTitulo') : t('acceso.errorInicioTitulo')}</AlertTitle>
          {detalle}
        </Alert>
        <div className="acceso-estado__acciones">
          {errorSesion && (
            <Button variant="contained" startIcon={<FiRefreshCw aria-hidden="true" />} onClick={recargarSesion}>
              {t('comun.reintentar')}
            </Button>
          )}
          <Button variant="outlined" startIcon={<FiLogOut aria-hidden="true" />} onClick={cerrarSesion}>
            {t('navegacion.salir')}
          </Button>
        </div>
      </main>
    );
  }

  if (cargando) {
    return <LoadingSplash message={t('acceso.verificandoDatos')} />;
  }

  if (!isAuthenticated) {
    return (
      <main className="acceso-estado" id="contenido-principal" tabIndex={-1}>
        <h1 className="visualmente-oculto">{t('acceso.errorInicioTitulo')}</h1>
        <Alert severity="error" role="alert">
          <AlertTitle>{t('acceso.errorInicioTitulo')}</AlertTitle>
          {t('acceso.errorInicioDescripcion')}
        </Alert>
        <div className="acceso-estado__acciones">
          <Button variant="contained" startIcon={<FiHome aria-hidden="true" />} onClick={() => navigate('/', { replace: true })}>
            {t('acceso.volverAlInicio')}
          </Button>
        </div>
      </main>
    );
  }

  return <LoadingSplash message={t('acceso.verificandoDatos')} />;
};

export default Callback;
