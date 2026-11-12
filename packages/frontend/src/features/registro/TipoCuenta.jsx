import { useNavigate } from 'react-router-dom';
import { Alert, Card, CardActionArea, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { FiArrowRight, FiCode, FiInfo, FiUsers, FiX } from 'react-icons/fi';
import { guardarTipo, rutaDeRegistro } from './tipoElegido';
import './TipoCuenta.css';

// Pantalla "Tipo de cuenta".
// - Dentro de Home: recibe onElegir y onCerrar (todavía no hay sesión).
// - Como ruta /registro/tipo: sin props, sigue con el formulario del tipo elegido.
const TipoCuenta = ({ onElegir, onCerrar }) => {
  const navigate = useNavigate();

  const elegir = (tipo) => {
    guardarTipo(tipo);
    if (onElegir) {
      onElegir(tipo);
    } else {
      navigate(rutaDeRegistro(tipo));
    }
  };

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="sm">
      <DialogTitle className="tipo-cuenta-titulo">
        <h2>Crear una cuenta</h2>
        {onCerrar && (
          <IconButton aria-label="Cerrar" onClick={onCerrar}>
            <FiX />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        <p className="tipo-cuenta-sub">¿Cómo querés sumarte a la comunidad?</p>

        <Card variant="outlined" className="tipo-cuenta-opcion">
          <CardActionArea onClick={() => elegir('colaboradora')}>
            <div className="tipo-cuenta-contenido">
              <FiCode />
              <div>
                <strong>Soy una persona colaboradora</strong>
                <small>Quiero aportar mi tiempo y mis saberes.</small>
              </div>
              <FiArrowRight />
            </div>
          </CardActionArea>
        </Card>

        <Card variant="outlined" className="tipo-cuenta-opcion">
          <CardActionArea onClick={() => elegir('colectivo')}>
            <div className="tipo-cuenta-contenido">
              <FiUsers />
              <div>
                <strong>Represento a un colectivo</strong>
                <small>Necesitamos software para nuestro proyecto.</small>
              </div>
              <FiArrowRight />
            </div>
          </CardActionArea>
        </Card>

        <Alert severity="info" icon={<FiInfo />} sx={{ background: 'none', padding: 0 }}>
          Elegí la opción que mejor te represente. En ambos casos, sumarse es gratis.
        </Alert>
      </DialogContent>
    </Dialog>
  );
};

export default TipoCuenta;
