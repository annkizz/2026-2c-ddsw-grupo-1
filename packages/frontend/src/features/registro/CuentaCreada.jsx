import { Link } from 'react-router-dom';
import { Button, Card } from '@mui/material';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import { t } from '../../i18n/t';
import './Registro.css';

const CuentaCreada = () => {
  return (
    <div className="registro">
      <Card variant="outlined" className="registro-card cuenta-creada">
        <div className="cuenta-creada-icono">
          <FiCheck />
        </div>
        <h1>{t('registro.cuentaCreada')}</h1>
        <p>
          {t('registro.bienvenida')}
          <br />
          {t('registro.bienvenidaDescripcion')}
        </p>
      </Card>
      <div className="cuenta-creada-boton">
        <Button variant="contained" component={Link} to="/" endIcon={<FiArrowRight />}>
          {t('registro.irInicio')}
        </Button>
      </div>
    </div>
  );
};

export default CuentaCreada;
