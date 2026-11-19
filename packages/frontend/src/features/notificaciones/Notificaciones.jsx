import React from 'react';
import { Button } from '@mui/material';
import { FiBell, FiHome } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import EstadoVacio from '../../components/EstadoVacio/EstadoVacio.jsx';
import { EsqueletoLista } from '../../components/Esqueletos/Esqueletos.jsx';
import { t } from '../../i18n/t';

// TODO: GET /notificaciones (notificacionesService.obtenerNotificaciones). La pantalla es solo de
// lectura y todavía no consulta el servicio: muestra el estado vacío. El esqueleto queda listo para
// cuando se conecte (cargando = true mientras se espera la respuesta).
const cargando = false;

const Notificaciones = () => (
  <div className="contenedor-pagina contenedor-pagina--formulario">
    <EncabezadoPagina
      titulo={t('notificaciones.titulo')}
      subtitulo={t('notificaciones.subtitulo')}
      migas={[{ texto: t('navegacion.inicio'), to: '/' }, { texto: t('notificaciones.titulo') }]}
    />
    {cargando ? (
      <EsqueletoLista cantidad={4} etiqueta={t('notificaciones.cargando')} />
    ) : (
      <EstadoVacio
        icono={FiBell}
        titulo={t('notificaciones.vacioTitulo')}
        descripcion={t('notificaciones.vacioDescripcion')}
        accion={
          <Button component={Link} to="/" variant="outlined" startIcon={<FiHome aria-hidden="true" />}>
            {t('notificaciones.irAlInicio')}
          </Button>
        }
      />
    )}
  </div>
);

export default Notificaciones;
