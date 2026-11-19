import React, { Component } from 'react';
import { Button } from '@mui/material';
import { FiAlertTriangle, FiHome, FiRefreshCw } from 'react-icons/fi';
import { t } from '../../i18n/t';
import '../../features/errores/PaginaEstado.css';

import PropTypes from 'prop-types';
// Red de seguridad global: si una pantalla falla al renderizar, se muestra un mensaje
// amigable con salidas claras en lugar de una pantalla en blanco.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { conError: false };
  }

  static getDerivedStateFromError() {
    return { conError: true };
  }

  componentDidCatch(error, info) {
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.conError && prevProps.claveReinicio !== this.props.claveReinicio) {
      this.setState({ conError: false });
    }
  }

  render() {
    if (!this.state.conError) return this.props.children;

    return (
      <main className="pagina-estado" id="contenido-principal" tabIndex={-1}>
        <span className="pagina-estado__icono pagina-estado__icono--error" aria-hidden="true">
          <FiAlertTriangle />
        </span>
        <h1>{t('errorGlobal.titulo')}</h1>
        <p className="pagina-estado__texto">{t('errorGlobal.descripcion')}</p>
        <div className="pagina-estado__acciones">
          <Button
            variant="contained"
            startIcon={<FiRefreshCw aria-hidden="true" />}
            onClick={() => window.location.reload()}
          >
            {t('errorGlobal.recargar')}
          </Button>
          <Button variant="outlined" startIcon={<FiHome aria-hidden="true" />} href="/">
            {t('comun.volverAlInicio')}
          </Button>
        </div>
      </main>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  onError: PropTypes.func,
  claveReinicio: PropTypes.string
};

export default ErrorBoundary;
