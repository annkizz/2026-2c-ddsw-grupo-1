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
    <DashboardCard
      className="dashboard-card--perfil"
      icon={<FiUser />}
    >
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
      <Button
        variant="outlined"
        onClick={onCompletar}
        endIcon={<FiArrowRight />}
      >
        {accion}
      </Button>
    </DashboardCard>
  );
};

export default IndicadorProgresoPerfil;
