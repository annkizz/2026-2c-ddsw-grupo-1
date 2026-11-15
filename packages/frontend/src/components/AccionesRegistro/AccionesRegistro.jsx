import { Button, CircularProgress } from '@mui/material';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import './AccionesRegistro.css';

// Botones "← Volver" y "Siguiente →" que se repiten en todas las pantallas de registro
const AccionesRegistro = ({ onVolver, siguiente = 'Siguiente', guardando = false }) => {
  return (
    <div className="acciones-registro">
      {onVolver && (
        <Button variant="outlined" type="button" onClick={onVolver} startIcon={<FiArrowLeft />}>
          Volver
        </Button>
      )}
      <Button
        variant="contained"
        type="submit"
        disabled={guardando}
        startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : null}
        endIcon={guardando ? null : <FiArrowRight />}
      >
        {guardando ? 'Guardando…' : siguiente}
      </Button>
    </div>
  );
};

export default AccionesRegistro;
