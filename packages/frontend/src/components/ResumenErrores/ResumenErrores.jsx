import React, { useEffect, useRef } from 'react';
import { Alert, AlertTitle } from '@mui/material';
import { t } from '../../i18n/t';

import PropTypes from 'prop-types';
// Resumen de errores al enviar un formulario (patrón GOV.UK / WCAG 3.3.1).
// errores: [{ campoId, mensaje }]. Recibe el foco cuando aparece y cada enlace lleva al campo.
const ResumenErrores = ({ errores = [], titulo, id = 'resumen-errores', intento = 0 }) => {
  const ref = useRef(null);
  const cantidad = errores.length;

  const cantidadRef = useRef(cantidad);
  cantidadRef.current = cantidad;

  // El foco va al resumen en cada intento de envío (no cuando se corrige un campo).
  useEffect(() => {
    if (cantidadRef.current > 0) ref.current?.focus();
  }, [intento]);

  if (cantidad === 0) return null;

  const irAlCampo = (evento, campoId) => {
    const campo = document.getElementById(campoId);
    if (!campo) return;
    evento.preventDefault();
    campo.scrollIntoView?.({ block: 'center' });
    campo.focus();
  };

  return (
    <Alert
      severity="error"
      role="alert"
      ref={ref}
      tabIndex={-1}
      aria-labelledby={`${id}-titulo`}
      className="resumen-errores"
    >
      <AlertTitle id={`${id}-titulo`} component="h2">
        {titulo ?? (cantidad === 1 ? t('formulario.resumenUno') : t('formulario.resumenVarios', { cantidad }))}
      </AlertTitle>
      <ul className="resumen-errores__lista">
        {errores.map(({ campoId, mensaje }) => (
          <li key={`${campoId}-${mensaje}`}>
            <a href={`#${campoId}`} onClick={(evento) => irAlCampo(evento, campoId)}>
              {mensaje}
            </a>
          </li>
        ))}
      </ul>
    </Alert>
  );
};

ResumenErrores.propTypes = {
  errores: PropTypes.arrayOf(PropTypes.shape({ campoId: PropTypes.string.isRequired, mensaje: PropTypes.node.isRequired })),
  titulo: PropTypes.node,
  id: PropTypes.string,
  intento: PropTypes.number
};

export default ResumenErrores;
