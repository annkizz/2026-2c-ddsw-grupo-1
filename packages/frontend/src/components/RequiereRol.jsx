import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import { FiHome, FiLock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import LoadingSplash from './LoadingSplash/LoadingSplash.jsx';
import { t } from '../i18n/t';
import '../features/errores/PaginaEstado.css';

// roles: valores de Rol del backend ('COLECTIVO' o 'COLABORADOR')
const RequiereRol = ({ roles, fallback, children }) => {
  const { cargando, sesion } = useAuth();

  if (cargando || !sesion) {
    return <LoadingSplash message={t('acceso.validandoPermisos')} />;
  }

  if (!roles.includes(sesion.rol)) {
    return (
      fallback || (
        <section className="pagina-estado" aria-labelledby="acceso-denegado-titulo">
          <span className="pagina-estado__icono" aria-hidden="true">
            <FiLock />
          </span>
          <h1 id="acceso-denegado-titulo">{t('acceso.denegadoTitulo')}</h1>
          <p className="pagina-estado__texto">{t('acceso.denegadoDescripcion')}</p>
          <div className="pagina-estado__acciones">
            <Button component={Link} to="/" variant="contained" startIcon={<FiHome aria-hidden="true" />}>
              {t('comun.volverAlInicio')}
            </Button>
          </div>
        </section>
      )
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
