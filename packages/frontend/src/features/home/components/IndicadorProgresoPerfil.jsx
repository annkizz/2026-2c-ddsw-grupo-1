import React from 'react';
import PropTypes from 'prop-types';
import { Button, LinearProgress } from '@mui/material';
import { FiArrowRight, FiUser } from 'react-icons/fi';
import DashboardCard from './DashboardCard.jsx';

const IndicadorProgresoPerfil = ({
  completados,
  total,
  faltantes,
  beneficio,
  onCompletar,
  titulo = 'Completá tu perfil',
  accion = 'Completar perfil',
}) => {
  const valor = total > 0 ? (completados / total) * 100 : 0;

  return (
    <DashboardCard className="dashboard-card--perfil" icon={<FiUser />}>
      <div className="dashboard-progreso-contenido">
        <h2>{titulo}</h2>
        <p>
          {completados} de {total} datos esenciales completos.
        </p>
        <LinearProgress
          variant="determinate"
          value={valor}
          aria-label="Progreso del perfil"
          aria-valuetext={`${completados} de ${total} datos esenciales`}
        />
        <p>Falta completar: {faltantes.map(({ etiqueta }) => etiqueta).join(', ')}.</p>
        {beneficio && <p>{beneficio}</p>}
      </div>
      <Button variant="outlined" onClick={onCompletar} endIcon={<FiArrowRight aria-hidden="true" />}>
        {accion}
      </Button>
    </DashboardCard>
  );
};

IndicadorProgresoPerfil.propTypes = {
  completados: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  faltantes: PropTypes.arrayOf(PropTypes.shape({ etiqueta: PropTypes.string })).isRequired,
  beneficio: PropTypes.node,
  onCompletar: PropTypes.func,
  titulo: PropTypes.node,
  accion: PropTypes.node,
};

export default IndicadorProgresoPerfil;
