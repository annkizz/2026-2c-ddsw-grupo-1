import { Button } from '@mui/material';
import { FiPlus } from 'react-icons/fi';

const AgregarMedioContactoButton = ({ onClick, className }) => (
  <Button
    type="button"
    variant="outlined"
    startIcon={<FiPlus />}
    onClick={onClick}
    className={className}
  >
    Agregar medio de contacto
  </Button>
);

export default AgregarMedioContactoButton;
