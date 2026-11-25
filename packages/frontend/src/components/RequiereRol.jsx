import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingSplash from './LoadingSplash/LoadingSplash.jsx';
import { t } from '../i18n/t';
import PaginaError from './PaginaError/PaginaError.jsx';

// roles: valores de Rol del backend
const RequiereRol = ({ roles, fallback, children }) => {
  const { cargando, sesion } = useAuth();

  if (cargando || !sesion) {
    return <LoadingSplash message={t('acceso.validandoPermisos')} />;
  }

  if (!roles.includes(sesion.rol)) {
    return (
      fallback || <PaginaError codigo={403} id="acceso-denegado-titulo" />
    );
  }

  return children;
};

RequiereRol.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.string).isRequired,
  fallback: PropTypes.node,
  children: PropTypes.node,
};

export default RequiereRol;
