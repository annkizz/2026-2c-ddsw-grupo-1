import React from 'react';
import { Dialog, useMediaQuery, useTheme } from '@mui/material';

import PropTypes from 'prop-types';
// Variante única de Dialog: pantalla completa debajo de sm, ancho máximo del sistema arriba.
// MUI devuelve el foco al elemento que lo abrió al cerrar (disableRestoreFocus=false).
const Dialogo = ({ children, maxWidth = 'sm', fullWidth = true, ...props }) => {
  const theme = useTheme();
  const pantallaCompleta = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Dialog fullScreen={pantallaCompleta} maxWidth={maxWidth} fullWidth={fullWidth} {...props}>
      {children}
    </Dialog>
  );
};

Dialogo.propTypes = {
  children: PropTypes.node,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  fullWidth: PropTypes.bool
};

export default Dialogo;
