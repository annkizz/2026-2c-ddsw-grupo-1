
import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { Alert, AlertTitle, Button } from '@mui/material';
import { FiLogOut, FiRefreshCw } from 'react-icons/fi';
import { t } from '../i18n/t';
import './Acceso.css';
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingSplash from './LoadingSplash/LoadingSplash.jsx';
import { leerTipo } from '../features/registro/tipoElegido';

const RequiereAuth = ({ children, exigirPerfil = true, tipoRegistro }) => {
  const {
    isAuthenticated,
    cargando,
    sesion,
    errorSesion,
    tipoErrorSesion,
    recargarSesion,
    cerrarSesion,
  } = useAuth();

  if (cargando) {
    return <LoadingSplash message={t('acceso.verificandoSesion')} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (errorSesion || !sesion) {
    return (
      <section className="acceso-estado" aria-labelledby="acceso-error-titulo">
        <Alert severity="error" role="alert">
          <AlertTitle id="acceso-error-titulo" component="h1">
            {t('acceso.errorSesionTitulo')}
          </AlertTitle>
          {t(`errores.${tipoErrorSesion ?? 'inesperado'}`)}
        </Alert>
        <div className="acceso-estado__acciones">
          <Button variant="contained" startIcon={<FiRefreshCw aria-hidden="true" />} onClick={recargarSesion}>
            {t('comun.reintentar')}
          </Button>
          <Button variant="outlined" startIcon={<FiLogOut aria-hidden="true" />} onClick={cerrarSesion}>
            {t('navegacion.salir')}
          </Button>
        </div>
      </section>
    );
  }

  if (sesion.tienePerfil) {
    if (!exigirPerfil) {
      return <Navigate to="/" replace />;
    }

    return children;
  }

  if (exigirPerfil || (tipoRegistro && leerTipo() !== tipoRegistro)) {
    return <Navigate to="/registro/tipo" replace />;
  }

  return children;
};

RequiereAuth.propTypes = {
  children: PropTypes.node,
  exigirPerfil: PropTypes.bool,
  tipoRegistro: PropTypes.string,
};

export default RequiereAuth;
