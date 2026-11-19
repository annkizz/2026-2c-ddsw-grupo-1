import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Dialogo from '../Dialogo/Dialogo.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { darDeBajaColaboracion } from '../../service/proyectosService';
import { mensajeDeError } from '../../utils/mensajeDeError';
import { t } from '../../i18n/t';

const DialogoBajaColaboracion = ({ seleccion, propia, onCerrar, onConfirmada }) => {
  const { getAccessToken } = useAuth();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const cerrar = () => {
    if (procesando) return;
    setError('');
    onCerrar();
  };

  const confirmar = async () => {
    setProcesando(true);
    setError('');
    try {
      const token = await getAccessToken();
      await darDeBajaColaboracion(token, seleccion.idProyecto, seleccion.idColaborador);
      onConfirmada(seleccion);
      onCerrar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Dialogo open={Boolean(seleccion)} onClose={cerrar} aria-labelledby="baja-colaboracion-titulo">
      <DialogTitle id="baja-colaboracion-titulo">
        {t(propia ? 'bajaColaboracion.tituloPropia' : 'bajaColaboracion.tituloColectivo')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {propia
            ? t('bajaColaboracion.descripcionPropia', { proyecto: seleccion?.nombre })
            : t('bajaColaboracion.descripcionColectivo', { nombre: seleccion?.nombre })}
        </DialogContentText>
        <Alert severity="warning">{t('bajaColaboracion.advertencia')}</Alert>
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={cerrar} disabled={procesando}>{t('bajaColaboracion.cancelar')}</Button>
        <Button color="error" variant="contained" onClick={confirmar} disabled={procesando}>
          {procesando ? t('bajaColaboracion.procesando') : t(propia ? 'bajaColaboracion.confirmarPropia' : 'bajaColaboracion.confirmarColectivo')}
        </Button>
      </DialogActions>
    </Dialogo>
  );
};

DialogoBajaColaboracion.propTypes = {
  seleccion: PropTypes.shape({
    idProyecto: PropTypes.string.isRequired,
    idColaborador: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
  }),
  propia: PropTypes.bool,
  onCerrar: PropTypes.func.isRequired,
  onConfirmada: PropTypes.func.isRequired,
};

export default DialogoBajaColaboracion;
