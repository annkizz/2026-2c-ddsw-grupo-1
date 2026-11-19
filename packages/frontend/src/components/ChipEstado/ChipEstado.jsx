import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import { FiCheckCircle, FiClock, FiPlayCircle, FiXCircle } from 'react-icons/fi';

// Chip de estado único: siempre ícono + texto (nunca solo color).
const ESTADOS = {
  ACTIVO: { texto: 'Activo', color: 'primary', Icono: FiPlayCircle },
  FINALIZADO: { texto: 'Finalizado', color: 'default', Icono: FiCheckCircle },
  ABIERTA: { texto: 'Búsqueda abierta', color: 'success', Icono: FiCheckCircle },
  CERRADA: { texto: 'Búsqueda cerrada', color: 'default', Icono: FiXCircle },
  PENDIENTE: { texto: 'Pendiente', color: 'warning', Icono: FiClock }
};

const ChipEstado = ({ estado, texto, className }) => {
  const config = ESTADOS[estado] ?? { texto: estado, color: 'default', Icono: FiClock };
  const { Icono } = config;
  return (
    <Chip
      className={`chip-estado ${className ?? ''}`.trim()}
      color={config.color}
      icon={<Icono aria-hidden="true" />}
      label={texto ?? config.texto}
    />
  );
};

ChipEstado.propTypes = {
  estado: PropTypes.string.isRequired,
  texto: PropTypes.node,
  className: PropTypes.string
};

export default ChipEstado;
