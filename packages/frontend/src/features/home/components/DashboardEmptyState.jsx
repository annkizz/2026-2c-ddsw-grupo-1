import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import { FiArrowRight, FiInbox } from 'react-icons/fi';
import EstadoVacio from '../../../components/EstadoVacio/EstadoVacio.jsx';

// Estado vacío dentro de una card del panel: misma pieza EstadoVacio, en su versión compacta.
const DashboardEmptyState = ({
  icon = FiInbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  actionVariant = 'outlined',
  nivelTitulo = 'h3',
}) => (
  <EstadoVacio
    className={`estado-vacio--compacto ${className}`.trim()}
    icono={icon}
    titulo={title}
    descripcion={description}
    nivelTitulo={nivelTitulo}
    accion={
      actionLabel ? (
        <Button variant={actionVariant} onClick={onAction} endIcon={<FiArrowRight aria-hidden="true" />}>
          {actionLabel}
        </Button>
      ) : null
    }
  />
);

DashboardEmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  actionLabel: PropTypes.node,
  onAction: PropTypes.func,
  className: PropTypes.string,
  actionVariant: PropTypes.oneOf(['contained', 'outlined', 'text']),
  nivelTitulo: PropTypes.oneOf(['h2', 'h3']),
};

export default DashboardEmptyState;
