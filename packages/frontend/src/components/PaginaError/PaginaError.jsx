import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import { FiCompass, FiHome, FiLock, FiLogIn } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/t';
import '../../features/errores/PaginaEstado.css';

// Página de error HTTP: el código (401, 403, 404…) se muestra grande y en texto,
// con un título claro y una salida. Reemplaza los "no autorizado" genéricos.
const ICONOS = { 401: FiLogIn, 403: FiLock, 404: FiCompass };

const PaginaError = ({ codigo, titulo, descripcion, accion, id = `titulo-error-${codigo}` }) => {
  const Icono = ICONOS[codigo] ?? FiCompass;
  return (
    <section className="pagina-estado pagina-estado--codigo" aria-labelledby={id}>
      <span className="pagina-estado__icono" aria-hidden="true">
        <Icono />
      </span>
      <p className="pagina-estado__codigo">
        <span className="visualmente-oculto">{t('errores.codigo')} </span>
        {t('errores.etiquetaCodigo', { codigo })}
      </p>
      <h1 id={id}>{titulo ?? t(`errores.titulo${codigo}`)}</h1>
      <p className="pagina-estado__texto">{descripcion ?? t(`errores.descripcion${codigo}`)}</p>
      <div className="pagina-estado__acciones">
        {accion ?? (
          <Button component={Link} to="/" variant="contained" startIcon={<FiHome aria-hidden="true" />}>
            {t('comun.volverAlInicio')}
          </Button>
        )}
      </div>
    </section>
  );
};

PaginaError.propTypes = {
  codigo: PropTypes.oneOf([400, 401, 403, 404, 409]).isRequired,
  titulo: PropTypes.node,
  descripcion: PropTypes.node,
  accion: PropTypes.node,
  id: PropTypes.string
};

export default PaginaError;
