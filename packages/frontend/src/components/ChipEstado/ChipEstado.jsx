import { t } from '../../i18n/t';
import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import { FiCheckCircle, FiClock, FiPlayCircle, FiXCircle } from 'react-icons/fi';

// Chip de estado único: siempre ícono + texto (nunca solo color).
const ESTADOS = {
  ACTIVO: { clave: 'proyectos.activo', color: 'primary', Icono: FiPlayCircle },
  FINALIZADO: { clave: 'proyectos.finalizado', color: 'default', Icono: FiCheckCircle },
  ABIERTA: { clave: 'proyectos.busquedaAbierta', color: 'success', Icono: FiCheckCircle },
  CERRADA: { clave: 'proyectos.busquedaCerrada', color: 'default', Icono: FiXCircle },
  PENDIENTE: { clave: 'misPostulaciones.pendiente', color: 'warning', Icono: FiClock },
  ACEPTADA: { clave: 'misPostulaciones.aceptada', color: 'success', Icono: FiCheckCircle },
  RECHAZADA: { clave: 'misPostulaciones.rechazada', color: 'error', Icono: FiXCircle }
};

const ChipEstado = ({ estado, texto, className }) => {
  const config = ESTADOS[estado] ?? { texto: estado, color: 'default', Icono: FiClock };
  const { Icono } = config;
  return (
    <Chip
      className={`chip-estado ${className ?? ''}`.trim()}
      color={config.color}
      icon={<Icono aria-hidden="true" />}
      label={texto ?? (config.clave ? t(config.clave) : config.texto)}
    />
  );
};

ChipEstado.propTypes = {
  estado: PropTypes.string.isRequired,
  texto: PropTypes.node,
  className: PropTypes.string
};

export default ChipEstado;
