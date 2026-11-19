import React from 'react';
import { Button } from '@mui/material';
import { FiCompass, FiHome } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/t';
import './PaginaEstado.css';

const PaginaNoEncontrada = () => (
  <section className="pagina-estado" aria-labelledby="titulo-404">
    <span className="pagina-estado__icono" aria-hidden="true">
      <FiCompass />
    </span>
    <h1 id="titulo-404">{t('noEncontrado.titulo')}</h1>
    <p className="pagina-estado__texto">{t('noEncontrado.descripcion')}</p>
    <div className="pagina-estado__acciones">
      <Button component={Link} to="/" variant="contained" startIcon={<FiHome aria-hidden="true" />}>
        {t('comun.volverAlInicio')}
      </Button>
    </div>
  </section>
);

export default PaginaNoEncontrada;
