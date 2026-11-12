import { Link } from 'react-router-dom';
import { Button, Card } from '@mui/material';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import './Registro.css';

const CuentaCreada = () => {
  return (
    <div className="registro">
      <Card variant="outlined" className="registro-card cuenta-creada">
        <div className="cuenta-creada-icono">
          <FiCheck />
        </div>
        <h1>¡Cuenta creada!</h1>
        <p>
          ¡Te damos la bienvenida a Código a Voluntad!
          <br />
          Ya podés compartir tus habilidades y sumar a proyectos en comunidad.
        </p>
      </Card>
      <div className="cuenta-creada-boton">
        <Button variant="contained" component={Link} to="/perfil" endIcon={<FiArrowRight />}>
          Ir a mi perfil
        </Button>
      </div>
    </div>
  );
};

export default CuentaCreada;
