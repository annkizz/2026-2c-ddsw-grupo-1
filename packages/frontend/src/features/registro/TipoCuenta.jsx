import { t } from '../../i18n/t';
import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, CardActionArea, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { FiArrowRight, FiCode, FiUsers, FiX } from 'react-icons/fi';
import Dialogo from '../../components/Dialogo/Dialogo.jsx';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import { guardarTipo, rutaDeRegistro } from './tipoElegido';
import './TipoCuenta.css';

const OPCIONES = [
  {
    tipo: 'colaboradora',
    Icono: FiCode,
    titulo: 'Soy una persona colaboradora',
    detalle: 'Quiero aportar mi tiempo y mis saberes.'
  },
  {
    tipo: 'colectivo',
    Icono: FiUsers,
    titulo: 'Represento a un colectivo',
    detalle: 'Necesitamos software para nuestro proyecto.'
  }
];

// Pantalla "Tipo de cuenta".
// - Dentro de Home: recibe onElegir y onCerrar (todavía no hay sesión) y se muestra como diálogo.
// - Como ruta /registro/tipo: sin props, es una página y sigue con el formulario del tipo elegido.
const TipoCuenta = ({ onElegir, onCerrar }) => {
  const navigate = useNavigate();
  const esDialogo = Boolean(onCerrar);
  const cerrar = () => {
    if (onCerrar) {
      onCerrar();
    } else {
      navigate('/');
    }
  };

  const elegir = (tipo) => {
    guardarTipo(tipo);
    if (onElegir) {
      onElegir(tipo);
    } else {
      navigate(rutaDeRegistro(tipo));
    }
  };

  const opciones = (
    <div className="tipo-cuenta">
      <p className="texto-secundario">¿Cómo querés sumarte a la comunidad?</p>
      {OPCIONES.map(({ tipo, Icono, titulo, detalle }) => (
        <Card key={tipo} className="tipo-cuenta-opcion">
          <CardActionArea onClick={() => elegir(tipo)}>
            <div className="tipo-cuenta-contenido">
              <Icono aria-hidden="true" />
              <div>
                <strong>{titulo}</strong>
                <small>{detalle}</small>
              </div>
              <FiArrowRight aria-hidden="true" />
            </div>
          </CardActionArea>
        </Card>
      ))}
      <Alert severity="info">{t('registro.elegiLaOpcionQueMejor')}</Alert>
    </div>
  );

  if (!esDialogo) {
    return (
      <div className="contenedor-pagina contenedor-pagina--lectura">
        <EncabezadoPagina
          titulo="Crear una cuenta"
          subtitulo={t('registro.paso1ElegiElTipo')}
          migas={[{ texto: t('navegacion.inicio'), to: '/' }, { texto: 'Crear una cuenta' }]}
        />
        {opciones}
      </div>
    );
  }

  return (
    <Dialogo open onClose={cerrar} aria-labelledby="tipo-cuenta-titulo">
      <DialogTitle id="tipo-cuenta-titulo" className="dialogo-titulo-con-cierre">
        <span>Crear una cuenta</span>
        <IconButton aria-label="Cerrar" onClick={cerrar}>
          <FiX aria-hidden="true" />
        </IconButton>
      </DialogTitle>
      <DialogContent>{opciones}</DialogContent>
    </Dialogo>
  );
};

TipoCuenta.propTypes = {
  onElegir: PropTypes.func,
  onCerrar: PropTypes.func
};

export default TipoCuenta;
